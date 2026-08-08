/**
 * Agent 对话核心逻辑：
 * 组装消息 → 请求大模型（强制 JSON 输出）→ 解析决策 JSON →
 * 命中系统工具则按任务数组逐个执行（每个任务支持延迟），
 * 否则封装 general_chat 并返回普通回复。
 */
import { API_ENDPOINTS, request } from '../utils/request';
import { AGENT_TOOLS, executeAgentTool, listAgentTools } from './index';

/** 对话消息（界面可展示） */
export interface AgentChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  error?: boolean;
  // tool 消息专用
  toolName?: string;
  toolArgs?: string;
  toolOk?: boolean;
}

/** 单个待执行任务 */
export interface AgentTask {
  tool: string;
  args?: Record<string, unknown>;
  /** 延迟执行毫秒数，默认 0 */
  delay?: number;
}

/** 大模型结构化输出解析结果 */
export interface ParsedModelResponse {
  isSystemAction?: boolean;
  tool?: string;
  args?: Record<string, unknown>;
  reply?: string;
  /** 任务数组：一次可执行多个功能，每项支持 delay */
  tasks?: AgentTask[];
}

// 把 agent 工具清单格式化为大模型可理解的「可调用函数」描述
const TOOLS = listAgentTools();
const SYSTEM_PROMPT = `你是运行在本系统里的 AI 助手，负责判断用户意图并输出机器可解析的 JSON。

可用系统功能工具：
${TOOLS.filter((t) => t.name !== 'general_chat')
  .map(
    (t) =>
      `- ${t.name}：${t.description}\n  参数：${JSON.stringify(t.parameters)}`,
  )
  .join('\n')}

输出要求（必须严格遵守，输出必须能被 JSON.parse 直接解析）：
1. 每次回复只输出一个 JSON 对象，禁止输出任何 JSON 以外的内容（包括自然语言解释、说明、标题）。
2. 禁止输出 <tool_response> 标签、markdown 代码块、或任何包装文字。
3. 当用户意图匹配系统功能工具时，输出任务数组：
   {"isSystemAction": true, "tasks": [{"tool": "<工具名>", "args": {<参数>}, "delay": <毫秒>}]}
   其中：
   - args 的字段名与类型必须与上述工具定义完全一致；布尔参数（如 enabled）必须显式给出 true/false。
   - delay 是延迟执行的毫秒数，用户没提到时间则写 0（立即执行），提到时间（如「5 秒后」「3 分钟后」）则换算成毫秒。
   - 一次可以包含多个任务（例如「调大字体并开启深色模式」输出两个任务），按顺序逐个执行。
4. 当用户要求创建定时/延迟任务时，优先使用 create_scheduled_task 工具，输出：
   {"isSystemAction": true, "tasks": [{"tool": "create_scheduled_task", "args": {"name": "任务名", "tool": "<要执行的目标工具>", "args": {<目标工具参数>}, "delay": <毫秒>}}]}
5. 当用户意图与系统功能无关时，输出：
   {"isSystemAction": false, "reply": "<给用户的自然语言回答>"}
6. 不要输出工具执行结果，也不要重复描述你做了什么，你只需要输出上述决策 JSON。

示例：
用户说「开启深色模式」→ {"isSystemAction": true, "tasks": [{"tool": "set_dark_mode", "args": {"enabled": true}, "delay": 0}]}
用户说「把亮度调到 100」→ {"isSystemAction": true, "tasks": [{"tool": "set_screen_brightness", "args": {"value": 100}, "delay": 0}]}
用户说「调大字体，同时开启深色模式」→ {"isSystemAction": true, "tasks": [{"tool": "set_font_variant", "args": {"variant": "C"}, "delay": 0}, {"tool": "set_dark_mode", "args": {"enabled": true}, "delay": 0}]}
用户说「5 秒后开启深色模式」→ {"isSystemAction": true, "tasks": [{"tool": "create_scheduled_task", "args": {"name": "5秒后开深色模式", "tool": "set_dark_mode", "args": {"enabled": true}, "delay": 5000}}]}
用户说「今天天气怎么样」→ {"isSystemAction": false, "reply": "我是本地助手，暂时无法获取实时天气。"}`;

