import { useEffect } from 'react';
import { Compass, Plus } from 'lucide-react';
import { SiteItem } from '../../api/site';
import { ShortcutTile } from './ShortcutTile';

export interface ShortcutsWidgetCardProps {
  shortcuts: SiteItem[];
  expanded: boolean;
  onAddClick: () => void;
  onOpen: (item: SiteItem) => void;
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

  return (
    <div
      className={`relative bg-[var(--card-bg)] ${expanded ? 'h-full' : ''} flex flex-col overflow-hidden`}
    >
      {/* Grid of Shortcuts */}
      <div
        className={`${expanded ? 'flex-1 min-h-0' : 'max-h-52'} my-2 overflow-y-auto pr-1 @container`}
      >
        {shortcuts.length === 0 ? (
          <div className="h-full min-h-[120px] flex flex-col items-center justify-center gap-3 text-center  dark:text-slate-500">
            <Compass size={28} className="opacity-60" />
            <p className="dark:text-slate-400 text-xs leading-relaxed">
              快捷导航还是空的
              <br />
              点击下方「新增」从站点库添加常用网址
            </p>
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

      {/* 底部正中心：高亮放大的新增按钮 */}
      <div className="flex justify-center pb-2 pt-1">
        <button
          data-no-drag
          type="button"
          onClick={onAddClick}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-[color:var(--accent)] shadow-md hover:bg-[color:var(--accent-hover)] hover:scale-105 active:scale-95 transition-transform"
          title="添加网址"
        >
          <Plus size={24} className="text-white" />
        </button>
      </div>
    </div>
  );
};
