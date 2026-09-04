export type ItemType =
  | 'widget-clock'
  | 'folder-large'
  | 'folder-vertical'
  | 'capsule'
  | 'folder-mini'
  | 'app';

export interface SiteCategory {
  id?: string;
  name?: string;
  [key: string]: unknown;
}

/**
 * 站点 / 应用的统一数据模型接口
 */
export interface SiteItem {
  // 数据库的ID
  id?: string;
  // 应用名称
  name: string;
  // 网页的logo
  logo?: string;
  // 应用的描述
  des?: string;
  // 应用的链接
  link?: string;
  // 应用的点击数量
  count?: number;
  // 是否为推荐
  recommend?: boolean;
  // 应用的背景颜色
  background?: string;
  // 应用的封面图片
  cover?: string;
  // 应用的关键词
  keyword?: string;
  // 应用的排序号
  orderNum?: number;
  // 应用所属的模块
  module?: string;
  /** 是否显示在系统应用中：网页应用（web-app）为 false，其余为 true。 */
  showInSystem?: boolean;
  // 应用的创建时间
  createTime?: string;
  // 应用所属的分类列表
  categoryList?: SiteCategory[];
}

export interface SubApp {
  id: string;
  name: string;
  logo?: string;
  iconName?: string;
  badge?: number | string;
  color?: string; // Brand color
  background?: string;
  symbol?: string; // Icon glyph or abbreviation
}

export interface GridItemPosition {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

/**
 * 桌面网格项（ICON 及卡片），继承 SiteItem 的全部数据字段
 */
export interface DesktopItem extends SiteItem {
  id: string;
  type: ItemType;
  layout: GridItemPosition;
  // 兼容器属性与扩展字段
  title?: string;
  iconName?: string;
  iconColor?: string;
  badge?: number | string;
  subApps?: SubApp[];
  widgetData?: {
    time?: string;
    date?: string;
    dayOfWeek?: string;
    location?: string;
    temperature?: string;
    tag?: string;
  };
}

/**
 * 底部快捷栏应用项，继承 SiteItem 的全部数据字段
 */
export interface DockItem extends SiteItem {
  id: string;
  iconName?: string;
  iconColor?: string;
  symbol?: string;
  badge?: number | string;
}

export interface DesktopConfig {
  version: string;
  systemName: string;
  lastUpdated: string;
  gridConfig: {
    cols: number;
    rowHeight: number;
    margin: [number, number];
  };
  items: DesktopItem[];
  dockItems: DockItem[];
}
