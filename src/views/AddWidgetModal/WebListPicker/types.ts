import { SiteCategory, SiteIdentity, SiteItem } from '../../../api/site';

/**
 * 站点卡片网格：网页列表与「我的」收藏共用同一套列宽 / 间距，
 * 保证两处卡片在不同屏幕宽度下的响应式大小完全一致。
 */
export const SITE_GRID_CLASS =
  'grid gap-4 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]';

export interface WebListPickerProps {
  /** 顶部横幅大字标题（如「应用市场」），不传则不显示 */
  title?: string;
  /** 点击卡片打开站点时的回调；缺省时在新窗口打开 */
  onOpen?: (item: SiteItem) => void;
  /** 已收藏的站点列表；传入后用于标记卡片的收藏态 */
  favorites?: SiteItem[];
  /** 切换某个站点的收藏状态；不传则不展示收藏按钮 */
  onToggleFavorite?: (item: SiteItem) => void;
}

/**
 * 将分类树拍平成两级结构（父级 + 其子级）。
 * 仅保留两层：根节点作为父级，其 children 作为子级，不会出现第三排。
 */
export function flattenCategories(categories: SiteCategory[]): SiteCategory[] {
  return categories.map((parent) => ({
    ...parent,
    children: parent.children ? parent.children.map((child) => ({ ...child })) : [],
  }));
}

/** 取所有父级（顶层）分类 */
export function getParentCategories(categories: SiteCategory[]): SiteCategory[] {
  return categories;
}

/** 根据父级 id 取其子级列表（无则空数组） */
export function getChildCategories(
  categories: SiteCategory[],
  parentId: string,
): SiteCategory[] {
  if (!parentId) return [];
  return categories.find((c) => c.id === parentId)?.children ?? [];
}

/** 根据任意分类 id（父或子）反查其所属父级 id */
export function findParentId(
  categories: SiteCategory[],
  id: string,
): string {
  for (const parent of categories) {
    if (parent.id === id) return parent.id;
    if (parent.children?.some((c) => c.id === id)) return parent.id;
  }
  return '';
}

export type { SiteCategory, SiteIdentity, SiteItem };
