import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type { WeatherSummary } from '../../widgets/WeatherWidget';
import { WidgetCard } from '../../components/dashboard/WidgetCard';
import type { StickyNote as StickyNoteType, WidgetItem } from '../../types';

interface WidgetGridProps {
  /** Muuri 初始化所需的网格容器 ref（由父组件持有，作为普通 prop 传入）。 */
  containerRef: React.RefObject<HTMLDivElement | null>;
  widgets: WidgetItem[];
  isEditMode: boolean;
  notes: StickyNoteType[];
  onUpdateNotes: (notes: StickyNoteType[]) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onWeatherChange?: (s: WeatherSummary) => void;
  enableHeadlessModal?: boolean;
  expandedWidgetId: string | null;
  onCycleSize: (widget: WidgetItem) => void;
  onDeleteWidget: (id: string) => void;
  onExpand: (id: string | null) => void;
  onClick: (e: React.MouseEvent<HTMLDivElement>, widget: WidgetItem) => void;
  onContextMenuWidget: (e: React.MouseEvent, widgetId: string) => void;
  onLongPressEdit?: () => void;
  onUpdateWidget?: (id: string, patch: Partial<WidgetItem>) => void;
}

/**
 * Muuri 网格渲染：负责 widget 卡片列表，并承载首屏 loading（300ms 后移除）。
 */
export const WidgetGrid: React.FC<WidgetGridProps> = ({
  containerRef,
  widgets,
  isEditMode,
  notes,
  onUpdateNotes,
  isDarkMode,
  onToggleDarkMode,
  onWeatherChange,
  enableHeadlessModal = true,
  expandedWidgetId,
  onCycleSize,
  onDeleteWidget,
  onExpand,
  onClick,
  onContextMenuWidget,
  onLongPressEdit,
  onUpdateWidget,
}) => {
  // 首屏 loading：挂载 300ms 后移除覆盖层。
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="muuri-grid relative w-full h-full p-2">
        {widgets.map((widget) => (
          <WidgetCard
            key={widget.id}
            widget={widget}
            isEditMode={isEditMode}
            notes={notes}
            onUpdateNotes={onUpdateNotes}
            isDarkMode={isDarkMode}
            onToggleDarkMode={onToggleDarkMode}
            onWeatherChange={onWeatherChange}
            enableHeadlessModal={enableHeadlessModal}
            expandedWidgetId={expandedWidgetId}
            onCycleSize={onCycleSize}
            onDeleteWidget={onDeleteWidget}
            onExpand={onExpand}
            onClick={onClick}
            onContextMenuWidget={onContextMenuWidget}
            onLongPressEdit={onLongPressEdit}
            onUpdateWidget={onUpdateWidget}
          />
        ))}
      </div>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm dark:bg-black/50">
          <Loader2 className="animate-spin text-[color:var(--accent)]" size={28} />
        </div>
      )}
    </div>
  );
};
