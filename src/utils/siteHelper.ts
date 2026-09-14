import { SiteItem } from '../api/site';

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
