import { GripHorizontal, X } from 'lucide-react';
import Muuri from 'muuri';
import React, { useEffect, useRef, useState } from 'react';
import {
  executeWidgetAction,
  getWidgetAction,
  getWidgetConfig,
} from '../data/widgetConfig';
import { StickyNote as StickyNoteType, WidgetItem, WidgetSize } from '../types';
import { AiChatWidget } from '../widgets/AiChatWidget';
import { AgentTestWidget } from '../widgets/AgentTestWidget';
import { ClockCalendarWidget } from '../widgets/ClockCalendarWidget';
import { ClockWidget } from '../widgets/ClockWidget';
import { ControlCenterWidget } from '../widgets/ControlCenterWidget';
import { IconWidget } from '../widgets/IconWidget';
import { SearchWidget } from '../widgets/SearchWidget';
import { SettingsWidget } from '../widgets/SettingsWidget';
import { ShortcutsWidget } from '../widgets/ShortcutsWidget';
import { StickyNotesWidget } from '../widgets/StickyNotesWidget';
import { WeatherWidget } from '../widgets/WeatherWidget';
import { Tooltip } from './Tooltip';

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
  const skipLayoutRef = useRef(false);
  const isEditModeRef = useRef(isEditMode);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // 无头模态：当前以 fixed 居中放大的 widget id（null 表示普通网格状态）。
  // 仅便签与导航使用放大能力。
  const [expandedWidgetId, setExpandedWidgetId] = useState<string | null>(null);
  // 设置弹窗：settings 以适中尺寸的模态框呈现（非放大）。
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Helper to render widget content. `inModal` 为 true 时用于无头模态（弹窗）：
  // settings 在网格中显示为图标，在模态中渲染完整设置面板。
  const renderWidgetContent = (widget: WidgetItem, inModal = false) => {
    switch (widget.type) {
      case 'search':
        return <SearchWidget />;
      case 'sticky-notes':
        return (
          <StickyNotesWidget notes={notes} onUpdateNotes={onUpdateNotes} />
        );
      case 'weather':
        return <WeatherWidget />;
      case 'ai-chat':
        return <AiChatWidget isDarkMode={isDarkMode} />;
      case 'agent-test':
        return <AgentTestWidget isDarkMode={isDarkMode} expanded={inModal} />;
      case 'clock':
        return <ClockCalendarWidget />;
      case 'clock-mini':
        return <ClockWidget />;
      case 'control-center':
        return (
          <ControlCenterWidget
            isDarkMode={isDarkMode}
            onToggleDarkMode={onToggleDarkMode}
          />
        );
      case 'shortcuts':
        // inModal 为 true 时表示处于无头模态（放大）状态，传 expanded 让布局填满模态并从头开始流式排列
        // grid 模式（非放大）下提供 onExpand，使 header 的「更多」能复用放大模态（全屏）功能
        return (
          <ShortcutsWidget
            expanded={inModal}
            onExpand={
              inModal ? undefined : () => setExpandedWidgetId(widget.id)
            }
          />
        );
      case 'settings':
        // 网格中：渲染为图标，点击后打开无头模态显示完整设置面板
        if (inModal) return <SettingsWidget />;
        return (
          <div data-icon-grid className="h-full w-full">
            <IconWidget
              editing={isEditMode}
              size={widget.size}
              iconType={widget.iconType}
              iconGlyph={widget.iconGlyph}
              iconLabel={widget.iconLabel}
              iconHref={widget.iconHref}
              iconTextColor={widget.iconTextColor}
              iconBgColor={widget.iconBgColor}
            />
          </div>
        );
      case 'icon-grid': {
        return (
          <div data-icon-grid className="h-full w-full">
            <IconWidget
              editing={isEditMode}
              size={widget.size}
              iconType={widget.iconType}
              iconGlyph={widget.iconGlyph}
              iconLabel={widget.iconLabel}
              iconHref={widget.iconHref}
              iconTextColor={widget.iconTextColor}
              iconBgColor={widget.iconBgColor}
            />
          </div>
        );
      }
      default:
        return null;
    }
  };

  // Size helper for responsive width classes on Muuri item containers
  // IMPORTANT: widths MUST be fixed percentages (no Tailwind responsive
  // breakpoints). Muuri measures each item's real pixel width via
  // getBoundingClientRect() to compute layout & free space. Responsive
  // classes (sm:/lg:/md:) change the width with the viewport, so below
  // 1024px a `sm` item was actually full-width and Muuri saw NO 1/4 gap ->
  // a ≤1/4 component could never be dragged up into the "remaining" space.
  // Fixed % keeps Muuri's measured width viewport-independent and correct.
  const getItemSizeClasses = (size: WidgetSize) => {
    switch (size) {
      case 'sm':
        return 'w-[25%]'; // 1/4
      case 'third':
        return 'w-[33.333%]'; // 1/3
      case 'wide':
        return 'w-[50%]'; // 1/2
      case 'large':
        return 'w-full'; // 1:1 占满整行
      case 'icon-1-8':
        return 'w-[12.5%] aspect-[1/1]'; // 1:8
      case 'icon-1-16':
        return 'w-[6.25%] aspect-[1/1]'; // 1:16
      default:
        return 'w-[50%]';
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
      isEditModeRef.current = isEditMode;

      // Instantiate Muuri Layout
      const grid = new Muuri(containerRef.current, {
        items: '.muuri-item',
        dragEnabled: true,
        // Allow dragging from the whole card (so content can be dragged too),
        // or from the explicit grip handle. Edit-mode gating is done below.
        dragHandle: '.drag-handle, .widget-card',
        // Muuri 0.9.x has no runtime drag() API, so we gate dragging with a
        // functional predicate that reads the live edit-mode ref. Functional
        // controls inside the header are excluded via [data-no-drag] so their
        // clicks are never swallowed by a drag gesture.
        dragStartPredicate: (_item, args: any) => {
          if (!isEditModeRef.current) return false;
          const target = args?.event?.target as HTMLElement | null;
          if (target && target.closest('[data-no-drag]')) return false;
          return true;
        },
        // Faster layout => less jank while sorting many heavy cards
        layoutDuration: 180,
        layoutEasing: 'cubic-bezier(0.2, 1, 0.2, 1)',
        dragSortHeuristics: {
          sortInterval: 50,
        },
        // Custom sort predicate.
        // Muuri's default predicate only reorders when the dragged element
        // OVERLAPS another item by >= 50%. So when you drag C below B into an
        // empty gap (C barely overlaps B), the score < threshold -> null -> C
        // snaps back. That's exactly the "can't drop C under B" bug.
        // We instead compute the target index from the pointer's vertical
        // position relative to every item's center, so dropping into an empty
        // gap below B correctly inserts C right after B.
        dragSortPredicate: (item: any, e: any) => {
          const grid = muuriInstanceRef.current;
          if (!grid) return null;
          const all = grid.getItems() as any[];
          const px = e.clientX;
          const py = e.clientY;
          // Walk items in current layout order; find the first item whose
          // center is below/right of the pointer -> insert before it.
          for (let i = 0; i < all.length; i++) {
            const t = all[i];
            if (t === item || !t._isActive) continue;
            const r = t.getElement().getBoundingClientRect();
            const cy = r.top + r.height / 2;
            const cx = r.left + r.width / 2;
            if (py < cy || (Math.abs(py - cy) < r.height / 2 && px < cx)) {
              return { index: i, action: 'move' };
            }
          }
          // Pointer is below every item -> append at the end.
          return { index: all.length - 1, action: 'move' };
        },
        dragPlaceholder: {
          enabled: true,
          // Lightweight placeholder instead of deep-cloning the whole heavy card,
          // which was the main source of drag lag.
          createElement(item) {
            const el = item.getElement().cloneNode(false) as HTMLElement;
            el.className = 'muuri-item';
            const inner = document.createElement('div');
            inner.className = 'muuri-item-content h-full w-full';
            const panel = document.createElement('div');
            panel.className =
              'h-full w-full glass-panel rounded-[24px] border border-white/60 dark:border-white/15 backdrop-blur-2xl';
            inner.appendChild(panel);
            el.appendChild(inner);
            return el;
          },
        },
      });

      muuriInstanceRef.current = grid;
      grid.refreshItems().layout();

      // Observe every item's own size and re-layout Muuri whenever it changes.
      // This keeps the grid from overlapping neighbouring cards when a widget's
      // height changes for any reason (resizing, aspect-square recompute, image
      // or font load). Muuri positions items with transforms, so a layout pass
      // never mutates an item's own box — therefore this observer cannot loop.
      const observeItems = () => {
        if (!resizeObserverRef.current || !containerRef.current) return;
        resizeObserverRef.current.disconnect();
        containerRef.current
          .querySelectorAll('.muuri-item')
          .forEach((el) => resizeObserverRef.current!.observe(el));
      };

      let resizeRaf = 0;
      resizeObserverRef.current = new ResizeObserver(() => {
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(() => {
          muuriInstanceRef.current?.refreshItems().layout();
        });
      });
      observeItems();

      // While dragging, strip the expensive backdrop-blur from every card so
      // the browser doesn't recompute the blur filter on every animation frame
      // (this is the #1 cause of drag jank with glassmorphism UIs).
      const onDragStart = () => {
        containerRef.current?.classList.add('is-dragging');
      };
      const onDragEndAll = () => {
        containerRef.current?.classList.remove('is-dragging');
      };
      grid.on('dragStart', onDragStart);
      grid.on('dragReleaseStart', onDragEndAll);

      // Listen for drag end / reorder events
      grid.on('dragEnd', () => {
        skipLayoutRef.current = true;
        const currentItems = grid.getItems();
        const newOrderedIds = currentItems
          .map((item) => item.getElement().getAttribute('data-widget-id'))
          .filter(Boolean) as string[];

        // Only persist when the order actually changed, otherwise a needless
        // setWidgets -> full re-render of the dashboard happens on every click.
        const orderChanged = newOrderedIds.some(
          (id, i) => widgets[i] && widgets[i].id !== id,
        );
        if (!orderChanged) return;

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
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect();
          resizeObserverRef.current = null;
        }
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
  // Skip the redundant sync triggered by our own dragEnd setWidgets call.
  useEffect(() => {
    if (!muuriInstanceRef.current) return;
    if (skipLayoutRef.current) {
      skipLayoutRef.current = false;
      return;
    }
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
      // React re-renders recreate the .muuri-item DOM nodes, so re-subscribe
      // the ResizeObserver to the fresh elements to keep height syncing alive.
      if (containerRef.current && resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        containerRef.current
          .querySelectorAll('.muuri-item')
          .forEach((el) => resizeObserverRef.current!.observe(el));
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [widgets]);

  return (
    <div className="w-full relative h-full">
      {/* Muuri Container */}
      <div ref={containerRef} className="muuri-grid relative w-full h-full ">
        {widgets.map((widget) => {
          const sizeClasses = getItemSizeClasses(widget.size);
          const showHeader = widget.showHeader !== false;

          return (
            <div
              key={widget.id}
              data-widget-id={widget.id}
              className={`muuri-item p-2.5 sm:p-3 absolute z-10 ${sizeClasses}${widget.id === expandedWidgetId ? ' hidden' : ''}`}
              onContextMenu={(e) => onContextMenuWidget(e, widget.id)}
            >
              {/* Muuri Required Item Content Wrapper */}
              <div className="muuri-item-content h-full w-full">
                <div
                  className={`widget-card h-full w-full glass-panel rounded-[24px] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/60 dark:border-white/15 backdrop-blur-2xl flex flex-col justify-between group${isEditMode ? ' edit-wiggle' : ''}`}
                  onClick={(e) => {
                    // Custom onAction event: owned by the widget-card container, not
                    // the inner icon button. When an icon-grid tile is clicked we
                    // resolve its behaviour by id (action handler from presetData,
                    // or a link to open). Clicks on header controls are marked
                    // data-no-drag but still bubble here — we ignore those so the
                    // green/red dot handlers remain authoritative.
                    if (isEditMode) return;
                    const target = e.target as HTMLElement;
                    if (target.closest('[data-no-drag]')) return;
                    // Type-level default action (optional). Resolved & executed
                    // centrally via WIDGET_CONFIG so the trigger lives in one place.
                    if (executeWidgetAction(widget.type)) return;
                    // settings 图标点击 → 打开适中尺寸设置弹窗（非放大）
                    if (widget.type === 'settings') {
                      setSettingsModalOpen(true);
                      return;
                    }
                    const iconGrid = target.closest('[data-icon-grid]');
                    if (!iconGrid) return;
                    const kind = widget.iconType;
                    if (kind === 'action') {
                      const action = getWidgetAction(widget.id);
                      console.log('[widget-card] action clicked', {
                        id: widget.id,
                        label: widget.iconLabel,
                        glyphName: widget.iconGlyph,
                        action,
                      });
                      action?.();
                    } else if (widget.iconHref) {
                      window.open(
                        widget.iconHref,
                        '_blank',
                        'noopener,noreferrer',
                      );
                    }
                  }}
                >
                  {/* Widget Card Title & Control Bar */}
                  {showHeader && (
                    <div className="flex items-center justify-between mb-2">
                      {/* Title (left) */}
                      <span className="text-font-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 select-none">
                        {widget.title}
                      </span>

                      {/* Controls (right): window dots + drag handle. Hidden by default,
                        shown on card hover (the card uses the `group` class). */}
                      <div className="flex items-center space-x-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="flex space-x-1.5 items-center">
                          {/* Green dot → left click cycles size, right click deletes */}
                          <Tooltip content="切换比例" placement="top">
                            <div
                              data-no-drag
                              onClick={(e) => {
                                e.stopPropagation();
                                cycleWidgetSize(widget);
                              }}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDeleteWidget(widget.id);
                              }}
                              className="w-3 h-3 rounded-full bg-[#28C840] hover:bg-[#28C840]/80 transition-colors cursor-pointer"
                            />
                          </Tooltip>
                          {/* Yellow dot → toggle headless modal (fixed centered).
                              放大能力仅对便签 (sticky-notes) 与导航 (shortcuts) 开放。 */}
                          {enableHeadlessModal &&
                            (widget.type === 'sticky-notes' ||
                              widget.type === 'shortcuts' ||
                              widget.type === 'agent-test') && (
                              <Tooltip content="无头模态放大" placement="top">
                                <div
                                  data-no-drag
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedWidgetId(widget.id);
                                  }}
                                  className="w-3 h-3 rounded-full bg-[#FFCC00] hover:bg-[#FFCC00]/80 transition-colors cursor-pointer"
                                />
                              </Tooltip>
                            )}
                          {/* Red dot → delete */}
                          <Tooltip content="移除小组件" placement="top">
                            <button
                              data-no-drag
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteWidget(widget.id);
                              }}
                              className="w-3 h-3 rounded-full bg-[#FF5F57] hover:bg-[#FF5F57]/80 flex items-center justify-center group/dot transition-colors cursor-pointer"
                              title="移除小组件"
                            >
                              <X
                                size={8}
                                className="text-black/60 opacity-0 group-hover/dot:opacity-100"
                              />
                            </button>
                          </Tooltip>
                        </div>

                        {/* Drag Handle (only shown while editing) */}
                        {isEditMode && (
                          <div
                            className="drag-handle p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing transition-colors"
                            title="按住拖拽排列位置 (Muuri Grid)"
                          >
                            <GripHorizontal size={14} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Inner Widget Component Content.
                      In edit mode the content is non-interactive (clicks are
                      disabled) but the card is still draggable from this area
                      because the event passes through to the .widget-card handle. */}
                  <div
                    className={`flex-1${widget.size === 'icon-1-16' ? '' : ' pt-1'}${isEditMode ? ' pointer-events-none' : ''}`}
                  >
                    {widget.id === expandedWidgetId
                      ? null
                      : renderWidgetContent(widget)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
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
                className="glass-panel rounded-[24px] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/60 dark:border-white/15 backdrop-blur-2xl w-[80vw] h-[80vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 无头：不渲染标题栏与控制栏 */}
                <div className="flex-1 min-h-0">
                  {renderWidgetContent(expandedWidget, true)}
                </div>
              </div>
            </div>
          );
        })()}

      {/* 设置弹窗：settings 以适中尺寸模态框呈现，点击外部遮罩或关闭按钮关闭 */}
      {settingsModalOpen &&
        (() => {
          const settingsWidget = widgets.find((w) => w.type === 'settings');
          if (!settingsWidget) return null;
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
              onClick={() => setSettingsModalOpen(false)}
            >
              <div
                className="rounded-[24px] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-black/5 dark:border-white/15 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden bg-white dark:bg-[#1C1C1E]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <SettingsWidget />
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
};
