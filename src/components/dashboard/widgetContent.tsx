import React from 'react';
import { StickyNote as StickyNoteType, WidgetItem } from '../../types';
import { WebListWidget } from '../../widgets/WebListWidget';
import { ClockCalendarWidget } from '../../widgets/ClockCalendarWidget';
import { ClockWidget } from '../../widgets/ClockWidget';
import { ClockLunarWidget } from '../../widgets/ClockLunarWidget';
import { ControlCenterWidget } from '../../widgets/ControlCenterWidget';
import { IconWidget } from '../../widgets/IconWidget';
import { BannerWidget } from '../../widgets/BannerWidget';
import { SearchWidget } from '../../widgets/SearchWidget';
import { SettingsWidget } from '../../widgets/SettingsWidget';
import { StickyNotesWidget } from '../../widgets/StickyNotesWidget';
import { WeatherWidget, WeatherSummary } from '../../widgets/WeatherWidget';
import { ShortcutsWidget } from '@/views/ShortcutsWidget';

interface RenderWidgetContentProps {
  widget: WidgetItem;
  notes: StickyNoteType[];
  onUpdateNotes: (notes: StickyNoteType[]) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isEditMode: boolean;
  onWeatherChange?: (s: WeatherSummary) => void;
  onExpand: (id: string) => void;
  /** true 时用于无头模态（弹窗）：settings 渲染完整面板，shortcuts 填满布局 */
  inModal?: boolean;
  onUpdateWidget?: (id: string, patch: Partial<WidgetItem>) => void;
}

// Helper to render widget content. `inModal` 为 true 时用于无头模态（弹窗）：
// settings 在网格中显示为图标，在模态中渲染完整设置面板。
export const renderWidgetContent = ({
  widget,
  notes,
  onUpdateNotes,
  isDarkMode,
  onToggleDarkMode,
  isEditMode,
  onWeatherChange,
  onExpand,
  inModal = false,
  onUpdateWidget,
}: RenderWidgetContentProps): React.ReactNode => {
  switch (widget.type) {
    case 'search':
      return <SearchWidget />;
    case 'sticky-notes':
      return <StickyNotesWidget notes={notes} onUpdateNotes={onUpdateNotes} />;
    case 'weather':
      return <WeatherWidget onWeatherChange={onWeatherChange} />;
    case 'clock':
      return <ClockCalendarWidget />;
    case 'clock-mini':
      return <ClockWidget />;
    case 'clock-lunar':
      return <ClockLunarWidget />;
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
          onExpand={inModal ? undefined : () => onExpand(widget.id)}
          shortcuts={widget.shortcuts}
          onUpdateShortcuts={
            onUpdateWidget
              ? (list) => onUpdateWidget(widget.id, { shortcuts: list })
              : undefined
          }
        />
      );
    case 'settings':
      // 网格中：渲染为图标，点击后打开无头模态显示完整设置面板
      if (inModal) return <SettingsWidget activeTab={'appearance'} />;
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
      // 桌面图标可能由「网页列表」添加（携带 site 数据），渲染时优先取 site 的站点信息；
      // 无站点且无自定义图标时，默认值为系统设置图标（点击弹出设置模态框）
      const site = widget.site;
      const isDefaultSettings = !site && !widget.iconGlyph;
      return (
        <div data-icon-grid className="h-full w-full">
          <IconWidget
            editing={isEditMode}
            size={widget.size}
            iconType={
              widget.iconType ?? (isDefaultSettings ? 'action' : 'link')
            }
            iconGlyph={
              site
                ? (widget.iconGlyph ?? 'Globe')
                : (widget.iconGlyph ?? 'Settings')
            }
            iconLabel={site?.name ?? widget.iconLabel ?? '系统设置'}
            iconHref={site?.link ?? widget.iconHref}
            iconImage={site?.logo}
            iconTextColor={widget.iconTextColor}
            iconBgColor={widget.iconBgColor}
          />
        </div>
      );
    }
    case 'application': {
      return <WebListWidget websites={widget.websites} html={widget.html} />;
    }
    case 'banner': {
      return <BannerWidget size={widget.size} />;
    }
    default:
      return null;
  }
};
