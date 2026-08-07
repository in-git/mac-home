import React, { useEffect, useRef } from 'react';
import Muuri from 'muuri';
import {
  WidgetItem,
  WidgetType,
  WidgetSize,
  StickyNote as StickyNoteType,
  ReminderTask
} from '../types';
import { StickyNotesWidget } from '../widgets/StickyNotesWidget';
import { WeatherWidget } from '../widgets/WeatherWidget';
import { TasksWidget } from '../widgets/TasksWidget';
import { ClockCalendarWidget } from '../widgets/ClockCalendarWidget';
import { ControlCenterWidget } from '../widgets/ControlCenterWidget';
import { ShortcutsWidget } from '../widgets/ShortcutsWidget';
import { AppleFormShowcase } from './AppleFormShowcase';
import {
  Maximize2,
  Minimize2,
  Trash2,
  GripHorizontal,
  X,
} from 'lucide-react';

interface MuuriDashboardProps {
  widgets: WidgetItem[];
  onUpdateWidgetOrder: (newWidgets: WidgetItem[]) => void;
  onDeleteWidget: (id: string) => void;
  onResizeWidget: (id: string, newSize: WidgetSize) => void;
  onContextMenuWidget: (e: React.MouseEvent, widgetId: string) => void;
  isEditMode: boolean;
  notes: StickyNoteType[];
  onUpdateNotes: (notes: StickyNoteType[]) => void;
  tasks: ReminderTask[];
  onUpdateTasks: (tasks: ReminderTask[]) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
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
  tasks,
  onUpdateTasks,
  isDarkMode,
  onToggleDarkMode,
  isFocusMode,
  onToggleFocusMode
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const muuriInstanceRef = useRef<Muuri | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const skipLayoutRef = useRef(false);
  const isEditModeRef = useRef(isEditMode);

  // Helper to render widget content
  const renderWidgetContent = (type: WidgetType) => {
    switch (type) {
      case 'sticky-notes':
        return <StickyNotesWidget notes={notes} onUpdateNotes={onUpdateNotes} />;
      case 'weather':
        return <WeatherWidget />;
      case 'tasks':
        return <TasksWidget tasks={tasks} onUpdateTasks={onUpdateTasks} />;
      case 'clock':
        return <ClockCalendarWidget />;
      case 'control-center':
        return (
          <ControlCenterWidget
            isDarkMode={isDarkMode}
            onToggleDarkMode={onToggleDarkMode}
            isFocusMode={isFocusMode}
            onToggleFocusMode={onToggleFocusMode}
          />
        );
      case 'shortcuts':
        return <ShortcutsWidget />;
      case 'form-showcase':
        return <AppleFormShowcase />;
      default:
        return null;
    }
  };

  // Size helper for responsive width classes on Muuri item containers
  const getItemSizeClasses = (size: WidgetSize) => {
    switch (size) {
      case 'sm':
        return 'w-full sm:w-1/2 lg:w-1/4 h-[240px]';
      case 'md':
        return 'w-full sm:w-1/2 lg:w-1/3 h-[270px]';
      case 'wide':
        return 'w-full lg:w-1/2';
      case 'tall':
        return 'w-full sm:w-1/2 lg:w-1/3 h-[420px]';
      case 'large':
        return 'w-full lg:w-1/2';
      default:
        return 'w-full lg:w-1/2 ';
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
        dragHandle: '.drag-handle',
        // Muuri 0.9.x has no runtime drag() API, so we gate dragging with a
        // functional predicate that reads the live edit-mode ref.
        dragStartPredicate: () => {
          return !!isEditModeRef.current;
        },
        // Faster layout => less jank while sorting many heavy cards
        layoutDuration: 180,
        layoutEasing: 'cubic-bezier(0.2, 1, 0.2, 1)',
        dragSortHeuristics: {
          sortInterval: 50
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
          }
        }
      });

      muuriInstanceRef.current = grid;
      grid.refreshItems().layout();

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
          (id, i) => widgets[i] && widgets[i].id !== id
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
      .filter((item) => !desiredIds.has(item.getElement().getAttribute('data-widget-id') || ''));
    if (toRemove.length) {
      grid.remove(toRemove, { layout: false });
    }

    // Add newly-added widget items (React already rendered their DOM nodes).
    const existingIds = new Set(
      grid.getItems().map((item) => item.getElement().getAttribute('data-widget-id'))
    );
    const addedEls = Array.from(
      containerRef.current?.querySelectorAll('.muuri-item') || []
    ).filter((el: Element) => !existingIds.has(el.getAttribute('data-widget-id') || ''));
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
    <div className="w-full relative min-h-[500px]">
      {/* Muuri Container */}
      <div
        ref={containerRef}
        className="muuri-grid relative w-full overflow-hidden"
      >
        {widgets.map((widget) => {
          const sizeClasses = getItemSizeClasses(widget.size);

          return (
            <div
              key={widget.id}
              data-widget-id={widget.id}
              className={`muuri-item p-2.5 sm:p-3 absolute z-10 ${sizeClasses}`}
              onContextMenu={(e) => onContextMenuWidget(e, widget.id)}
            >
              {/* Muuri Required Item Content Wrapper */}
              <div className="muuri-item-content h-full w-full">
                <div className="h-full w-full glass-panel rounded-[24px] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/60 dark:border-white/15 backdrop-blur-2xl flex flex-col justify-between hover:shadow-2xl transition-shadow duration-200 group">
                  {/* Widget Card Title & Control Bar */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {/* Drag Handle or Window Dots */}
                      <div className="flex space-x-1.5 items-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteWidget(widget.id);
                          }}
                          className="w-3 h-3 rounded-full bg-[#FF5F57] hover:bg-[#FF5F57]/80 flex items-center justify-center group/dot transition-all cursor-pointer"
                          title="移除小组件"
                        >
                          <X size={8} className="text-black/60 opacity-0 group-hover/dot:opacity-100" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const sizeCycle: WidgetSize[] = ['sm', 'md', 'wide', 'large'];
                            const nextSize =
                              sizeCycle[(sizeCycle.indexOf(widget.size) + 1) % sizeCycle.length];
                            onResizeWidget(widget.id, nextSize);
                          }}
                          className="w-3 h-3 rounded-full bg-[#FFBD2E] hover:bg-[#FFBD2E]/80 flex items-center justify-center group/dot transition-all cursor-pointer"
                          title="切换尺寸"
                        >
                          <Minimize2 size={7} className="text-black/60 opacity-0 group-hover/dot:opacity-100" />
                        </button>
                        <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                      </div>

                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 select-none">
                        {widget.title}
                      </span>
                    </div>

                    {/* Drag Grip Handle & Size Controls */}
                    <div className="flex items-center space-x-1.5">
                      {/* Drag Handle */}
                      <div
                        className="drag-handle p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing transition-colors"
                        title="按住拖拽排列位置 (Muuri Grid)"
                      >
                        <GripHorizontal size={14} />
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newSize = widget.size === 'wide' ? 'md' : 'wide';
                          onResizeWidget(widget.id, newSize);
                        }}
                        className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="切换大小"
                      >
                        <Maximize2 size={12} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteWidget(widget.id);
                        }}
                        className="p-1 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="关闭"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Inner Widget Component Content */}
                  <div className="flex-1 overflow-hidden pt-1">
                    {renderWidgetContent(widget.type)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
