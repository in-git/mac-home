import type { AgentTool, AgentToolCallResult, AgentToolInvocation } from './types';
import { AGENT_TOOLS } from './tools';

const TOOL_MAP: Record<string, AgentTool> = Object.fromEntries(
  AGENT_TOOLS.map((t) => [t.name, t]),
);

export type {
  AgentTool,
  AgentToolParam,
  AgentToolCallResult,
  AgentToolInvocation,
  AgentRole,
  AgentChatMessage,
  ToolTask,
  ModelTask,
  ParsedModel,
  AgentChatOptions,
} from './types';
export { AGENT_TOOLS } from './tools';

/** 供 AI 获取当前可用的功能清单（function-calling 用） */
export function listAgentTools(): AgentTool[] {
  return AGENT_TOOLS;
}

/**
 * AI 调用功能的统一入口：根据工具名查找并执行对应实现，返回标准化结果。
 * 找不到工具或执行异常时给出友好提示，不会向外抛出异常。
 */
export async function executeAgentTool(
  invocation: AgentToolInvocation,
): Promise<AgentToolCallResult> {
  const toolName = invocation?.name;
  const tool = toolName ? TOOL_MAP[toolName] : undefined;
  if (!tool) {
    return {
      ok: false,
      tool: toolName ?? '',
      message: `未知功能：「${toolName ?? 'undefined'}」。可用功能：${AGENT_TOOLS.map(
        (t) => t.name,
      ).join(', ')}`,
    };
  }
  try {
    return await tool.run(invocation.args ?? {});
  } catch (e) {
    return {
      ok: false,
      tool: tool.name,
      message: `调用「${tool.name}」时出错：${(e as Error).message}`,
    };
  }
}
