import { siteApi, SiteItem } from '../api/site';
import { openInExternal } from './appBridge';

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
 * **不在当前 WebView 内加载**：app 内由原生拉起系统浏览器接管，
 * 浏览器内开新标签页。主页始终保留在 WebView 中不动，
 * 用户可以从系统返回键 / 标签页切换回到主页。
 *
 * 因为不在当前 WebView 加载，不需要 loading 效果：
 * 当前页不会被替换，也不会出现"点了没反应"的窗口期。
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
      // app 内 → 系统浏览器接管；浏览器内 → 新标签页
      openInExternal(item.link);
    })
    .catch((error) => {
      console.warn('[site] 打开失败', item.id ?? item.link, error);
    });
}
