import { Globe } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Skeleton } from '@heroui/react';
import { runRequestAction, useSiteList } from '../../agent/request';
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
  const {
    items,
    loading,
    page,
    totalPages,
    fetchSites,
  } = useSiteList({
    defaultPage: 1,
    defaultSize: 12,
    defaultCat: selectedCat,
    defaultKw: searchKeyword,
    autoFetch: true,
  });

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
        onRefresh={() => fetchSites(page, selectedCat, searchKeyword)}
        page={page}
        totalPages={totalPages}
        onPrevPage={() => fetchSites(page - 1, selectedCat, searchKeyword)}
        onNextPage={() => fetchSites(page + 1, selectedCat, searchKeyword)}
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
