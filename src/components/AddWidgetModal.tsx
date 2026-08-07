import React from 'react';
import { Plus } from 'lucide-react';
import { Modal } from './Modal';
import { WidgetType, WidgetItem } from '../types';
import { ADDABLE_WIDGETS, getWidgetConfig } from '../data/widgetConfig';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (type: WidgetType) => void;
  widgets: WidgetItem[];
}

/**
 * "添加组件" picker presented as a centered modal (reusing the app-wide
 * <Modal>). Opened from the `widget-add` icon tile on the dashboard.
 */
export const AddWidgetModal: React.FC<Props> = ({ isOpen, onClose, onAddWidget, widgets }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="选择添加组件"
      icon={<Plus size={18} className="text-[#007AFF]" />}
      maxWidth="max-w-sm"
    >
      <div className="p-4 grid grid-cols-2 gap-2">
        {ADDABLE_WIDGETS.map((t) => {
          const count = widgets.filter((w) => w.type === t.type).length;
          const max = getWidgetConfig(t.type).maxInstances;
          const disabled = max !== Infinity && count >= max;
          return (
            <button
              key={t.type}
              type="button"
              disabled={disabled}
              onClick={() => {
                onAddWidget(t.type);
                onClose();
              }}
              className={`flex flex-col items-center gap-1.5 rounded-xl border border-white/40 bg-white/60 px-3 py-3 text-slate-700 transition-colors hover:bg-black/5 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 ${
                disabled ? 'cursor-not-allowed opacity-40 hover:bg-white/60 dark:hover:bg-white/5' : ''
              }`}
            >
              <span className="text-2xl">{t.glyph}</span>
              <span className="text-[11px] font-medium">{t.label}</span>
              {disabled && <span className="text-[9px] text-slate-400">已添加</span>}
            </button>
          );
        })}
      </div>
    </Modal>
  );
};
