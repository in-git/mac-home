import {  X } from 'lucide-react';
import React from 'react';
import { SiteItem } from '../../api/site';
import { IconWidget } from '../IconWidget';

interface ShortcutTileProps {
  item: SiteItem;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

/**
 * 单个快捷方式磁贴：复用 IconWidget 渲染图标与标题，叠加删除按钮。
 */
export const ShortcutTile: React.FC<ShortcutTileProps> = ({ item, onDelete }) => {
  const itemId = item.id || item.link;
  return (
    <div className="group/shortcut relative h-full w-full">
      <IconWidget  site={item} />
      <button
        onClick={(e) => onDelete(itemId, e)}
        className="absolute top-0 right-0   p-1 rounded-xl opacity-0 transition-opacity group-hover/shortcut:opacity-100 "
      >
        <X size={16} />
      </button>
    </div>
  );
};
