import { Check, ChevronDown } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { FlatCategory } from './category';

interface FilterBarProps {
  /** 一级分类（含「推荐」由本组件内部追加） */
  categories: FlatCategory[];
  /** 当前选中一级分类下的二级分类；无二级时为空数组 */
  subCategories: FlatCategory[];
  /** 当前选中一级分类的 id，空表示「推荐」 */
  selectedParent: string;
  categoryLoading: boolean;
  /** 当前选中的分类 id，空表示「推荐」 */
  selectedCat: string;
  searchKeyword: string;
  loading: boolean;
  /** 是否展示分类行：随列表滚动方向折叠 / 展开 */
  showCategories: boolean;
  onSearchChange: (kw: string) => void;
  /** 点击搜索按钮 / 回车：立即以当前关键词搜索（跳过防抖等待） */
  onSearchSubmit: () => void;
  /** 选择一级分类：切换后清空二级选中 */
  onSelectParent: (id: string) => void;
  /** 选择二级分类 */
  onSelectCategory: (id: string) => void;
}

/**
 * 顶部第一行**首项**的固定 id 与文案。
 *
 * 空 id 表示「不按分类筛选」，即首页默认态：此时展示头条区（推荐轮播 + 排行榜 + 推荐宫格）。
 * 文案为「推荐」而非「全部」：这一项在观感上就是「看推荐」，与其它分类是并列关系。
 */
export const ALL_CATEGORY_ID = '';
export const ALL_CATEGORY_LABEL = '推荐';

/** 一级下拉的菜单项：可能是「推荐」，也可能是某个一级分类 */
type ParentOption = FlatCategory & {
  /** 是否有子级：决定是否展示实心箭头 */
  hasChildren: boolean;
};

/**
 * 分类下拉按钮。
 *
 * 选中态用强调色实心表达（与旧胶囊标签的选中态一致，保持视觉延续），
 * `hasChildren` 为真时在文字右侧显示**实心**下箭头，提示「点开还有子分类」。
 */
