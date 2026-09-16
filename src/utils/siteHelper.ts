import { siteApi, SiteItem } from '../api/site';
import { hideNativeLoading, isNativeApp, showNativeLoading } from './appBridge';
import { openWithLoading } from './openWithLoading';

/**
 * 判断两个站点是否为同一个（优先 id，其次 link，最后 name）。
 * 收藏去重等场景统一使用该判定，避免以不同字段为准导致重复。
 */
export function isSameSite(a?: SiteItem | null, b?: SiteItem | null): boolean {
  if (!a || !b) return false;
  if (a.id && b.id) return a.id === b.id;
  if (a.link && b.link) return a.link === b.link;
  return !!a.name && a.name === b.name;
}

/**
 * 打开站点卡片：先上报点击量（POST /api/public/site/click），再打开链接。
 * 上报为统计用途，失败时静默，不影响正常跳转；无 id 时跳过上报。
 *
 * ── loading 由谁负责，分两种情况 ──────────────────────────
 *
 * **在原生 App 内**：交给 App 做（原生 Compose 遮罩，见 `appBridge.ts`）。
 * 网页只负责「告诉 App 开始」和「告诉 App 结束」，自己不画遮罩。
 * 之所以这么分：网页内的遮罩与页面同层、会随滚动抖动，且层级低于原生
 * 控件；原生遮罩是一层独立的覆盖物，稳定得多。
 *
 * **在普通浏览器内**：沿用网页内的全屏 loading（`openWithLoading`），
 * 因为此时没有原生容器可依托，也没有跨页面跳转的观感问题 ——
 * `window.open` 是新标签页，当前页不需要遮罩遮掩什么。
 *
 * @param onOpen 调用方自定义的打开逻辑（如随机网页组件内部处理），缺省时新窗口打开
 */
export function openSite(
  item: SiteItem,
  onOpen?: (item: SiteItem) => void,
): void {
  /** 真正执行「上报 + 跳转」，两个分支共用 */
  const doOpen = (): Promise<void> => {
    // 点击量上报是「尽力而为」：失败也照样跳转，只是不计入统计
    const report = item.id
      ? siteApi.recordClick(item.id).catch(() => {})
      : Promise.resolve();

    return report.then(() => {
      if (onOpen) {
        onOpen(item);
        return;
      }
      if (item.link) window.open(item.link, '_blank', 'noreferrer');
    });
  };

  // App 内：由原生负责遮罩
  if (isNativeApp()) {
    showNativeLoading('正在打开…');

    /**
     * 结束信号 = 跳转动作已发出。
     *
     * 不能等新页面加载完成：`window.open` 打开的是跨域页面，
     * 当前页面无法观测其加载状态。上报接口返回（无论成败）就说明
     * 我们该做的事做完了，此时收掉遮罩即可 —— 剩下的是新页面自己的事。
     *
     * 原生侧还有一份超时兜底（WEB_LOADING_TIMEOUT_MS），
     * 所以即使这里的 Promise 因异常永不 resolve，遮罩也不会卡住。
     */
    void doOpen()
      .catch((error) => {
        console.warn('[site] 打开失败', item.id ?? item.link, error);
      })
      .finally(() => {
        hideNativeLoading();
      });
    return;
  }

  // 浏览器内：沿用网页内的 loading（带 10s 超时与异常处理）
  void openWithLoading(doOpen, {
    label: '正在打开…',
    onError: (reason) => {
      console.warn('[site] 打开失败', reason, item.id ?? item.link);
    },
  });
}
