import { WidgetType, CardStyle, WidgetItem } from '../types';
import { getSizeOptions, type WidgetSizeOption } from './options/size.options';
import { ROLE_DIALOG_ACTION_EVENT } from '../agent/pet/dialog';

/**
 * Type-level configuration registry for every widget type. This consolidates
 * the previously scattered maps (title / max instances / default size / size
 * options / addability / picker glyph & label) into a single source of truth.
 *
 * Edit an entry here to change how that widget type behaves across the app.
 */
export type WidgetCategory = 'system' | 'web';

/**
 * 组件分类映射（集中维护）。未在此声明的组件默认归入 'system' 分类，
 * 用于「添加组件」模态框的左侧分组。
 */
export const WIDGET_CATEGORIES: Partial<Record<WidgetType, WidgetCategory>> = {
  'web-app': 'web',
};

/** 获取组件分类，缺省返回 'system'。 */
export function getWidgetCategory(type: WidgetType): WidgetCategory {
  return WIDGET_CATEGORIES[type] ?? 'system';
}



/** 全局默认卡片样式（放大模态框等未单独配置时回退到此）。 */
export const DEFAULT_CARD_STYLE: CardStyle = {
  padding: 'p-4',
  glass: true,
  'backgroundTheme': undefined,
  background: undefined
};


/**
 * 组件配置注册表（模板）：位置/大小由 react-grid-layout 的 grid 字段直接驱动，
 *故每个配置项自带默认 grid（x/y/w/h），运行时按此创建实例，用户可拖拽调整并持久化。 */
export const WIDGET_CONFIG: Array<WidgetItem> = [
    {
    id: 'cfg-system-function',
    component: 'system-function',
    title: '系统设置',
    maxInstances: 1,
    cardStyle: {
      glass: false,
      padding: 'p-0',
      background: 'white'
    },
    grid: {
      x: 0,
      y: 0,
      w: 8,
      h: 8,
    },
    data: {
      color: 'var(--accent)',
      icon: 'settings',
    },
    onClick: () => {
      // 打开系统设置页面：复用 App 已监听的对话框动作事件
      window.dispatchEvent(
        new CustomEvent(ROLE_DIALOG_ACTION_EVENT, { detail: { modal: 'settings' } }),
      );
    },
  },
  {
    id: 'cfg-system-function-add',
    component: 'system-function',
    title: '添加',
    maxInstances: 1,
    cardStyle: {
      glass: false,
      padding: 'p-0',
      background: 'white'
    },
    grid: {
      x: 0,
      y: 0,
      w: 8,
      h: 8,
    },
    data: {
      color: 'var(--accent)',
      icon: 'add',
    },
    onClick: () => {
      // 打开「添加组件」弹窗：复用 App 已监听的对话框动作事件
      window.dispatchEvent(
        new CustomEvent(ROLE_DIALOG_ACTION_EVENT, { detail: { modal: 'addWidget' } }),
      );
    },
  },
  {
    id: 'cfg-search',
    component: 'search',
    title: '网络搜索',
    maxInstances: 1,
    data: {
      color: 'var(--accent)',
    },
    cardStyle: {
      disableBackgroundMenu: true,
      background: 'transparent'
    },
    grid: {
      x: 0,
      y: 0,
      w: 96,
      h: 12
    }
  },
  {
    id: 'cfg-clock',
    component: 'clock',
    title: '时钟日历',
    maxInstances: 1,
    data: {
      color: 'var(--accent)',
    },
    grid: {
      x: 0,
      y: 0,
      w: 24,
      h: 24,
    },
  },
  {
    id: 'cfg-weather',
    component: 'weather',
    title: '天气预报',
    maxInstances: 1,
    data: {
      color: 'var(--accent)',
    },
    grid: {
      x: 0,
      y: 0,
      w: 40,
      h: 34,
    },
  },
  {
    id: 'cfg-sticky-notes',
    component: 'sticky-notes',
    title: '便签笔记',
    maxInstances: 1,
    data: {
      color: 'var(--accent)',
    },
    grid: {
      x: 0,
      y: 0,
      w: 32,
      h: 24,
    },
  },

  {
    id: 'cfg-clock-mini',
    component: 'clock-mini',
    title: '时钟',
    maxInstances: 1,
    data: {
      color: 'var(--accent)',
    },
    grid: {
      x: 0,
      y: 0,
      w: 16,
      h: 16,
    },
  },
  {
    id: 'cfg-clock-lunar',
    component: 'clock-lunar',
    title: '农历时钟',
    maxInstances: 1,
    grid: {
      x: 0,
      y: 0,
      w: 32,
      h: 18,
    },
    data: {
      color: 'var(--accent)',
      size: '3.5rem',
    },
    cardStyle: {
      background: 'transparent'
    }
  },
  {
    id: 'cfg-control-center',
    component: 'control-center',
    title: '控制中心',
    maxInstances: 1,
    data: {
      color: 'var(--accent)',
    },
    cardStyle: {
      ...DEFAULT_CARD_STYLE,
    },
    grid: {
      x: 0,
      y: 0,
      w: 20,
      h: 26,
    }
  },
  // {
  //   id: 'cfg-web-app',
  //   component: 'web-app',
  //   title: '网页应用',
  //   maxInstances: Infinity,
  //   cardStyle: {
  //     glass: false,
  //     padding: 'p-0'
  //   },
  //   grid: {
  //     x: 0,
  //     y: 0,
  //     w: 8,
  //     h: 8,
  //   },
  //   data: {
  //     color: 'var(--accent)',
  //   },
  // },

  {
    id: 'cfg-random-web',
    component: 'random-web',
    title: '随机网页',
    maxInstances: 1,
    cardStyle: {
      padding: 'p-0',
      background: 'transparent',
      backgroundTheme: 'dark'
    },
    grid: {
      x: 0,
      y: 0,
      w: 24,
      h: 16,
    },
    data: {},
  },
  {
    id: 'cfg-member-count',
    component: 'member-count',
    title: '在线人数',
    maxInstances: 1,
    cardStyle: {
      padding: 'p-4',
      glass: true,
    },
    grid: {
      x: 0,
      y: 0,
      w: 24,
      h: 24,
    },
    data: {
      color: 'var(--accent)',
    },
  },
];



