import React, { useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { SiteItem } from '../../api/site';
import { useHomeStore } from '../../store/useHomeStore';
import { isSameSite } from '../../utils/siteHelper';
import { useToast } from '../../components/Toast/Toast';
import { Sidebar, MobileMenuDrawer } from './Sidebar';
import { Mine } from './Mine';
import { VideoList } from './Video';
import { WebListPicker } from './WebListPicker';

/** 各模块相对侧边栏的显隐状态：由模块内部滚动方向驱动 */
type VisibilityMap = Record<string, boolean>;

/**
 * 主页：仅负责「侧边栏 + 内容模块」的组合与共享状态（收藏 / 抽屉 / 分类切换），
 * 具体页面逻辑下沉到各模块：
 * - Sidebar/   侧边栏（导航 + 站点统计 + 移动端抽屉）
 * - Mine/      我的（本地收藏）
 * - Video/     视频（B 站式列表 + 播放器）
 * - WebListPicker/  网页（头条区 + 卡片网格）
 * - components/ hooks/  跨模块复用件（搜索框、滚动、搜索状态等）
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
   * 移动端顶部导航显隐：与各列表滚动方向联动。
   * 「网页」「视频」「我的」页各自回调，独立记录以免切换分类时互相干扰。
   */
  const [visibility, setVisibility] = useState<VisibilityMap>({});
  const makeVisibilityHandler = useCallback(
    (key: string) => (visible: boolean) =>
      setVisibility((prev) =>
        prev[key] === visible ? prev : { ...prev, [key]: visible },
      ),
    [],
  );
  const webVisibility = useCallback(
    makeVisibilityHandler('web'),
    [makeVisibilityHandler],
  );
  const videoVisibility = useCallback(
    makeVisibilityHandler('video'),
    [makeVisibilityHandler],
  );

  const handleToggleFavorite = (item: SiteItem) => {
    const already = favoriteSites.some((s) => isSameSite(s, item));
    toggleFavoriteSite(item);
    showToast(
      already ? `已取消收藏「${item.name}」` : `已收藏「${item.name}」`,
      already ? 'info' : 'success',
    );
  };

  const openMenu = () => setMenuOpen(true);

  return (
    <div className="flex h-[100dvh] w-full flex-col sm:flex-row overflow-hidden bg-white dark:bg-[#1C1C1E]">
      {/* 桌面端左侧栏 */}
      <Sidebar activeCategory={activeCategory} onSelect={setActiveCategory} />

      {/* 移动端菜单抽屉（全屏，从左向右滑入） */}
      <MobileMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      {/* 内容区：按分类渲染对应模块 */}
      <div className="relative flex-1 min-w-0 min-h-0 flex flex-col">
        {activeCategory === 'mine' ? (
          <Mine
            favorites={favoriteSites}
            onToggleFavorite={handleToggleFavorite}
            onOpenMenu={openMenu}
          />
        ) : activeCategory === 'video' ? (
          <VideoList
            onVisibilityChange={videoVisibility}
            onOpenMenu={openMenu}
          />
        ) : (
          <WebListPicker
            favorites={favoriteSites}
            onToggleFavorite={handleToggleFavorite}
            onVisibilityChange={webVisibility}
            onOpenMenu={openMenu}
          />
        )}
      </div>
    </div>
  );
};

export default AddWidgetView;
