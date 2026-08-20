import React from 'react';
import GridLayout, { WidthProvider, type Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { useHomeStore } from '../../store/useHomeStore';
import { WidgetCard } from '../../components/dashboard/WidgetCard';

const GridLayoutWithWidth = WidthProvider(GridLayout);

interface DashboardGridProps {
  onContextMenuWidget?: (e: React.MouseEvent, widgetId: string) => void;
  onEnterEditMode?: () => void;
  [key: string]: any;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  onContextMenuWidget,
  onEnterEditMode,
  isEditMode = false,
  notes = [],
  onUpdateNotes = () => {},
  isDarkMode = false,
  onToggleDarkMode = () => {},
  onWeatherChange,
  onUpdateWidget = () => {},
  widgets: incomingWidgets,
}) => {
  const storeWidgets = useHomeStore((state) => state.widgets);
  const setWidgets = useHomeStore((state) => state.setWidgets);

  // 清屏时 App 会传入空数组以隐藏全部组件；只要显式传入了 widgets（含空数组）就使用它，否则回退 store
  const widgets = Array.isArray(incomingWidgets) ? incomingWidgets : storeWidgets;

  const layout: Layout[] = widgets.map((widget) => ({
    i: widget.id,
    ...(widget.grid || { x: 0, y: 0, w: 4, h: 4 }),
  }));

  const handleLayoutChange = (newLayout: Layout[]) => {
    const updated = widgets.map((w) => {
      const item = newLayout.find((l) => l.i === w.id);
      if (!item) return w;
      return {
        ...w,
        grid: {
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
        },
      };
    });
    setWidgets(updated);
  };

  return (
    <div className="w-full h-full">
      <GridLayoutWithWidth
        className="layout"
        layout={layout}
        cols={96}
        rowHeight={11}
        margin={[1, 1]}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        onLayoutChange={handleLayoutChange}
      >
        {widgets.map((widget) => (
          <div key={widget.id}>
            <WidgetCard
              widget={widget}
              isEditMode={isEditMode}
              notes={notes}
              onUpdateNotes={onUpdateNotes}
              isDarkMode={isDarkMode}
              onToggleDarkMode={onToggleDarkMode}
              onWeatherChange={onWeatherChange}
              expandedWidgetId={null}
              onExpand={() => {}}
              onClick={() => {}}
              onContextMenuWidget={onContextMenuWidget}
              onLongPressEdit={onEnterEditMode}
              onUpdateWidget={onUpdateWidget}
            />
          </div>
        ))}
      </GridLayoutWithWidth>
    </div>
  );
};
