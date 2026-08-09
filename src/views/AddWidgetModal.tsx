import {
  AlarmClock,
  AppWindow,
  Bot,
  Clock,
  CloudSun,
  Compass,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  StickyNote,
  type LucideIcon,
} from 'lucide-react';
import React from 'react';
import { ADDABLE_WIDGETS, getWidgetConfig } from '../data/widgetConfig';
import { WidgetItem, WidgetType } from '../types';
import { Modal } from '../components/Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (type: WidgetType) => void;
  widgets: WidgetItem[];
}

/** 每个小组件类型对应的细线性图标（遵循 Apple HIG 细线性图标风格） */
const WIDGET_ICONS: Record<WidgetType, LucideIcon> = {
  search: Search,
  'ai-chat': Bot,
  weather: CloudSun,
  'sticky-notes': StickyNote,
  clock: Clock,
  'clock-mini': AlarmClock,
  shortcuts: Compass,
  'control-center': SlidersHorizontal,
  settings: Settings,
  'icon-grid': Plus,
  application: AppWindow,
};

/** 图标气泡哑光底色（主色以 Apple 蓝 #007AFF 点缀） */
const WIDGET_ICON_BUBBLE: Record<WidgetType, string> = {
  search: 'bg-[#007AFF]/10 text-[#007AFF]',
  'ai-chat': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  weather: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  'sticky-notes': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  clock: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  'clock-mini': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  shortcuts: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  'control-center': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  settings: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  'icon-grid': 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  application: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
};

/**
 * "添加组件" picker presented as a centered modal (reusing the app-wide
 * <Modal>). Opened from the `widget-add` icon tile on the dashboard.
 * 样式遵循 UI 规范：12px 哑光磨砂圆角瓦片、无生硬描边、hover 加深、active:scale-95。
 */
export const AddWidgetModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onAddWidget,
  widgets,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="选择添加组件"
      icon={<Plus size={18} className="text-[#007AFF]" />}
      maxWidth="max-w-md"
    >
      <div className="p-4 grid grid-cols-3 gap-2">
        {ADDABLE_WIDGETS.map((t) => {
          const count = widgets.filter((w) => w.type === t.type).length;
          const max = getWidgetConfig(t.type).maxInstances;
          const disabled = max !== Infinity && count >= max;
          const Icon = WIDGET_ICONS[t.type];
          return (
            <button
              key={t.type}
              type="button"
              disabled={disabled}
              onClick={() => {
                onAddWidget(t.type);
                onClose();
              }}
              className={`flex flex-col items-center gap-2 rounded-[var(--card-radius)] bg-black/5 px-3 py-3.5 transition-colors dark:bg-white/10 ${
                disabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:bg-black/10 active:scale-95 dark:hover:bg-white/15'
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-[var(--card-radius)] ${WIDGET_ICON_BUBBLE[t.type]}`}
              >
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <span className="text-center text-xs font-medium text-slate-700 dark:text-slate-200">
                {t.label}
              </span>
              {disabled && (
                <span className="text-font-sm text-slate-400">已添加</span>
              )}
            </button>
          );
        })}
      </div>
    </Modal>
  );
};
