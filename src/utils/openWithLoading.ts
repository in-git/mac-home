import { hideLoading, showLoading } from '@/components/LoadingOverlay/loadingStore';

/**
 * 打开动作的统一兜底超时（ms）。
 *
 * 需求要求「10 秒内没启动就关掉 loading」。这里分两层用：
 * - store 层也有一份兜底（loadStore 的 showLoading timeout），
 *   防的是「调用方忘了 hide」这种漏掉的情况
 * - 本文件的 timeout 才是业务语义：「启动信号」没在 10s 内到达就判失败
 *
 * 两者时长一致，但职责不同，不要合并。
 */
export const OPEN_TIMEOUT_MS = 10_000;

export interface OpenWithLoadingOptions {
  /** loading 文案 */
  label?: string;
  /** 超时时长（ms），默认 10s */
  timeout?: number;
  /** 超时或异常时的回调（例如提示用户、回滚乐观更新） */
  onError?: (reason: 'timeout' | 'error', error?: unknown) => void;
}

/**
 * 带全屏 loading + 超时 + 异常处理的「打开」包装器。
 *
 * 设计要点：
 *
 * 1. **loading 必须在超时或异常时关闭。** 打开网页是跨域行为，
 *    我们无法观测新标签页的加载结果，所以只有两个终止条件：
 *    拿到「已启动」信号，或等到超时。
 *
 * 2. **`start` 返回 Promise 时等待它，返回 void 时视为同步启动成功。**
 *    视频播放是同步 setState，站点打开是异步上报，两种形态都要能覆盖。
 *
 * 3. **用 id 精确关闭，避免竞态。** 用户快速连点两个卡片时，
 *    A 的超时回调可能在 B 已经开始后才触发；如果直接 `hideLoading()`
 *    会把 B 的遮罩误关。所以 `showLoading` 的返回值要一路带着。
 *
 * 4. **`Promise.race` 而非 `Promise.race` 后再判超时**：超时后仍要保证
 *    遮罩关闭，且不能让迟到的成功回调再动 UI。
 */
export async function openWithLoading(
  start: () => void | Promise<unknown>,
  options: OpenWithLoadingOptions = {},
): Promise<void> {
  const { label = '正在打开…', timeout = OPEN_TIMEOUT_MS, onError } = options;

  const id = showLoading(label, timeout);

  /** 超时哨兵：与真实结果区分开 */
  const TIMEOUT = Symbol('timeout');

  try {
    // 同步启动函数（如 setState）直接执行，不需要包 Promise：
    // 包成 Promise 会让「已启动」信号推迟一个微任务，遮罩多闪一下
    const result = start();
    if (!(result instanceof Promise)) {
      hideLoading(id);
      return;
    }

    let timer: number | undefined;
    const timeoutPromise = new Promise<typeof TIMEOUT>((resolve) => {
      timer = window.setTimeout(() => resolve(TIMEOUT), timeout);
    });

    const winner = await Promise.race([
      result.then(() => 'ok' as const),
      timeoutPromise,
    ]);
    if (timer !== undefined) window.clearTimeout(timer);

    if (winner === TIMEOUT) {
      hideLoading(id);
      onError?.('timeout');
      return;
    }
    hideLoading(id);
  } catch (error) {
    // 网络异常 / 抛出错误：一样要关掉遮罩，否则界面永久卡住
    hideLoading(id);
    onError?.('error', error);
  }
}
