import React from 'react';
import { Tooltip } from '@heroui/react';
import { GripHorizontal, X } from 'lucide-react';
import { getWidgetConfig } from '../../data/widgetConfig';
import { StickyNote as StickyNoteType, WidgetItem } from '../../types';
import { WeatherSummary } from '../../widgets/WeatherWidget';
import { renderWidgetContent } from './widgetContent';
import { getItemSizeClasses } from './itemSize';

interface WidgetCardProps {
  widget: WidgetItem;
  isEditMode: boolean;
  notes: StickyNoteType[];
  onUpdateNotes: (notes: StickyNoteType[]) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onWeatherChange?: (s: WeatherSummary) => void;
  /** 是否在 widget 控制栏显示黄色按钮（点击后该 widget 以无头模态框居中显示） */
  enableHeadlessModal?: boolean;
  /** 当前以无头模态放大的 widget id（此时卡片内容区不渲染，避免双份 DOM） */
  expandedWidgetId: string | null;
  onCycleSize: (widget: WidgetItem) => void;
  onDeleteWidget: (id: string) => void;
  onExpand: (id: string) => void;
  onClick: (e: React.MouseEvent<HTMLDivElement>, widget: WidgetItem) => void;
  /** 卡片整体右键菜单回调（参数与 App.handleContextMenuWidget 一致：事件 + widgetId）。 */
  onContextMenuWidget?: (e: React.MouseEvent, widgetId: string) => void;
  /** 更新任意 widget 实例字段（如快捷导航的 shortcuts 数据空间）。 */
  onUpdateWidget?: (id: string, patch: Partial<WidgetItem>) => void;
}

// 单个 widget 的卡片：外层包裹（供 Muuri 测量） + 玻璃面板（header 控制栏 + 内容区）。
// 控制栏的三个圆点（绿/黄/红）与拖拽手柄在此渲染；卡片整体点击逻辑交由父组件传入的 onClick。
export const WidgetCard: React.FC<WidgetCardProps> = ({
  widget,
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
  onUpdateWidget,
}) => {
  const sizeClasses = getItemSizeClasses(widget.size);
  const showHeader = widget.showHeader !== false;
  const isExpanded = widget.id === expandedWidgetId;

  return (
    <div
      data-widget-id={widget.id}
      className={`muuri-item p-2 z-10 ${sizeClasses}${
        isExpanded ? ' hidden' : ''
      }`}
    >
      {/* Muuri Required Item Content Wrapper */}
      <div className="muuri-item-content h-full w-full">
        <div
          style={widget.background ? { background: widget.background } : undefined}
          className={`widget-card h-full w-full glass-panel rounded-[var(--card-radius)] ${
            widget.size === 'icon-1-16' ? 'p-0' : 'p-4'
          } shadow-[0_12px_40px_rgba(0,0,0,0.10)] border border-white/60 dark:border-white/15 backdrop-blur-2xl flex flex-col justify-between group${
            widget.backgroundTheme ? ` card-theme-${widget.backgroundTheme}` : ''
          }${isEditMode ? ' edit-wiggle' : ''}`}
          onClick={(e) => onClick(e, widget)}
          onContextMenu={(e) => onContextMenuWidget?.(e, widget.id)}
        >
          {/* Widget Card Title & Control Bar */}
          {showHeader && (
            <div className="flex items-center justify-between mb-3">
              {/* Title (left) */}
              <span className="text-font-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 select-none">
                {widget.title}
              </span>

              {/* Controls (right): window dots + drag handle. Hidden by default,
                shown on card hover (the card uses the `group` class). */}
              <div className="flex items-center space-x-2 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex space-x-1.5 items-center">
                  {/* Green dot → left click cycles size, right click deletes.
                      Hidden when the widget has only one size option. */}
                  {getWidgetConfig(widget.type).sizeOptions.length > 1 && (
                    <Tooltip delay={150}>
                      <Tooltip.Trigger className="inline-flex">
                        <div
                          data-no-drag
                          onClick={(e) => {
                            e.stopPropagation();
                            onCycleSize(widget);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDeleteWidget(widget.id);
                          }}
                          className="w-3 h-3 rounded-full bg-[#28C840] hover:bg-[#28C840]/80 transition-colors cursor-pointer"
                        />
                      </Tooltip.Trigger>
                      <Tooltip.Content placement="top">
                        切换比例
                      </Tooltip.Content>
                    </Tooltip>
                  )}
                  {/* Yellow dot → toggle headless modal (fixed centered).
                      放大能力仅对便签 (sticky-notes) 与导航 (shortcuts) 开放。 */}
                  {enableHeadlessModal &&
                    (widget.type === 'sticky-notes' ||
                      widget.type === 'shortcuts') && (
                      <Tooltip delay={150}>
                        <Tooltip.Trigger className="inline-flex">
                          <div
                            data-no-drag
                            onClick={(e) => {
                              e.stopPropagation();
                              onExpand(widget.id);
                            }}
                            className="w-3 h-3 rounded-full bg-[#FFCC00] hover:bg-[#FFCC00]/80 transition-colors cursor-pointer"
                          />
                        </Tooltip.Trigger>
                        <Tooltip.Content placement="top">
                          最大化
                        </Tooltip.Content>
                      </Tooltip>
                    )}
                  {/* Red dot → delete */}
                  <Tooltip delay={150}>
                    <Tooltip.Trigger className="inline-flex">
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
                    </Tooltip.Trigger>
                    <Tooltip.Content placement="top">
                      移除小组件
                    </Tooltip.Content>
                  </Tooltip>
                </div>

                {/* Drag Handle (only shown while editing) */}
                {isEditMode && (
                  <div
                    className="drag-handle p-1 rounded-[var(--card-radius)] hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing transition-colors"
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
            className={`flex-1${
              widget.size === 'icon-1-16' ? '' : ' pt-0'
            }${isEditMode ? ' pointer-events-none' : ''}`}
          >
            {isExpanded ? null : renderWidgetContent({ widget, notes, onUpdateNotes, isDarkMode, onToggleDarkMode, isEditMode, onWeatherChange, onExpand, onUpdateWidget })}
          </div>
        </div>
      </div>
    </div>
  );
};
