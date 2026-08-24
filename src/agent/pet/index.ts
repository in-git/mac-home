import { petActions } from './actions';
import type { PetAction, PetActionResult } from './actions';

export { petActions, EVENT, dispatchPetEvent } from './actions';
export type { PetAction, PetActionResult } from './actions';
export {
  ROLE_DIALOG_EVENT,
  ROLE_DIALOG_CLOSE_EVENT,
  dispatchPetDialog,
  closeRoleDialog,
  ROLE_CLICK_DIALOG,
  HELP_MENU_DIALOG,
} from './dialog';
export type {
  RoleDialogConfig,
  BaseDialogConfig,
  GameDialogConfig,
  DialogLine,
  DialogChoice,
} from './types';

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
 * 顺序执行一组动作（组动作）。供前端 / 工具层一次性执行多个基础行为。
 * @param actions 动作数组，每个元素为 { name, args? }
 */
export function performPetActions(
  actions: Array<{ name: string; args?: Record<string, unknown> }>,
): PetActionResult {
  if (actions.length === 0) {
    return { ok: false, message: '没有需要执行的动作。' };
  }
  const results: string[] = [];
  let allOk = true;
  for (const item of actions) {
    const res = runPetAction(item.name, item.args ?? {});
    if (!res.ok) allOk = false;
    results.push(res.message);
  }
  return { ok: allOk, message: results.join('；') };
}
