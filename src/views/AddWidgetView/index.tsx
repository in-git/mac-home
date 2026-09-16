import React, { useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { SiteItem } from '../../api/site';
import { CategoryId, useHomeStore } from '../../store/useHomeStore';
import { isSameSite } from '../../utils/siteHelper';
import { useToast } from '../../components/Toast/Toast';
import { Sidebar, MobileTabBar } from './Sidebar';
import { Mine } from './Mine';
import { VideoList } from './Video';
import { WebListPicker } from './WebListPicker';

/** 各模块相对侧边栏的显隐状态：由模块内部滚动方向驱动 */
type VisibilityMap = Record<string, boolean>;

/**
 * 主页：负责「导航 + 内容模块」的组合与共享状态（收藏 / 分类切换），
 * 具体页面逻辑下沉到各模块：
 * - Sidebar/   桌面端左侧栏（导航 + 站点统计 + 备案）
 *              移动端导航改由其中的 MobileTabBar（底部 tabbar）承担
 * - Mine/      我的（本地收藏 + 访客统计 / 备案）
 * - Video/     视频（B 站式列表 + 播放器）
 * - WebListPicker/  网页（头条区 + 卡片网格）
 * - components/ hooks/  跨模块复用件（搜索框、滚动、搜索状态等）
 */
export const AddWidgetView: React.FC = () => {
  // 「我的」收藏 + 当前分类：均为本地持久化字段
  // （activeCategory 持久化后，刷新会回到上次浏览的标签页）
  const { favoriteSites, toggleFavoriteSite, activeCategory, setActiveCategory } =
    useHomeStore(
      useShallow((s) => ({
        favoriteSites: s.favoriteSites,
        toggleFavoriteSite: s.toggleFavoriteSite,
        activeCategory: s.activeCategory,
        setActiveCategory: s.setActiveCategory,
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

  return (
    /**
     * 根容器：占满视口高度且 `overflow-hidden`，内部自行分配滚动。
     *
     * - 移动端（默认）纵向排列：[内容区][底部 tabbar]
     * - 桌面端（sm 起）横向排列：[左侧栏][内容区]
     *
     * `h-[100dvh]` + `overflow-hidden` 是「底部 tabbar 不随内容滚动」的前提：
     * 页面本身不滚动，滚动只发生在内容区内部的 `overflow-y-auto` 里，
     * tabbar 作为同级的 flex 子项自然固定。
     */
    <div className="flex h-[100dvh] w-full flex-col sm:flex-row overflow-hidden bg-white dark:bg-[#1C1C1E]">
      {/* 桌面端左侧栏 */}
      <Sidebar activeCategory={activeCategory} onSelect={setActiveCategory} />

      {/* 内容区：按分类渲染对应模块。
          min-h-0 让 flex 子项可以真正被压缩，否则内容会顶开容器而非内部滚动 */}
      <div className="relative flex-1 min-w-0 min-h-0 flex flex-col">
        {activeCategory === 'mine' ? (
          <Mine
            favorites={favoriteSites}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : activeCategory === 'video' ? (
          <VideoList onVisibilityChange={videoVisibility} />
        ) : (
          <WebListPicker
            favorites={favoriteSites}
            onToggleFavorite={handleToggleFavorite}
            onVisibilityChange={webVisibility}
          />
        )}
      </div>

      {/* 移动端底部 tabbar：作为最后一个 flex 子项，固定贴底、不随内容滚动。
          桌面端由左侧栏承担导航职责，故 sm 起隐藏 */}
      <MobileTabBar activeCategory={activeCategory} onSelect={setActiveCategory} />
    </div>
  );
};

export default AddWidgetView;
