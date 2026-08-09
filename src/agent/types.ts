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
  /** 工具标题，用于 UI 展示 */
  title: string;
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

/** 对话角色 */
export type AgentRole = 'user' | 'assistant' | 'tool' | 'system';

/** 一条对话消息（兼容 OpenAI 风格的 role/content，并携带渲染所需元信息） */
export interface AgentChatMessage {
  id: string;
  role: AgentRole;
  content: string;
  timestamp: string;
  /** tool 消息专用：工具名 */
  toolName?: string;
  /** tool 消息专用：参数（已序列化为可读文本） */
  toolArgs?: string;
  /** tool 消息专用：执行是否成功 */
  toolOk?: boolean;
  /** 是否为错误/失败回复 */
  error?: boolean;
}

/** 模型工具调用任务 */
export interface ToolTask {
  name: string;
  args?: Record<string, unknown>;
  reply?: string;
  /**
   * 是否在执行完该工具后继续下一轮对话。
   * - true：把执行结果回填上下文，自动进入下一轮（默认行为，符合 ReAct 循环）。
   * - false：执行完即结束本轮，不再请求模型（适用于"一步到位"的场景）。
   * 模型不传时按 true 处理。
   */
  continue?: boolean;
}

/** 模型返回的单条任务（对应 Response.task 数组中的元素） */
export interface ModelTask {
  /** 'text'：输出到输入框给用户看；'tool'：让前端执行工具 */
  type: 'text' | 'tool';
  /**
   * text 时为回复内容（纯字符串）；
   * tool 时为 JSON 字符串，格式：{"name": 工具名, "args": 参数对象}
   */
  content: string;
}

/** 解析后的模型响应：{ task: [...], continue: boolean } */
export interface ParsedModel {
  /** 本轮要执行的任务列表 */
  tasks: ModelTask[];
  /** 是否继续下一轮对话（前端据此判断是否再请求模型） */
  continue: boolean;
}

export interface AgentChatOptions {
  /** 已有的对话历史（来自 UI） */
  history?: AgentChatMessage[];
  /** 本轮用户输入（可选，用于补全 history） */
  userInput?: string;
  /** 模型名 */
  model?: string;
  /** 最大工具循环轮次，防止死循环 */
  maxRounds?: number;
  /** 是否禁止模型再调用 agent_chat（防止自调用无限递归） */
  disableSelfCall?: boolean;
}
