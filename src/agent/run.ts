import { askOnce } from '../utils/aiClient';
import type { ChatMessage } from '../utils/aiClient';
import { ChatUtils } from '../utils/chatUtils';
import { useHomeStore } from '../store/useHomeStore';
import type { AgentChatMessage, AgentTool } from './types';

export interface RunAgentOptions {
  /** 系统人设（如桌宠名字/性格）；缺省走 ChatUtils 默认角色设定 */
  systemPrompt?: string;
  /** 最大 ReAct 轮数，防止模型死循环调用工具，默认 6 */
  maxRounds?: number;
  /**
   * 限定 AI 可用的工具清单（白名单）。
   * 传入后，system prompt 只展示这些工具，且工具执行只在该清单内进行，
   * 即 AI 只能执行传入清单中的行为。缺省为全部 AGENT_TOOLS。
   */
  tools?: AgentTool[];
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
  const { systemPrompt, maxRounds = 6, tools } = options;
  // 指定 tools 时：AI 只能看到并执行该清单内的行为（白名单约束）；
  // 否则默认注入全部 AGENT_TOOLS（listAgentTools / executeAgentTool）
  const chat = tools
    ? new ChatUtils({
        listTools: () => tools,
        execTool: async (invocation) => {
          const tool = tools.find((t) => t.name === invocation?.name);
          if (!tool) {
            return {
              ok: false,
              tool: invocation?.name ?? '',
              message: `未知功能：「${invocation?.name ?? 'undefined'}」。可用功能：${tools
                .map((t) => t.name)
                .join(', ')}`,
            };
          }
          return await tool.run(invocation?.args ?? {});
        },
      })
    : new ChatUtils(); // 默认注入 listAgentTools / executeAgentTool
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

    // 模型可能返回 content 为字符串或对象，故类型放宽容纳两者
    let parsed: {
      tasks?: Array<{ type: string; content: string | { name: string; args?: Record<string, unknown> } }>;
      continue?: boolean;
    };
    try {
      parsed = JSON.parse(raw);
    } catch {
      // 模型没返回规范 JSON：整段文本当作最终回复
      lastReply = raw.trim();
      return { ok: true, data: lastReply };
    }

    // 兼容嵌套返回形态：{ role: 'assistant', content: { tasks, continue } }
    // content 可能是对象，也可能是 JSON 字符串
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.tasks === undefined &&
      (parsed as { content?: unknown }).content !== undefined
    ) {
      const inner = (parsed as { content: unknown }).content;
      if (typeof inner === 'string') {
        try {
          parsed = JSON.parse(inner);
        } catch {
          parsed = undefined;
        }
      } else if (inner && typeof inner === 'object') {
        parsed = inner as typeof parsed;
      }
    }

    const tasks = Array.isArray(parsed?.tasks) ? parsed.tasks : [];
    if (tasks.length === 0) {
      lastReply = raw.trim();
      return { ok: true, data: lastReply };
    }

    // 执行本轮所有任务：text 收集回复，tool 执行并回填
    let hasTool = false;
    for (const task of tasks) {
      if (task.type === 'text') {
        lastReply =
          typeof task.content === 'string' ? task.content.trim() : JSON.stringify(task.content);
        continue;
      }
      // type === 'tool'：content 是 {"name","args"}，可能是 JSON 字符串或对象（部分模型直接返回对象）
      hasTool = true;
      let taskObj: { name: string; args?: Record<string, unknown> };
      try {
        taskObj =
          typeof task.content === 'string'
            ? JSON.parse(task.content)
            : (task.content as { name: string; args?: Record<string, unknown> });
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

    if (!hasTool || parsed?.continue === false) {
      break;
    }
  }

  return { ok: true, data: lastReply };
}