/**
 * 按 id 解析组件配置（含运行时 sizeOptions）。
 * 优先用 id 精确匹配（区分同 component 的不同配置，如「系统设置」/「添加」），
 * 找不到时回退到按 component 查找以兼容旧调用方。
 */
export function getWidgetConfig(id: string): WidgetItem {
  const all = [...WIDGET_CONFIG];
  // 优先按配置 id 精确匹配（区分同 component 的不同配置，如「系统设置」/「添加」），
  // 找不到时回退到按 component 查找以兼容按 component 调用的旧调用方（如 canAddWidget）。
  return all.find(v => v.id === id) ?? all.find(v => v.component === id) ?? all[0];
}

/** Whether another instance of `type` may be added given the current count. */
export function canAddWidget(type: WidgetType, currentCount: number): boolean {
  const max = getWidgetConfig(type).maxInstances;
  return max === Infinity || currentCount < max;
}

/**
 * 某配置与其桌面实例的匹配规则。
 * 同一 component 存在多个配置（如 system-function：「系统设置」/「添加」）时，
 * 按配置 id 精确匹配（实例 id = 配置 id，或实例的 configId 字段），避免统计互相干扰；
 * 其余组件按 component 匹配（兼容旧数据）。
 */
export function widgetInstanceMatcher(cfg: WidgetItem): (w: WidgetItem) => boolean {
  const sharedComponent = WIDGET_CONFIG.some(
    (c) => c.component === cfg.component && c.id !== cfg.id,
  );
  return sharedComponent
    ? (w) => w.id === cfg.id || w.configId === cfg.id
    : (w) => w.component === cfg.component;
}

/** 统计某配置在当前组件列表中的已存在实例数量。 */
export function countWidgetInstances(widgets: WidgetItem[], cfg: WidgetItem): number {
  return widgets.filter(widgetInstanceMatcher(cfg)).length;
}

/** 查找某配置在当前组件列表中已存在的实例（达到上限时置顶用）。 */
export function findWidgetInstance(widgets: WidgetItem[], cfg: WidgetItem): WidgetItem | undefined {
  return widgets.find(widgetInstanceMatcher(cfg));
}

/** 网页应用类图标组件（新增网页创建的类型）。 */
export function isWebApp(type: WidgetType): boolean {
  return type === 'web-app';
}

