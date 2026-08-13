import { RefreshCw, Search } from 'lucide-react';
import React from 'react';
import { Skeleton } from '@heroui/react';
import { Button } from '../../components/Button';
import { SiteCategory } from '../../api/site';

interface FilterBarProps {
  categories: SiteCategory[];
  categoryLoading: boolean;
  selectedCat: string;
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
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-slate-400 text-xs mr-1">{label}</span>
      {loading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className={SKELETON_BTN} />
        ))
      ) : (
        children
      )}
    </div>
  );
}

export const FilterBar: React.FC<FilterBarProps> = ({
  categories,
  categoryLoading,
  selectedCat,
  searchKeyword,
  loading,
  onSearchChange,
  onSelectCategory,
  onRefresh,
}) => {
  const chipClass = (active: boolean) =>
    `rounded-[var(--card-radius)] px-3 py-1.5 transition-colors ${
      active
        ? 'bg-[color:var(--accent)] font-medium text-white'
        : 'bg-black/5 text-slate-600 hover:bg-black/10 dark:bg-white/10 dark:text-slate-300'
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

      {/* Category filter */}
      <FilterRow label="分类" loading={categoryLoading}>
        <button onClick={() => onSelectCategory('')} className={chipClass(selectedCat === '')}>
          全部
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelectCategory(c.id)}
            className={chipClass(selectedCat === c.id)}
          >
            {c.name}
          </button>
        ))}
      </FilterRow>
    </div>
  );
};
