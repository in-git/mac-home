import { useEffect } from 'react';
import { usePetAgent } from './usePetAgent';

// 进入页面打招呼只触发一次（module 级 flag，StrictMode 双挂载下也只会发起一次）
let greetingDispatchedRef = false;

/**
 * 进入页面时由大模型驱动桌宠主动打招呼。
 * 模型会根据角色设定决定桌宠说什么、并可能触发动作（如挥手/跳跃）。
 * 保留 hook 签名以保证调用处（App）无需改动。
 */
export function useGreeting() {
  const { send } = usePetAgent();

  useEffect(() => {
    if (greetingDispatchedRef) return;
    greetingDispatchedRef = true;

    void send('现在用户刚刚打开了主页，请用一句话热情地打招呼，可以顺带做一个欢迎动作。', {
      keepHistory: false,
    });
  }, [send]);
}
