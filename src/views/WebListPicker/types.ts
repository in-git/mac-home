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
  /** 添加按钮的 Tooltip 文案 */
  addTip?: string;
  /** 删除按钮的 Tooltip 文案 */
  removeTip?: string;
}

export function flattenCategories(categories: SiteCategory[]): SiteCategory[] {
  const result: SiteCategory[] = [];
  const walk = (list: SiteCategory[]) => {
    for (const c of list) {
      result.push(c);
      if (c.children && c.children.length > 0) walk(c.children);
    }
  };
  walk(categories);
  return result;
}

export type { SiteCategory, SiteIdentity, SiteItem };
