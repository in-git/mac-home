import { ChevronDown } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { SiteCategory } from '@/api/site';

interface CategoryDropdownProps {
  /** 待展示的全部分类（超出一行的会被收进下拉里） */
  categories: SiteCategory[];
  /** 当前选中的分类 id，用于下拉项高亮 */
  activeId: string;
  onSelect: (id: string) => void;
  /** 分类行收起时禁用交互 */
  disabled?: boolean;
}

/**
 * 分类溢出下拉菜单：点击展开全部，选中或点击外部后关闭。
 */
const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  categories,
  activeId,
  onSelect,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // 点击外部 / ESC 关闭
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (categories.length === 0) return null;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-label="展开全部分类"
        aria-expanded={open}
        className="flex h-7 w-8 items-center justify-center rounded-md bg-black/5 text-slate-500 transition-colors hover:bg-black/10 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20"
      >
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 max-h-64 w-40 overflow-y-auto rounded-md border border-black/5 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#2C2C2E]">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onSelect(c.id);
                setOpen(false);
              }}
              className={`block w-full truncate rounded px-2.5 py-1.5 text-left text-md transition-colors ${
                activeId === c.id
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface CategoryRowProps {
  label: string;
  loading: boolean;
  /** 分类列表 */
  categories: SiteCategory[];
  /** 当前选中的分类 id */
  activeId: string;
  onSelect: (id: string) => void;
  /** 分类行收起时禁用交互 */
  disabled?: boolean;
  /** 「全部」按钮：仅子级分类行需要 */
  allLabel?: string;
  allActive?: boolean;
  allValue?: string;
}

/**
 * 单行分类：不换行，超出部分溢出隐藏；当内容装不下时，最右侧出现下拉图标，
 * 点击展开包含全部分类的下拉菜单。
 *
 * 溢出检测：容器宽度变化时用 ResizeObserver 比较 scrollWidth / clientWidth。
 */
const CategoryRow: React.FC<CategoryRowProps> = ({
  label,
  loading,
  categories,
  activeId,
  onSelect,
  disabled,
  allLabel,
  allActive,
  allValue,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => {
      // +1 容差，避免亚像素误差导致误判
      setOverflow(el.scrollWidth - el.clientWidth > 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [categories, loading, label]);

  const chipClass = (active: boolean) =>
    `shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 transition-colors ${
      active
        ? 'bg-blue-500 text-white'
        : 'bg-black/5 hover:bg-black/10 dark:bg-white/10 '
    }`;

  return (
    <div className="flex items-center gap-2 text-md">
      <span className="mr-1 shrink-0 text-xs text-slate-400">{label}</span>

      {/* 不换行容器：超出横向裁剪，由右侧下拉补充 */}
      <div ref={scrollRef} className="min-w-0 flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-7 w-16 shrink-0 animate-pulse rounded-md bg-black/5 dark:bg-white/10" />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {allLabel && (
              <button
                type="button"
                onClick={() => onSelect(allValue ?? '')}
                disabled={disabled}
                className={chipClass(!!allActive)}
              >
                {allLabel}
              </button>
            )}
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.id)}
                disabled={disabled}
                className={chipClass(activeId === c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 溢出时才出现的下拉入口 */}
      {!loading && overflow && (
        <CategoryDropdown
          categories={categories}
          activeId={activeId}
          onSelect={onSelect}
          disabled={disabled}
        />
      )}
    </div>
  );
};

export default CategoryRow;