function nowTimestamp(): string {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * 从大模型回复中提取 JSON 形式的响应对象。
 * 兼容：纯 JSON、被 ```json 代码块包裹、以及夹带在正文中的 JSON。
 */
export function extractModelResponse(
  content: string,
): ParsedModelResponse | null {
  let text = content.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return null;
  text = text.slice(start, end + 1);
  try {
    const obj = JSON.parse(text);
    if (!obj || typeof obj !== 'object') return null;

    // 任务数组：优先解析 tasks，其次兼容单个 tool/name 的旧格式
    let tasks: AgentTask[] | undefined;
    if (Array.isArray(obj.tasks)) {
      tasks = obj.tasks
        .filter(
          (t: unknown) =>
            !!t &&
            typeof t === 'object' &&
            typeof (t as Record<string, unknown>).tool === 'string',
        )
        .map((t: unknown) => {
          const item = t as Record<string, unknown>;
          const args =
            item.args && typeof item.args === 'object'
              ? (item.args as Record<string, unknown>)
              : {};
          const delay =
            typeof item.delay === 'number' && !Number.isNaN(item.delay)
              ? Math.max(0, Math.round(item.delay))
              : 0;
          return { tool: String(item.tool), args, delay };
        });
    }

    const tool =
      typeof (obj.tool ?? obj.name) === 'string'
        ? String(obj.tool ?? obj.name)
        : undefined;
    const args =
      obj.args && typeof obj.args === 'object'
        ? (obj.args as Record<string, unknown>)
        : {};
    const reply = typeof obj.reply === 'string' ? obj.reply : undefined;
    const isSystemAction =
      typeof obj.isSystemAction === 'boolean'
        ? obj.isSystemAction
        : Array.isArray(tasks) && tasks.length > 0
          ? true
          : typeof tool === 'string' && tool.length > 0;

    const parsed: ParsedModelResponse = {
      isSystemAction,
      tool,
      args,
      reply,
      ...(tasks && tasks.length > 0 ? { tasks } : {}),
    };
    return parsed;
  } catch {
    /* 非 JSON */
  }
  return null;
}

/**
 * 规范化后端返回体，解出模型回复文本。
 * data 可能是 ollama 响应的 JSON 字符串，也可能是已解析的对象。
 */
function normalizeReply(value: unknown): string {
  if (typeof value === 'string') {
    // 可能是 ollama JSON 字符串，也可能是直接的内容文本
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        // ollama 风格：{ message: { content } }
        if (obj.message && typeof obj.message === 'object') {
          const content = (obj.message as Record<string, unknown>).content;
          if (typeof content === 'string') return content;
        }
        // 直接就是决策 JSON（如 {"isSystemAction":...}），原样返回以便下一步解析
        return value;
      }
    } catch {
      return value;
    }
    return value;
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (obj.message && typeof obj.message === 'object') {
      const content = (obj.message as Record<string, unknown>).content;
      if (typeof content === 'string') return content;
    }
    // 对象本身已是决策 JSON
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
  return '';
}

export interface SendAgentChatParams {
  /** 当前对话历史（应已包含最新用户消息） */
  history: AgentChatMessage[];
  /** 用户本次输入 */
  userInput: string;
  /** 模型名，不传走后端默认模型 */
  model?: string;
}

/**
 * 发送一轮 Agent 对话并处理返回（可返回多条消息）：
 * - 命中系统工具：按任务数组逐个执行（每个任务可带 delay），每条结果一条 tool 消息
 * - 未命中：封装 general_chat 工具，返回一条 assistant 消息（模型回答原文）
 * 任何异常都会转为 error 消息返回，不会向外抛错。
 */
export async function sendAgentChat(
  params: SendAgentChatParams,
): Promise<AgentChatMessage[]> {
  const { history, userInput, model } = params;

  // 组装发给大模型的消息：系统提示 + 历史（过滤错误/开场，排除 system 占位）
  const apiMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history
      .filter((m) => !m.error && m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userInput },
  ];

  try {
    const raw = await request.post<string>(
      API_ENDPOINTS.aiChat,
      {
        model: model?.trim() || undefined,
        messages: apiMessages,
        // 强制 JSON 结构化输出，确保模型只返回可解析的 JSON 对象
        format: 'json',
      },
      // AI 大模型响应慢（后端最长 300s），此请求不设超时
      { timeout: 0 },
    );

    const replyContent = normalizeReply(raw);
    const parsed = extractModelResponse(replyContent);
    const isSystem = parsed?.isSystemAction ?? (parsed?.tool ? true : false);

    // 汇总待执行任务：优先 tasks 数组，其次单个 tool
    const tasks: AgentTask[] = [];
    if (Array.isArray(parsed?.tasks) && parsed.tasks.length > 0) {
      tasks.push(...parsed.tasks);
    } else if (parsed?.tool) {
      tasks.push({ tool: parsed.tool, args: parsed.args, delay: 0 });
    }

    if (isSystem && tasks.length > 0) {
      const results: AgentChatMessage[] = [];
      for (const task of tasks) {
        // 延迟执行：按任务自身的 delay 等待（默认 0）
        if (task.delay && task.delay > 0) {
          await sleep(task.delay);
        }
        const toolName = task.tool;
        const matchedTool = AGENT_TOOLS.find(
          (t) =>
            t.name === toolName ||
            t.name.trim().toLowerCase() === toolName.trim().toLowerCase(),
        );

        if (matchedTool) {
          const result = await executeAgentTool({
            name: matchedTool.name,
            args: task.args,
          });
          results.push({
            id: 'tool-' + Date.now() + '-' + results.length,
            role: 'tool',
            content: result.message,
            toolName,
            toolArgs: JSON.stringify(task.args ?? {}),
            toolOk: result.ok,
            timestamp: nowTimestamp(),
          });
        } else {
          results.push({
            id: 'msg-' + (Date.now() + results.length),
            role: 'assistant',
            content: `模型指示执行系统功能，但工具未找到：tool="${toolName}"。可用系统工具：${AGENT_TOOLS.map(
              (t) => t.name,
            ).join(', ')}`,
            timestamp: nowTimestamp(),
          });
        }
      }
      return results;
    }

    // 与系统无关的通用请求：把回复/请求封装成 general_chat 工具在后台处理，界面显示模型回答原文
    const replyText = parsed?.reply || replyContent || '未获取到回复内容';
    await executeAgentTool({
      name: 'general_chat',
      args: { query: userInput, reply: replyText },
    });

    return [
      {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: replyText,
        timestamp: nowTimestamp(),
      },
    ];
  } catch (err: any) {
    return [
      {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content: `调用失败: ${err?.message || '无法连接到 AI 服务'}`,
        timestamp: nowTimestamp(),
        error: true,
      },
    ];
  }
}
