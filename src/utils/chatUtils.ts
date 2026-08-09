import { executeAgentTool, listAgentTools } from '../agent/index';
import type {
  AgentChatMessage,
  AgentToolInvocation,
  ToolTask,
} from '../agent/types';

/**
 * Agent 对话相关的纯工具集合，从 agent/chat.ts 抽出，便于复用与单测。
 *
 * 采用依赖注入：listTools / execTool 可在构造时覆盖，默认走 agent/index
 * 的真实实现，避免与 chat 模块产生循环依赖。
 */
export class ChatUtils {
  private readonly listTools: typeof listAgentTools;
  private readonly execTool: typeof executeAgentTool;

  constructor(
    deps: {
      listTools?: typeof listAgentTools;
      execTool?: typeof executeAgentTool;
    } = {},
  ) {
    this.listTools = deps.listTools ?? listAgentTools;
    this.execTool = deps.execTool ?? executeAgentTool;
  }

  /** 当前时间，格式 HH:mm */
  now(): string {
    return new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /** 把后端返回的各类形态统一为模型 content 字符串 */
  normalizeReply(raw: unknown): string {
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
  makeSystemPrompt(): string {
    const toolList = this.listTools()
      .map(
        (t) =>
          `- ${t.name}：${t.description}\n  参数：${JSON.stringify(t.parameters)}`,
      )
      .join('\n');

    return `

你是这个系统的助手，可以通过调用工具来读取或修改系统数据。

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
你需要返回这两个字段，让前端去执行，以达到用户的需求，一旦可以执行，则把continue设为false【必须】

### 情况二： 你确定这是一个本系统无法执行的命令，列如帮我煮饭，帮我打工赚钱，则委婉拒绝，也要返回JSON

### 情况三：如果用户的请求是系统内部的数据，你当前没有，则需要调用工具去执行，然后前端会返回给你数据，你对这个数据再继续处理，直到用户的问题被完全回答
如果你需要前端给你返回数据，则要把continue设为true,没有数据，不要回答用户的问题

### 情况四： 如果用户只是闲聊，则直接回答用户问题，不要调用工具，直接回答用户问题，回答完毕后把continue设为false

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
  async runTaskAsToolMessage(task: ToolTask): Promise<AgentChatMessage> {
    const invocation: AgentToolInvocation = {
      name: task.name,
      args: task.args ?? {},
    };

    const res = await this.execTool(invocation);
    return {
      id: 'tool-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      role: 'tool',
      content: res.message,
      timestamp: this.now(),
      toolName: res.tool,
      toolArgs: JSON.stringify(task.args ?? {}),
      toolOk: res.ok,
    };
  }
}
