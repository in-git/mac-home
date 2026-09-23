import { Globe } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { SiteItem } from '@/api/site';
import {
  runRequestAction,
  useSiteHomeAggregate,
  useSiteList,
} from '@/agent/request';
import { Button } from '@/components/Button/Button';
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
  FEATURED_GRID_CARD_CLASS,
  FEATURED_HERO_CLASS,
  FEATURED_TILES_CLASS,
  FEATURED_TILE_FIRST_CLASS,
  FEATURED_TILE_LAST_CLASS,
  SITE_GRID_CLASS,
} from './constants';
import { GridCard, RankTab } from './GridCard';
import { SiteGridSkeleton } from './SiteGridSkeleton';
import { CategoryGroup, groupCategories } from './category';

/**
 * 宫格内渲染的推荐卡「槽位数」：lg 起为 3 张，移动端第 3 张由
 * `FEATURED_TILE_LAST_CLASS`（max-lg:hidden）隐藏，因此实际可见 2 张。
 *
 * **这 3 格必须优先填满**：宫格是固定四格（左上是排行榜卡）的棋盘，
 * 少一张就会露出空洞；轮播则是有几张放几张，不存在「填不满」的问题。
 */
const FEATURED_TILE_COUNT = 3;

/**
 * 头条区左侧推荐**轮播**的幻灯片数上限。
 *
 * 轮播拿的是宫格挑剩下的数据，因此这里只是上限而非固定张数；
 * 取 4 张在「够看」与「不拖慢首屏」之间取平衡。
 */
const FEATURED_HERO_MAX = 4;

/** 每页卡片数 */
const PAGE_SIZE = 20;

/**
 * 头条区聚合接口 `size` 参数：**最新 / 最热各自**的返回条数。
 *
 * 推荐榜不受该参数约束（接口固定返回全部推荐），宫格靠前 3 条、轮播取剩余，
 * 因此这里只需覆盖排行榜卡渲染 5 行的需求。
 */
const AGGREGATE_SIZE = 5;

