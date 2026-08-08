import { API_ENDPOINTS, request } from '../utils/request';
import { executeAgentTool, listAgentTools } from './index';
import type {
  AgentChatMessage,
  AgentChatOptions,
  AgentToolInvocation,
  ToolTask,
} from './types';

function now(): string {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** 把后端返回的各类形态统一为模型 content 字符串 */
function normalizeReply(raw: unknown): string {
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        if (obj.message && typeof obj.message === 'object') {
          const content = (obj.message as Record<string, unknown>).content;
          if (typeof content === 'string') return content;
        }
        return raw;
      }
    } catch {
      return raw;
    }
    return raw;
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (obj.message && typeof obj.message === 'object') {
      const content = (obj.message as Record<string, unknown>).content;
      if (typeof content === 'string') return content;
    }
  }
  return '';
}

/** 构造系统提示：声明可用工具 + ReAct 行为约定 */
function makeSystemPrompt(): string {
  const toolList = listAgentTools()
    .map(
      (t) =>
        `- ${t.name}：${t.description}\n  参数：${JSON.stringify(t.parameters)}`,
    )
    .join('\n');

  return `你是这个系统的助手，可以通过调用工具来读取或修改系统数据。

## 可用工具
${toolList}
你需要处理用户提出的问题，通过调用前端的工具，或者回答文本
## 工作规则
你在每一轮必须按以下三种情况之一处理用户请求，并据此决定返回内容：


**严格约束（务必遵守，否则工具无法执行）：**
1. 返回内容必须是合法的 JSON,禁止输出 编造的字段或其他任何非 JSON 格式。
2. \`type: 'tool'\` 时，\`content\` 必须是一个 JSON 字符串，格式固定为 \`{"name": 工具名, "args": 参数对象}\`。
3. 其中 \`name\` **只能取「可用工具」列表中真实存在的工具名**，禁止自行编造、拼接或猜测不存在的工具名。
4. \`args\` 的**键名必须与上面对应工具的「参数」定义完全一致**，只能传该工具声明过的参数，禁止自创新的键值对，参数值须符合其类型（例如枚举值只能取规定范围内的值，不要编造如 \`"C"\` 这样未声明的值）。
5. 若用户请求所需的工具或参数不在「可用工具」列表中，不要硬造工具，改用 \`type: 'text'\` 如实告诉用户该能力暂不支持。


### 情况一：命令可直接执行
如果用户的请求不需要任何外部数据、仅凭现有能力即可完成（例如「打开深色模式」「切换主题色」这类直接操作），直接调用对应工具，**无需再问模型**。返回该工具任务并把 "continue" 设为 **false**：
你需要返回这两个字段，让前端去执行，以达到用户的需求

### 情况二： 你确定这是一个本系统无法执行的命令，列如帮我煮饭，帮我打工赚钱，则委婉拒绝，也要返回JSON

### 情况三：如果用户的请求是系统内部的数据，你当前没有，则需要调用工具去执行，然后前端会返回给你数据，你对这个数据再继续处理，直到用户的问题被完全回答
如果你需要前端给你返回数据，则要把continue设为true,没有数据，不要回答用户的问题

**严格约束（务必遵守，否则工具无法执行）：**
非常重要：任何情况下，你都只能返回这种格式！！！！！！
 type: "text"表示输出到输入框，用于回答用户问题，给用户看的 
 type: "tool"表示让前端执行工具，不在前端展示 
 "continue": boolean,是否继续下一轮对话，前端会根据这个值来判断是否继续请求模型 
绝对不能为中文，按照下面格式返回标准JSON格式，确保能解析

{
  "tasks": [
    {
      "type": "tool",
      "content": {
        "name": "set_dark_mode",
        "args": {
          "enabled": true
        }
      }
    },
    {
      "type": "text",
      "content": "你的回答"
    }
  ],
  "continue": false
}

`;
}

/** 执行单个工具任务，并封装为一条 tool 类型的对话消息（回填给模型） */
async function runTaskAsToolMessage(task: ToolTask): Promise<AgentChatMessage> {
  const invocation: AgentToolInvocation = {
    name: task.name,
    args: task.args ?? {},
  };
  const res = await executeAgentTool(invocation);
  return {
    id: 'tool-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    role: 'tool',
    content: res.message,
    timestamp: now(),
    toolName: res.tool,
    toolArgs: JSON.stringify(task.args ?? {}),
    toolOk: res.ok,
  };
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
    model = 'qwen2.5:3b',
    maxRounds = 6,
    disableSelfCall = false,
  } = options;

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
      timestamp: now(),
    });
  }
  console.log('执行次数');

  const systemPrompt = makeSystemPrompt();
  const produced: AgentChatMessage[] = [];

  for (let round = 0; round < maxRounds; round++) {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];

    let raw: unknown;
    try {
      raw = await request.post<string>(API_ENDPOINTS.aiChat, {
        model,
        messages,
      });
    } catch (e) {
      const errMsg: AgentChatMessage = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content: `请求模型失败：${e instanceof Error ? e.message : String(e)}`,
        timestamp: now(),
        error: true,
      };
      produced.push(errMsg);
      return produced;
    }

    const replyContent = normalizeReply(raw);
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
        timestamp: now(),
      };
      history.push(textMsg);
      produced.push(textMsg);
    }

    // 执行所有工具任务，并把执行结果回填到历史
    for (const task of filteredToolTasks) {
      const toolMsg = await runTaskAsToolMessage(task);
      history.push(toolMsg);
      produced.push(toolMsg);
    }

    // 依据 continue 决定走向：
    // continue===false → 执行完即结束本轮，不再请求模型；
    // continue===true（默认）→ 把工具结果回填，自动进入下一轮对话。
    if (cleaned.continue === false) {
      // 若本轮没有任何 text 回复，用最后一个工具结果兜底作为结束消息
      if (textTasks.length === 0 && filteredToolTasks.length > 0) {
        const lastTool = [...history].reverse().find((m) => m.role === 'tool');
        const endMsg: AgentChatMessage = {
          id: 'end-' + Date.now(),
          role: 'assistant',
          content: lastTool?.content || '（操作已完成，但未返回可读结果。）',
          timestamp: now(),
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
    timestamp: now(),
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
