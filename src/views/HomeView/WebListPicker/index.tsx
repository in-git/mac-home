import { Globe } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { SiteItem } from '@/api/site';
import highRatedContentTitle from '@/assets/高赞内容.webp';
import {
  runRequestAction,
  useSiteHomeAggregate,
  useSiteList,
} from '@/agent/request';
import { openSite } from '@/utils/siteHelper';
import { useListScroll } from '../hooks/useListScroll';
import { useSearch } from '../hooks/useSearch';
import { SiteCard } from './SiteCard';
import { SiteHeroCarousel } from './SiteHeroCarousel';
import { SiteTileCard } from './SiteTileCard';
import { FilterBar, ALL_CATEGORY_ID } from './FilterBar';
import { WebListPickerProps } from './types';
import {
  FEATURED_CLASS,
  FEATURED_HERO_CLASS,
  FEATURED_TILES_CLASS,
  SITE_GRID_BREAKPOINTS,
  SITE_GRID_CLASS,
} from './constants';
import { SiteGridSkeleton } from './SiteGridSkeleton';
import { LatestContentCarousel } from './LatestContentCarousel';
import { useLoadMoreRows, ViewMoreTile } from './LoadMoreGrid';
import { CategoryGroup, groupCategories } from './category';

/** Banner 右侧宫格卡片数 */
const FEATURED_TILE_COUNT = 4;

/** 每页卡片数 */
const PAGE_SIZE = 20;

/** 最新内容每次通用分页查询的条数；前端按各断点列数整排分批展示 */
const LATEST_PAGE_SIZE = 10;

/**
 * 网页列表（WebListPicker）：
 * 顶部为搜索 + 两行分类筛选，其下为推荐轮播 + 右侧四卡片、最新内容，
 * 再往下是高赞内容卡片网格。
 *
 * **首屏数据来源**：
 * - 推荐轮播与右侧卡片共享 `recommends`：前 4 条进入卡片，其余进入轮播；
 * - 最新内容：独立的 `site_get_page` 分页请求，按 createTime 倒序；
 * - 高赞内容：独立的 `site_get_page` 分页请求（带分类 / 搜索条件）。
 *
 * 两个网格的翻页均通过末尾的「查看更多」卡片触发，共用
 * `useLoadMoreRows` 按各断点列数整排分批放量；常规列表不再切出首条作超大卡。
 */
