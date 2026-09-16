/**
 * 全屏 loading 的状态源（模块级单例）。
 *
 * 为什么不用 React Context 存状态、而用「模块级 store + useSyncExternalStore」：
 *
 * 打开网页 / 视频的调用点散落在 `openSite()`、`openVideo()` 这类**普通函数**里，
 * 不在组件内，拿不到 context，也没法调 `setState`。若强行用 context，
 * 每个调用点都得先把 `show/hide` 一层层透传下去，等于把 UI 状态
 * 污染到业务函数签名上。
 *
 * 所以状态放在模块级，组件侧用 `useSyncExternalStore` 订阅 ——
 * 它比 `useState + 手动订阅` 更贴合「外部数据源」的语义，且自动处理
 * 并发渲染下的撕裂问题。这样任何位置（组件内 / 普通函数里）都能
 * 直接 `showLoading()` / `hideLoading()`。
 */

/** 一次 loading 请求 */
interface LoadingRequest {
  /** 唯一标识，用于 hide 时精确关闭「自己那一次」 */
  id: number;
  /** 提示文字 */
  label: string;
  /** 超时时长（ms）；到点后无论是否完成都会自动关闭 */
  timeout: number;
}

interface LoadingState {
  /** 当前展示的请求；null 表示不展示 */
  current: LoadingRequest | null;
  /** 是否是超时 / 异常关闭（用于给用户一个失败提示而非静默消失） */
  timedOut: boolean;
}

let state: LoadingState = { current: null, timedOut: false };
const listeners = new Set<() => void>();

/** 自增 id，避免同一毫秒内两次 show 拿到相同标识 */
let seq = 0;
/** 当前挂起的超时定时器 */
let timer: number | null = null;
/** 最近一次 show 的 id，供 hide 时判断「关闭的是不是当前这次」 */
let currentId = 0;

function emit(next: LoadingState) {
  state = next;
  listeners.forEach((fn) => fn());
}

function clearTimer() {
  if (timer !== null) {
    window.clearTimeout(timer);
    timer = null;
  }
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** 供 useSyncExternalStore 读取快照（必须返回稳定引用） */
export function getSnapshot(): LoadingState {
  return state;
}

/** 服务端 / 首帧快照：始终未加载，避免 SSR 水合不一致 */
export function getServerSnapshot(): LoadingState {
  return EMPTY_STATE;
}

const EMPTY_STATE: LoadingState = { current: null, timedOut: false };

/**
 * 展示全屏 loading，返回本次请求的 id。
 *
 * 重复调用时**后一次覆盖前一次**并重置计时器：用户连着点两个站点，
 * 关心的是最后点的那次，而不是排队等前一个走完 10 秒。
 *
 * @param label 提示文字
 * @param timeout 超时时长（ms），默认 10s
 */
export function showLoading(label = '正在打开…', timeout = 10_000): number {
  clearTimer();
  currentId = ++seq;
  emit({ current: { id: currentId, label, timeout }, timedOut: false });

  // 兜底：到点无论成功与否都关掉，避免遮罩永久卡在屏幕上
  timer = window.setTimeout(() => {
    timer = null;
    if (state.current?.id !== currentId) return;
    currentId = 0;
    emit({ current: null, timedOut: true });
  }, timeout);

  return currentId;
}

/**
 * 关闭 loading。
 *
 * @param id 指定要关闭的请求 id；不传则关闭当前展示的那个。
 *   传 id 是为了处理竞态：A 的失败回调可能在 B 已经开始加载后才到达，
 *   此时不应把 B 的遮罩一起关掉。
 */
export function hideLoading(id?: number) {
  if (id !== undefined && id !== currentId) return;
  clearTimer();
  currentId = 0;
  emit({ current: null, timedOut: false });
}

/** 清除超时标记（消费掉一次失败提示，避免残留到下次） */
export function clearTimeoutFlag() {
  if (!state.timedOut) return;
  emit({ ...state, timedOut: false });
}
