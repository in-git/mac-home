import type { WidgetItem, WidgetSize } from '../../types';

export interface ContextMenuPosition {
  x: number;
  y: number;
  targetWidgetId?: string | null;
}

export interface ContextMenuProps {
  position: ContextMenuPosition | null;
  onClose: () => void;
  widgets: WidgetItem[];
  onDeleteWidget: (id: string) => void;
  onResizeWidget: (id: string, newSize: WidgetSize) => void;
  onChangeWidgetBackground: (
    id: string,
    background?: string,
    backgroundTheme?: 'light' | 'dark',
  ) => void;
  /** 合并写回组件 data 的补丁（由 store.updateWidget 应用），用于二级配置子菜单。 */
  onUpdateWidget: (id: string, patch: Partial<WidgetItem>) => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onOpenWallpaper: () => void;
  onOpenAddWidget: () => void;
  onOpenSettings: () => void;
  /** 是否显示桌面图标（web-grid 类组件），用于右键菜单「显示桌面图标」勾选态。 */
  showDesktopIcons: boolean;
  /** 切换桌面图标显示/隐藏。 */
  onToggleDesktopIcons: () => void;
}
