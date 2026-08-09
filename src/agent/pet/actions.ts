import {
  dispatchPetEvent,
  PET_EVENT_JUMP,
  PET_EVENT_MOVE,
  PET_EVENT_RESET,
  PET_EVENT_SPEAK,
} from './events';

export interface PetActionResult {
  ok: boolean;
  message: string;
}

/** 让桌宠说话（在头顶弹出对话气泡） */
export function petSpeak(text: string): PetActionResult {
  const content = text.trim();
  if (!content) {
    return { ok: false, message: '说话内容不能为空。' };
  }
  dispatchPetEvent(PET_EVENT_SPEAK, { text: content });
  return { ok: true, message: `桌宠已说话：「${content}」` };
}

/** 让桌宠向指定方向移动一段时间（毫秒） */
export function petMove(
  direction: 'left' | 'right',
  durationMs: number,
): PetActionResult {
  if (direction !== 'left' && direction !== 'right') {
    return { ok: false, message: 'direction 只能是 left 或 right。' };
  }
  const duration = Math.max(100, Math.min(8000, Math.round(durationMs)));
  dispatchPetEvent(PET_EVENT_MOVE, { direction, duration });
  return {
    ok: true,
    message: `桌宠正在向${direction === 'left' ? '左' : '右'}移动（约 ${duration} 毫秒）。`,
  };
}

/** 让桌宠跳跃（double 为二段跳） */
export function petJump(double: boolean): PetActionResult {
  dispatchPetEvent(PET_EVENT_JUMP, { double: !!double });
  return { ok: true, message: `桌宠${double ? '二段跳' : '跳跃'}中。` };
}

/** 让桌宠回到屏幕中央底部，停止当前动作 */
export function petReset(): PetActionResult {
  dispatchPetEvent(PET_EVENT_RESET, {});
  return { ok: true, message: '桌宠已回到屏幕中央底部。' };
}
