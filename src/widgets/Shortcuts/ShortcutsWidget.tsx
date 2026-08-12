import { useState, useEffect } from 'react';
import { Compass, Plus, Pencil } from 'lucide-react';
import { SiteItem } from '../../api/site';
import { ShortcutTile } from './ShortcutTile';

export interface ShortcutsWidgetCardProps {
  shortcuts: SiteItem[];
  expanded: boolean;
  onAddClick: () => void;
  onOpen: (item: SiteItem) => void;
  /** 卡片标题（widget.title）；提供时支持内联编辑 */
  title?: string;
  /** 标题编辑保存回调 */
  onUpdateTitle?: (title: string) => void;
  /** 展开态切换（由外层容器驱动） */
  onExpand?: () => void;
  /** 删除磁贴回调 */
  onDelete?: (id: string, e: React.MouseEvent) => void;
}

/**
 * 快捷导航卡片：渲染站点磁贴网格，支持标题内联编辑与展开态。
 * 列表为空时提示用户从站点库添加。
 */
export const ShortcutsWidgetCard: React.FC<ShortcutsWidgetCardProps> = ({
  shortcuts = [],
  expanded,
  onAddClick,
  onOpen,
  title,
  onUpdateTitle,
  onDelete,
}) => {
  // 展开态下锁定页面滚动
  useEffect(() => {
    if (expanded) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [expanded]);

  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title ?? '快捷导航');

  useEffect(() => {
    setDraftTitle(title ?? '快捷导航');
  }, [title]);

  const commitTitle = () => {
    const next = draftTitle.trim() || '快捷导航';
    setDraftTitle(next);
    setEditingTitle(false);
    onUpdateTitle?.(next);
  };

  return (
    <div
      className={`relative bg-[var(--card-bg)] ${expanded ? 'h-full' : ''} flex flex-col overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3">
        {editingTitle ? (
          <input
            autoFocus
            data-no-drag
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle();
              if (e.key === 'Escape') {
                setDraftTitle(title ?? '快捷导航');
                setEditingTitle(false);
              }
            }}
            className="text-sm font-semibold bg-transparent border-b border-[color:var(--accent)] outline-none text-slate-800 dark:text-slate-100"
          />
        ) : (
          <button
            data-no-drag
            type="button"
            onClick={() => onUpdateTitle && setEditingTitle(true)}
            className="flex items-center gap-1 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:text-[color:var(--accent)] transition-colors"
            title={onUpdateTitle ? '点击编辑标题' : undefined}
          >
            <span>{title ?? '快捷导航'}</span>
            {onUpdateTitle && <Pencil size={11} className="opacity-50" />}
          </button>
        )}
        <button
          data-no-drag
          type="button"
          onClick={onAddClick}
          className="relative z-10 p-1 rounded-full text-slate-400 hover:text-[color:var(--accent)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          title="添加网址"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Grid of Shortcuts */}
      <div
        className={`${expanded ? 'flex-1 min-h-0' : 'max-h-52'} my-2 overflow-y-auto pr-1 @container`}
      >
        {shortcuts.length === 0 ? (
          <div className="h-full min-h-[120px] flex flex-col items-center justify-center gap-3 text-center text-slate-400 dark:text-slate-500">
            <Compass size={28} className="opacity-60" />
            <p className="dark:text-slate-400 text-xs leading-relaxed">
              快捷导航还是空的
              <br />
              点击下方「+」从站点库添加常用网址
            </p>
            <button
              data-no-drag
              type="button"
              onClick={onAddClick}
              className="px-3 py-1.5 rounded-[var(--card-radius)] text-xs font-medium bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent-hover)] transition-transform active:scale-95"
            >
              添加网址
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 @sm:grid-cols-4 @md:grid-cols-6 @lg:grid-cols-6 @xl:grid-cols-10 @2xl:grid-cols-12 gap-3">
            {shortcuts.map((item) => (
              <a
                key={item.id || item.link}
                href={item.link}
                target="_blank"
                rel="noreferrer"
                onClick={() => onOpen(item)}
                className="group relative flex flex-col rounded-[var(--card-radius)] transition-colors shadow-xs text-center aspect-square"
              >
                <ShortcutTile
                  item={item}
                  onDelete={onDelete ? (id, e) => onDelete(id, e) : () => {}}
                />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
