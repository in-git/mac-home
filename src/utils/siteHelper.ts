import { siteApi, SiteItem } from '../api/site';
import { openWithLoading } from './openWithLoading';

/**
 * 打开站点卡片：先上报点击量（POST /api/public/site/click），再打开链接。
 * 上报为统计用途，失败时静默，不影响正常跳转；无 id 时跳过上报。
 *
 * 全屏 loading 的关闭时机：
 * - 上报接口返回（成功或失败）即认为「启动完成」，关闭遮罩
 * - 超时 10s 未返回 / 请求抛错，都会关闭遮罩（见 openWithLoading），
 *   并在界面上给出「打开超时」的提示，不会永久卡住
 *
 * 注意**不能**等新标签页加载完成：`window.open` 打开的是跨域页面，
 * 父页面无法观测其加载状态，所以只能以「跳转动作已发出」为完成信号。
 * 真正的页面加载反馈由新标签页自己的进度条承担。
 *
 * @param onOpen 调用方自定义的打开逻辑（如随机网页组件内部处理），缺省时新窗口打开
 */
export function openSite(
  item: SiteItem,
  onOpen?: (item: SiteItem) => void,
): void {
  void openWithLoading(
    () => {
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
    },
    {
      label: '正在打开…',
      onError: (reason) => {
        console.warn('[site] 打开失败', reason, item.id ?? item.link);
      },
    },
  );
}

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
