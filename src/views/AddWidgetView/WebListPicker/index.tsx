import { Globe } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SiteItem } from '@/api/site';
import { runRequestAction, useSiteList } from '@/agent/request';
import { Button } from '@/components/Button/Button';
import { openSite } from '@/utils/siteHelper';
import { useListScroll } from '../hooks/useListScroll';
import { useSearch } from '../hooks/useSearch';
import { SiteCard } from './SiteCard';
import { SiteHeroCard } from './SiteHeroCard';
import { SiteTileCard } from './SiteTileCard';
import { FilterBar } from './FilterBar';
import { WebListPickerProps } from './types';
import {
  FEATURED_CLASS,
  FEATURED_GRID_CARD_CLASS,
  FEATURED_HERO_CLASS,
  FEATURED_TILES_CLASS,
  FEATURED_TILE_FIRST_CLASS,
  FEATURED_TILE_LAST_CLASS,
  SITE_GRID_CLASS,
} from './constants';
import { GridCard, RankTab } from './GridCard';
import { CategoryGroup, groupCategories } from './category';

/** 宫格内渲染的推荐卡数量：与排行榜错开，避免同一批数据重复展示 */
const FEATURED_TILE_COUNT = 3;

/** 每页卡片数 */
const PAGE_SIZE = 20;

/** 排行榜取数条数：最新榜（按发布时间倒序）与最热榜（按点击量倒序）共用 */
const RANK_SIZE = 5;

