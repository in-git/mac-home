import { Menu } from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { SiteItem } from '../../api/site';
import { useHomeStore } from '../../store/useHomeStore';
import { isSameSite } from '../../utils/siteHelper';
import { useToast } from '../../components/Toast/Toast';
import { WebListPicker } from './WebListPicker';
import { VideoList } from './VideoList';
import { FavoriteList } from './FavoriteList';
import { SidebarNav } from './SidebarNav';
import { SidebarFooter } from './SidebarFooter';
import { MobileMenuDrawer } from './MobileMenuDrawer';
import { useScrollDirection } from './useScrollDirection';

/**
 * 桌面主页：一进页面即展示「添加网页」（我的收藏 / 应用市场）。
 * 桌面端：左侧分类侧边栏 + 右侧站点列表；
 * 移动端：顶部三横杠打开全屏菜单抽屉，内容区占满视口。
 */
export const AddWidgetView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('web');
  // 移动端菜单抽屉开关
  const [menuOpen, setMenuOpen] = useState(false);

  // 「我的」收藏：本地持久化字段 favoriteSites
  const { favoriteSites, toggleFavoriteSite } = useHomeStore(
    useShallow((s) => ({
      favoriteSites: s.favoriteSites,
      toggleFavoriteSite: s.toggleFavoriteSite,
    })),
  );
  const { showToast } = useToast();

  /**
   * 移动端顶部导航显隐：与列表滚动方向联动。
   * 「网页」「视频」页由各自列表回调，「我的」页由本组件的滚动容器驱动，
   * 三者都走 useScrollDirection（含过渡锁，避免高度变化引发滚动抖动）。
   */
  const [webHeaderVisible, setWebHeaderVisible] = useState(true);
  const handleWebVisibilityChange = useCallback((visible: boolean) => {
    setWebHeaderVisible(visible);
  }, []);
  const [videoHeaderVisible, setVideoHeaderVisible] = useState(true);
  const handleVideoVisibilityChange = useCallback((visible: boolean) => {
    setVideoHeaderVisible(visible);
  }, []);
  const mineScrollRef = useRef<HTMLDivElement>(null);
  const {
    visible: mineHeaderVisible,
    onScroll: handleMineScroll,
  } = useScrollDirection(mineScrollRef);
  // 各分类独立的顶部导航显隐状态，避免切换分类时互相干扰
  const headerVisibleMap: Record<string, boolean> = {
    mine: mineHeaderVisible,
    web: webHeaderVisible,
    video: videoHeaderVisible,
  };
  const headerVisible = headerVisibleMap[activeCategory] ?? true;

  /**
   * 需要单独渲染三横杠行的分类：这些页面顶部没有搜索行。
   * 「网页」「视频」页的三横杠并入了各自搜索行，无需单独一行。
   */
  const needsStandaloneMenuButton = activeCategory === 'mine';

  const handleToggleFavorite = (item: SiteItem) => {
    const already = favoriteSites.some((s) => isSameSite(s, item));
    toggleFavoriteSite(item);
    showToast(
      already ? `已取消收藏「${item.name}」` : `已收藏「${item.name}」`,
      already ? 'info' : 'success',
    );
  };

  return (
    <div className="flex h-[100dvh] w-full flex-col sm:flex-row overflow-hidden bg-white dark:bg-[#1C1C1E]">
      {/* 桌面端左侧栏 */}
      <div className="hidden sm:flex flex-col bg-[#F2F2F7] dark:bg-[#2C2C2E] sm:w-52 shrink-0 border-b sm:border-b-0 sm:border-r border-black/5 dark:border-white/10">
        <SidebarNav
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
          
        />
        {/* 底部：访客统计 + 备案信息 */}
        <div className="mt-auto">
          <SidebarFooter />
        </div>
      </div>

      {/* 移动端菜单抽屉（全屏，从左向右滑入） */}
      <MobileMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      {/* 右侧内容区 */}
      <div className="relative flex-1 min-w-0 min-h-0 flex flex-col">
        {/* 移动端「我的」页：顶部无搜索行，三横杠单独占一行；随列表滚动方向显隐。
            「网页」「视频」页的三横杠并入了各自搜索行（见 FilterBar / VideoList）。 */}
        {needsStandaloneMenuButton && (
          <div
            aria-hidden={!headerVisible}
            className={`shrink-0 overflow-hidden transition-[height] duration-300 ease-out will-change-[height] sm:hidden ${
              headerVisible ? 'h-11' : 'h-0'
            }`}
          >
            <div
              className={`flex h-11 items-center px-3 transition-[opacity,transform] duration-300 ease-out ${
                headerVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 -translate-y-2'
              }`}
            >
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="打开菜单"
                tabIndex={headerVisible ? undefined : -1}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-slate-600 transition-colors hover:bg-black/10 active:scale-95 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        )}

        {/* 我的收藏 / 网页列表 / 视频列表 */}
        {activeCategory === 'mine' ? (
          <div
            ref={mineScrollRef}
            onScroll={handleMineScroll}
            className="flex-1 min-h-0 overflow-y-auto p-5"
          >
            <FavoriteList
              favorites={favoriteSites}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        ) : activeCategory === 'video' ? (
          <div className="flex-1 min-h-0 overflow-hidden">
            <VideoList
              onVisibilityChange={handleVideoVisibilityChange}
              onOpenMenu={() => setMenuOpen(true)}
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-hidden">
            <WebListPicker
              favorites={favoriteSites}
              onToggleFavorite={handleToggleFavorite}
              onVisibilityChange={handleWebVisibilityChange}
              // 移动端三横杠已并入搜索行，由这里提供打开抽屉的回调
              onOpenMenu={() => setMenuOpen(true)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AddWidgetView;
