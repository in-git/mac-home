import { Heart } from 'lucide-react';
import React, { useCallback } from 'react';
import { SiteItem } from '@/api/site';
import { openSite } from '@/utils/siteHelper';
import { MobileMenuButton } from '../components/MobileMenuButton';
import { useListScroll } from '../hooks/useListScroll';
import { SiteCard } from '../WebListPicker/SiteCard';
import { SITE_GRID_CLASS } from '../WebListPicker/constants';

interface MineProps {
  /** 已收藏的站点（来自本地持久化字段 favoriteSites） */
  favorites: SiteItem[];
  /** 点击收藏按钮：取消收藏 */
  onToggleFavorite: (item: SiteItem) => void;
  /** 移动端：打开全屏菜单抽屉 */
  onOpenMenu: () => void;
}

/**
 * 「我的」模块：本地收藏的网页站点。
 *
 * 该页顶部没有搜索行，因此移动端三横杠单独占一行，
 * 并随列表滚动方向显隐（与「网页」「视频」页行为一致）。
 */
export const Mine: React.FC<MineProps> = ({
  favorites,
  onToggleFavorite,
  onOpenMenu,
}) => {
  // 点击卡片：上报点击量并打开站点
  const handleOpen = useCallback((item: SiteItem) => {
    openSite(item);
  }, []);

  const [headerVisible, setHeaderVisible] = React.useState(true);
  const handleVisibilityChange = useCallback((visible: boolean) => {
    setHeaderVisible(visible);
  }, []);

  const { scrollRef, onScroll } = useListScroll({
    onVisibilityChange: handleVisibilityChange,
  });

  return (
    <div className="flex h-full flex-col">
      {/* 移动端独立三横杠行：随滚动方向收起 / 展开 */}
      <div
        aria-hidden={!headerVisible}
        className={`shrink-0 overflow-hidden transition-[height] duration-300 ease-out will-change-[height] sm:hidden ${
          headerVisible ? 'h-11' : 'h-0'
        }`}
      >
        <div
          className={`flex h-11 items-center px-3 transition-[opacity,transform] duration-300 ease-out ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`}
        >
          <MobileMenuButton onClick={onOpenMenu} disabled={!headerVisible} />
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5"
      >
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24">
            <Heart size={36} strokeWidth={1} />
            <p className="text-base">还没有收藏的网页</p>
            <p className=" text-slate-400">
              在「网页」中把鼠标移到卡片上，点击右上角爱心即可收藏
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 xl:text-2xl text-lg  font-bold">我的收藏</div>
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
        )}
      </div>
    </div>
  );
};

export default Mine;
