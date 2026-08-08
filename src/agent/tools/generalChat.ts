import type { AgentTool } from '../types';

/**
 * 通用 AI 对话工具（与系统功能无关的对话/请求）。
 * 将非系统功能的请求与回答封装为 Agent 可调用的工具。
 */
export const generalChatTool: AgentTool = {
  name: 'general_chat',
  description: '处理与系统设置无关的通用 AI 对话请求。',
  parameters: {
    query: {
      type: 'string',
      description: '用户的请求或提问内容。',
      required: true,
    },
    reply: {
      type: 'string',
      description: '模型生成的回复原文。',
      required: false,
    },
  },
  run: (args) => {
    const reply = typeof args.reply === 'string' && args.reply.length > 0
      ? args.reply
      : String(args.query ?? '');
    return {
      ok: true,
      tool: 'general_chat',
      message: reply,
      data: { query: args.query, reply },
    };
  },
};
