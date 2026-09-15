import { Loader2, Search } from 'lucide-react';
import React, { useState } from 'react';
import { FlatCategory } from './category';

interface FilterBarProps {
  /** 平铺后的全部分类（一级 + 二级混排） */
  categories: FlatCategory[];
  categoryLoading: boolean;
  /** 当前选中的分类 id，空表示「全部」 */
  selectedCat: string;
  searchKeyword: string;
  loading: boolean;
  /** 是否展示分类行：随列表滚动方向折叠 / 展开 */
  showCategories: boolean;
  onSearchChange: (kw: string) => void;
  /** 点击搜索按钮 / 回车：立即以当前关键词搜索（跳过防抖等待） */
  onSearchSubmit: () => void;
  onSelectCategory: (id: string) => void;
}

/** 分类胶囊：一级略强，二级常规；选中态为实心蓝 */
function CategoryChip({
  category,
  active,
  disabled,
  onClick,
}: {
  category: FlatCategory;
  active: boolean;
  disabled?: boolean;
  onClick: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(category.id)}
      disabled={disabled}
      className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 transition-colors ${
        active
          ? 'bg-blue-500 text-white'
          : category.level === 0
            ? 'bg-black/5 font-medium hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20'
            : 'bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10'
      }`}
    >
      {category.name}
    </button>
  );
}

/**
 * 顶部筛选区：搜索框 + 单排平铺分类。
 * 分类不分父子，一级与二级混排在同一横向滚动行内。
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  categories,
  categoryLoading,
  selectedCat,
  searchKeyword,
  loading,
  showCategories,
  onSearchChange,
  onSearchSubmit,
  onSelectCategory,
}) => {
  // 搜索框聚焦状态：聚焦时强制还原为展开态（即使分类处于折叠态），失焦后跟随滚动状态
  const [searchFocused, setSearchFocused] = useState(false);

  // 聚焦输入框时等同于「向上滚动」：分类与紧凑态一并还原
  const expanded = showCategories || searchFocused;
  const compact = !expanded;

  return (
    <div
      className={`px-5 border-b border-black/5 dark:border-white/10 space-y-4 transition-[padding] duration-300 ease-out ${
        compact ? 'py-2' : 'py-4'
      }`}
    >
      {/* 搜索框：移动端占满，桌面端 50% 宽，整体居中，胶囊圆角 */}
      <div className="relative w-full sm:w-1/2 mx-auto">
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearchSubmit();
          }}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="输入关键词搜索"
          className={`w-full rounded-full bg-black/5 dark:bg-white/10 outline-none focus:ring-2 ring-[color:var(--accent)]/40 transition-[padding,font-size] duration-300 ease-out ${
            compact ? 'pl-4 pr-12 py-1.5 ' : 'pl-5 pr-14 py-3.5 text-base'
          }`}
        />
        {/* 输入框内右侧搜索按钮：加载中显示 spinner */}
        <button
          type="button"
          onClick={onSearchSubmit}
          disabled={loading}
          aria-label="搜索"
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-blue-500 text-white transition-[width,height] duration-300 ease-out hover:brightness-110 active:scale-95 disabled:opacity-60 ${
            compact ? 'h-7 w-7' : 'h-10 w-10'
          }`}
        >
          {loading ? (
            <Loader2 size={compact ? 15 : 18} className="animate-spin" />
          ) : (
            <Search size={compact ? 15 : 18} />
          )}
        </button>
      </div>

      {/* 分类行：向下滚动时折叠（grid-rows 1fr → 0fr 自适应高度），向上滚动或聚焦输入框时展开 */}
      <div
        aria-hidden={!expanded}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden min-h-0">
          {/* 平铺分类：单行横向滚动，不换行、不折叠成多级 */}
          <div className="-mx-1 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max items-center gap-2 px-1 text-md">
              {categoryLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-7 w-16 shrink-0 animate-pulse rounded-md bg-black/5 dark:bg-white/10"
                  />
                ))
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onSelectCategory('')}
                    disabled={!expanded}
                    className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 font-medium transition-colors ${
                      selectedCat === ''
                        ? 'bg-blue-500 text-white'
                        : 'bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20'
                    }`}
                  >
                    全部
                  </button>
                  {categories.map((c) => (
                    <CategoryChip
                      key={c.id}
                      category={c}
                      active={selectedCat === c.id}
                      disabled={!expanded}
                      onClick={onSelectCategory}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
