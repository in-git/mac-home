import { SiteCategory } from '@/api/site';

/** 平铺后的分类项 */
export interface FlatCategory {
  id: string;
  name: string;
  /** 0：一级分类（含无子级的独立分类）；1：二级分类 */
  level: 0 | 1;
}

/** 一级分类及其子级（用于顶部「一级一行 + 子级一行」的居中展示） */
export interface CategoryGroup {
  /** 一级分类本身 */
  parent: FlatCategory;
  /** 其下的二级分类；无子级时为空数组 */
  children: FlatCategory[];
}

/**
 * 将分类树整理为「一级 + 子级」的分组列表。
 *
 * 与旧的 flattenCategories 不同：不再把父子拍平成同一行，
 * 而是保留层级关系，供顶部按两行分别居中渲染。
 * 无子级的一级分类 children 为空数组，选中它时只请求该分类。
 */
export function groupCategories(categories: SiteCategory[]): CategoryGroup[] {
  return categories.map((parent) => ({
    parent: { id: parent.id, name: parent.name, level: 0 },
    children: (parent.children ?? []).map((child) => ({
      id: child.id,
      name: child.name,
      level: 1 as const,
    })),
  }));
}

/**
 * 将分类树拍平成一维列表，用于顶部单排「平铺」展示。
 * 有子级的父分类不再单独展示（只展示其子级），无子级的父分类保留。
 *
 * @deprecated 顶部已改为「一级 + 子级」两行居中展示，请改用 groupCategories。
 */
export function flattenCategories(categories: SiteCategory[]): FlatCategory[] {
  const list: FlatCategory[] = [];
  for (const parent of categories) {
    const children = parent.children ?? [];
    if (children.length > 0) {
      // 父级有子级：跳过父级本身，只保留子级
      for (const child of children) {
        list.push({ id: child.id, name: child.name, level: 1 });
      }
    } else {
      // 无子级：作为独立分类展示
      list.push({ id: parent.id, name: parent.name, level: 0 });
    }
  }
  return list;
}