export const WebListPicker: React.FC<WebListPickerProps> = ({
  onOpen,
  favorites,
  onToggleFavorite,
  onVisibilityChange,
}) => {
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  // 当前选中的一级分类，空表示「全部」
  const [selectedParent, setSelectedParent] = useState<string>('');
  // 当前选中的分类（二级优先，未选二级时即一级），空表示「全部」
  const [selectedCat, setSelectedCat] = useState<string>('');

  // 搜索（输入值 / 防抖值 / 立即搜索）
  const { keyword, setKeyword, debouncedKw, nonce, submit } = useSearch();

  // 常规列表：沿用默认（不传 recommend 字段），后端返回全部站点（含推荐），
  // 搜索结果也会包含推荐站点；与头条区推荐卡重复是可接受的。
  // 默认按点击量（count）降序排序。

  const {
    items,
    loading,
    appendLoading,
    hasMore,
    fetchSites,
    loadMore,
  } = useSiteList({
    autoFetch: false,
    defaultSortField: 'count',
    defaultSortOrder: 'descend',
  });

  // 最新内容：通用分页查询，按创建时间倒序；点击「查看更多」追加下一页
  const {
    items: latestItems,
    appendLoading: latestAppendLoading,
    hasMore: latestHasMore,
    fetchSites: fetchLatestSites,
    loadMore: loadMoreLatest,
  } = useSiteList({
    autoFetch: false,
    defaultSortField: 'createTime',
    defaultSortOrder: 'descend',
  });

  /**
   * 头条区数据：一次聚合请求拿回推荐站点（recommends）。
   *
   * 排序与筛选口径全部由后端定义（见接口文档），前端不再自行拼排序参数：
   * - recommends 按 orderNum 升序、createTime 倒序
   */
  const {
    recommends: recommendItems,
    loading: aggregateLoading,
    fetchAggregate,
  } = useSiteHomeAggregate({
    autoFetch: false,
  });

  // 分类元数据是否已就绪（用于推迟首次列表拉取，避免先用「全部」查一次再按默认分类重查）
  const [categoriesReady, setCategoriesReady] = useState(false);

  // 加载分类元数据：刷新时也会调用，重新拉取并把 categoryLoading 置为 true 以显示骨架屏
  const loadCategories = useCallback(async () => {
    setCategoryLoading(true);
    try {
      const categoryRes = await runRequestAction('site_get_category_tree');
      if (categoryRes.ok && Array.isArray(categoryRes.data)) {
        setGroups(groupCategories(categoryRes.data));
      }
    } catch {
      /* noop */
    } finally {
      setCategoryLoading(false);
      setCategoriesReady(true);
    }
  }, []);

  // 首次挂载只加载分类元数据
  useEffect(() => {
    loadCategories();
  }, []);

  // 分类 / 搜索变化时，回到第一页重新拉取（等分类就绪后再拉，保证默认分类生效）
  useEffect(() => {
    if (!categoriesReady) return;
    fetchSites(1, selectedCat, debouncedKw, PAGE_SIZE);
    // 头条区聚合数据与分类 / 搜索无关，只在分类就绪时拉一次；
    // 之后不再随筛选条件重复请求（切回「推荐」时直接复用已有数据）。
    // nonce 仅用于触发立即搜索（点击搜索按钮时关键词可能未变）
  }, [categoriesReady, selectedCat, debouncedKw, nonce, fetchSites]);

  // 推荐聚合与最新内容：首次进入时各自拉取一次，与分类 / 搜索条件无关
  useEffect(() => {
    if (!categoriesReady) return;
    fetchAggregate();
    fetchLatestSites(1, '', '', LATEST_PAGE_SIZE, 'createTime', 'descend');
  }, [categoriesReady, fetchAggregate, fetchLatestSites]);

  // 滚动：仅负责按方向折叠 / 展开分类行（并通知父级）。
  // 分页统一走网格末尾的「查看更多」卡片，与最新内容保持一致，避免触底与分批放量互相冲突
  const { scrollRef, onScroll, scrollVisible: showCategories } = useListScroll({
    canReachBottom: false,
    onVisibilityChange,
  });

  // 点击卡片：上报点击量后打开站点（优先走调用方回调，缺省时新窗口打开）
  const handleOpen = (item: SiteItem) => {
    openSite(item, onOpen);
  };

  /**
   * 一级 id → 其二级分类列表（完整分类树映射）。
   *
   * FilterBar 据此把二级分类**紧跟其一级之后**平铺到同一行，
   * 并判断某个一级是否有子级（决定是否显示实心箭头）——
   * 两件事取自同一份数据，因此不会出现「有箭头但没有二级可点」这类不一致。
   */
  const childrenByParent = new Map(
    groups.map((g) => [g.parent.id, g.children]),
  );

  // 点击一级分类：按父级筛选（后端 categoryId 级联包含其所有子分类），并清空二级选中
  const handleSelectParent = (id: string) => {
    setSelectedParent(id);
    setSelectedCat(id);
  };

  // 点击二级分类：以二级 id 作为最终筛选条件
  const handleSelectSub = (id: string) => {
    setSelectedCat(id);
  };

  // 常规列表整批进下方网格，不再切出首条作超大卡（超大卡由推荐轮播承担）
  const gridItems = items;

  // 高赞内容（常规网格）：与最新内容共用同一套「查看更多」分批放量规则，
  // 按各断点列数整排展示，按钮始终落在最后一排最后一格。
  const {
    visibleItems: visibleGridItems,
    classNameFor: gridItemClassName,
    handleLoadMore: handleGridLoadMore,
    showMore: showGridMore,
  } = useLoadMoreRows(gridItems, {
    breakpoints: SITE_GRID_BREAKPOINTS,
    hasMore,
    loadingMore: appendLoading,
    onLoadMore: () => loadMore(selectedCat, debouncedKw, PAGE_SIZE),
    resetKey: `${selectedCat}|${debouncedKw}|${nonce}`,
  });

  /**
   * 是否展示头条区（推荐轮播与最新内容）。
   *
   * 仅当**未选中任何分类**（顶部第一行的「推荐」）且**无搜索词**时展示：
   * - 一旦切到某个一级 / 二级分类，或输入关键词，用户就是在「找特定内容」，
   *   此时推荐区属无关内容，收起后把版面全部让给筛选结果；
   * - 也正因如此，推荐数据不会随分类 / 搜索重新拉取（见上方 effect 注释）。
   */
  const showFeatured = selectedCat === ALL_CATEGORY_ID && !debouncedKw;
  // 非推荐分类：选中了某个具体分类（而非「推荐」）
  const isNonRecommendQuery = selectedCat !== ALL_CATEGORY_ID;

  /** 推荐数据前 4 条进入右侧宫格，其余进入 Banner 轮播 */
  const tileItems = showFeatured
    ? recommendItems.slice(0, FEATURED_TILE_COUNT)
    : [];
  const heroItems = showFeatured
    ? recommendItems.slice(FEATURED_TILE_COUNT)
    : [];
  const latestContentItems = showFeatured ? latestItems : [];

  // 收藏态判定：id / link / name 任一命中即视为已收藏
  const isFavorited = (item: SiteItem) =>
    favorites?.some(
      (s) =>
        (item.id && s.id === item.id) ||
        (item.link && s.link === item.link) ||
        (item.name && s.name === item.name),
    );

  return (
    <div className="flex flex-col h-full">
      <FilterBar
        categories={groups.map((g) => g.parent)}
        childrenByParent={childrenByParent}
        selectedParent={selectedParent}
        categoryLoading={categoryLoading}
        selectedCat={selectedCat}
        searchKeyword={keyword}
        loading={loading}
        showCategories={showCategories}
        onSearchChange={setKeyword}
        onSearchSubmit={submit}
        onSelectParent={handleSelectParent}
        onSelectCategory={handleSelectSub}
      />

      {/* Site Grid */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto p-3 sm:p-5 relative"
      >
        {/* Loading 遮罩 */}
        {loading && items.length > 0 && (
          <div className="absolute inset-0 bg-[var(--glass-bg)] backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-[color:var(--accent)] border-t-transparent rounded-full animate-spin" />
              <span className=" text-slate-400">加载中…</span>
            </div>
          </div>
        )}

        {/*
          头条区与常规网格**各自独立**决定「出骨架 / 出内容」。

          原因是两者的数据来自两个独立请求，谁先返回不由前端决定：
          - 若用「都就绪才整体切真实内容」的单一开关，常规列表快时会被迫一起等聚合，
            白白空等；
          - 若只用常规列表的 loading 判断，聚合慢时就撤了骨架，头条区却还是空的 ——
            表现为「其他骨架都消失了，只有排行榜单独杵着」（空壳渲染「暂无数据」）。

          因此这里拆成两个条件，谁就绪谁先出真实内容。

          头条区骨架的显隐还要叠加 `showFeatured`：切到分类 / 有搜索词时头条区
          本就不展示，骨架也不该多出那一整块。
        */}
        {/* 头条区：聚合未就绪时出骨架，就绪后出真实内容 */}
        {showFeatured &&
          (aggregateLoading ? (
            <SiteGridSkeleton showFeatured showCards={false} />
          ) : (
            <div className={`relative mb-4 xl:mb-5 2xl:mb-8 ${FEATURED_CLASS}`}>
              {heroItems.length > 0 && (
                <span
                  className="pointer-events-none absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-xs font-semibold text-white shadow ring-1 ring-white/25"
                  aria-label="超推荐"
                >
                  超推荐
                </span>
              )}
              {heroItems.length > 0 ? (
                <SiteHeroCarousel
                  items={heroItems}
                  onOpen={handleOpen}
                  favoritedOf={isFavorited}
                  onToggleFavorite={onToggleFavorite}
                  className={FEATURED_HERO_CLASS}
                />
              ) : (
                <div
                  className={`flex aspect-[2/1] w-full items-center justify-center rounded-md border border-dashed border-black/10 bg-slate-50 text-sm text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500 ${FEATURED_HERO_CLASS}`}
                >
                  暂无数据
                </div>
              )}
              <div className={FEATURED_TILES_CLASS}>
                {tileItems.map((item, idx) => (
                  <SiteTileCard
                    key={item.id || item.link || `${item.name}-${idx}`}
                    item={item}
                    onOpen={handleOpen}
                    favorited={isFavorited(item)}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </div>
            </div>
          ))}

        {/* 最新内容：按创建时间倒序展示 */}
        {latestContentItems.length > 0 && (
          <LatestContentCarousel
            items={latestContentItems}
            hasMore={latestHasMore}
            loadingMore={latestAppendLoading}
            onLoadMore={() =>
              loadMoreLatest('', '', LATEST_PAGE_SIZE, 'createTime', 'descend')
            }
            onOpen={handleOpen}
            favoritedOf={isFavorited}
            onToggleFavorite={onToggleFavorite}
          />
        )}

        {/* 常规网格：首次加载中出骨架（已有数据时为分页 / 切分类，走上方 loading 遮罩）；
            就绪且有数据后出真实卡片 */}
        {items.length === 0 && loading ? (
          <SiteGridSkeleton showFeatured={false} />
        ) : items.length > 0 ? (
          <>
            {showFeatured && (
              <div className="mb-3 flex justify-center sm:mt-12 sm:mb-8">
                <img
                  src={highRatedContentTitle}
                  alt="高赞内容"
                  className="h-18 w-auto object-contain sm:h-32"
                />
              </div>
            )}
            {/*
              非推荐分类（选中了某具体分类）下，移动端把前 4 张做成 2x2 大卡展示
              （仅 < sm 显示），让分类头部更聚焦；其余卡片照常展示。
              桌面端无此分块，全部走下方常规网格。
            */}
            {isNonRecommendQuery && visibleGridItems.length > 0 && (
              <div className="mb-3 grid grid-cols-2 gap-3 sm:hidden">
                {visibleGridItems.slice(0, 4).map((item) => (
                  <SiteCard
                    key={item.id}
                    item={item}
                    onOpen={handleOpen}
                    favorited={isFavorited(item)}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </div>
            )}
            <div className={SITE_GRID_CLASS}>
              {visibleGridItems.map((item, idx) => (
                <SiteCard
                  key={item.id}
                  item={item}
                  onOpen={handleOpen}
                  favorited={isFavorited(item)}
                  onToggleFavorite={onToggleFavorite}
                  /* 分批放量的断点显隐 + 非推荐分类移动端 2x2 分块去重 */
                  className={`${gridItemClassName(idx)} ${
                    isNonRecommendQuery && idx < 4 ? 'max-sm:hidden' : ''
                  }`.trim()}
                />
              ))}
              {/* 与最新内容一致：按钮占最后一排最后一格，加载中显示旋转图标 */}
              {showGridMore && (
                <ViewMoreTile
                  loading={appendLoading}
                  onClick={handleGridLoadMore}
                />
              )}
            </div>
          </>
        ) : !showFeatured && !loading ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 min-h-[320px]">
            <Globe size={36} strokeWidth={1} />
            <p className="text-base">没有数据</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default WebListPicker;
