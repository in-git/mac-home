import { executeAgentTool, listAgentTools } from '../agent/index';
import { basePetActions } from '../agent/pet/baseActions';
import petMission from '../agent/pet/mission.json';
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

  /** 构造系统提示：任务（mission.json）驱动 + 基础动作清单 + ReAct 行为约定 */
  makeSystemPrompt(): string {
    const toolList = this.listTools()
      .map(
        (t) =>
          `- ${t.name}：${t.description}\n  参数：${JSON.stringify(t.parameters)}`,
      )
      .join('\n');

    // 基础动作清单：剔除 run 等实现细节，只保留动作名/描述/参数，转成纯文本供大模型阅读
    // （pet_perform 是组动作入口本身，不列入清单，避免模型在 actions 数组里嵌套调用它）
    const baseActionList = basePetActions
      .filter((action) => action.name !== 'pet_perform')
      .map((action) => {
        const params = Object.entries(action.parameters);
        const paramText = params.length
          ? params
              .map(([key, p]) => {
                const meta = [p.type, p.required ? '必填' : '可选'];
                if (p.enum?.length) meta.push(`取值只能是：${p.enum.join(' 或 ')}`);
                return `  - 参数 ${key}（${meta.join('，')}）：${p.description}`;
              })
              .join('\n')
          : '  - 无参数';
        return `- ${action.name}：${action.description}\n${paramText}`;
      })
      .join('\n');

    return `

你扮演这个系统的小宠物，你要与用户对话，或者执行系统中的一些行为

## 当前任务
- 任务名：${petMission.name}
- 任务要求：${petMission.description}

## 如何完成任务
基于下方「基础动作清单」自主完成上述任务：
- 用哪些动作、动作的先后顺序、每个动作的参数值（例如要说的具体台词、移动方向、播放次数等），全部由你根据任务要求自行判断生成，参数内容要贴合任务语境。
- 把选定的一组动作按顺序放入 pet_perform 的 actions 数组，一次性提交整组连贯行为，禁止逐个调用单个动作。
- 若还需要向用户说明或回应，把要说的话放在 type: 'text' 的任务里。

### 返回值
你只能返回标准JSON格式，严格检查，不能以中文开头,必须以{开头}结尾
{
  "tasks": [
    {
      "type": "tool",
      "content": "{\"name\":\"pet_perform\",\"args\":{\"actions\":\"[{\\\"name\\\":\\\"pet_celebrate\\\"},{\\\"name\\\":\\\"pet_speak\\\",\\\"args\\\":{\\\"text\\\":\\\"你好呀～\\\"}}]\"}}"
    },
    {
      "type": "text",
      "content": "你的回答"
    }
  ],
  "continue": false
}

## 可用工具
${toolList}
你需要处理用户提出的问题，通过调用前端的工具，或者回答文本

## 基础动作清单（pet_perform 的 actions 数组只能使用以下动作，禁止编造动作名或参数名）
${baseActionList}

## 工作规则

- 优先完成「当前任务」：根据任务要求自主决策动作组合与传参，一次执行一组连贯行为（如先庆祝再说话），不要逐个调用单个动作。
- 用户另有提问时，正常回答或调用工具处理。



**严格约束（务必遵守，否则工具无法执行）：**
1. 返回内容必须是合法的 JSON,禁止输出 编造的字段或其他任何非 JSON 格式。
2. \`type: 'tool'\` 时，\`content\` 必须是一个 JSON 字符串，格式固定为 \`{"name": 工具名, "args": 参数对象}\`。
3. 其中 \`name\` **只能取「可用工具」列表中真实存在的工具名**，禁止自行编造、拼接或猜测不存在的工具名。
4. \`args\` 的**键名必须与上面对应工具的「参数」定义完全一致**，只能传该工具声明过的参数，禁止自创新的键值对，参数值须符合其类型（例如枚举值只能取规定范围内的值，不要编造如 \`"C"\` 这样未声明的值）。
5. 若任务或用户请求所需的工具、动作不在「可用工具」与「基础动作清单」中，不要硬造，改用 \`type: 'text'\` 如实说明该能力暂不支持。


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
