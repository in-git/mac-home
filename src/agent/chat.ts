import { API_ENDPOINTS, request } from '../utils/request';
import { askOnce } from '../utils/aiClient';
import { useHomeStore } from '../store/useHomeStore';
import type { AIConfig } from './config/aiConfig';
import type {
  AgentChatMessage,
  AgentChatOptions,
  ToolTask,
} from './types';
import { ChatUtils } from '../lib/chatUtils';

// 对话工具单例：now / normalizeReply / makeSystemPrompt / runTaskAsToolMessage
// 采用惰性初始化，避免在循环依赖（chat.ts ↔ chatUtils.ts ↔ agent/index）下
// 于模块求值阶段访问尚未就绪的 ChatUtils，导致 "Cannot access 'ChatUtils'
// before initialization"。
let chatUtilsSingleton: ChatUtils | null = null;
function getChatUtils(): ChatUtils {
  if (!chatUtilsSingleton) chatUtilsSingleton = new ChatUtils();
  return chatUtilsSingleton;
}

/**
 * 按「系统设置 → AI」中的大模型配置请求模型，返回模型原始文本（即 ReAct 循环
 * 期望的 JSON 字符串，供上层 JSON.parse）。
 *
 * 路由策略：
 * - 若用户在设置中填写了自定义 BaseURL 或 API Key，则走前端直连
 *   （OpenAI 兼容协议，真正的用户大模型）。
 * - 否则回退到后端 /public/ai/chat 通道（后端自带默认模型）。
 *
 * @param config  本地保存的 AI 配置（来自设置）
 * @param model   最终使用的模型名
 * @param messages 本轮对话上下文
 */
async function callModel(
  config: AIConfig,
  model: string,
  messages: { role: string; content: string }[],
): Promise<string> {
  // 自定义地址或填写了 Key → 前端直连用户配置的大模型（本地大模型走后端通道）
  const useDirect =
    config.provider !== 'local' &&
    (!!(config.baseURL && config.baseURL.trim()) || !!config.apiKey);

  if (useDirect) {
    return askOnce(
      { ...config, model },
      messages as { role: 'system' | 'user' | 'assistant'; content: string }[],
    );
  }

  // 回退：后端默认通道（后端自行决定模型，这里仍把 model 透传给后端备用）
  const raw = await request.post<string>(API_ENDPOINTS.aiChat, {
    model,
    messages,
  });
  // 后端返回 ollama 风格 JSON 字符串，取出 message.content
  return getChatUtils().normalizeReply(raw);
}

/**
 * Agent 对话核心：实现「思考 → 调用工具 → 回填结果 → 再思考」的 ReAct 循环。
 *
 * - 模型返回工具调用时，执行工具并把结果作为 tool 消息追加回 history，
 *   然后继续请求模型，直到模型给出纯文本回答为止。
 * - 返回值为本轮新增的消息（含中间的 tool 气泡与最终的 assistant 回答），
 *   UI 直接追加渲染即可。
 */
