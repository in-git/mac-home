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
}
