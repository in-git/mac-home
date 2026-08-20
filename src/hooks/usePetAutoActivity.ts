import { useEffect, useRef } from 'react';
import { runAgentTurn } from '../agent/run';
import { petTools } from '../agent/pet';

/**
 * AI 自由活动。
 * 开启后，桌宠每 20 秒交由大模型自主决策一个行为（通过 pet_perform 组动作执行），
 * 模拟「活着的宠物」而非静止摆设。相比本地随机，行为更丰富、更符合当前语境。
 *
 * 保留 hook 签名以保证调用处（App）无需改动。
 */

/** 两次 AI 自主活动请求的固定间隔（毫秒） */
const AI_ACTIVITY_INTERVAL = 20000;
/** 进入后首次触发前的等待（毫秒），避免与进页面打招呼重叠 */
const AI_ACTIVITY_FIRST_DELAY = 3000;

// AI 自由活动的指令模板：引导模型自主决定并执行一组动作
const AI_ACTIVITY_PROMPT =
  `
  
  '优先调用 pet_perform 做出实际行为。`;

export function usePetAutoActivity(petAutoActivity: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runningRef = useRef(false);

  // 由 AI 自主决策并执行一组行为；带运行锁，避免多次触发重叠
  const triggerAI = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    try {
      await runAgentTurn([], AI_ACTIVITY_PROMPT, { tools: petTools });
    } catch {
      // 失败静默，等待下一次调度
    } finally {
      runningRef.current = false;
    }
  };

  useEffect(() => {
    if (!petAutoActivity) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // 首次进入后稍等片刻来第一次，之后每 20 秒固定发起一次 AI 自主活动请求
    timerRef.current = setTimeout(() => {
      triggerAI();
      intervalRef.current = setInterval(() => {
        triggerAI();
      }, AI_ACTIVITY_INTERVAL);
    }, AI_ACTIVITY_FIRST_DELAY);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [petAutoActivity]);
}
