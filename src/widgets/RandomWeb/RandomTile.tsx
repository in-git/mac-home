import {  X } from 'lucide-react';
import React from 'react';
import { SiteItem } from '../../api/site';
import { WebApp } from '../../widgets/WebApp/WebApp';

interface RandomTileProps {
  item: SiteItem;
  onDelete: (id: string, e: React.MouseEvent) => void;
  /** 图标尺寸（像素），默认 64 */
  iconSize?: number;
}

/**
 * 单个随机网页磁贴：复用 WebApp 渲染图标与标题，叠加删除按钮。
 */
export const RandomTile: React.FC<RandomTileProps> = ({ item, onDelete, iconSize = 64 }) => {
  const itemId = item.id || item.link;
  return (
    <div className="group/randomweb relative h-full w-full flex flex-col items-center">
      <WebApp site={item} iconSize={iconSize} />
      <button
        onClick={(e) => onDelete(itemId, e)}
        title="删除快捷方式"
        className="absolute -top-1.5 -right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white/90  shadow-sm backdrop-blur-sm opacity-0 scale-75 transition-all duration-150 group-hover/randomweb:opacity-100 group-hover/randomweb:scale-100 hover:bg-red-500 hover:text-white"
      >
        <X size={13} strokeWidth={2.5} />
      </button>
    </div>
  );
};
