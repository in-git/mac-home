import { Heart } from 'lucide-react';
import React, { useCallback } from 'react';
import { SiteItem } from '@/api/site';
import { openSite } from '@/utils/siteHelper';
import { AppDownloadEntry, RecordInfo } from '../Sidebar/SidebarFooter';
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
 * 抽屉移除后，这部分内容只在**移动端**落到本页底部：
 * 备案信息在移动端没有侧栏可依托，必须在此保留（境内站点要求展示）；
 * 桌面端则由左侧栏展示，本页不再重复。
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
            {/*
              移动端：横向滚动单行（卡片定宽，一屏可见多张，滚动查看其余）。
              桌面端（sm 起）：恢复为响应式网格。
              用「容器查询」式的两套结构切换：外层负责滚动方向，内层是网格。
            */}
            <div className="sm:hidden -mx-3 px-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max gap-3">
                {favorites.map((item, index) => (
                  <div key={item.id || item.link || `fav-${index}`} className="w-40 shrink-0">
                    <SiteCard
                      item={item}
                      onOpen={handleOpen}
                      favorited
                      onToggleFavorite={onToggleFavorite}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className={`${FAVORITES_GRID_CLASS} hidden sm:grid`}>
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

      {/*
        专属 App 下载 + 备案信息：仅移动端在本页展示，固定在底部（滚动区外），
        不论收藏列表多长都始终可见。两者各自独立成卡片。

        桌面端（sm 起）由左侧栏常驻展示，本页不再重复。
      */}
      <div className="sm:hidden space-y-2 border-t border-black/[0.06] p-3">
        <AppDownloadEntry card />
        <RecordInfo card />
      </div>
    </div>
  );
};

export default Mine;