const CategoryDropdown: React.FC<{
  label: string;
  active: boolean;
  open: boolean;
  /**
   * 是否有子级。为真时展示实心下箭头。
   *
   * 箭头用 `fill-current` 画成实心三角，而不是 lucide 默认的描边 V 形 ——
   * 描边箭头在浅底上偏细、容易和文字糊在一起，实心块更醒目。
   */
  hasChildren?: boolean;
  disabled?: boolean;
  onClick: () => void;
}> = ({ label, active, open, hasChildren = false, disabled, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    aria-haspopup="listbox"
    aria-expanded={open}
    onClick={onClick}
    className={`inline-flex h-6 shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 select-none sm:h-9 sm:px-3 sm:text-md ${
      active
        ? 'bg-blue-500 text-white'
        : 'bg-black/5 text-slate-700 hover:bg-black/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20'
    } disabled:opacity-50 disabled:pointer-events-none`}
  >
    <span className="truncate">{label}</span>
    {hasChildren && (
      <ChevronDown
        size={12}
        strokeWidth={0}
        className={`shrink-0 fill-current transition-transform duration-200 ${
          open ? 'rotate-180' : ''
        }`}
      />
    )}
  </button>
);

/**
 * 下拉菜单面板。
 *
 * **绝对定位**，因此展开时不会把下方内容顶下去 —— 这是它相对旧「两行胶囊」
 * 的核心收益：不占用列表空间，收起时只留一行高度。
 */
const DropdownPanel: React.FC<{
  options: { id: string; name: string; hasChildren?: boolean }[];
  selectedId: string;
  onSelect: (id: string) => void;
  /**
   * 面板宽度策略：`min-w` 撑到与触发按钮等宽，内容更长时再自行变宽。
   * 分类名长短差异大，固定宽度会出现文字被截断或大片留白。
   */
}> = ({ options, selectedId, onSelect }) => (
  <div
    role="listbox"
    className="absolute left-0 top-full z-30 mt-1.5 max-h-72 min-w-full overflow-y-auto rounded-lg border border-black/5 bg-white py-1 shadow-lg ring-1 ring-black/5 dark:border-white/10 dark:bg-slate-800 dark:ring-white/10"
  >
    {options.map((opt) => {
      const selected = opt.id === selectedId;
      return (
        <button
          key={opt.id || 'recommend'}
          type="button"
          role="option"
          aria-selected={selected}
          onClick={() => onSelect(opt.id)}
          className={`flex w-full cursor-pointer items-center gap-1.5 whitespace-nowrap px-3 py-2 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${
            selected
              ? 'font-medium text-[color:var(--accent)]'
              : 'text-slate-700 dark:text-slate-200'
          }`}
        >
          <span className="flex-1 truncate">{opt.name}</span>
          {/* 有子级的项在菜单里也用同一个实心箭头提示 */}
          {opt.hasChildren && (
            <ChevronDown
              size={11}
              strokeWidth={0}
              className="-rotate-90 shrink-0 fill-current opacity-50"
            />
          )}
          {selected && <Check size={14} className="shrink-0" />}
        </button>
      );
    })}
  </div>
);

/**
 * 网页列表顶部筛选区：搜索框 + 分类下拉。
 *
 * 分类收进**两个下拉**（一级、以及选中一级有子级时的二级），
 * 收起时只占一行，不再像旧的「两行胶囊」那样长期占用列表空间。
 *
 * 有子级的一级分类在其按钮上显示实心下箭头，提示可展开子分类。
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

  // 当前展开的下拉：null 表示都收起。同一时刻只允许开一个
  const [openMenu, setOpenMenu] = useState<'parent' | 'child' | null>(null);

  // 下拉容器的 ref：用于点击外部 / Esc 关闭
  const containerRef = useRef<HTMLDivElement>(null);

  // 聚焦输入框时等同于「向上滚动」：分类与紧凑态一并还原
  const expanded = showCategories || searchFocused;
  const compact = !expanded;

  // 折叠时（未展开）强制关闭下拉，避免分类行不可见却仍浮着一个面板
  useEffect(() => {
    if (!expanded) setOpenMenu(null);
  }, [expanded]);

  // 点击面板外部 / 按 Esc 时关闭下拉
  useEffect(() => {
    if (!openMenu) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openMenu]);

  // 一级选项：首项为「推荐」（不筛选），其余为真实一级分类。
  // `hasChildren` 取自该分类是否有二级，用于决定是否显示实心箭头。
  const parentOptions: ParentOption[] = [
    { id: ALL_CATEGORY_ID, name: ALL_CATEGORY_LABEL, level: 0, hasChildren: false },
    ...categories
      .filter((c) => c.level === 0)
      .map((c) => ({
        ...c,
        // 仅当前选中的一级能拿到子级列表；未选中时无从判断，
        // 由调用方传入的 categories 无法表达「是否有子级」，
        // 因此这里以「是否为当前选中」+ 子级列表共同推断（见下方 hasChildrenOf）
        hasChildren: false,
      })),
  ];

  /**
   * 判断某个一级分类是否有子级。
   *
   * 接口只在「选中该一级」后才返回其子级，因此对**当前选中**的一级可以直接看
   * `subCategories`；未选中的一级无法得知，此时按「存在子级」保守显示箭头 ——
   * 分类树里一级带子级是压倒性的常见情况，多显示箭头远好于漏提示；
   * 若点开后确实没有子级，二级下拉自然不会出现，不影响使用。
   */
  const hasChildrenOf = (id: string): boolean => {
    if (id === ALL_CATEGORY_ID) return false;
    if (id === selectedParent) return subCategories.length > 0;
    return true;
  };

  // 一级按钮的文案：选中「推荐」显「推荐」，否则显对应分类名
  const parentLabel =
    selectedParent === ALL_CATEGORY_ID
      ? ALL_CATEGORY_LABEL
      : parentOptions.find((c) => c.id === selectedParent)?.name ??
        ALL_CATEGORY_LABEL;

  // 二级按钮的文案：未选中二级时提示「全部」，让用户知道还能再缩小范围
  const childLabel =
    subCategories.find((c) => c.id === selectedCat)?.name ?? '全部';

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
        <div className="overflow-hidden min-h-0">
          {categoryLoading ? (
            // 骨架屏：与真实布局一致的一行两个下拉占位
            <div className="flex items-center gap-2">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-6 w-20 shrink-0 animate-pulse rounded-md bg-black/5 sm:h-9 sm:w-28 dark:bg-white/10"
                />
              ))}
            </div>
          ) : (
            <div ref={containerRef} className="relative flex items-center gap-2">
              {/* 一级分类下拉：始终存在，收起时显示当前选中的分类名 */}
              <div className="relative">
                <CategoryDropdown
                  label={parentLabel}
                  active={selectedParent !== ALL_CATEGORY_ID}
                  open={openMenu === 'parent'}
                  hasChildren={hasChildrenOf(selectedParent)}
                  disabled={!expanded}
                  onClick={() =>
                    setOpenMenu((cur) => (cur === 'parent' ? null : 'parent'))
                  }
                />
                {openMenu === 'parent' && (
                  <DropdownPanel
                    options={parentOptions.map((c) => ({
                      id: c.id,
                      name: c.name,
                      hasChildren: hasChildrenOf(c.id),
                    }))}
                    selectedId={selectedParent}
                    onSelect={(id) => {
                      setOpenMenu(null);
                      if (id !== selectedParent) onSelectParent(id);
                    }}
                  />
                )}
              </div>

              {/* 二级分类下拉：仅当前一级有子级时出现 */}
              {subCategories.length > 0 && (
                <div className="relative">
                  <CategoryDropdown
                    label={childLabel}
                    active={selectedCat !== selectedParent}
                    open={openMenu === 'child'}
                    disabled={!expanded}
                    onClick={() =>
                      setOpenMenu((cur) => (cur === 'child' ? null : 'child'))
                    }
                  />
                  {openMenu === 'child' && (
                    <DropdownPanel
                      // 首项「全部」：回到该一级下的全部分类（即清空二级筛选）
                      options={[
                        { id: selectedParent, name: '全部' },
                        ...subCategories.map((c) => ({
                          id: c.id,
                          name: c.name,
                        })),
                      ]}
                      selectedId={selectedCat}
                      onSelect={(id) => {
                        setOpenMenu(null);
                        onSelectCategory(id);
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
