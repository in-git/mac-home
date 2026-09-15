import { Menu } from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { SiteItem } from '../../api/site';
import { useHomeStore } from '../../store/useHomeStore';
import { isSameSite } from '../../utils/siteHelper';
import { useToast } from '../../components/Toast/Toast';
import { WebListPicker } from './WebListPicker';
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
   * 「网页」页由 WebListPicker 回调，「我的」页由本组件的滚动容器驱动，
   * 两者都走 useScrollDirection（含过渡锁，避免高度变化引发滚动抖动）。
   */
  const [webHeaderVisible, setWebHeaderVisible] = useState(true);
  const handleWebVisibilityChange = useCallback((visible: boolean) => {
    setWebHeaderVisible(visible);
  }, []);
  const mineScrollRef = useRef<HTMLDivElement>(null);
  const {
    visible: mineHeaderVisible,
    onScroll: handleMineScroll,
  } = useScrollDirection(mineScrollRef);
  const headerVisible =
    activeCategory === 'mine' ? mineHeaderVisible : webHeaderVisible;

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
      {/* 移动端顶部栏：三横杠 + 标题；向下滚动时收起、向上滚动时恢复。
          外层做高度过渡（h-12 ↔ h-0），内层同步淡出并轻微上移，避免被生硬裁切。 */}
      <div
        aria-hidden={!headerVisible}
        className={`shrink-0 overflow-hidden transition-[height] duration-300 ease-out will-change-[height] sm:hidden sm:h-0 ${
          headerVisible ? 'h-12' : 'h-0'
        }`}
      >
        <header
          className={`flex h-12 items-center gap-3 border-b border-black/5 px-3 transition-[opacity,transform] duration-300 ease-out dark:border-white/10 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`}
        >
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="打开菜单"
            tabIndex={headerVisible ? undefined : -1}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5 active:scale-95 dark:hover:bg-white/10"
          >
            <Menu size={20} />
          </button>
          <span className="text-font-md">游趣</span>
        </header>
      </div>

      {/* 桌面端左侧栏 */}
      <div className="hidden sm:flex flex-col bg-[#F2F2F7] dark:bg-[#2C2C2E] sm:w-52 shrink-0 border-b sm:border-b-0 sm:border-r border-black/5 dark:border-white/10">
        <SidebarNav
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
          showTitle
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
        {/* 我的收藏 / 网页：使用公共「网页列表」选择器，收藏态与本地持久化字段联动 */}
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
        ) : (
          <div className="flex-1 min-h-0 overflow-hidden">
            <WebListPicker
              favorites={favoriteSites}
              onToggleFavorite={handleToggleFavorite}
              onVisibilityChange={handleWebVisibilityChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AddWidgetView;
