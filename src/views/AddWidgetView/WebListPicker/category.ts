import { SiteCategory } from '@/api/site';

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
