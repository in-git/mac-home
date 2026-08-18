import { SiteCategory, SiteIdentity, SiteItem } from '../../api/site';

export interface WebListPickerProps {
  /** 已选中的站点列表（由父组件持有），用于标记「已新增」并渲染删除入口 */
  selected: SiteItem[];
  /** 点击「添加」按钮时的回调 */
  onAdd: (item: SiteItem) => void;
  /** 点击「删除」已选站点时的回调；缺省时已选卡片只显示勾标记 */
  onRemove?: (item: SiteItem) => void;
  /** 点击卡片打开站点时的回调；缺省时在新窗口打开 */
  onOpen?: (item: SiteItem) => void;
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
