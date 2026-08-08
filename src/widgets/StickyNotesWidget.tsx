import {
  Calendar,
  Check,
  CheckSquare,
  Copy,
  Pin,
  Plus,
  Square,
  Trash2,
} from 'lucide-react';
import React, { useState } from 'react';
import { Tooltip } from '../components/Tooltip';
import { NoteColor, StickyNote as StickyNoteType } from '../types';

interface Props {
  notes: StickyNoteType[];
  onUpdateNotes: (notes: StickyNoteType[]) => void;
}

export const StickyNotesWidget: React.FC<Props> = ({
  notes,
  onUpdateNotes,
}) => {
  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id || '');
  const [copied, setCopied] = useState(false);

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];

  const colorStyles: Record<
    NoteColor,
    { bg: string; text: string; accent: string }
  > = {
    yellow: {
      bg: 'bg-amber-100/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40',
      text: 'text-amber-950 dark:text-amber-100',
      accent: 'bg-amber-400',
    },
    mint: {
      bg: 'bg-emerald-100/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40',
      text: 'text-emerald-950 dark:text-emerald-100',
      accent: 'bg-emerald-400',
    },
    pink: {
      bg: 'bg-rose-100/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40',
      text: 'text-rose-950 dark:text-rose-100',
      accent: 'bg-rose-400',
    },
    lavender: {
      bg: 'bg-purple-100/90 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40',
      text: 'text-purple-950 dark:text-purple-100',
      accent: 'bg-purple-400',
    },
    blue: {
      bg: 'bg-sky-100/90 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/40',
      text: 'text-sky-950 dark:text-sky-100',
      accent: 'bg-sky-400',
    },
    glass: {
      bg: 'glass-panel border-white/40 dark:border-white/10',
      text: 'text-slate-900 dark:text-slate-100',
      accent: 'bg-[#007AFF]',
    },
  };

  const handleAddNote = () => {

    const newNote: StickyNoteType = {
      id: `note-${Date.now()}`,
      title: '新便签',
      content: '在此记录你的新想法与灵感...',
      color: 'yellow',
      updatedAt: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      pinned: false,
    };
    onUpdateNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
  };

  const handleDeleteNote = (id: string) => {

    const updated = notes.filter((n) => n.id !== id);
    onUpdateNotes(updated);
    if (activeNoteId === id && updated.length > 0) {
      setActiveNoteId(updated[0].id);
    }
  };

  const handleUpdateCurrent = (fields: Partial<StickyNoteType>) => {
    if (!activeNote) return;
    const updated = notes.map((n) =>
      n.id === activeNote.id
        ? {
            ...n,
            ...fields,
            updatedAt: new Date().toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          }
        : n,
    );
    onUpdateNotes(updated);
  };

  const handleToggleChecklistItem = (noteId: string, itemId: string) => {

    const note = notes.find((n) => n.id === noteId);
    if (!note || !note.checklistItems) return;

    const newItems = note.checklistItems.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item,
    );

    handleUpdateCurrent({ checklistItems: newItems });
  };

  const handleCopyNote = async () => {
    if (!activeNote) return;

    const text =
      activeNote.isChecklist && activeNote.checklistItems
        ? activeNote.checklistItems
            .map((i) => `${i.completed ? '[x]' : '[ ]'} ${i.text}`)
            .join('\n')
        : activeNote.content;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 剪贴板不可用时静默失败
    }
  };

  return (
    <div className="h-full flex flex-col justify-between text-xs p-1">
      {/* Top Header & Note Switcher Tabs */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pr-2">
          {notes.map((n) => (
            <button
              key={n.id}
              onClick={() => {
            
                setActiveNoteId(n.id);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium truncate max-w-[100px] transition-colors flex items-center space-x-1 ${
                activeNoteId === n.id
                  ? 'bg-[#007AFF] text-white shadow-xs'
                  : 'bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-black/10'
              }`}
            >
              {n.pinned && <Pin size={10} className="fill-current shrink-0" />}
              <span className="truncate">{n.title || '无标题'}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleAddNote}
          className="p-1.5 rounded-lg bg-[#007AFF] text-white hover:bg-blue-600 shadow-xs transition-transform active:scale-95 shrink-0"
          title="新建便签"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Active Note Content Area */}
      {activeNote ? (
        <div
          className={`relative flex-1 rounded-2xl p-3.5 border transition-colors flex flex-col justify-between shadow-xs ${
            colorStyles[activeNote.color].bg
          } ${colorStyles[activeNote.color].text}`}
        >
          {/* Note Title & Action Bar */}
          <div className="flex items-center justify-between mb-2">
            <input
              type="text"
              value={activeNote.title}
              onChange={(e) => handleUpdateCurrent({ title: e.target.value })}
              className="bg-transparent font-bold text-sm outline-none w-full border-b border-transparent focus:border-black/20 dark:focus:border-white/20 pb-0.5"
            />

            <div className="flex items-center space-x-1 shrink-0 ml-2">
              {/* Pin button */}
              <button
                onClick={() => {
              
                  handleUpdateCurrent({ pinned: !activeNote.pinned });
                }}
                className={`p-1 rounded-md transition-colors ${
                  activeNote.pinned
                    ? 'bg-black/10 dark:bg-white/20'
                    : 'hover:bg-black/5'
                }`}
                title="固定便签"
              >
                <Pin
                  size={12}
                  className={activeNote.pinned ? 'fill-current' : ''}
                />
              </button>

              {/* Color Selector */}
              <div className="flex items-center space-x-1 px-1">
                {(
                  [
                    'yellow',
                    'mint',
                    'pink',
                    'lavender',
                    'blue',
                    'glass',
                  ] as NoteColor[]
                ).map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                  
                      handleUpdateCurrent({ color: c });
                    }}
                    className={`w-3.5 h-3.5 rounded-full border border-black/10 transition-transform ${
                      colorStyles[c].accent
                    } ${activeNote.color === c ? 'scale-125 ring-2 ring-[#007AFF]' : 'hover:scale-110'}`}
                  />
                ))}
              </div>

              {/* Delete Note */}
              <button
                onClick={() => handleDeleteNote(activeNote.id)}
                className="p-1 rounded-md text-red-500 hover:bg-red-500/10 transition-colors"
                title="删除便签"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* Note Content / Checklist */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {activeNote.isChecklist && activeNote.checklistItems ? (
              <div className="space-y-1.5 pt-1">
                {activeNote.checklistItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() =>
                      handleToggleChecklistItem(activeNote.id, item.id)
                    }
                    className="flex items-center space-x-2 cursor-pointer group hover:opacity-80"
                  >
                    {item.completed ? (
                      <CheckSquare
                        size={14}
                        className="text-[#007AFF] shrink-0"
                      />
                    ) : (
                      <Square size={14} className="text-slate-400 shrink-0" />
                    )}
                    <span
                      className={`text-xs ${
                        item.completed
                          ? 'line-through opacity-50'
                          : 'font-medium'
                      }`}
                    >
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <textarea
                rows={4}
                value={activeNote.content}
                onChange={(e) =>
                  handleUpdateCurrent({ content: e.target.value })
                }
                className="w-full h-full bg-transparent outline-none resize-none text-xs leading-relaxed font-normal"
                placeholder="键入随手记便签..."
              />
            )}
          </div>

          {/* Footer timestamp */}
          <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-font-sm opacity-60">
            <span className="flex items-center space-x-1">
              <Calendar size={10} />
              <span>更新时间: {activeNote.updatedAt}</span>
            </span>
            <Tooltip content={copied ? '已复制' : '一键复制'} placement="top">
              <button
                onClick={handleCopyNote}
                className={`flex items-center space-x-1 transition-colors ${
                  copied
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'hover:opacity-100'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={10} />
                    <span>已复制</span>
                  </>
                ) : (
                  <>
                    <Copy size={10} />
                    <span>复制</span>
                  </>
                )}
              </button>
            </Tooltip>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-400">
          暂无便签，点击右上角新建
        </div>
      )}
    </div>
  );
};
