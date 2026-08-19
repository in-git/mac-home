import { Globe } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@heroui/react';
import { runRequestAction, useSiteList } from '../../../agent/request';
import { SiteCard } from './SiteCard';
import { FilterBar } from './FilterBar';
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

  // 选择分类：父级或子级均会同步 activeParent，保证第二排始终对应其所属父级
  const handleSelectCategory = (id: string) => {
    setSelectedCat(id);
    if (!id) {
      setActiveParent('');
    } else {
      setActiveParent(findParentId(categories, id));
    }
  };
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  // 搜索防抖后的值，用于实际拉取，避免每次按键都请求
  const [debouncedKw, setDebouncedKw] = useState<string>('');
  // 动态列数与每页卡片数（列数 × 行数），使首屏恰好铺满容器
  const [cols, setCols] = useState(5);
  const [pageSize, setPageSize] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  const {
    items,
    loading,
    page,
    totalPages,
    fetchSites,
  } = useSiteList({ autoFetch: false });

  // 首次挂载只加载分类元数据
  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  // 根据容器尺寸动态计算列数与每页卡片数，并同步网格布局（ResizeObserver 适配窗口/弹窗尺寸变化）
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const compute = () => {
      const cs = getComputedStyle(el);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const availW = el.clientWidth - padX;
      const availH = el.clientHeight - padY;
      const gap = 16;
      const minCard = 180;
      const nextCols = Math.max(1, Math.floor((availW + gap) / (minCard + gap)));
      const cardW = (availW - gap * (nextCols - 1)) / nextCols;
      const cardH = (cardW * 9) / 16 + 64; // 封面 16:9 + 底部信息区
      const rows = Math.max(1, Math.floor((availH + gap) / (cardH + gap)));
      const nextSize = Math.min(60, nextCols * rows);
      setCols(nextCols);
      setPageSize((prev) => (prev === nextSize ? prev : nextSize));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 分类 / 搜索 / 每页数量变化时，回到第一页重新拉取（动态分页铺满首屏）
  useEffect(() => {
    if (pageSize <= 0) return;
    fetchSites(1, selectedCat, debouncedKw, pageSize);
  }, [selectedCat, debouncedKw, pageSize]);

  // 搜索关键词 400ms 防抖
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKw(searchKeyword), 400);
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
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: Math.max(cols * 2, 10) }).map((_, i) => (
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
    <div className="flex flex-col h-full">
      <FilterBar
        parentCategories={categories}
        childCategories={getChildCategories(categories, activeParent)}
        categoryLoading={categoryLoading}
        selectedCat={selectedCat}
        searchKeyword={searchKeyword}
        loading={loading}
        onSearchChange={setSearchKeyword}
        onSelectCategory={handleSelectCategory}
        onRefresh={() => fetchSites(page, selectedCat, debouncedKw, pageSize)}
        page={page}
        totalPages={totalPages}
        onPrevPage={() => fetchSites(page - 1, selectedCat, debouncedKw, pageSize)}
        onNextPage={() => fetchSites(page + 1, selectedCat, debouncedKw, pageSize)}
      />

      {/* Site Grid */}
      <div ref={gridRef} className="flex-1 overflow-y-auto p-5">
        {loading && items.length === 0 ? (
          renderSkeletonGrid()
        ) : items.length > 0 ? (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
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
        ) : (
          <div className="flex h-40 flex-col items-center justify-center gap-2 min-h-[320px]">
            <Globe size={36} strokeWidth={1} />
            <p className="text-base">暂无站点</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebListPicker;
