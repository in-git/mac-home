import { Heart } from 'lucide-react';
import React from 'react';
import { SiteItem } from '../../api/site';
import { SiteCard } from './WebListPicker/SiteCard';
import { SITE_GRID_CLASS } from './WebListPicker/types';

interface FavoriteListProps {
  /** 已收藏的站点（来自本地持久化字段 favoriteSites） */
  favorites: SiteItem[];
  /** 点击收藏按钮：取消收藏 */
  onToggleFavorite: (item: SiteItem) => void;
}

/**
 * 「我的」收藏列表：
 * 展示用户本地收藏的网页站点，支持打开站点与取消收藏。
 */
export const FavoriteList: React.FC<FavoriteListProps> = ({
  favorites,
  onToggleFavorite,
}) => {
  // 点击卡片打开站点
  const handleOpen = (item: SiteItem) => {
    if (item.link) window.open(item.link, '_blank', 'noreferrer');
  };

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24">
        <Heart size={36} strokeWidth={1} />
        <p className="text-base">还没有收藏的网页</p>
        <p className="text-xs text-slate-400">
          在「网页」中把鼠标移到卡片上，点击右上角爱心即可收藏
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-base font-medium dark:text-white">我的收藏</h3>
        <span className="text-xs text-slate-400">{favorites.length}</span>
      </div>
      <div className={SITE_GRID_CLASS}>
        {favorites.map((item, index) => (
          <SiteCard
            key={item.id || item.link || `fav-${index}`}
            item={item}
            onOpen={handleOpen}
            favorited
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </>
  );
};

export default FavoriteList;
