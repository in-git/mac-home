import { Trash2 } from 'lucide-react';
import React from 'react';
import { SiteItem } from '../../api/site';

interface ShortcutTileProps {
  item: SiteItem;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

/**
 * 单个快捷方式磁贴：根据 SiteItem 数据渲染封面图或首字母占位，含删除按钮与标题。
 */
export const ShortcutTile: React.FC<ShortcutTileProps> = ({ item, onDelete }) => {
  const imgSrc = item.cover || item.logo;
  const itemId = item.id || item.link;
  return (
    <>
      <div className="relative group/icon w-full flex-1">
        {imgSrc ? (
          <div className="relative w-full aspect-square rounded-[var(--card-radius)] overflow-hidden shadow-sm bg-slate-800">
            <img
              src={imgSrc}
              alt={item.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          </div>
        ) : (
          <div
            className="relative w-full aspect-square rounded-[var(--card-radius)] flex items-center justify-center shadow-sm text-white transition-transform"
            style={{
              background:
                item.background ||
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            <span className="text-2xl font-bold">
              {(item.name || '?').charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <button
          onClick={(e) => onDelete(itemId, e)}
          className="absolute top-1 right-1 p-1 rounded-full  hover:text-red-500 hover:bg-black/10 dark:hover:bg-white/10 opacity-0 group-hover/icon:opacity-100 transition-opacity"
        >
          <Trash2 size={11} />
        </button>
      </div>
      <span className="font-semibold text-font-sm truncate w-full mt-1 text-slate-800 dark:text-slate-100">
        {item.name}
      </span>
    </>
  );
};
