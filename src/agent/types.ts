/**
 * AI 代理（Agent）工具层 —— 公共类型定义。
 * 每个工具都带有名称、自然语言描述与参数 schema，便于上层
 * （如 LLM function-calling）理解并生成调用。
 */

export interface AgentToolParam {
  type: 'string' | 'number' | 'boolean' | 'object';
  description: string;
  enum?: string[];
  required?: boolean;
}

export interface AgentToolCallResult {
  ok: boolean;
  tool: string;
  message: string;
  data?: unknown;
}

export interface AgentTool {
  /** 工具唯一名，AI 调用时按此匹配 */
  name: string;
  /** 给 AI 看的功能描述 */
  description: string;
  /** 参数定义，供 AI 生成调用参数 */
  parameters: Record<string, AgentToolParam>;
  /** 实际执行逻辑 */
  run: (
    args: Record<string, unknown>,
  ) => AgentToolCallResult | Promise<AgentToolCallResult>;
}

export interface AgentToolInvocation {
  name: string;
  args?: Record<string, unknown>;
}
