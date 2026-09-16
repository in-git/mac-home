import React, { useState } from 'react';
import { Button } from '@/components/Button/Button';
import { SearchBar } from '@/components/SearchBar';
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
  /** 移动端：打开全屏菜单抽屉；不传则不渲染三横杠 */
  onOpenMenu?: () => void;
}

/** 分类胶囊：一级略强，二级常规；选中态为实心蓝。统一走通用 Button 的 pill 模式 */
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
    <Button
      variant="pill"
      size="xs-md"
      active={active}
      disabled={disabled}
      onClick={() => onClick(category.id)}
      className={`shrink-0 whitespace-nowrap ${
        category.level === 0 && !active ? 'font-medium' : ''
      }`}
    >
      {category.name}
    </Button>
  );
}

/**
 * 网页列表顶部筛选区：搜索框 + 单排平铺分类。
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
  onOpenMenu,
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
      <SearchBar
        value={searchKeyword}
        onChange={onSearchChange}
        onSubmit={onSearchSubmit}
        loading={loading}
        compact={compact}
        onFocus={() => setSearchFocused(true)}
        onBlur={() => setSearchFocused(false)}
        onOpenMenu={onOpenMenu}
      />

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
                  <Button
                    variant="pill"
                    size="xs-md"
                    active={selectedCat === ''}
                    disabled={!expanded}
                    onClick={() => onSelectCategory('')}
                    className="shrink-0 whitespace-nowrap font-medium"
                  >
                    全部
                  </Button>
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
