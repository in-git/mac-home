import type { AgentToolCallResult } from './types';

/** 构造一个成功的工具调用结果 */
export function ok(
  tool: string,
  message: string,
  data?: unknown,
): AgentToolCallResult {
  return { ok: true, tool, message, ...(data !== undefined ? { data } : {}) };
}

/** 构造一个失败的工具调用结果 */
export function err(tool: string, message: string): AgentToolCallResult {
  return { ok: false, tool, message };
}
