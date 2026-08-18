import {
  Eye,
  Image as ImageIcon,
  Lock,
  Palette,
  Pencil,
  Plus,
  Settings2,
  Settings as SettingsIcon,
  Trash2,
  LucideIcon,
} from 'lucide-react';
import { STATIC_WALLPAPERS } from './options/gradient.options';

/**
 * 右键菜单配置 —— 将「桌面空白处」与「组件」的右键菜单拆分成两个独立、可配置的列表。
 *
 * 之前两类菜单的条目散落在 ContextMenu.tsx 里硬编码。现在统一用下面的配置数组驱动，
 * 修改菜单项只需编辑此处，无需改动渲染组件。
 *
 * 配置项字段说明：
 *  - id:      唯一标识
 *  - label:   显示文案
 *  - icon:    lucide 图标组件
 *  - action:  触发的动作（组件根据 action 映射到对应的处理函数）
 *  - danger:  是否为危险操作（红色样式，用于「移除该组件」）
 *  - showOnlyWhenEditLocked: 仅当处于「已锁定 / 非编辑模式」时显示（用于「布局」开关）
 *  - dividerAfter: 该项下方是否渲染分隔线
 */

/** 菜单动作类型 —— 组件据此映射到传入的回调。 */
export type ContextMenuAction =
  | 'addWidget'
  | 'wallpaper'
  | 'settings'
  | 'toggleEditMode'
  | 'changeBackground'
  | 'editIcon'
  | 'editWidgetConfig'
  | 'removeWidget'
  | 'toggleDesktopIcons';

export interface ContextMenuItemConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  action: ContextMenuAction;
  /** 危险操作使用红色高亮（如移除组件）。 */
  danger?: boolean;
  /** 仅当未处于编辑模式（已锁定）时显示，如「布局」开关。 */
  showOnlyWhenEditLocked?: boolean;
  /** 该项下方是否渲染分隔线。 */
  dividerAfter?: boolean;
  /** 带勾选标记的开关型条目（如「清屏」）。 */
  isToggle?: boolean;
}

/**
 * 组件（widget）右键菜单配置。
 * 注意：组件标题与「调整尺寸」区为组件专属动态内容，由 ContextMenu 在渲染时统一附加，
 * 此处仅配置尺寸区下方的操作型菜单项。
 */
export const WIDGET_CONTEXT_MENU: ContextMenuItemConfig[] = [
  {
    id: 'change-background',
    label: '切换卡片背景',
    icon: Palette,
    action: 'changeBackground',
    dividerAfter: true,
  },
  {
    id: 'edit-icon',
    label: '编辑图标',
    icon: Pencil,
    action: 'editIcon',
    // 仅对 icon / web-grid / settings 组件显示（组件内由 resolveAction 根据类型控制）
    dividerAfter: true,
  },
  {
    id: 'edit-widget-config',
    label: '个性化',
    icon: Settings2,
    action: 'editWidgetConfig',
    // 仅当该组件类型在「二级配置子菜单注册表」中注册了子菜单时才显示
    // （可见性由 ContextMenu 的 resolveAction 依据 WIDGET_CONFIG_SUBMENUS 决定）。
    dividerAfter: true,
  },
  {
    id: 'remove-widget',
    label: '移除该组件',
    icon: Trash2,
    action: 'removeWidget',
    danger: true,
  },
];

/** 桌面空白处（背景）右键菜单配置。 */
export const DESKTOP_CONTEXT_MENU: ContextMenuItemConfig[] = [
  {
    id: 'add-widget',
    label: '添加小组件...',
    icon: Plus,
    action: 'addWidget',
    dividerAfter: true,
  },
  {
    id: 'wallpaper',
    label: '壁纸中心',
    icon: ImageIcon,
    action: 'wallpaper',
  },
  {
    id: 'settings',
    label: '设置',
    icon: SettingsIcon,
    action: 'settings',
    dividerAfter: true,
  },
  {
    id: 'toggle-edit-mode',
    label: '布局',
    icon: Lock,
    action: 'toggleEditMode',
  },
  {
    id: 'toggle-desktop-icons',
    label: '清屏',
    icon: Eye,
    action: 'toggleDesktopIcons',
    isToggle: true,
  },
];

/**
 * 右键「切换卡片背景」可选择的渐变背景列表。
 * 复用 gradient.options.ts 的 STATIC_WALLPAPERS 单一数据源，避免重复维护。
 * 组件按当前亮/暗标签（bgTab）从 theme 过滤展示。
 */
export const CARD_BACKGROUND_OPTIONS = STATIC_WALLPAPERS;