/**
 * 网页列表（WebListPicker）：
 * 顶部为搜索 + 两行分类筛选，其下为抖音式头条区（左 1 超大卡 + 右宫格），
 * 再往下是常规卡片网格与加载更多。
 *
 * 头条区数据分三路，彼此独立：
 * - 超大卡：常规列表的第 1 条（`items` 去除首条后即为下方网格数据）；
 * - 排行榜卡：最新 / 最热两榜（`latestItems` / `hotItems`），独占宫格左侧；
 * - 宫格其余格子：推荐站点卡（`recommendItems`）。
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

  const {
    items,
    loading,
    appendLoading,
    hasMore,
    fetchSites,
    loadMore,
  } = useSiteList({
    autoFetch: false,
  });

  // 头条区推荐数据：宫格内的推荐站点卡
  // 文档：recommend 为布尔值（后端已把 Y/N 转成 true/false），传 "Y" 无效
  const {
    items: recommendItems,
    fetchSites: fetchRecommended,
  } = useSiteList({
    autoFetch: false,
    defaultRecommend: true,
  });

  // 排行榜数据
  // 1) 最新榜：按创建时间倒序
  const {
    items: latestItems,
    fetchSites: fetchLatest,
  } = useSiteList({
    autoFetch: false,
    defaultSortField: 'createTime',
    defaultSortOrder: 'descend',
  });

  // 2) 最热榜：按点击量倒序；切到该 tab 时才拉取，避免首屏多一次请求
  const {
    items: hotItems,
    loading: hotLoading,
    fetchSites: fetchHot,
  } = useSiteList({
    autoFetch: false,
    defaultSortField: 'count',
    defaultSortOrder: 'descend',
  });

  // 排行榜当前 tab 与「最热」是否已拉取过（避免来回切换时重复请求）
  const [rankTab, setRankTab] = useState<RankTab>('latest');
  const hotFetchedRef = useRef(false);

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
    // 推荐站点：与分类 / 搜索无关，固定取前 3 条填宫格
    fetchRecommended(1, '', '', FEATURED_TILE_COUNT);
    // 最新榜：与分类 / 搜索无关，固定取发布时间最新的若干条
    fetchLatest(1, '', '', RANK_SIZE);
    // nonce 仅用于触发立即搜索（点击搜索按钮时关键词可能未变）
  }, [
    categoriesReady,
    selectedCat,
    debouncedKw,
    nonce,
    fetchSites,
    fetchRecommended,
    fetchLatest,
  ]);

  // 滚动：触底加载下一页 + 按方向折叠 / 展开分类行（并通知父级）
  const { scrollRef, onScroll, scrollVisible: showCategories } = useListScroll({
    canReachBottom: !appendLoading && hasMore,
    onReachBottom: () => loadMore(selectedCat, debouncedKw, PAGE_SIZE),
    onVisibilityChange,
  });

  // 点击卡片：上报点击量后打开站点（优先走调用方回调，缺省时新窗口打开）
  const handleOpen = (item: SiteItem) => {
    openSite(item, onOpen);
  };

  // 点击排行榜条目：上报点击量后打开站点
  const handleOpenRank = (item: SiteItem) => {
    openSite(item, onOpen);
  };

  // 排行榜 tab 切换：首次切到「最热」时按点击量倒序拉取，之后复用已取到的数据
  const handleRankTabChange = (tab: RankTab) => {
    setRankTab(tab);
    if (tab === 'hot' && !hotFetchedRef.current) {
      hotFetchedRef.current = true;
      fetchHot(1, '', '', RANK_SIZE);
    }
  };

  // 当前一级分类下的二级分类（用于第二行居中展示）
  const subCategories =
    groups.find((g) => g.parent.id === selectedParent)?.children ?? [];

  // 点击一级分类：按父级筛选（后端 categoryId 级联包含其所有子分类），并清空二级选中
  const handleSelectParent = (id: string) => {
    setSelectedParent(id);
    setSelectedCat(id);
  };

  // 点击二级分类：以二级 id 作为最终筛选条件
  const handleSelectSub = (id: string) => {
    setSelectedCat(id);
  };

  // 头条区数据切分：常规列表第 1 项作超大卡，其余进下方常规网格
  const [heroItem, ...restItems] = items;
  const gridItems = restItems;

  // 宫格推荐卡：取推荐数据前 3 条
  const tileItems = recommendItems.slice(0, FEATURED_TILE_COUNT);

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
        subCategories={subCategories}
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

        {loading && items.length === 0 ? (
          <div className="flex h-40 items-center justify-center min-h-[320px]">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-[color:var(--accent)] border-t-transparent rounded-full animate-spin" />
              <span className=" text-slate-400">加载中…</span>
            </div>
          </div>
        ) : items.length > 0 ? (
          <>
            {/* 头条区：左侧超大卡片 + 右侧宫格（排行榜卡 + 推荐站点卡）。
                下边距与网格 gap 同分档，避免小屏桌面被大屏间距挤压 */}
            <div className={`mb-4 xl:mb-5 2xl:mb-8 ${FEATURED_CLASS}`}>
              <SiteHeroCard
                item={heroItem}
                onOpen={handleOpen}
                favorited={isFavorited(heroItem)}
                onToggleFavorite={onToggleFavorite}
                className={FEATURED_HERO_CLASS}
              />
              <div className={FEATURED_TILES_CLASS}>
                {/* 排行榜卡：移动端跨 2 行独占左列、lg 起只占左上单格，tabbar 切「最新 / 最热」 */}
                <GridCard
                  latest={latestItems}
                  hot={hotItems}
                  rankTab={rankTab}
                  rankLoading={hotLoading}
                  onRankTabChange={handleRankTabChange}
                  onOpen={handleOpenRank}
                  className={FEATURED_GRID_CARD_CLASS}
                />
                {/*
                  宫格其余格子：推荐站点卡。
                  移动端宫格为 2 列，排行榜卡已占满左列上下 2 格，
                  第 3 张推荐卡会溢出到第 3 行（左侧空一格），故 < lg 时隐藏，
                  只保留填满右列的 2 张；lg 起排行榜只占 1 格，3 张正好铺满其余 3 格。
                */}
                {tileItems.map((item, idx) => (
                  <SiteTileCard
                    key={item.id || item.link || `${item.name}-${idx}`}
                    item={item}
                    onOpen={handleOpen}
                    favorited={isFavorited(item)}
                    onToggleFavorite={onToggleFavorite}
                    className={`${
                      idx === 0 ? FEATURED_TILE_FIRST_CLASS : ''
                    } ${idx === FEATURED_TILE_COUNT - 1 ? FEATURED_TILE_LAST_CLASS : ''}`}
                  />
                ))}
              </div>
            </div>

            {/* 常规卡片列表 */}
            {gridItems.length > 0 && (
              <div className={SITE_GRID_CLASS}>
                {gridItems.map((item) => (
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
            {/* 底部：有数据显示「加载更多」按钮，无更多显示提示 */}
            <div className="py-4 flex justify-center">
              {appendLoading ? (
                <span className=" text-slate-400">加载中…</span>
              ) : hasMore ? (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => loadMore(selectedCat, debouncedKw, PAGE_SIZE)}
                >
                  加载更多
                </Button>
              ) : (
                <span className=" text-slate-400">没有更多了</span>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-40 flex-col items-center justify-center gap-2 min-h-[320px]">
            <Globe size={36} strokeWidth={1} />
            <p className="text-base">没有数据</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebListPicker;
