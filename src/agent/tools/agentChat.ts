import type { AgentTool, AgentToolCallResult } from '../types';
import { ok, err } from '../result';
import { sendAgentChat } from '../chat';

/**
 * 让「对话核心 sendAgentChat」本身可作为一个 Agent 工具被模型调用。
 *
 * 语义：当模型认为需要进一步向自己提问 / 检索信息（例如需要先整合多个
 * 工具结果再回答）时，可调用本工具，把 query 作为新的用户输入再跑一轮
 * ReAct 循环，最终返回自然语言文本。
 *
 * 为防止无限自递归：内部调用 sendAgentChat 时传入 disableSelfCall=true，
 * 这样循环里即使再出现 agent_chat 也会被跳过。
 */
export const agentChatTool: AgentTool = {
  name: 'agent_chat',
  description:
    '当需要进一步向自己提问、整合信息或重新检索时调用。输入 query，返回一轮对话后的自然语言结果。',
  parameters: {
    query: {
      type: 'string',
      description: '要再次向 AI 提出的问题或检索请求。',
      required: true,
    },
  },
  run: async (args): Promise<AgentToolCallResult> => {
    const query = typeof args.query === 'string' ? args.query : '';
    if (!query.trim()) {
      return err('agent_chat', '参数 query 必须是非空字符串。');
    }
    try {
      const msgs = await sendAgentChat({
        userInput: query,
        maxRounds: 4,
        disableSelfCall: true,
      });
      const text =
        [...msgs].reverse().find((m) => m.role === 'assistant')?.content ??
        '（无回复）';
      return ok('agent_chat', text, { text });
    } catch (e) {
      return err('agent_chat', `agent_chat 执行失败：${(e as Error).message}`);
    }
  },
};