export async function sendAgentChat(
  options: AgentChatOptions,
): Promise<AgentChatMessage[]> {
  const {
    userInput,
    model,
    maxRounds = 6,
    disableSelfCall = false,
  } = options;

  // 模型参数优先用调用方传入，否则回退到「系统设置 → AI」中保存的大模型配置。
  // 该配置通过 zustand persist 存储在本地（localStorage），不会上传。
  const aiConfig = useHomeStore.getState().aiConfig;
  // 模型优先用调用方传入，否则用「系统设置 → AI」中保存的配置（默认本地大模型 qwen2.5:3b）
  const effectiveModel = (model || aiConfig.model || '').trim();

  // 维护运行期历史（复制外部传入的，避免污染 UI state）
  const history: AgentChatMessage[] = [...(options.history ?? [])];
  if (
    userInput &&
    (history.length === 0 ||
      history[history.length - 1].role !== 'user' ||
      history[history.length - 1].content !== userInput)
  ) {
    history.push({
      id: 'user-' + Date.now(),
      role: 'user',
      content: userInput,
      timestamp: getChatUtils().now(),
    });
  }

  const systemPrompt = getChatUtils().makeSystemPrompt();
  const produced: AgentChatMessage[] = [];

  for (let round = 0; round < maxRounds; round++) {
    const messages = [
      { role: 'system', content: systemPrompt },
      // tool 角色消息在直连 OpenAI 协议下需转为 assistant，避免协议错误
      ...history.map((m) => ({
        role: m.role === 'tool' ? 'assistant' : m.role,
        content: m.content,
      })),
    ];

    let replyContent: string;
    try {
      replyContent = await callModel(aiConfig, effectiveModel, messages);
    } catch (e) {
      const errMsg: AgentChatMessage = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content: `请求模型失败：${e instanceof Error ? e.message : String(e)}`,
        timestamp: getChatUtils().now(),
        error: true,
      };
      produced.push(errMsg);
      return produced;
    }

    // 解析 + 清洗模型返回（递归摊平嵌套 JSON），直接得到可执行结构
    const cleaned = JSON.parse(replyContent);

    // 将清洗后的 task 列表拆为「工具任务」与「文本回复」
    const toolTasks: ToolTask[] = [];
    const textTasks: string[] = [];
    console.log(cleaned);

    for (const t of cleaned.tasks) {
      if (t.type === 'tool') {
        toolTasks.push({ name: t.content.name, args: t.content.args });
      } else {
        textTasks.push(t.content);
      }
    }

    // 过滤自调用（防递归）
    const filteredToolTasks = disableSelfCall
      ? toolTasks.filter((t) => t.name !== 'agent_chat')
      : toolTasks;

    if (disableSelfCall && filteredToolTasks.length < toolTasks.length) {
      textTasks.push('（已在自问自答处理中，无法再次自我调用。）');
    }

    // 先展示本轮的 text 回复（给用户看的）
    for (const txt of textTasks) {
      const textMsg: AgentChatMessage = {
        id: 'txt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        role: 'assistant',
        content: txt,
        timestamp: getChatUtils().now(),
      };
      history.push(textMsg);
      produced.push(textMsg);
    }

    // 执行所有工具任务，并把执行结果回填到历史
    for (const task of filteredToolTasks) {
      const toolMsg = await getChatUtils().runTaskAsToolMessage(task);
      history.push(toolMsg);
      produced.push(toolMsg);
    }

    // 依据 continue 决定走向：
    // continue===false → 执行完即结束本轮，不再请求模型；
    // continue===true（默认）→ 把工具结果回填，自动进入下一轮对话。
    if (!cleaned.continue) {
      // 若本轮没有任何 text 回复，用最后一个工具结果兜底作为结束消息
      if (textTasks.length === 0 && filteredToolTasks.length > 0) {
        const lastTool = [...history].reverse().find((m) => m.role === 'tool');
        const endMsg: AgentChatMessage = {
          id: 'end-' + Date.now(),
          role: 'assistant',
          content: lastTool?.content || '（操作已完成，但未返回可读结果。）',
          timestamp: getChatUtils().now(),
          };
          history.push(endMsg);
        produced.push(endMsg);
      }
      return produced;
    }

    // continue===true：工具结果已回填，自动进入下一轮对话
    continue;
  }

  // 超过最大轮次仍未给出文本回答
  const timeoutMsg: AgentChatMessage = {
    id: 'to-' + Date.now(),
    role: 'assistant',
    content: '处理步骤过多，已自动停止。请简化你的问题后重试。',
    timestamp: getChatUtils().now(),
  };
  produced.push(timeoutMsg);
  return produced;
}

export type {
  AgentChatMessage,
  AgentChatOptions,
  AgentRole,
  ModelTask,
  ParsedModel,
  ToolTask,
} from './types';
