import { useEffect, useRef } from 'react';
import { petActions, runPetAction } from '../agent/pet';

/**
 * 随机自由活动规则。
 * 开启后，桌宠每隔一段时间随机触发一个行为（本地随机，不消耗大模型 token），
 * 模拟「活着的宠物」而非静止摆设。保留 hook 签名以保证调用处（App）无需改动。
 */

// 自由活动台词池：随机挑一句让桌宠自言自语，显得有生气
const IDLE_LINES = [
  '发呆中…',
  '今天天气不错呀～',
  '要不要来点音乐？',
  '嗯…刚才想到一件事',
  '偷偷打个盹',
  '在等你来找我玩呢',
  '我是你的桌面小伙伴！',
  '好无聊，动一动吧',
];

// 各行为的相对权重（越高越常被触发）；reset 权重很低，避免频繁归位
const WEIGHTS: Record<string, number> = {
  pet_speak: 3,
  pet_move: 4,
  pet_jump: 3,
  pet_celebrate: 1,
  pet_reset: 0.4,
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 按权重随机选一个行为名 */
function pickActionName(): string {
  const pool: string[] = [];
  for (const a of petActions) {
    const w = WEIGHTS[a.name] ?? 1;
    const times = Math.max(1, Math.round(w * 10));
    for (let i = 0; i < times; i++) pool.push(a.name);
  }
  return pickRandom(pool);
}

/** 为某个行为生成随机参数 */
function randomArgs(name: string): Record<string, unknown> {
  switch (name) {
    case 'pet_speak':
      return { text: pickRandom(IDLE_LINES) };
    case 'pet_move':
      return {
        direction: pickRandom(['left', 'right'] as const),
        distance: 80 + Math.floor(Math.random() * 240),
      };
    case 'pet_jump':
      return { double: Math.random() < 0.3 };
    case 'pet_celebrate':
      return { count: 2 };
    default:
      return {};
  }
}

/** 随机触发一个桌宠行为 */
function triggerRandomAction() {
  const name = pickActionName();
  runPetAction(name, randomArgs(name));
}

export function usePetAutoActivity(petAutoActivity: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!petAutoActivity) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // 随机间隔（6~12 秒）递归调度，比固定 setInterval 更自然
    const scheduleNext = () => {
      const delay = 6000 + Math.floor(Math.random() * 6000);
      timerRef.current = setTimeout(() => {
        triggerRandomAction();
        scheduleNext();
      }, delay);
    };

    // 进入后稍等片刻来第一次，避免与进页面打招呼重叠
    timerRef.current = setTimeout(() => {
      triggerRandomAction();
      scheduleNext();
    }, 3000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [petAutoActivity]);
}
