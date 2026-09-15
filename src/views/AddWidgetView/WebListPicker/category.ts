import { SiteCategory } from '@/api/site';

/** 平铺后的分类项 */
export interface FlatCategory {
  id: string;
  name: string;
  /** 0：无子级的独立分类（原一级）；1：二级分类 */
  level: 0 | 1;
}

/**
 * 将分类树拍平成一维列表，用于顶部单排「平铺」展示。
 * 有子级的父分类不再单独展示（只展示其子级），无子级的父分类保留。
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
