import Muuri from 'muuri';
import React, { useEffect, useRef, useState } from 'react';
import {
  executeWidgetAction,
  getWidgetAction,
  getWidgetConfig,
} from '../data/widgetConfig';
import { StickyNote as StickyNoteType, WidgetItem, WidgetSize } from '../types';
import { SettingsModal } from '../views/SettingsModal';
import { InternalBrowser } from './InternalBrowser';
import { WidgetCard } from './dashboard/WidgetCard';
import { renderWidgetContent } from './dashboard/widgetContent';

interface MuuriDashboardProps {
  widgets: WidgetItem[];
  onUpdateWidgetOrder: (newWidgets: WidgetItem[]) => void;
  onDeleteWidget: (id: string) => void;
  onResizeWidget: (id: string, newSize: WidgetSize) => void;
  onContextMenuWidget: (e: React.MouseEvent, widgetId: string) => void;
  isEditMode: boolean;
  notes: StickyNoteType[];
  onUpdateNotes: (notes: StickyNoteType[]) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  /** 是否在 widget 控制栏显示黄色按钮（点击后该 widget 以无头模态框居中显示） */
  enableHeadlessModal?: boolean;
  /** 卡片天气变化回调（顶部状态栏以卡片为准） */
  onWeatherChange?: (s: import('../widgets/WeatherWidget').WeatherSummary) => void;
}

