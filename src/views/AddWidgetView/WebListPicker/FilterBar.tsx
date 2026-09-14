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
  onSearchChange: (kw: string) => void;
  /** 点击搜索按钮 / 回车：立即以当前关键词搜索（跳过防抖等待） */
  onSearchSubmit: () => void;
  onSelectCategory: (id: string) => void;
}

const SKELETON_BTN = 'h-7 w-16 rounded-[var(--card-radius)]';

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
    <div className="flex items-center justify-between gap-2 text-sm">
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
  onSearchChange,
  onSearchSubmit,
  onSelectCategory,
}) => {
  const chipClass = (active: boolean) =>
    `rounded-[var(--card-radius)] px-3 py-1.5 transition-colors ${
      active
        ? 'bg-[color:var(--accent)]  text-white'
        : 'bg-black/5  hover:bg-black/10 dark:bg-white/10 '
    }`;

  return (
    <div className="px-5 py-4 border-b border-black/5 dark:border-white/10 space-y-4">
      {/* 顶部横幅：站点 Logo */}
      <div className="flex justify-center">
        <img
          src={logo}
          className="h-9 sm:h-24 w-auto object-contain"
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
          className="w-full pl-5 pr-14 py-3.5 rounded-full bg-black/5 dark:bg-white/10 outline-none text-base focus:ring-2 ring-[color:var(--accent)]/40"
        />
        {/* 输入框内右侧搜索按钮：加载中显示 spinner */}
        <button
          type="button"
          onClick={onSearchSubmit}
          disabled={loading}
          aria-label="搜索"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--accent)] text-white transition-opacity hover:brightness-110 active:scale-95 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Search size={18} />
          )}
        </button>
      </div>

      {/* 第一排：父级分类（顶层） */}
      <FilterRow label="分类" loading={categoryLoading}>
        {parentCategories.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelectCategory(c.id)}
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
            className={chipClass(selectedCat === CHILD_ALL)}
          >
            全部
          </button>
          {childCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectCategory(c.id)}
              className={chipClass(selectedCat === c.id)}
            >
              {c.name}
            </button>
          ))}
        </FilterRow>
      )}
    </div>
  );
};
