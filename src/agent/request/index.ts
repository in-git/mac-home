import { err, ok } from '../config/result';
import type {
  AgentTool,
  AgentToolCallResult,
  AgentToolParam,
} from '../types';
import { requestActions } from './actions';
import type { RequestAction, RequestActionResult } from './actions';

export { requestActions } from './actions';
export type { RequestAction, RequestActionResult } from './actions';
export { useSiteList } from './useSiteList';
export type { UseSiteListOptions } from './useSiteList';

/** 按 name 建立索引，供 skill 调用快速查找 */
const requestActionMap: Record<string, RequestAction> = Object.fromEntries(
  requestActions.map((a) => [a.name, a]),
);

/**
 * 统一的 skill 调用入口：根据请求行为名执行对应 API 操作。
 */
export async function runRequestAction(
  name: string,
  args: Record<string, unknown> = {},
): Promise<RequestActionResult> {
  const action = requestActionMap[name];
  if (!action) {
    return { ok: false, message: `未知的请求行为：${name}` };
  }
  return action.run(args);
}

/**
 * 请求工具列表由 requestActions 自动生成：requestActions 是行为清单的唯一来源，
 * 每个行为的 name/title/description/parameters 直接映射为对应 AgentTool，
 * 保持与 skill.json、requestActions 三者同步。
 */
export const requestTools: AgentTool[] = requestActions.map((action) => ({
  name: action.name,
  title: action.title,
  description: action.description,
  parameters: action.parameters as Record<string, AgentToolParam>,
  run: async (args): Promise<AgentToolCallResult> => {
    const res = await runRequestAction(action.name, args);
    return res.ok
      ? ok(action.name, res.message, res.data)
      : err(action.name, res.message);
  },
}));
