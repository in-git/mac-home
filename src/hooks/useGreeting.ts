import { useEffect } from 'react';
import { chatWithPet } from '../utils/aiClient';
import { useHomeStore } from '../store/useHomeStore';

// 进入页面打招呼只触发一次（module 级 flag，StrictMode 双挂载下也只会发起一次模型请求）
let greetingDispatchedRef = false;

/**
 * 进入页面时，给模型发送一条打招呼指令，让模型随机让桌宠说一句问候语。
 * 仅在首次进入时触发一次（module 级 flag 防止 StrictMode 双执行）。
 */
export function useGreeting() {
  useEffect(() => {
    if (greetingDispatchedRef) return;
    greetingDispatchedRef = true;
    const aiConfig = useHomeStore.getState().aiConfig;
    const greetingPrompt =
      '你刚进入用户桌面，请以桌宠的身份随机挑一句简短友好的打招呼用语' +
      '（10~20 字，语气活泼自然，不要复述指令），直接输出这句话即可。';
    chatWithPet(aiConfig, greetingPrompt, []).catch((err) => {
      console.warn('进入页面打招呼失败（忽略）：', err);
    });
  }, []);
}
