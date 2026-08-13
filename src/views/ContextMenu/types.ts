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
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onOpenWallpaper: () => void;
  onOpenAddWidget: () => void;
  onOpenSettings: () => void;
}
