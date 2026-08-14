import {  X } from 'lucide-react';
import React from 'react';
import { SiteItem } from '../../api/site';
import { IconWidget } from '../IconWidget';

interface ShortcutTileProps {
  item: SiteItem;
  onDelete: (id: string, e: React.MouseEvent) => void;
  /** 图标尺寸（像素），默认 64 */
  iconSize?: number;
}

/**
 * 单个快捷方式磁贴：复用 IconWidget 渲染图标与标题，叠加删除按钮。
 */
export const ShortcutTile: React.FC<ShortcutTileProps> = ({ item, onDelete, iconSize = 64 }) => {
  const itemId = item.id || item.link;
  return (
    <div className="group/shortcut relative h-full w-full flex flex-col items-center">
      <IconWidget site={item} iconSize={iconSize} />
      <button
        onClick={(e) => onDelete(itemId, e)}
        className="absolute top-0 right-0 flex items-center justify-center bg-red-500 p-1 rounded-xl text-white opacity-0 transition-opacity group-hover/shortcut:opacity-100 hover:bg-red-600"
      >
        <X size={16} />
      </button>
    </div>
  );
};
