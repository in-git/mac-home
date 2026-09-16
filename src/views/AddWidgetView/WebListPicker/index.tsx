import { Globe } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SiteItem } from '@/api/site';
import { runRequestAction, useSiteList } from '@/agent/request';
import { Button } from '@/components/Button/Button';
import { openSite } from '@/utils/siteHelper';
import { SiteCard } from './SiteCard';
import { SiteHeroCard } from './SiteHeroCard';
import { SiteTileCard } from './SiteTileCard';
import { FilterBar } from './FilterBar';
import { WebListPickerProps } from './types';
import { useScrollDirection } from '../useScrollDirection';
import {
  FEATURED_CLASS,
  FEATURED_TILES_CLASS,
  SITE_GRID_CLASS,
  SITE_SORT_FIELD,
  SITE_SORT_ORDER,
} from './constants';
import { FlatCategory, flattenCategories } from './category';

/** 头条区占位数量：左侧 1 张大卡 + 右侧 4 张小卡 */
const FEATURED_SIZE = 5;

/**
 * 网页列表（WebListPicker）：
 * 通用站点选择器，供多个应用复用（如快捷导航的「站点库」）。
 * 顶部为平铺的分类，其下为抖音式头条区（左 1 超大卡 + 右 4 卡），再往下是常规卡片网格。
 * 选中状态由父应用传入（selected），新增 / 删除等变更事件均交由父应用处理。
 */
export const WebListPicker: React.FC<WebListPickerProps> = ({
  onOpen,
  favorites,
  onToggleFavorite,
  onVisibilityChange,
  onOpenMenu,
}) => {
  const [categories, setCategories] = useState<FlatCategory[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  // 当前选中的分类，空表示「全部」
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  // 搜索防抖后的值，用于实际拉取，避免每次按键都请求
  const [debouncedKw, setDebouncedKw] = useState<string>('');
  // 固定每页卡片数（初始化加载条数）
  const PAGE_SIZE = 20;

  const {
    items,
    loading,
    appendLoading,
    hasMore,
    fetchSites,
    loadMore,
  } = useSiteList({
    autoFetch: false,
    // 最新的排最前：头条区大卡取 items[0]，即最新上架的站点
    defaultSortField: SITE_SORT_FIELD,
    defaultSortOrder: SITE_SORT_ORDER,
  });

  // 分类元数据是否已就绪（用于推迟首次列表拉取，避免先用「全部」查一次再按默认分类重查）
  const [categoriesReady, setCategoriesReady] = useState(false);

  // 加载分类元数据：刷新时也会调用，重新拉取并把 categoryLoading 置为 true 以显示骨架屏
  const loadCategories = useCallback(async () => {
    setCategoryLoading(true);
    try {
      const categoryRes = await runRequestAction('site_get_category_tree');
      if (categoryRes.ok && Array.isArray(categoryRes.data)) {
        setCategories(flattenCategories(categoryRes.data));
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

  // 立即搜索（点击搜索按钮 / 回车）：同步防抖值并递增 nonce，
  // 保证关键词与上次相同时也能重新拉取（两者在同一批次更新，effect 只跑一次）
  const [searchNonce, setSearchNonce] = useState(0);
  const handleSearchSubmit = () => {
    setDebouncedKw(searchKeyword);
    setSearchNonce((n) => n + 1);
  };

  // 分类 / 搜索变化时，回到第一页重新拉取（等分类就绪后再拉，保证默认分类生效）
  useEffect(() => {
    if (!categoriesReady) return;
    fetchSites(1, selectedCat, debouncedKw, PAGE_SIZE);
    // searchNonce 仅用于触发立即搜索（点击搜索按钮时关键词可能未变）
  }, [categoriesReady, selectedCat, debouncedKw, searchNonce, fetchSites]);

  // 搜索关键词 400ms 防抖
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKw(searchKeyword), 400);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // 滚动触底自动加载下一页 + 按滚动方向折叠 / 展开分类行
  const scrollRef = useRef<HTMLDivElement>(null);
  // 方向判定统一走 useScrollDirection（含过渡锁，避免高度变化引发的滚动抖动）
  const { visible: showCategories, onScroll: handleDirectionScroll } =
    useScrollDirection(scrollRef);

  // 分类显隐变化通知父级（移动端顶部导航与之联动）
  useEffect(() => {
    onVisibilityChange?.(showCategories);
  }, [showCategories, onVisibilityChange]);

  // 触底加载：与方向判定解耦，不受过渡锁影响
  const loadRafRef = useRef<number | null>(null);
  const handleLoadMore = useCallback(() => {
    if (loadRafRef.current) return;
    loadRafRef.current = requestAnimationFrame(() => {
      loadRafRef.current = null;
      const el = scrollRef.current;
      if (!el) return;
      if (appendLoading || !hasMore) return;
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
        loadMore(selectedCat, debouncedKw, PAGE_SIZE);
      }
    });
  }, [appendLoading, hasMore, loadMore, selectedCat, debouncedKw]);

  useEffect(
    () => () => {
      if (loadRafRef.current !== null) cancelAnimationFrame(loadRafRef.current);
    },
    [],
  );

  const handleScroll = useCallback(() => {
    handleDirectionScroll();
    handleLoadMore();
  }, [handleDirectionScroll, handleLoadMore]);

  // 点击卡片：上报点击量后打开站点（优先走调用方回调，缺省时新窗口打开）
  const handleOpen = (item: SiteItem) => {
    openSite(item, onOpen);
  };

  // 头条区：数组第 1 项（items[0]）固定作超大卡，
  // 紧随其后的 4 张组成右侧四宫格，剩余项走常规网格
  const [heroItem, ...restItems] = items;
  const tileItems = restItems.slice(0, FEATURED_SIZE - 1);
  const gridItems = restItems.slice(FEATURED_SIZE - 1);

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
        categories={categories}
        categoryLoading={categoryLoading}
        selectedCat={selectedCat}
        searchKeyword={searchKeyword}
        loading={loading}
        showCategories={showCategories}
        onSearchChange={setSearchKeyword}
        onSearchSubmit={handleSearchSubmit}
        onSelectCategory={setSelectedCat}
        onOpenMenu={onOpenMenu}
      />

      {/* Site Grid */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-5 relative"
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
            {/* 头条区：左侧超大卡片 + 右侧 2×2 四张卡片 */}
            <div className={`mb-4 xl:mb-8 ${FEATURED_CLASS}`}>
              <SiteHeroCard
                item={heroItem}
                onOpen={handleOpen}
                favorited={isFavorited(heroItem)}
                onToggleFavorite={onToggleFavorite}
              />
              <div className={FEATURED_TILES_CLASS}>
                {tileItems.map((item) => (
                  <SiteTileCard
                    key={item.id}
                    item={item}
                    onOpen={handleOpen}
                    favorited={isFavorited(item)}
                    onToggleFavorite={onToggleFavorite}
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
