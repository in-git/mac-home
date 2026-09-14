import { Globe } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { runRequestAction, useSiteList } from '../../../agent/request';
import { Button } from '../../../components/Button/Button';
import { SiteCard } from './SiteCard';
import { FilterBar, CHILD_ALL } from './FilterBar';
import {
  flattenCategories,
  getChildCategories,
  findParentId,
  SITE_GRID_CLASS,
  WebListPickerProps,
} from './types';

/**
 * 网页列表（WebListPicker）：
 * 通用站点选择器，供多个应用复用（如快捷导航的「站点库」）。
 * 内置搜索/分类过滤与站点卡片网格。
 * 选中状态由父应用传入（selected），新增 / 删除等变更事件均交由父应用处理。
 */
export const WebListPicker: React.FC<WebListPickerProps> = ({
  title,
  onOpen,
  favorites,
  onToggleFavorite,
}) => {
  const [categories, setCategories] = useState<ReturnType<typeof flattenCategories>>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string>('');
  // 当前选中的父级（用于第二排渲染对应子级）；空表示「全部」
  const [activeParent, setActiveParent] = useState<string>('');
  // 实际传给后端拉取的分类 ID：与 selectedCat 解耦，使点击父级时子类「全部」可保持高亮
  const [queryCat, setQueryCat] = useState<string>('');

  // 应用分类选择：父级或子级均会同步 activeParent，保证第二排始终对应其所属父级
  // cats / currentParent 由调用方显式传入，避免异步加载分类后立即选中时读到旧 state
  const applyCategory = (
    id: string,
    cats: ReturnType<typeof flattenCategories>,
    currentParent: string = activeParent,
  ) => {
    // 子级「全部」标记：表示为当前父级下、但不限定具体子类（仍是选中态，第二排保留）
    if (id === CHILD_ALL) {
      setSelectedCat(CHILD_ALL);
      setQueryCat(currentParent);
      return;
    }
    if (!id) {
      // 父级「全部」：清空父级与查询条件
      setSelectedCat('');
      setActiveParent('');
      setQueryCat('');
      return;
    }
    const parentId = findParentId(cats, id);
    setActiveParent(parentId);
    if (parentId === id) {
      // 点击的是父级：归入该父级下，同时高亮父级和子类「全部」，按父级拉取
      setSelectedCat(CHILD_ALL);
      setQueryCat(id);
    } else {
      // 点击的是子级：按具体子类拉取
      setSelectedCat(id);
      setQueryCat(id);
    }
  };

  // 选择分类（用户点击）
  const handleSelectCategory = (id: string) => {
    applyCategory(id, categories);
  };
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
  } = useSiteList({ autoFetch: false });

  // 分类元数据是否已就绪（用于推迟首次列表拉取，避免先用「全部」查一次再按默认分类重查）
  const [categoriesReady, setCategoriesReady] = useState(false);
  // 是否已在首次加载时应用默认分类（只应用一次，后续刷新保留用户当前选择）
  const defaultAppliedRef = useRef(false);

  // 加载分类元数据：刷新时也会调用，重新拉取并把 categoryLoading 置为 true 以显示骨架屏
  const loadCategories = useCallback(async () => {
    setCategoryLoading(true);
    try {
      const categoryRes = await runRequestAction('site_get_category_tree');
      if (categoryRes.ok && Array.isArray(categoryRes.data)) {
        const flat = flattenCategories(categoryRes.data);
        setCategories(flat);
        // 默认不查「全部」，而是以第一个大分类作为初始查询条件
        if (!defaultAppliedRef.current && flat.length > 0) {
          defaultAppliedRef.current = true;
          applyCategory(flat[0].id, flat, '');
        }
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
    fetchSites(1, queryCat, debouncedKw, PAGE_SIZE);
    // searchNonce 仅用于触发立即搜索（点击搜索按钮时关键词可能未变）
  }, [categoriesReady, queryCat, debouncedKw, searchNonce, fetchSites]);

  // 搜索关键词 400ms 防抖
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKw(searchKeyword), 400);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // 滚动触底自动加载下一页
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const handleScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = scrollRef.current;
      if (!el || appendLoading || !hasMore) return;
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
        loadMore(queryCat, debouncedKw, PAGE_SIZE);
      }
    });
  }, [appendLoading, hasMore, loadMore, queryCat, debouncedKw]);

  // 点击卡片打开站点：优先走调用方回调，缺省时新窗口打开
  const handleOpen = (item: Parameters<typeof SiteCard>[0]['item']) => {
    if (onOpen) {
      onOpen(item);
    } else if (item.link) {
      window.open(item.link, '_blank', 'noreferrer');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <FilterBar
        title={title}
        parentCategories={categories}
        childCategories={getChildCategories(categories, activeParent)}
        categoryLoading={categoryLoading}
        selectedCat={selectedCat}
        activeParent={activeParent}
        searchKeyword={searchKeyword}
        loading={loading}
        onSearchChange={setSearchKeyword}
        onSearchSubmit={handleSearchSubmit}
        onSelectCategory={handleSelectCategory}
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
              <span className="text-xs text-slate-400">加载中…</span>
            </div>
          </div>
        )}

        {loading && items.length === 0 ? (
          <div className="flex h-40 items-center justify-center min-h-[320px]">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-[color:var(--accent)] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400">加载中…</span>
            </div>
          </div>
        ) : items.length > 0 ? (
          <>
            <div className={SITE_GRID_CLASS}>
              {items.map((item) => (
                <SiteCard
                  key={item.id}
                  item={item}
                  onOpen={handleOpen}
                  favorited={favorites?.some(
                    (s) =>
                      (item.id && s.id === item.id) ||
                      (item.link && s.link === item.link) ||
                      (item.name && s.name === item.name),
                  )}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
            {/* 底部：有数据显示「加载更多」按钮，无更多显示提示 */}
            <div className="py-4 flex justify-center">
              {appendLoading ? (
                <span className="text-xs text-slate-400">加载中…</span>
              ) : hasMore ? (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => loadMore(queryCat, debouncedKw, PAGE_SIZE)}
                >
                  加载更多
                </Button>
              ) : (
                <span className="text-xs text-slate-400">没有更多了</span>
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
