import { RefreshCw, Search } from 'lucide-react';
import React from 'react';
import { Skeleton } from '@heroui/react';
import { Button } from '../../../components/Button/Button';
import { SiteCategory } from '../../../api/site';

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
  onSelectCategory: (id: string) => void;
  onRefresh: () => void;
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
  onSelectCategory,
  onRefresh,
}) => {
  const chipClass = (active: boolean) =>
    `rounded-[var(--card-radius)] px-3 py-1.5 transition-colors ${
      active
        ? 'bg-[color:var(--accent)]  text-white'
        : 'bg-black/5  hover:bg-black/10 dark:bg-white/10 '
    }`;

  return (
    <div className="px-5 py-4 border-b border-black/5 dark:border-white/10 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 "
          />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="输入关键词搜索"
            className="w-full pl-9 pr-3 py-2 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10 outline-none text-sm focus:ring-2 ring-[color:var(--accent)]/40"
          />
        </div>
        <Button
          variant="secondary"
          size="md"
          icon={<RefreshCw size={14} />}
          loading={loading}
          onClick={onRefresh}
          title="刷新"
        >
          <span className="hidden sm:inline">刷新</span>
        </Button>
      </div>

      {/* 第一排：父级分类（顶层） */}
      <FilterRow label="分类" loading={categoryLoading}>
        <button
          onClick={() => onSelectCategory('')}
          className={chipClass(selectedCat === '' && activeParent === '')}
        >
          全部
        </button>
        {parentCategories.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelectCategory(c.id)}
            className={chipClass(selectedCat === c.id)}
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
            className={chipClass(selectedCat === '' && activeParent !== '')}
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
