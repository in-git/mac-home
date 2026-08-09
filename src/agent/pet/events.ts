/**
 * 桌宠 Agent 事件常量与分发助手。
 *
 * AI 工具层与桌宠组件（RoleCharacterCanvas）通过 window CustomEvent 解耦通信：
 * 工具层只负责分发事件，桌宠组件监听对应事件并驱动 Pixi 渲染/物理循环。
 */

/** 桌宠事件名（与 RoleCharacterCanvas 中的监听保持一致） */
export const PET_EVENT_SPEAK = 'role-dialog-speak';
export const PET_EVENT_MOVE = 'role-move';
export const PET_EVENT_JUMP = 'role-jump';
export const PET_EVENT_RESET = 'role-reset';

/** 分发一条桌宠事件 */
export function dispatchPetEvent(
  name: string,
  detail?: Record<string, unknown>,
): void {
  window.dispatchEvent(new CustomEvent(name, { detail: detail ?? {} }));
}
