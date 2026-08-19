import React from 'react';
import { StickyNote as StickyNoteType, WidgetItem } from '../../types';
import { WebListWidget } from '../../widgets/WebListWidget';
import { ClockCalendarWidget } from '../../widgets/ClockCalendar/ClockCalendarWidget';
import { ClockWidget } from '../../widgets/Clock/ClockWidget';
import { ClockLunarWidget } from '../../widgets/ClockLunar/ClockLunarWidget';
import { ControlCenterWidget } from '../../widgets/ControlCenter/ControlCenterWidget';
import { WebApp } from '../../widgets/WebApp/WebApp';
import { SearchWidget } from '../../widgets/Search/SearchWidget';
import { StickyNotesWidget } from '../../widgets/StickyNotes/StickyNotesWidget';
import { WeatherWidget, WeatherSummary } from '../../widgets/Weather';
import { RandomWebWidget } from '@/widgets/RandomWebWidget';
import { MemberCountWidget } from '../../widgets/MemberCount/MemberCountWidget';

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
  onWeatherChange,
  onExpand,
  inModal = false,
  isEditMode = false,
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
    case 'random-web':

      return (
        <RandomWebWidget
          expanded={inModal}
          onExpand={inModal ? undefined : () => onExpand(widget.id)}
        />
      );
 
    case 'web-app': {
      // 桌面图标可能由「网页列表」添加（携带 site 数据），渲染时优先取 site 的站点信息；
      // 保持 1:1 比例正方形居中展示
      // 1:1 比例（grid.w === grid.h，即正方形档位）时隐藏站点文本
      const isSquare = !!widget.grid && widget.grid.w === widget.grid.h;
      return (
        <div data-icon-grid className="h-full w-full flex items-center justify-center">
          <div className="w-full aspect-square flex items-center justify-center">
            <WebApp site={widget.data.site} hideLabel={isSquare} editing={isEditMode} />
          </div>
        </div>
      );
    }
    case 'application': {
      return <WebListWidget site={widget.data.site} />;
    }

    case 'member-count': {
      return <MemberCountWidget />;
    }
    default:
      return null;
  }
};
