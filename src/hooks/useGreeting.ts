import { useEffect } from 'react';
import { dispatchPetDialog, ROLE_CLICK_DIALOG } from '../agent/pet';

// 进入页面打招呼只触发一次（module 级 flag，StrictMode 双挂载下也只会发起一次）
let greetingDispatchedRef = false;

/**
 * 进入页面时显示欢迎对话框。
 * 保留 hook 签名以保证调用处（App）无需改动。
 */
export function useGreeting() {
  useEffect(() => {
    if (greetingDispatchedRef) return;
    greetingDispatchedRef = true;

    // 延迟 500ms 显示，避免页面刚加载时立即弹出
    setTimeout(() => {
      dispatchPetDialog(ROLE_CLICK_DIALOG);
    }, 500);
  }, []);
}
