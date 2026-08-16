import { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { SiteItem } from '../../api/site';
import { ShortcutTile } from './ShortcutTile';

/** 磁贴图标尺寸（像素），磁贴与“添加”按钮共用，保证高度一致、动态跟随 */
const ICON_SIZE = 64;

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
            className={`relative bg-[var(--card-bg)] `}
        >
            {/* Grid of Shortcuts */}
            <div
                className={`${expanded ? 'flex-1 min-h-0' : ''} my-2 overflow-y-auto pr-1 @container overflow-x-hidden`}
            >
                {shortcuts.length === 0 ? (
                    /* 空态：提示用户添加网页 */
                    <div className="flex h-full min-h-24 flex-col items-center justify-center gap-3 py-6 text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            还没有添加网页，点击下方按钮添加
                        </p>
                        <button
                            data-no-drag
                            type="button"
                            onClick={onAddClick}
                            className="flex items-center gap-1.5 rounded-full bg-[color:var(--accent)] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90 active:scale-95"
                        >
                            <Plus size={16} />
                            添加网页
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
                                className="relative flex flex-col items-center rounded-[var(--card-radius)] transition-colors text-center"
                            >
                                <ShortcutTile
                                    item={item}
                                    iconSize={ICON_SIZE}
                                    onDelete={onDelete ? (id, e) => onDelete(id, e) : () => { }}
                                />
                            </a>
                        ))}
                        {/* 新增：矩形 Plus 占位，尺寸与其他磁贴一致（动态跟随 iconSize） */}
                        <div className="relative flex flex-col items-center rounded-[var(--card-radius)] transition-colors text-center">
                            <button
                                data-no-drag
                                type="button"
                                onClick={onAddClick}
                                title="添加网址"
                                style={{ height: ICON_SIZE, width: ICON_SIZE }}
                                className="group relative flex flex-col items-center justify-center rounded-[var(--card-radius)] border border-dashed border-slate-300 dark:border-slate-600 bg-white hover:bg-slate-50 dark:bg-white/10 dark:hover:bg-white/15 text-[color:var(--accent)]"
                            >
                                <Plus size={28} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
