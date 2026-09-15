import { siteApi, SiteItem } from '../api/site';

/**
 * 打开站点卡片：先上报点击量（POST /api/public/site/click），再打开链接。
 * 上报为统计用途，失败时静默，不影响正常跳转；无 id 时跳过上报。
 *
 * @param onOpen 调用方自定义的打开逻辑（如随机网页组件内部处理），缺省时新窗口打开
 */
export function openSite(
  item: SiteItem,
  onOpen?: (item: SiteItem) => void,
): void {
  if (item.id) {
    siteApi.recordClick(item.id).catch(() => {});
  }
  if (onOpen) {
    onOpen(item);
    return;
  }
  if (item.link) window.open(item.link, '_blank', 'noreferrer');
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
