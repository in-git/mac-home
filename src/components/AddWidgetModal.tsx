import React from 'react';
import { Plus } from 'lucide-react';
import { Modal } from './Modal';
import { WidgetType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (type: WidgetType) => void;
}

// Components that can be added from the "添加组件" modal.
const ADDABLE_TYPES: { type: WidgetType; glyph: string; label: string }[] = [
  { type: 'weather', glyph: '⛅', label: '天气预报' },
  { type: 'tasks', glyph: '📋', label: '实时提醒' },
  { type: 'sticky-notes', glyph: '📝', label: '便签' },
  { type: 'clock', glyph: '🕒', label: '时间 & 日历' },
  { type: 'shortcuts', glyph: '🔗', label: '快捷导航' },
  { type: 'control-center', glyph: '🎛️', label: '控制中心' },
];

/**
 * "添加组件" picker presented as a centered modal (reusing the app-wide
 * <Modal>). Opened from the `widget-add` icon tile on the dashboard.
 */
export const AddWidgetModal: React.FC<Props> = ({ isOpen, onClose, onAddWidget }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="选择添加组件"
      icon={<Plus size={18} className="text-[#007AFF]" />}
      maxWidth="max-w-sm"
    >
      <div className="p-4 grid grid-cols-2 gap-2">
        {ADDABLE_TYPES.map((t) => (
          <button
            key={t.type}
            type="button"
            onClick={() => {
              onAddWidget(t.type);
              onClose();
            }}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-white/40 bg-white/60 px-3 py-3 text-slate-700 transition-colors hover:bg-black/5 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            <span className="text-2xl">{t.glyph}</span>
            <span className="text-[11px] font-medium">{t.label}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
};
