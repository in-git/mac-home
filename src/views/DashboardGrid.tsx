import React from 'react';
import GridLayout, { WidthProvider, type Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { useHomeStore } from '../store/useHomeStore';
import { WidgetCard } from '../components/dashboard/WidgetCard';

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
}) => {
  const storeWidgets = useHomeStore((state) => state.widgets);
  const setWidgets = useHomeStore((state) => state.setWidgets);

  const layout: Layout[] = storeWidgets.map((widget) => ({
    i: widget.id,
    ...(widget.grid || { x: 0, y: 0, w: 4, h: 4 }),
  }));

  const handleLayoutChange = (newLayout: Layout[]) => {
    const updated = storeWidgets.map((w) => {
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
        cols={24}
        rowHeight={10}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        onLayoutChange={handleLayoutChange}
      >
        {storeWidgets.map((widget) => (
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
