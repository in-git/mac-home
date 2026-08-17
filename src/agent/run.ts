import { askOnce } from '../utils/aiClient';
import type { ChatMessage } from '../utils/aiClient';
import { ChatUtils } from '../utils/chatUtils';
import { useHomeStore } from '../store/useHomeStore';
import type { AgentChatMessage } from './types';

export interface RunAgentOptions {
  /** 系统人设（如桌宠名字/性格）；缺省走 ChatUtils 默认角色设定 */
  systemPrompt?: string;
  /** 最大 ReAct 轮数，防止模型死循环调用工具，默认 6 */
  maxRounds?: number;
}

/**
 * 让大模型接管桌宠的核心引擎。
 *
 * 采用 ReAct（理由 + 行动）循环，对齐 tools/index 注册的全部 AgentTool：
 *   1. 把 system prompt、历史、当前输入 + 工具清单发给模型；
 *   2. 解析模型返回的 JSON 任务（约定格式见 chatUtils.makeSystemPrompt）：
 *        { tasks: [{type:'text'|'tool', content}], continue }
 *      其中 type='tool' 的 content 是 {"name","args"} 的 JSON 字符串，
 *            type='text' 的 content 是直接给用户看的回复文本；
 *   3. 对每个 tool 任务调用 executeAgentTool（最终落到 petTools →
 *      window CustomEvent → RoleCharacterCanvas），把结果回填上下文；
 *   4. 若 continue=true（还有后续动作要做），带着工具结果再请求模型，
 *      直到 continue=false 或达到 maxRounds 上限。
 *
 * 模型本身只负责「决策调用哪些工具 + 说什么话」，真正改变桌宠的动作
 * 都通过 tool 落地，因此大模型能够完全控制桌宠行为。
 */
export async function runAgentTurn(
  history: AgentChatMessage[],
  userInput: string,
  options: RunAgentOptions = {},
): Promise<{ ok: boolean; data?: string; error?: string }> {
  const { systemPrompt, maxRounds = 6 } = options;
  const chat = new ChatUtils(); // 默认注入 listAgentTools / executeAgentTool
  const system = systemPrompt ?? chat.makeSystemPrompt();
  const config = useHomeStore.getState().aiConfig;

  // 组装 OpenAI 风格消息：system + 历史(role/content) + 本轮用户输入
  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userInput },
  ];

  let lastReply = '';

  for (let round = 0; round < maxRounds; round++) {
    let raw: string;
    try {
      raw = await askOnce(config, messages);
    } catch (e) {
      return {
        ok: false,
        error: `模型请求失败：${e instanceof Error ? e.message : String(e)}`,
      };
    }

    let parsed: { tasks?: Array<{ type: string; content: string }>; continue?: boolean };
    try {
      parsed = JSON.parse(raw);
    } catch {
      // 模型没返回规范 JSON：整段文本当作最终回复
      lastReply = raw.trim();
      return { ok: true, data: lastReply };
    }

    const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    if (tasks.length === 0) {
      lastReply = raw.trim();
      return { ok: true, data: lastReply };
    }

    // 执行本轮所有任务：text 收集回复，tool 执行并回填
    let hasTool = false;
    for (const task of tasks) {
      if (task.type === 'text') {
        lastReply = task.content.trim();
        continue;
      }
      // type === 'tool'：content 是 {"name","args"} 的 JSON 字符串
      hasTool = true;
      let taskObj: { name: string; args?: Record<string, unknown> };
      try {
        taskObj = JSON.parse(task.content);
      } catch {
        lastReply = `工具调用格式错误：${task.content}`;
        continue;
      }
      const toolMsg: AgentChatMessage = await chat.runTaskAsToolMessage({
        name: taskObj.name,
        args: taskObj.args ?? {},
      });
      messages.push({ role: 'tool', content: toolMsg.content });
    }

    if (!hasTool || parsed.continue === false) {
      break;
    }
  }

  return { ok: true, data: lastReply };
}