export const MuuriDashboard: React.FC<MuuriDashboardProps> = ({
  widgets,
  onUpdateWidgetOrder,
  onDeleteWidget,
  onResizeWidget,
  onContextMenuWidget,
  isEditMode,
  notes,
  onUpdateNotes,
  isDarkMode,
  onToggleDarkMode,
  enableHeadlessModal = true,
  onWeatherChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const muuriInstanceRef = useRef<Muuri | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Cycle a widget through its available sizes on each click of the green dot.
  const cycleWidgetSize = (widget: WidgetItem) => {
    const sizes = getWidgetConfig(widget.type).sizeOptions;
    const currentIndex = sizes.indexOf(widget.size);
    const nextSize = sizes[(currentIndex + 1) % sizes.length];
    if (nextSize && nextSize !== widget.size) {
      onResizeWidget(widget.id, nextSize);
    }
  };
  const isEditModeRef = useRef(isEditMode);

  // 无头模态：当前以 fixed 居中放大的 widget id（null 表示普通网格状态）。
  // 仅便签与导航使用放大能力。
  const [expandedWidgetId, setExpandedWidgetId] = useState<string | null>(null);
  // 设置弹窗：settings 以适中尺寸的模态框呈现（非放大）。
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // 内部浏览器：当 icon 组件配置了 openInApp 时，以全屏 iframe 打开其链接。
  const [internalBrowser, setInternalBrowser] = useState<{
    url: string;
    title?: string;
  } | null>(null);

  // Card-level click handler: drives open-in-new-tab / open-in-app / action /
  // settings-modal / icon-grid behaviour based on the widget's config.
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>, widget: WidgetItem) => {
    if (isEditMode) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-drag]')) return;
    if (executeWidgetAction(widget.type)) return;
    if (widget.type === 'settings') {
      setSettingsModalOpen(true);
      return;
    }
    const iconGrid = target.closest('[data-icon-grid]');
    if (!iconGrid) return;
    const kind = widget.iconType;
    if (kind === 'action') {
      const action = getWidgetAction(widget.id);
      action?.();
    } else if (widget.iconHref) {
      if (widget.openInApp) {
        setInternalBrowser({
          url: widget.iconHref,
          title: widget.iconLabel ?? widget.title,
        });
      } else {
        window.open(widget.iconHref, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Initialize Muuri ONCE on mount. We deliberately do NOT depend on `widgets`
  // or `isEditMode` here: recreating the grid on every drag-end (which triggers
  // a setWidgets -> new widgets reference) was the root cause of severe lag.
  useEffect(() => {
    if (!containerRef.current) return;

    // Defer initialization until the DOM (item sizes) has settled, so Muuri
    // can measure items correctly. Otherwise all `.muuri-item` (position:absolute)
    // collapse onto (0,0) and the container height collapses to 0 -> blank center.
    let rafId = requestAnimationFrame(() => {
      if (!containerRef.current) return;

      // Instantiate Muuri Layout
      const grid = new Muuri(containerRef.current, {
        items: '.muuri-item',
        // 首次布局延迟到下面显式执行：初始化时 item 仍处于普通文档流
        //（CSS 兜底），避免未布局前 absolute 卡片叠在 (0,0)。
        layoutOnInit: false,
        dragEnabled: true,
        // Allow dragging from the whole card (so content can be dragged too),
        // or from the explicit grip handle. Edit-mode gating is done below.
        dragHandle: '.drag-handle, .widget-card',
        // Muuri 0.9.x has no runtime drag() API, so we gate dragging with a
        // functional predicate that reads the live edit-mode ref. Functional
        // controls inside the header are excluded via [data-no-drag] so their
        // clicks are never swallowed by a drag gesture.
        dragStartPredicate: (_item: unknown, args: any) => {
          if (!isEditModeRef.current) return false;
          const target = args?.event?.target as HTMLElement | null;
          if (target && target.closest('[data-no-drag]')) return false;
          return true;
        },
      });

      muuriInstanceRef.current = grid;

      // 切换 item 到绝对定位（CSS 依据此 class），并立即（无动画）执行首次
      // 布局。两步在同一帧内同步完成，用户看不到任何重叠状态。
      containerRef.current.classList.add('muuri-laid-out');
      grid.refreshItems().layout(true);

      // Listen for drag end / reorder events
      grid.on('dragEnd', () => {
        const currentItems = grid.getItems();
        const newOrderedIds = currentItems
          .map((item) => item.getElement().getAttribute('data-widget-id'))
          .filter(Boolean) as string[];

        // Reorder widget state array to match Muuri's current grid arrangement
        const reorderedWidgets: WidgetItem[] = [];
        newOrderedIds.forEach((id) => {
          const found = widgets.find((w) => w.id === id);
          if (found) reorderedWidgets.push(found);
        });

        // Add any remaining
        widgets.forEach((w) => {
          if (!reorderedWidgets.some((rw) => rw.id === w.id)) {
            reorderedWidgets.push(w);
          }
        });

        onUpdateWidgetOrder(reorderedWidgets);
      });

      // Window resize layout adjustment
      const handleResize = () => {
        if (muuriInstanceRef.current) {
          muuriInstanceRef.current.refreshItems().layout();
        }
      };

      window.addEventListener('resize', handleResize);

      cleanupRef.current = () => {
        window.removeEventListener('resize', handleResize);
        if (muuriInstanceRef.current) {
          muuriInstanceRef.current.destroy();
          muuriInstanceRef.current = null;
        }
      };
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  // Keep the live edit-mode ref in sync so the dragStartPredicate can gate
  // dragging without recreating the grid or calling any Muuri instance method.
  useEffect(() => {
    isEditModeRef.current = isEditMode;
  }, [isEditMode]);

  // Sync Muuri's items with React's widgets (add/remove/resize) from outside
  // drag. Crucially, removed widgets must be removed from Muuri too — otherwise
  // Muuri keeps a dangling reference to the detached DOM node and re-inserts it
  // on the next layout (the "deleted widget comes back" bug).
  useEffect(() => {
    if (!muuriInstanceRef.current) return;
    const grid = muuriInstanceRef.current;
    const desiredIds = new Set(widgets.map((w) => w.id));

    // Remove items that no longer exist in widgets.
    const toRemove = grid
      .getItems()
      .filter(
        (item) =>
          !desiredIds.has(
            item.getElement().getAttribute('data-widget-id') || '',
          ),
      );
    if (toRemove.length) {
      grid.remove(toRemove, { layout: false });
    }

    // Add newly-added widget items (React already rendered their DOM nodes).
    const existingIds = new Set(
      grid
        .getItems()
        .map((item) => item.getElement().getAttribute('data-widget-id')),
    );
    const addedEls = Array.from(
      containerRef.current?.querySelectorAll('.muuri-item') || [],
    ).filter(
      (el: Element) =>
        !existingIds.has(el.getAttribute('data-widget-id') || ''),
    );
    if (addedEls.length) {
      grid.add(addedEls as HTMLElement[], { layout: false });
    }

    const timer = setTimeout(() => {
      if (muuriInstanceRef.current) {
        muuriInstanceRef.current.refreshItems().layout();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [widgets]);

  return (
    <div className="w-full relative h-full">
      {/* Muuri Container */}
      <div ref={containerRef} className="muuri-grid relative w-full h-full ">
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
            onCycleSize={cycleWidgetSize}
            onDeleteWidget={onDeleteWidget}
            onExpand={setExpandedWidgetId}
            onClick={handleCardClick}
          />
        ))}
      </div>

      {/* 无头模态层：点击黄色按钮后，对应 widget 以 fixed 居中、无头、放大的模态框显示；
          点击外部遮罩则还原为普通网格 widget（position 由 fixed 改回网格流） */}
      {expandedWidgetId &&
        (() => {
          const expandedWidget = widgets.find((w) => w.id === expandedWidgetId);
          if (!expandedWidget) return null;
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
              onClick={() => setExpandedWidgetId(null)}
            >
              <div
                className="glass-panel rounded-[var(--card-radius)] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/60 dark:border-white/15 backdrop-blur-2xl w-[80vw] h-[80vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 无头：不渲染标题栏与控制栏 */}
                <div className="flex-1 min-h-0">
                  {renderWidgetContent({
                    widget: expandedWidget,
                    notes,
                    onUpdateNotes,
                    isDarkMode,
                    onToggleDarkMode,
                    isEditMode,
                    onWeatherChange,
                    onExpand: () => {},
                    inModal: true,
                  })}
                </div>
              </div>
            </div>
          );
        })()}

      {/* 设置弹窗：复用全局 SettingsModal（左右布局 + 三选项卡） */}
      {settingsModalOpen && (
        <SettingsModal
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
        />
      )}

      {/* 内部浏览器：icon 组件配置 openInApp 后以全屏 iframe 打开其链接 */}
      <InternalBrowser
        isOpen={!!internalBrowser}
        url={internalBrowser?.url ?? ''}
        title={internalBrowser?.title}
        onClose={() => setInternalBrowser(null)}
      />
    </div>
  );
};
