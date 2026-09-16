import { Heart } from 'lucide-react';
import React, { useCallback } from 'react';
import { SiteItem } from '@/api/site';
import { openSite } from '@/utils/siteHelper';
import { SidebarFooter } from '../Sidebar/SidebarFooter';
import { SiteCard } from '../WebListPicker/SiteCard';
import { FAVORITES_GRID_CLASS } from '../WebListPicker/constants';

interface MineProps {
  /** 已收藏的站点（来自本地持久化字段 favoriteSites） */
  favorites: SiteItem[];
  /** 点击收藏按钮：取消收藏 */
  onToggleFavorite: (item: SiteItem) => void;
}

/**
 * 「我的」模块：本地收藏的网页站点。
 *
 * 原先该页顶部有一行独立的三横杠（用于打开全屏菜单抽屉）——
 * 移动端导航改由底部 tabbar 承担后，那一行随之移除，
 * 因此本页不再需要监听滚动方向。
 *
 * 抽屉里原本还装着数据统计与备案信息（SidebarFooter）。
 * 抽屉移除后，这部分内容移到本页底部：备案信息在移动端必须仍可达
 * （境内站点要求展示），而「我的」是它的自然归宿。
 */
export const Mine: React.FC<MineProps> = ({
  favorites,
  onToggleFavorite,
}) => {
  // 点击卡片：上报点击量并打开站点
  const handleOpen = useCallback((item: SiteItem) => {
    openSite(item);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
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
            <div className={FAVORITES_GRID_CLASS}>
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

        {/* 数据统计 + 备案信息：原属移动端抽屉，抽屉移除后落在这里 */}
        <div className="mt-6">
          <SidebarFooter />
        </div>
      </div>
    </div>
  );
};

export default Mine;
