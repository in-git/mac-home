import { Globe } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { Skeleton } from '@heroui/react';
import { siteApi } from '../../api/site';
import { useToast } from '../../components/Toast';
import { SiteCard } from './SiteCard';
import { FilterBar } from './FilterBar';
import { flattenCategories, WebListPickerProps } from './types';

/**
 * 网页列表（WebListPicker）：
 * 通用站点选择器，供多个组件复用（如快捷导航的「站点库」）。
 * 内置搜索/分类过滤、分页加载与站点卡片网格。
 * 选中状态由父组件传入（selected），新增 / 删除等变更事件均交由父组件处理。
 */
export const WebListPicker: React.FC<WebListPickerProps> = ({
  selected = [],
  onAdd,
  onRemove,
  onOpen,
  addTip = '添加',
  removeTip = '删除',
}) => {
  const [categories, setCategories] = useState<ReturnType<typeof flattenCategories>>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof siteApi.getPage>>['records']
  >([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSites = useCallback(
    async (p = 1, cat = selectedCat, kw = searchKeyword) => {
      setLoading(true);
      setItems([]);
      const params: Record<string, unknown> = { current: p, size: 12 };
      if (cat) params.categoryId = cat;
      if (kw) params.searchKey = kw;
      try {
        const res = await siteApi.getPage(
          params as Parameters<typeof siteApi.getPage>[0],
        );
        if (res && Array.isArray(res.records)) {
          setItems(res.records);
          setPage(res.current ?? p);
          setTotalPages(res.pages ?? 1);
        }
      } catch {
        /* noop */
      } finally {
        setLoading(false);
      }
    },
    [selectedCat, searchKeyword],
  );

  // 首次挂载只加载分类元数据；站点拉取交给下方分类 effect（首次也会执行，cat='' 即全部）
  useEffect(() => {
    (async () => {
      setCategoryLoading(true);
      try {
        const categoryRes = await siteApi.getCategoryTree();
        if (Array.isArray(categoryRes))
          setCategories(flattenCategories(categoryRes));
      } catch {
        /* noop */
      } finally {
        setCategoryLoading(false);
      }
    })();
  }, []);

  // 分类变化时回到第一页重新拉取（首次挂载也会触发一次，加载全部站点）
  useEffect(() => {
    fetchSites(1, selectedCat, searchKeyword);
  }, [selectedCat]);

  // 关键词搜索：400ms 防抖（跳过首次挂载，避免与分类 effect 重复拉取）
  const searchFirst = React.useRef(true);
  useEffect(() => {
    if (searchFirst.current) {
      searchFirst.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetchSites(1, selectedCat, searchKeyword);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // 点击卡片打开站点：优先走调用方回调，缺省时新窗口打开
  const handleOpen = (item: Parameters<typeof SiteCard>[0]['item']) => {
    if (onOpen) {
      onOpen(item);
    } else if (item.link) {
      window.open(item.link, '_blank', 'noreferrer');
    }
  };

  const renderSkeletonGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="space-y-2.5">
          <Skeleton className="aspect-[4/3] w-full rounded-[var(--card-radius)]" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-3/4 rounded" />
            <Skeleton className="h-2.5 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full max-h-[75vh]">
      <FilterBar
        categories={categories}
        categoryLoading={categoryLoading}
        selectedCat={selectedCat}
        searchKeyword={searchKeyword}
        loading={loading}
        onSearchChange={setSearchKeyword}
        onSelectCategory={setSelectedCat}
        onRefresh={() => fetchSites(page, selectedCat, searchKeyword)}
      />

      {/* Site Grid */}
      <div className="flex-1 overflow-y-auto p-5 min-h-[320px] md:min-h-[420px] lg:min-h-[520px]">
        {loading && items.length === 0 ? (
          renderSkeletonGrid()
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((item) => (
              <SiteCard
                key={item.id}
                item={item}
                onOpen={handleOpen}
                onAdd={onAdd}
                onRemove={onRemove}
                exists={selected.some((s) => s.link === (item.link || '#'))}
                addTip={addTip}
                removeTip={removeTip}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-40 flex-col items-center justify-center  gap-2 min-h-[320px]">
            <Globe size={36} strokeWidth={1} />
            <p className="text-base">暂无站点</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-sm text-slate-500">
          <span>
            共 {totalPages} 页 · {items.length} 条/页
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() =>
                fetchSites(page - 1, selectedCat, searchKeyword)
              }
              className="rounded-[var(--card-radius)] border border-black/10 dark:border-white/10 px-3.5 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              上一页
            </button>
            <span className="px-2">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages || loading}
              onClick={() =>
                fetchSites(page + 1, selectedCat, searchKeyword)
              }
              className="rounded-[var(--card-radius)] border border-black/10 dark:border-white/10 px-3.5 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebListPicker;
