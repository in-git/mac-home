import React, { useState } from 'react';
import { Button } from '@/components/Button/Button';
import { SearchBar } from '@/components/SearchBar';
import { FlatCategory } from './category';

interface FilterBarProps {
  /** 一级分类（含「全部」由本组件内部追加） */
  categories: FlatCategory[];
  /** 当前选中一级分类下的二级分类；无二级时为空数组 */
  subCategories: FlatCategory[];
  /** 当前选中一级分类的 id，空表示「全部」 */
  selectedParent: string;
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
  /** 点击一级分类：切换后清空二级选中 */
  onSelectParent: (id: string) => void;
  /** 点击二级分类 */
  onSelectCategory: (id: string) => void;
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
 * 网页列表顶部筛选区：搜索框 + 分类行。
 *
 * 分类分两行、均**居中**展示：
 * - 第一行：一级分类（含「全部」）
 * - 第二行：当前一级分类下的二级分类（仅当有子级时出现）
 *
 * 每行仍保持横向可滚动（超出屏幕时可左右滑动），但内容整体居中。
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  categories,
  subCategories,
  selectedParent,
  categoryLoading,
  selectedCat,
  searchKeyword,
  loading,
  showCategories,
  onSearchChange,
  onSearchSubmit,
  onSelectParent,
  onSelectCategory,
}) => {
  // 搜索框聚焦状态：聚焦时强制还原为展开态（即使分类处于折叠态），失焦后跟随滚动状态
  const [searchFocused, setSearchFocused] = useState(false);

  // 聚焦输入框时等同于「向上滚动」：分类与紧凑态一并还原
  const expanded = showCategories || searchFocused;
  const compact = !expanded;

  // 一级分类行：首项为「全部」；与二级分开渲染以便各自居中
  const parentChips: FlatCategory[] = [
    { id: '', name: '全部', level: 0 },
    ...categories.filter((c) => c.level === 0),
  ];

  return (
    <div
      className={`px-3 sm:px-5 border-b border-black/5 dark:border-white/10 space-y-4 transition-[padding] duration-300 ease-out ${
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
      />

      {/* 分类区：向下滚动时折叠（grid-rows 1fr → 0fr 自适应高度），向上滚动或聚焦输入框时展开 */}
      <div
        aria-hidden={!expanded}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden min-h-0 space-y-3">
          {categoryLoading ? (
            // 骨架屏：两行居中占位
            <div className="space-y-3">
              {[0, 1].map((row) => (
                <div
                  key={row}
                  className="flex items-center justify-center gap-2"
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-7 w-16 shrink-0 animate-pulse rounded-md bg-black/5 dark:bg-white/10"
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* 一级分类行：整体居中 */}
              <div className="overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex w-max min-w-full items-center justify-center gap-2 px-1 text-md">
                  {parentChips.map((c) => (
                    <Button
                      key={c.id || 'all'}
                      variant="pill"
                      size="xs-md"
                      active={selectedParent === c.id}
                      disabled={!expanded}
                      onClick={() => onSelectParent(c.id)}
                      className="shrink-0 whitespace-nowrap font-medium"
                    >
                      {c.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 二级分类行：仅当前一级分类有子级时出现，同样整体居中 */}
              {subCategories.length > 0 && (
                <div className="overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex w-max min-w-full items-center justify-center gap-2 px-1 text-md">
                    {subCategories.map((c) => (
                      <CategoryChip
                        key={c.id}
                        category={c}
                        active={selectedCat === c.id}
                        disabled={!expanded}
                        onClick={onSelectCategory}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
