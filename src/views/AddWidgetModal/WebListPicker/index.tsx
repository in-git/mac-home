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
  WebListPickerProps,
} from './types';

/**
 * 网页列表（WebListPicker）：
 * 通用站点选择器，供多个组件复用（如快捷导航的「站点库」）。
 * 内置搜索/分类过滤与站点卡片网格。
 * 选中状态由父组件传入（selected），新增 / 删除等变更事件均交由父组件处理。
 */
export const WebListPicker: React.FC<WebListPickerProps> = ({
  selected = [],
  onAdd,
  onRemove,
  onOpen,
}) => {
  const [categories, setCategories] = useState<ReturnType<typeof flattenCategories>>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string>('');
  // 当前选中的父级（用于第二排渲染对应子级）；空表示「全部」
  const [activeParent, setActiveParent] = useState<string>('');
  // 实际传给后端拉取的分类 ID：与 selectedCat 解耦，使点击父级时子类「全部」可保持高亮
  const [queryCat, setQueryCat] = useState<string>('');

  // 选择分类：父级或子级均会同步 activeParent，保证第二排始终对应其所属父级
  const handleSelectCategory = (id: string) => {
    // 子级「全部」标记：表示为当前父级下、但不限定具体子类（仍是选中态，第二排保留）
    if (id === CHILD_ALL) {
      setSelectedCat('');
      setQueryCat(activeParent);
      return;
    }
    if (!id) {
      // 父级「全部」：清空父级与查询条件
      setSelectedCat('');
      setActiveParent('');
      setQueryCat('');
      return;
    }
    setSelectedCat(id);
    const parentId = findParentId(categories, id);
    setActiveParent(parentId);
    if (parentId === id) {
      // 点击的是父级：归入该父级下，子类「全部」高亮，按父级拉取
      setSelectedCat('');
      setQueryCat(id);
    } else {
      // 点击的是子级：按具体子类拉取
      setQueryCat(id);
    }
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
    }
  }, []);

  // 首次挂载只加载分类元数据
  useEffect(() => {
    loadCategories();
  }, []);

  // 分类 / 搜索变化时，回到第一页重新拉取
  useEffect(() => {
    fetchSites(1, queryCat, debouncedKw, PAGE_SIZE);
  }, [queryCat, debouncedKw, fetchSites]);

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
        parentCategories={categories}
        childCategories={getChildCategories(categories, activeParent)}
        categoryLoading={categoryLoading}
        selectedCat={selectedCat}
        activeParent={activeParent}
        searchKeyword={searchKeyword}
        loading={loading}
        onSearchChange={setSearchKeyword}
        onSelectCategory={handleSelectCategory}
        onRefresh={() => {
          void loadCategories();
          void fetchSites(1, queryCat, debouncedKw, PAGE_SIZE);
        }}
      />

      {/* Site Grid */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-5"
      >
        {loading && items.length === 0 ? (
          <div className="flex h-40 items-center justify-center min-h-[320px]">
            <span className="text-xs text-slate-400">加载中…</span>
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="grid grid-cols-5 gap-4">
              {items.map((item) => (
                <SiteCard
                  key={item.id}
                  item={item}
                  onOpen={handleOpen}
                  onAdd={onAdd}
                  onRemove={onRemove}
                  exists={selected.some(
                    (s) =>
                      (item.id && s.id === item.id) ||
                      (item.link && s.link === item.link) ||
                      (item.name && s.name === item.name),
                  )}
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
