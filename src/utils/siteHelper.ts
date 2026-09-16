import { siteApi, SiteItem } from '../api/site';
import { openInSameContext } from './appBridge';

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
 * 点击不再展示 loading 效果：上报完成后直接跳转。
 *
 * @param onOpen 调用方自定义的打开逻辑（如随机网页组件内部处理），缺省时新窗口打开
 */
export function openSite(
  item: SiteItem,
  onOpen?: (item: SiteItem) => void,
): void {
  // 点击量上报是「尽力而为」：失败也照样跳转，只是不计入统计
  const report = item.id
    ? siteApi.recordClick(item.id).catch(() => {})
    : Promise.resolve();

  void report
    .then(() => {
      if (onOpen) {
        onOpen(item);
        return;
      }
      if (!item.link) return;
      /**
       * 在 App 内必须复用同一个浏览上下文打开（openInSameContext），
       * 否则每次打开都是一个全新窗口：站点存在 `sessionStorage` 的进度
       * 会随上下文销毁一起丢失，表现为「存了下次打开又没了」。
       *
       * 普通浏览器里该函数返回 false，回退到新标签页 —— 桌面端
       * 用户本来也更习惯「点开新标签、主页不丢」。
       */
      if (!openInSameContext(item.link)) {
        window.open(item.link, '_blank', 'noreferrer');
      }
    })
    .catch((error) => {
      console.warn('[site] 打开失败', item.id ?? item.link, error);
    });
}
