import { err, ok } from '../config/result';
import type {
  AgentTool,
  AgentToolCallResult,
  AgentToolParam,
} from '../types';
import { petActions } from './actions';
import type { PetAction, PetActionResult } from './actions';

export { petActions, EVENT } from './actions';
export type { PetAction, PetActionResult } from './actions';
export {
  ROLE_DIALOG_EVENT,
  ROLE_DIALOG_CLOSE_EVENT,
  dispatchPetDialog,
  closeRoleDialog,
  IDLE_SPEECH,
  GREETING_DIALOG,
  THANKS_DIALOG,
} from './dialog';
export type {
  RoleDialogConfig,
  BaseDialogConfig,
  GameDialogConfig,
  DialogLine,
  DialogChoice,
} from './dialog';

/** 按 name 建立索引，供 skill 调用快速查找 */
const petActionMap: Record<string, PetAction> = Object.fromEntries(
  petActions.map((a) => [a.name, a]),
);

/**
 * 统一的 skill 调用入口：根据行为名执行对应动作。
 * 调用方（如 AI Agent）只需 runPetAction('pet_move', { direction: 'left' })，
 * 无需关心具体实现，行为清单完全来自 petActions（与 skill.json 对齐）。
 */
export function runPetAction(
  name: string,
  args: Record<string, unknown> = {},
): PetActionResult {
  const action = petActionMap[name];
  if (!action) {
    return { ok: false, message: `未知的角色行为：${name}` };
  }
  return action.run(args);
}

/**
 * 桌宠事件分发助手。
 *
 * 工具层与桌宠组件（RoleCharacterCanvas）通过 window CustomEvent 解耦通信：
 * 工具层只负责分发事件，桌宠组件监听对应事件并驱动 Pixi 渲染/物理循环。
 * 事件名字符串集中在 actions.ts 的 EVENT 常量中定义，作为唯一来源。
 */
export function dispatchPetEvent(
  name: string,
  detail?: Record<string, unknown>,
): void {
  window.dispatchEvent(new CustomEvent(name, { detail: detail ?? {} }));
}

/**
 * 宠物工具列表由 petActions 自动生成：petActions 是行为清单的唯一来源，
 * 每个行为的 name/title/description/parameters 直接映射为对应 AgentTool，
 * 因此 petTools 始终与 skill.json、petActions 三者完全一致，无需重复维护。
 */
export const petTools: AgentTool[] = petActions.map((action) => ({
  name: action.name,
  title: action.title,
  description: action.description,
  parameters: action.parameters as Record<string, AgentToolParam>,
  run: (args): AgentToolCallResult => {
    const res = runPetAction(action.name, args);
    return res.ok
      ? ok(action.name, res.message)
      : err(action.name, res.message);
  },
}));