/**
 * 网页列表（WebListPicker）：
 * 顶部为搜索 + 两行分类筛选，其下为抖音式头条区（左 1 轮播大卡 + 右宫格），
 * 再往下是常规卡片网格与加载更多。
 *
 * **首屏数据来源**：
 * - 头条区（推荐轮播 + 排行榜 + 推荐宫格）：一次 `homeAggregate` 聚合请求，
 *   同时拿回 `recommends` / `latest` / `hottest` 三组数据；
 * - 常规网格：独立的 `site_get_page` 分页请求（带分类 / 搜索条件，且排除推荐站点）。
 *
 * 头条区内部的数据分配：
 * - 推荐数据（`recommends`）：**按接口顺序整批分配、互不重复** ——
 *   前 `FEATURED_TILE_COUNT` 条先填满宫格推荐卡，剩下的才给左侧轮播；
 * - 排行榜卡：最新榜（`latest`）/ 最热榜（`hottest`），独占宫格左侧。
 *
 * 常规列表（`items`）全部进下方网格，不再切出首条作超大卡。
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

  // 常规列表：**只看非推荐**（recommend = false）。
  //
  // 头条区已经把推荐站点用掉了（宫格 3 张 + 轮播若干），常规列表若仍返回
  // 推荐站点，同一站点就会在首屏出现两次 —— 上方推荐区一次、下方网格又一次。
  // 因此这里显式传 recommend=false 把推荐站点排除掉，两块内容互不重叠。
  //
  // 注意 useSiteList 里对 recommend 的处理：`false` 也必须显式下发，
  // 丢弃该参数后端会按「不带条件」返回全部站点（含推荐），与不传无异。
  const {
    items,
    loading,
    appendLoading,
    hasMore,
    fetchSites,
    loadMore,
  } = useSiteList({
    autoFetch: false,
    defaultRecommend: false,
  });

  /**
   * 头条区数据：一次聚合请求拿回「推荐 / 最新 / 最热」三组。
   *
   * 排序与筛选口径全部由后端定义（见接口文档），前端不再自行拼排序参数：
   * - recommends 按 orderNum 升序、createTime 倒序
   * - latest 按 createTime 倒序、同值按 orderNum 升序
   * - hottest 按 count 倒序、同值按 createTime 倒序
   */
  const {
    latest: latestItems,
    hottest: hotItems,
    recommends: recommendItems,
    loading: aggregateLoading,
    fetchAggregate,
  } = useSiteHomeAggregate({
    autoFetch: false,
    defaultSize: AGGREGATE_SIZE,
  });

  // 排行榜当前 tab：两榜数据都已在聚合响应里，切换纯前端行为，无需再发请求
  const [rankTab, setRankTab] = useState<RankTab>('latest');

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

  // 头条区聚合数据：首次进入时拉取一次（等分类就绪后与常规列表并发，避免早于首屏渲染）
  useEffect(() => {
    if (!categoriesReady) return;
    fetchAggregate(AGGREGATE_SIZE);
  }, [categoriesReady, fetchAggregate]);

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

  // 排行榜 tab 切换：两榜数据都随聚合响应一并到达，切换纯前端行为，无需再发请求
  const handleRankTabChange = (tab: RankTab) => {
    setRankTab(tab);
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

  // 常规列表整批进下方网格，不再切出首条作超大卡（超大卡由推荐轮播承担）
  const gridItems = items;

  /**
   * 是否展示头条区（推荐轮播 + 排行榜 + 推荐宫格）。
   *
   * 仅当**未选中任何分类**（顶部第一行的「推荐」）且**无搜索词**时展示：
   * - 一旦切到某个一级 / 二级分类，或输入关键词，用户就是在「找特定内容」，
   *   此时推荐区属无关内容，收起后把版面全部让给筛选结果；
   * - 也正因如此，推荐数据不会随分类 / 搜索重新拉取（见上方 effect 注释）。
   */
  const showFeatured = selectedCat === ALL_CATEGORY_ID && !debouncedKw;

  /**
   * 是否处于「首屏加载」：骨架屏的唯一开关。
   *
   * 常规列表与头条区聚合是两个独立请求，二者任一先返回都会让 `items` / 布局变化。
   * 若只以常规列表的 `loading` 为判断依据，聚合稍慢时会出现这一幕：
   * 骨架屏整体被撤下、真实卡片铺开，但排行榜卡仍带着 `rankLoading=true`，
   * 于是它在页面里单独渲染出一块自己的内部骨架 —— 看起来就是
   * 「其他骨架都加载完了，排行榜还挂着在那儿转」。
   *
   * 因此这里把两个 loading 合并：只有当**常规列表已有数据**、
   * 且**头条区已就绪（或不展示头条区）**时，才认为首屏加载完成。
   */
  const featuredPending = showFeatured && aggregateLoading;
  const firstScreenLoading =
    items.length === 0 && (loading || featuredPending);

  /**
   * 头条区推荐数据分配，**宫格优先**：
   *
   * 1. 先取 `FEATURED_TILE_COUNT` 条给宫格的 3 个槽位 —— 宫格是固定棋盘，
   *    少一张就露空洞，必须优先保证填满；
   * 2. 剩下的全部给左侧轮播（最多 `FEATURED_HERO_MAX` 张，多余的截掉）。
   *
   * 两段取自同一数组的不同区间，因此**不会重复**；推荐总数不足时，
   * 宫格先降级为占位，轮播坦然为空（此时不渲染，宫格自然占满整行）。
   *
   * 若改成「轮播优先」，推荐正好 4~6 条时宫格就会缺格 —— 这正是要避免的。
   *
   * 聚合接口的 recommends 固定返回**全部**推荐站点（不受 size 约束），
   * 可能远超轮播需要的张数，因此这里必须再截一次上限。
   *
   * 不展示头条区时两者都清空，避免隐藏状态下仍持有数据。
   */
  const tileItems = showFeatured
    ? recommendItems.slice(0, FEATURED_TILE_COUNT)
    : [];
  const heroItems = showFeatured
    ? recommendItems.slice(
        FEATURED_TILE_COUNT,
        FEATURED_TILE_COUNT + FEATURED_HERO_MAX,
      )
    : [];

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

        {/*
          首屏加载：骨架屏按真实布局（头条区 + 网格）占位，避免转圈带来的空白与跳动。
          头条区是否出骨架同样由 showFeatured 决定，否则选中分类后骨架会多出一整块。

          **必须等常规列表与头条区聚合都返回**才算首屏加载完成：
          两者是两个独立请求，只要有一个先到，`items` 非空就会切走骨架屏，
          而排行榜卡会带着 `rankLoading=true` 单独渲染自己的内部骨架 ——
          表现为「其他骨架都消失了，只有排行榜还挂着一块在转」。
          合并成同一个条件后，二者同时就绪才切到真实内容。
        */}
        {firstScreenLoading ? (
          <SiteGridSkeleton showFeatured={showFeatured} />
        ) : items.length > 0 ? (
          <>
            {/* 头条区：左侧推荐轮播大卡 + 右侧宫格（排行榜卡 + 推荐站点卡）。
                仅在「推荐」（未选分类 / 无搜索）时展示，切到分类后整块收起。
                下边距与网格 gap 同分档，避免小屏桌面被大屏间距挤压 */}
            {showFeatured && (
              <div className={`mb-4 xl:mb-5 2xl:mb-8 ${FEATURED_CLASS}`}>
                {/* 推荐轮播：与右侧宫格推荐卡取自推荐数组的不同片段，因此不会重复；
                    暂无推荐数据时不渲染（宫格会自动占满整行） */}
                {heroItems.length > 0 && (
                  <SiteHeroCarousel
                    items={heroItems}
                    onOpen={handleOpen}
                    favoritedOf={isFavorited}
                    onToggleFavorite={onToggleFavorite}
                    className={FEATURED_HERO_CLASS}
                  />
                )}
                <div className={FEATURED_TILES_CLASS}>
                  {/* 排行榜卡：移动端跨 2 行独占左列、lg 起只占左上单格，tabbar 切「最新 / 最热」 */}
                  <GridCard
                    latest={latestItems}
                    hot={hotItems}
                    rankTab={rankTab}
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
            )}

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
