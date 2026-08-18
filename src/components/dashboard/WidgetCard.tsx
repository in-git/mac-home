import React, { useRef } from 'react';
import { getWidgetConfig, DEFAULT_CARD_STYLE } from '../../data/widgetConfig';
import { StickyNote as StickyNoteType, WidgetItem } from '../../types';
import { WeatherSummary } from '../../widgets/WeatherWidget';
import { renderWidgetContent } from './widgetContent';
import { getItemSizeClasses, getWebGridPx } from './itemSize';
import { isWebGrid } from '../../data/widgetConfig';

/** 长按卡片进入编辑布局的按压时长（ms），与右键菜单「布局」功能等价 */
const LONG_PRESS_MS = 500;

interface WidgetCardProps {
  widget: WidgetItem;
  isEditMode: boolean;
  notes: StickyNoteType[];
  onUpdateNotes: (notes: StickyNoteType[]) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onWeatherChange?: (s: WeatherSummary) => void;
  /** 当前以无头模态放大的 widget id（此时卡片内容区不渲染，避免双份 DOM） */
  expandedWidgetId: string | null;
  onExpand: (id: string) => void;
  onClick: (e: React.MouseEvent<HTMLDivElement>, widget: WidgetItem) => void;
  /** 卡片整体右键菜单回调（参数与 App.handleContextMenuWidget 一致：事件 + widgetId）。 */
  onContextMenuWidget?: (e: React.MouseEvent, widgetId: string) => void;
  /** 长按卡片进入编辑布局（与右键「布局」一致）；编辑模式下不触发 */
  onLongPressEdit?: () => void;
  /** 更新任意 widget 实例字段（如快捷导航的 shortcuts 数据空间）。 */
  onUpdateWidget?: (id: string, patch: Partial<WidgetItem>) => void;
}

// 单个 widget 的卡片：外层包裹（供 Muuri 测量） + 玻璃面板（内容区）。
// 卡片整体点击逻辑交由父组件传入的 onClick；组件删除/调整比例等由右键菜单（ContextMenu）提供。
export const WidgetCard: React.FC<WidgetCardProps> = ({
  widget,
  isEditMode,
  notes,
  onUpdateNotes,
  isDarkMode,
  onToggleDarkMode,
  onWeatherChange,
  expandedWidgetId,
  onExpand,
  onClick,
  onContextMenuWidget,
  onLongPressEdit,
  onUpdateWidget,
}) => {
  const sizeClasses = getItemSizeClasses(widget.size, widget.type);
  const isWebGridType = isWebGrid(widget.type);
  // 纯图标类型：固定像素正方形作用在「内层 content」上（外层已 w-fit 收缩），
  // 尺寸切换时内层盒子变化即可驱动 Muuri 重新测量并排布。需要 48 下限保证最小尺寸。
  const webGridPx = isWebGridType ? getWebGridPx(widget.size) : undefined;
  const isExpanded = widget.id === expandedWidgetId;
  // 卡片内容区内边距由类型配置驱动（cardStyle.padding，回退到默认），纯图标尺寸保持贴边
  const widgetPadding =
    widget.size === '1/16'
      ? 'p-0'
      : (getWidgetConfig(widget.type).cardStyle?.padding ?? DEFAULT_CARD_STYLE.padding);

  // 卡片外观配置（毛玻璃），回退到默认
  const cardStyleCfg = getWidgetConfig(widget.type).cardStyle ?? DEFAULT_CARD_STYLE;
  const isGlass = cardStyleCfg.glass;
  // 组件自定义高度：用于固定卡片高度（如 clock-mini 指定 160），
  // 内部组件通过 h-full 自适应填满该高度。
  const cardHeightStyle = cardStyleCfg.height ? { height: cardStyleCfg.height } : undefined;

  // 长按进入编辑模式：按压计时，松开/移出/取消时清除；
  // 触发后标记本次按压，避免随后的 click 再执行打开链接等操作。
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const cancelLongPress = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isEditMode || !onLongPressEdit) return;
    // 控制栏按钮/拖拽手柄等交互元素上不触发长按
    if ((e.target as HTMLElement).closest('[data-no-drag], .drag-handle')) return;
    cancelLongPress();
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      onLongPressEdit();
    }, LONG_PRESS_MS);
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 长按已触发编辑布局，忽略随后的点击，避免误触组件行为
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    onClick(e, widget);
  };

  return (
    <div
      data-widget-id={widget.id}
      className={`muuri-item z-10 p-2 lg:p-4 ${sizeClasses}`}
      onClick={handleCardClick}
    >
      {/* Muuri Required Item Content Wrapper */}
      <div className="muuri-item-content h-full w-full">
        <div
          style={{
            ...(widget.cardStyle?.background ? { background: widget.cardStyle.background } : {}),
            ...(cardHeightStyle ?? {}),
            // 纯图标：固定像素正方形作用在可见的 .widget-card 上（外层 p-2 lg:p-4
            // 提供间距），尺寸切换时盒子变化会触发 Muuri 重新测量，避免被内联尺寸锁死。
            ...(isWebGridType ? { width: webGridPx, height: webGridPx } : {}),
          }}
          className={`widget-card ${isWebGridType ? '' : 'h-full w-full'} ${isGlass ? 'glass-panel  shadow-[0_12px_40px_rgba(0,0,0,0.10)]' : ''} rounded-[var(--card-radius)] ${widgetPadding} flex flex-col justify-between group${
            widget.cardStyle?.backgroundTheme ? ` card-theme-${widget.cardStyle.backgroundTheme}` : ''
          }${isEditMode ? ' edit-wiggle border-2 border-dashed border-[color:var(--accent)]' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerUp={cancelLongPress}
          onPointerLeave={cancelLongPress}
          onPointerCancel={cancelLongPress}
          onContextMenu={(e) => onContextMenuWidget?.(e, widget.id)}
        >
          {/* Inner Widget Component Content.
              In edit mode the content is non-interactive (clicks are
              disabled) but the card is still draggable from this area
              because the event passes through to the .widget-card handle. */}
          <div
            className={`flex-1${
              widget.size === '1/16' ? '' : ' pt-0'
            }${isEditMode ? ' pointer-events-none' : ''}`}
          >
            {isExpanded ? null : renderWidgetContent({ widget, notes, onUpdateNotes, isDarkMode, onToggleDarkMode, isEditMode, onWeatherChange, onExpand, onUpdateWidget })}
          </div>
        </div>
      </div>
    </div>
  );
};
