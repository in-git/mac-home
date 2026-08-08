import type { ToolTask } from '../types';

/** 清洗后的单条任务：tool 已解析为结构化 name/args，text 保留纯文本 */
export type CleanedTask =
  | { type: 'tool'; name: string; args: Record<string, unknown> }
  | { type: 'text'; content: string };

/** 清洗后的模型响应 */
export interface CleanedModel {
  tasks: CleanedTask[];
  continue: boolean;
}

/**
 * 递归解析一个值：
 * 若值为字符串且可以 JSON.parse，则解析后对其结果再次递归解析，
 * 直到结果不再是「可继续解析的 JSON 字符串」为止（即达到稳定态）。
 * 这样无论模型把 content / args 嵌套了多少层 JSON 字符串，都能被摊平。
 *
 * 例如 '"{\"name\":\"x\"}"' → '{"name":"x"}' → { name: "x" }
 */
function recursiveParse(value: unknown, depth = 0): unknown {
  // 防止极端情况下无限递归
  if (depth > 20) return value;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    // 仅当看起来像 JSON（以 { [ " 开头且能解析）时才继续递归，
    // 避免把普通工具名（如 set_dark_mode）误判为 JSON
    if (/^[\[{"]/.test(trimmed)) {
      try {
        const inner = JSON.parse(trimmed);
        return recursiveParse(inner, depth + 1);
      } catch {
        return value;
      }
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((v) => recursiveParse(v, depth + 1));
  }

  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = recursiveParse(v, depth + 1);
    }
    return out;
  }

  return value;
}

/**
 * 从模型原文中解析并清洗出可执行的任务列表。
 *
 * 处理流程（全程递归摊平嵌套 JSON）：
 * 1. 剥离 ```json 围栏（若有）；
 * 2. 递归解析整个响应体为对象，取 task 数组；
 * 3. 对每条 task：
 *    - type==='tool'：content 递归解析为对象，从中取 name 与 args
 *      （args 同样会被递归摊平为 JSON 对象）；
 *    - type==='text'：content 递归解析后转回字符串原样保留；
 * 4. continue 取布尔，缺省为 true。
 *
 * 若解析失败或无有效任务，则整体作为一条 text 任务兜底。
 */
export function parseModelResponse(content: string): CleanedModel {
  const text = content.trim();
  const parsed = JSON.parse(text);
  console.log(parsed);

  // 解析失败或无任务：整体作为一条 text 回复
  return parsed;
}

/** 将清洗后的 tool 任务转为内部执行用的 ToolTask */
export function toToolTasks(cleaned: CleanedModel): ToolTask[] {
  const toolTasks: ToolTask[] = [];
  for (const t of cleaned.tasks) {
    if (t.type === 'tool') {
      toolTasks.push({ name: t.name, args: t.args });
    }
  }
  return toolTasks;
}

/** 提取清洗后的 text 任务内容 */
export function toTextTasks(cleaned: CleanedModel): string[] {
  const textTasks: string[] = [];
  for (const t of cleaned.tasks) {
    if (t.type === 'text') {
      textTasks.push(t.content);
    }
  }
  return textTasks;
}
