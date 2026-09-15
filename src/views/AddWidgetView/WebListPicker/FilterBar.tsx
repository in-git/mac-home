import { Loader2, Search } from 'lucide-react';
import React, { useState } from 'react';
import { SiteCategory } from '@/api/site';
import CategoryRow from './CategoryRow';

/** 子级「全部」的标记值，与父级「全部」('') 区分，避免两者高亮态互相干扰 */
export const CHILD_ALL = '__child_all__';

interface FilterBarProps {
  /** 父级（顶层）分类列表，用于第一排 */
  parentCategories: SiteCategory[];
  /** 当前父级对应的子级列表，用于第二排；为空不渲染第二排 */
  childCategories: SiteCategory[];
  categoryLoading: boolean;
  selectedCat: string;
  /** 当前选中的父级；非空表示用户已选定某个父级（用于区分父级「全部」与子级「全部」） */
  activeParent: string;
  searchKeyword: string;
  loading: boolean;
  /** 是否展示分类行：随列表滚动方向折叠 / 展开 */
  showCategories: boolean;
  onSearchChange: (kw: string) => void;
  /** 点击搜索按钮 / 回车：立即以当前关键词搜索（跳过防抖等待） */
  onSearchSubmit: () => void;
  onSelectCategory: (id: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  parentCategories,
  childCategories,
  categoryLoading,
  selectedCat,
  activeParent,
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
            compact
              ? 'pl-4 pr-12 py-1.5 text-sm'
              : 'pl-5 pr-14 py-3.5 text-base'
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
        <div className="overflow-hidden min-h-0 space-y-4">
          {/* 第一排：父级分类（顶层） */}
          <CategoryRow
            label="分类"
            loading={categoryLoading}
            categories={parentCategories}
            activeId={activeParent}
            onSelect={onSelectCategory}
            disabled={!expanded}
          />

          {/* 第二排：子级分类（仅当前父级存在子级时显示，不会出现第三排） */}
          {!categoryLoading && childCategories.length > 0 && (
            <CategoryRow
              label="子类"
              loading={false}
              categories={childCategories}
              activeId={selectedCat}
              onSelect={onSelectCategory}
              disabled={!expanded}
              allLabel="全部"
              allActive={selectedCat === CHILD_ALL}
              allValue={CHILD_ALL}
            />
          )}
        </div>
      </div>
    </div>
  );
};
