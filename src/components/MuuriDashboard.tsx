import Muuri from 'muuri';
import React, { useEffect, useRef, useState } from 'react';
import {
  executeWidgetAction,
  executeWidgetClick,
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
  /** 长按组件卡片切换编辑布局（与右键菜单「布局」一致） */
  onToggleEditMode?: () => void;
  notes: StickyNoteType[];
  onUpdateNotes: (notes: StickyNoteType[]) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  /** 是否在 widget 控制栏显示黄色按钮（点击后该 widget 以无头模态框居中显示） */
  enableHeadlessModal?: boolean;
  /** 卡片天气变化回调（顶部状态栏以卡片为准） */
  onWeatherChange?: (s: import('../widgets/WeatherWidget').WeatherSummary) => void;
  /** 更新任意 widget 实例字段（如快捷导航的 shortcuts 数据空间）。 */
  onUpdateWidget?: (id: string, patch: Partial<WidgetItem>) => void;
}

export const MuuriDashboard: React.FC<MuuriDashboardProps> = ({
  widgets,
  onUpdateWidgetOrder,
  onDeleteWidget,
  onResizeWidget,
  onContextMenuWidget,
  isEditMode,
  onToggleEditMode,
  notes,
  onUpdateNotes,
  isDarkMode,
  onToggleDarkMode,
  enableHeadlessModal = true,
  onWeatherChange,
  onUpdateWidget,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const muuriInstanceRef = useRef<Muuri | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  // 防止 ResizeObserver 与 Muuri layout 互相触发导致的重新布局死循环。
  const relayoutScheduledRef = useRef(false);
  // 始终保持最新的 widgets 引用，供 dragEnd 闭包读取（避免用初始化时的
  // 过时快照重建数组，覆盖掉拖拽前已做的 resize 等字段修改）。
  const widgetsRef = useRef(widgets);

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
    if (executeWidgetClick(widget.type, e)) return;
    if (executeWidgetAction(widget.type)) return;
    if (widget.type === 'settings') {
      setSettingsModalOpen(true);
      return;
    }
    const iconGrid = target.closest('[data-icon-grid]');
    if (!iconGrid) return;
    // icon-grid 默认值（无站点 / 链接 / 自定义图标）= 系统设置，点击弹出设置模态框
    if (!widget.site && !widget.iconHref && !widget.iconGlyph) {
      setSettingsModalOpen(true);
      return;
    }
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


  useEffect(() => {
    if (!containerRef.current) return;


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
        // 对齐到左上角并启用 fillGaps：卡片从左上角开始排布，松手后自动回填
        // 上方/中间的空隙，而非固定按原顺序堆叠。
        layout: {
          fillGaps: true,
          alignRight: false,
          alignBottom: false,
          // 卡片间距：原来由 .muuri-item 的 p-2 内边距提供（相邻 8+8=16px），
          // p-2 已移除并转移到容器 padding（边缘留白 8px），此处等价补齐 item 间距。
          spacing: 16,
        },
      });

      muuriInstanceRef.current = grid;

      // 卡片内容高度变化（便签输入、图标网格增减、异步组件/图片加载完成等）
      // 会改变 .muuri-item 的实际高度，但 Muuri 不会自动重新测量，导致框架
      // 之间的间距 / 位置错乱。用 ResizeObserver 监听每个 item 的尺寸，
      // 高度变化后重新测量并布局，使框架间距始终与卡片高度保持一致。
      const ro = new ResizeObserver(() => {
        const container = containerRef.current;
        if (
          muuriInstanceRef.current &&
          container &&
          container.classList.contains('muuri-laid-out') &&
          !relayoutScheduledRef.current
        ) {
          // debounce：用 rAF 合并同一帧内的多次尺寸变化，并置标志防止
          // refreshItems().layout() 触发的尺寸回调再次进入造成死循环。
          relayoutScheduledRef.current = true;
          requestAnimationFrame(() => {
            relayoutScheduledRef.current = false;
            if (muuriInstanceRef.current) {
              muuriInstanceRef.current.refreshItems().layout();
            }
          });
        }
      });
      // 监听每个已存在 item 的内容元素（尺寸变化来自内层 glass-panel）。
      const observeItems = () => {
        containerRef.current
          ?.querySelectorAll<HTMLElement>('.muuri-item .muuri-item-content')
          .forEach((el) => ro.observe(el));
      };
      observeItems();
      // 后续 add 进来的 item 也需要在布局后补观察。
      grid.on('add', () => {
        observeItems();
      });

      cleanupRef.current = () => {
        ro.disconnect();
        cancelAnimationFrame(layoutRaf);
        if (muuriInstanceRef.current) {
          muuriInstanceRef.current.destroy();
          muuriInstanceRef.current = null;
        }
      };

      // 最小首屏布局：等一帧让 DOM（图片/字体/异步组件）尺寸就绪后，
      // 一次性切 absolute + 无动画布局。替代原先的 50ms×60 次轮询。
      const layoutRaf = requestAnimationFrame(() => {
        const container = containerRef.current;
        if (!container || !muuriInstanceRef.current) return;
        container.classList.add('muuri-laid-out');
        grid.refreshItems().layout(true);
      });

      // Listen for drag end / reorder events
      grid.on('dragEnd', () => {
        const currentItems = grid.getItems();
        const newOrderedIds = currentItems
          .map((item) => item.getElement().getAttribute('data-widget-id'))
          .filter(Boolean) as string[];

        // Reorder widget state array to match Muuri's current grid arrangement.
        // 使用 widgetsRef（始终保持最新），避免套用初始化时的过时 widgets 快照
        // 重建数组——否则会用拖拽前的旧对象覆盖掉用户已做的 resize 等字段修改。
        const latestWidgets = widgetsRef.current;
        const reorderedWidgets: WidgetItem[] = [];
        newOrderedIds.forEach((id) => {
          const found = latestWidgets.find((w) => w.id === id);
          if (found) reorderedWidgets.push(found);
        });

        // Add any remaining
        latestWidgets.forEach((w) => {
          if (!reorderedWidgets.some((rw) => rw.id === w.id)) {
            reorderedWidgets.push(w);
          }
        });

        onUpdateWidgetOrder(reorderedWidgets);
      });

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

  // 同步最新 widgets 引用，供 dragEnd 闭包读取，避免用初始化时的过时快照
  // 重建数组、把用户拖拽前已做的 resize 等修改覆盖回初始值。
  useEffect(() => {
    widgetsRef.current = widgets;
  }, [widgets]);

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
      // 首屏时若容器尚未切到 absolute（.muuri-laid-out），布局交给初始化
      // 的 settle 轮询负责，避免 relative 阶段抢先 layout 与首屏布局竞争。
      const container = containerRef.current;
      if (
        muuriInstanceRef.current &&
        container &&
        container.classList.contains('muuri-laid-out')
      ) {
        muuriInstanceRef.current.refreshItems().layout();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [widgets]);

  return (
    <div className="w-full relative h-full">
      {/* Muuri Container */}
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
            onCycleSize={cycleWidgetSize}
            onDeleteWidget={onDeleteWidget}
            onExpand={setExpandedWidgetId}
            onClick={handleCardClick}
            onContextMenuWidget={onContextMenuWidget}
            onLongPressEdit={onToggleEditMode}
            onUpdateWidget={onUpdateWidget}
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
                    onUpdateWidget,
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
