import type { WidgetItem } from '../../types';
import type { ContextMenuItemConfig } from '../../data/contextMenuConfig';
import { ClockFontSubmenu } from './ClockFontSubmenu';
import { AspectSubmenu } from './AspectSubmenu';

/**
 * 组件特有「二级配置子菜单」注册表。
 *
 * 设计目标：右键菜单的「个性化」入口是统一的，但不同组件类型可配置的内容不同。
 * 为避免把每个类型的配置 UI 都硬编码进 ContextMenu，这里用一张注册表把
 * 「组件类型」映射到「对应的二级子菜单组件」。ContextMenu 在渲染时按当前
 * widget 的 type 查表：有注册才显示「个性化」入口并渲染对应子菜单。
 *
 * 将来要支持更多组件的自定义配置，只需：
 *   1. 新建一个类似 ClockFontSubmenu 的子菜单组件；
 *   2. 在下方注册表里加一行 `Type: SubmenuComponent` 即可，无需改动 ContextMenu。
 */

/** 二级配置子菜单组件统一接收的 props。 */
export interface WidgetConfigSubmenuProps {
  /** 触发该子菜单的菜单项（用于取 label / icon）。 */
  item: ContextMenuItemConfig;
  /** 当前右键的组件实例。 */
  targetWidget: WidgetItem;
  /** 写回组件 data 的合并补丁（由 store.updateWidget 应用）。 */
  onUpdateWidgetData: (id: string, patch: Partial<WidgetItem['data']>) => void;
  onClose: () => void;
}

/** 按组件类型注册的二级配置子菜单组件。 */
export const WIDGET_CONFIG_SUBMENUS: Partial<
  Record<WidgetItem['type'], React.FC<WidgetConfigSubmenuProps>>
> = {
  'clock-lunar': ClockFontSubmenu,
};
