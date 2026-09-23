/**
 * 播放进度记忆（内存 + sessionStorage 双写）。
 *
 * 场景：鼠标悬停卡片时静音预览播放，用户点击进入模态框应「接着播」，
 * 因此需要一个跨组件的进度传递通道 —— 悬停预览写入，模态框读取。
 *
 * 用模块级 Map 保证同页内即时可读（无异步 / 序列化开销），
 * 同时写 sessionStorage，让刷新后也能恢复（仅当次会话，关标签即清）。
 */

const STORAGE_KEY = 'video-progress';

/** id → 秒 */
const memory = new Map<string, number>();

/** 从 sessionStorage 载入（懒加载一次） */
let hydrated = false;
function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, number>;
    Object.entries(parsed).forEach(([id, seconds]) => {
      if (typeof seconds === 'number' && seconds > 0) memory.set(id, seconds);
    });
  } catch {
    /* 解析失败忽略，等价于无历史进度 */
  }
}

/** 将内存数据落盘（节流：仅在进度明显变化时写） */
function persist() {
  try {
    const obj: Record<string, number> = {};
    memory.forEach((v, k) => {
      obj[k] = Math.round(v * 10) / 10; // 保留 1 位小数，压缩体积
    });
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    /* 存储不可用（隐私模式等）时静默降级为纯内存 */
  }
}

const persistTimers = new Map<string, number>();

/** 记录进度（写入内存立即生效，落盘节流 1s 避免高频写） */
export function saveProgress(id: string, seconds: number) {
  if (!id || !Number.isFinite(seconds) || seconds <= 0) return;
  hydrate();
  memory.set(id, seconds);

  if (persistTimers.has(id)) return;
  const timer = window.setTimeout(() => {
    persistTimers.delete(id);
    persist();
  }, 1000);
  persistTimers.set(id, timer);
}

/** 读取进度（秒）；无记录返回 0 */
export function getProgress(id: string): number {
  hydrate();
  return memory.get(id) ?? 0;
}

/** 清除某个视频的进度（例如播放完成后不再续播） */
export function clearProgress(id: string) {
  hydrate();
  if (!memory.delete(id)) return;
  persist();
}
