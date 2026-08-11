import { useEffect, useRef } from 'react';
import { chatWithPet } from '../utils/aiClient';
import { useHomeStore } from '../store/useHomeStore';

/**
 * 模型定时驱动桌宠自主活动：把当前设备宽度上报给模型，由模型随机决定本次
 * 动作（移动 / 跳跃 / 说一句对话问候），配合 RoleCharacterCanvas 的物理循环执行。
 * 每次触发后在 10~60 秒之间随机选取下一次延迟，让活动更自然。
 * 仅在设置中开启「宠物 → 自由活动」时运行；busy ref 防止上一次请求
 * 未结束时堆积新一轮请求。
 */
export function usePetAutoActivity(petAutoActivity: boolean) {
  const petActivityBusyRef = useRef(false);

  useEffect(() => {
    if (!petAutoActivity) return;

    const drivePetActivity = () => {
      if (petActivityBusyRef.current) return;
      petActivityBusyRef.current = true;
      const aiConfig = useHomeStore.getState().aiConfig;
      const deviceWidth = window.innerWidth;
      const activityPrompt =
        `现在是桌宠定时自主活动时刻。当前设备宽度为 ${deviceWidth} 像素。` +
        '请随机选择以下三种动作之一执行：' +
        '1) 调用 pet_move 工具让桌宠向左或向右移动一次（方向可自由选择，' +
        '移动距离请结合设备宽度合理取值，建议 80~300 像素，注意不要移出屏幕）；' +
        '2) 调用 pet_jump 工具让桌宠跳一下（可偶尔二段跳）；' +
        '3) 调用 pet_speak 工具，让桌宠随口说一句简短、活泼的对话问候语' +
        '（10~20 字，符合桌宠身份，不要复述指令）。' +
        '三种动作随机选取，避免每次固定同一种。';
      chatWithPet(aiConfig, activityPrompt, [])
        .catch((err) => {
          console.warn('定时驱动桌宠自主活动失败（忽略）：', err);
        })
        .finally(() => {
          petActivityBusyRef.current = false;
        });
    };

    // 每次触发后，在 10~60 秒之间随机选取下一次延迟，让桌宠活动更自然。
    const scheduleNext = () => {
      const delay = 10000 + Math.random() * 50000; // 10s ~ 60s
      return window.setTimeout(() => {
        drivePetActivity();
        timerRef.current = scheduleNext();
      }, delay);
    };
    const timerRef = { current: scheduleNext() };
    return () => window.clearTimeout(timerRef.current);
  }, [petAutoActivity]);
}
