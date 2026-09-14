import { Loader2, Search } from 'lucide-react';
import React from 'react';
import { Skeleton } from '@heroui/react';
import { SiteCategory } from '@/api/site';
import logo from '@/assets/logo.webp';

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

const SKELETON_BTN = 'h-7 w-16 rounded-md';

function FilterRow({
  label,
  loading,
  children,
}: {
  label: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-md">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-slate-400 text-xs mr-1 shrink-0">{label}</span>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className={SKELETON_BTN} />
          ))
        ) : (
          children
        )}
      </div>
    </div>
  );
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
  const chipClass = (active: boolean) =>
    `rounded-md px-3 py-1.5 transition-colors ${
      active
        ? 'bg-blue-500  text-white'
        : 'bg-black/5  hover:bg-black/10 dark:bg-white/10 '
    }`;

  // 分类折叠时同步进入紧凑态：Logo 与搜索框高度收窄
  const compact = !showCategories;

  return (
    <div
      className={`px-5 border-b border-black/5 dark:border-white/10 space-y-4 transition-[padding] duration-300 ease-out ${
        compact ? 'py-2' : 'py-4'
      }`}
    >
      {/* 顶部横幅：站点 Logo，滚动向下时高度收窄 */}
      <div className="flex justify-center">
        <img
          src={logo}
          className={`w-auto object-contain transition-[height] duration-300 ease-out ${
            compact ? 'h-8 sm:h-12' : 'h-12 sm:h-24'
          }`}
        />
      </div>

      {/* 搜索框：移动端占满，桌面端 50% 宽，整体居中，胶囊圆角 */}
      <div className="relative w-full sm:w-1/2 mx-auto">
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearchSubmit();
          }}
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

      {/* 分类行：向下滚动时折叠（grid-rows 1fr → 0fr 自适应高度），向上滚动时展开 */}
      <div
        aria-hidden={!showCategories}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          showCategories
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden min-h-0 space-y-4">
          {/* 第一排：父级分类（顶层） */}
          <FilterRow label="分类" loading={categoryLoading}>
            {parentCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectCategory(c.id)}
                tabIndex={showCategories ? undefined : -1}
                className={chipClass(activeParent === c.id)}
              >
                {c.name}
              </button>
            ))}
          </FilterRow>

          {/* 第二排：子级分类（仅当前父级存在子级时显示，不会出现第三排） */}
          {!categoryLoading && childCategories.length > 0 && (
            <FilterRow label="子类" loading={false}>
              <button
                onClick={() => onSelectCategory(CHILD_ALL)}
                tabIndex={showCategories ? undefined : -1}
                className={chipClass(selectedCat === CHILD_ALL)}
              >
                全部
              </button>
              {childCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectCategory(c.id)}
                  tabIndex={showCategories ? undefined : -1}
                  className={chipClass(selectedCat === c.id)}
                >
                  {c.name}
                </button>
              ))}
            </FilterRow>
          )}
        </div>
      </div>
    </div>
  );
};
