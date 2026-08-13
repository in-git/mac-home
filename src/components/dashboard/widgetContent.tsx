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
      return <ClockLunarWidget widget={widget} />;
    case 'control-center':
      return (
        <ControlCenterWidget
          isDarkMode={isDarkMode}
          onToggleDarkMode={onToggleDarkMode}
        />
      );
    case 'shortcuts':

      return (
        <ShortcutsWidget
          expanded={inModal}
          onExpand={inModal ? undefined : () => onExpand(widget.id)}
          shortcuts={widget.data.shortcuts}
          onUpdateShortcuts={
            onUpdateWidget
              ? (list) => onUpdateWidget(widget.id, { data: { ...widget.data, shortcuts: list } })
              : undefined
          }
        />
      );
 
    case 'web-grid': {
      // 桌面图标可能由「网页列表」添加（携带 site 数据），渲染时优先取 site 的站点信息；
      // 无站点且无自定义图标时，默认值为系统设置图标（点击弹出设置模态框）
      return (
        <div data-icon-grid className="h-full w-full">
          <IconWidget size={widget.size} site={widget.data.site} />
        </div>
      );
    }
    case 'application': {
      return <WebListWidget site={widget.data.site} />;
    }
    case 'banner': {
      return <BannerWidget size={widget.size} />;
    }
    default:
      return null;
  }
};
