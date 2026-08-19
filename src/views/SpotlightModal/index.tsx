import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, StickyNote, CloudSun, Clock, Compass, Sliders, ExternalLink } from 'lucide-react';
import { StickyNote as StickyNoteType, WidgetType } from '../../types';


interface Props {
  isOpen: boolean;
  onClose: () => void;
  notes: StickyNoteType[];
  onAddWidget: (type: WidgetType) => void;
}

export const SpotlightModal: React.FC<Props> = ({
  isOpen,
  onClose,
  notes,
  onAddWidget,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();

        if (isOpen) onClose();
        else {
          // Open spotlight
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(query.toLowerCase()) ||
      n.content.toLowerCase().includes(query.toLowerCase())
  );

  const widgetCommands = [
    { name: '打开/添加 天气预报小组件', type: 'weather' as WidgetType, icon: CloudSun },
    { name: '打开/添加 便签小组件', type: 'sticky-notes' as WidgetType, icon: StickyNote },
    { name: '打开/添加 时钟与日历', type: 'clock' as WidgetType, icon: Clock },
    { name: '打开/添加 控制中心', type: 'control-center' as WidgetType, icon: Sliders },
    { name: '打开/添加 随机网页', type: 'random-web' as WidgetType, icon: Compass },
  ].filter((w) => w.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/20 backdrop-blur-xs"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: -20, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl glass-panel rounded-[var(--card-radius)] shadow-2xl border border-white/50 dark:border-white/15 overflow-hidden "
        >
          {/* Spotlight Search Bar */}
          <div className="flex items-center px-4 py-3.5 border-b border-black/5 dark:border-white/10">
            <Search size={20} className="text-[color:var(--accent)] shrink-0 mr-3" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="聚焦搜索：输入小组件、便签内容、待办事项..."
              className="w-full bg-transparent border-none text-base outline-none placeholder-slate-400 font-normal"
            />
            <span className="text-xs  px-2 py-0.5 rounded bg-black/5 dark:bg-white/10">
              ESC 退出
            </span>
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto p-2 space-y-3 text-xs">
            {/* Widget Commands */}
            {widgetCommands.length > 0 && (
              <div>
                <div className="px-3 py-1 text-font-sm   dark:uppercase tracking-wider">
                  功能 & 小组件
                </div>
                {widgetCommands.map((w, i) => {
                  const Icon = w.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => {

                        onAddWidget(w.type);
                        onClose();
                      }}
                      className="w-full px-3 py-2 rounded-[var(--card-radius)] hover:bg-[color:var(--accent)] hover:text-white flex items-center space-x-3 transition-colors text-left"
                    >
                      <Icon size={16} />
                      <span className="">{w.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Notes Results */}
            {filteredNotes.length > 0 && (
              <div>
                <div className="px-3 py-1 text-font-sm   dark:uppercase tracking-wider">
                  便签卡片 ({filteredNotes.length})
                </div>
                {filteredNotes.map((n) => (
                  <div
                    key={n.id}
                    className="px-3 py-2 rounded-[var(--card-radius)] hover:bg-black/5 dark:hover:bg-white/10 flex items-start space-x-2 transition-colors cursor-pointer"
                    onClick={() => {

                      onAddWidget('sticky-notes');
                      onClose();
                    }}
                  >
                    <StickyNote size={15} className="text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <div className=" ">{n.title}</div>
                      {n.content && (
                        <div className=" line-clamp-1">{n.content}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* External Search fallback */}
            {query.trim() && (
              <a
                href={`https://www.baidu.com/s?wd=${encodeURIComponent(query)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full px-3 py-2 rounded-[var(--card-radius)] hover:bg-[color:var(--accent)] hover:text-white flex items-center justify-between transition-colors  "
              >
                <div className="flex items-center space-x-2">
                  <ExternalLink size={14} />
                  <span>在网页中搜索 "{query}"</span>
                </div>
                <span className="text-font-sm opacity-70">Enter ⏎</span>
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
