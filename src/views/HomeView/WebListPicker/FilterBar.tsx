import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/Button/Button';
import { SearchBar } from '@/components/SearchBar';
import { FlatCategory } from './category';

interface FilterBarProps {
  /** 一级分类（含「推荐」由本组件内部追加） */
  categories: FlatCategory[];
  /**
   * **完整分类树**下的子级映射：一级 id → 其二级分类列表。
   *
   * 用于把「有子级的一级」展开平铺成同一行的胶囊，以及渲染其下的二级。
   */
  childrenByParent: Map<string, FlatCategory[]>;
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

/**
 * 分类胶囊的公共样式：**宽度固定为 4 个汉字**（`--chip-w`）。
 *
 * 固定宽度的前提是全局等宽字体（见 index.css）：等宽下 4 个汉字与
 * 4 个拉丁字符推进宽度接近，按钮才不会「有的很宽有的很窄」。
 * 内容超出 4 字时由 Button 内部的 `truncate` 截断。
 *
 * 高度：Button 的 `xs-md` 档给的是移动端 24px / PC 36px。
 * 移动端那 24px 作为**触摸目标偏小**（iOS / Material 建议至少 44 / 48dp，
 * 至少也要 32px 以上才好点），因此这里在移动端抬高到 32px；
 * PC 用鼠标、指针精度高，维持原有 36px 不动。
 *
 * 宽度不受高度影响：`--chip-w` 是按字符数算的，与高度各管一轴。
 */
const CHIP_CLASS =
  'h-8 sm:h-9 w-[var(--chip-w)] max-w-[var(--chip-w)] border border-black/10 sm:border-2 sm:border-black/15 dark:border-white/15 dark:sm:border-white/20';

/**
 * 子级胶囊的降级样式：靠降低不透明度与其它项区分。
 */
const SUB_CHIP_CLASS = 'opacity-80';

/**
 * 网页列表顶部筛选区：搜索框 + 分类行。
 *
 * 分类**全部平铺在同一行**（推荐 / 各分类），不分层级下拉 ——
 * 一眼能看到所有可选项，少一次交互。
 *
 * 布局：**单行横向排布**。
 * - 内容不足一行：整行居中（`w-max min-w-full justify-center`）；
 * - 内容超出一行：横向滚动，移动端左右两侧出现滚动箭头。
 *
 * 展平规则：
 * - 有子级的父分类**只展示其子级**（父级自身移除，避免与子级重复）；
 * - 无子级的父分类作为独立项展示；
 * - 子级胶囊降低不透明度，与独立项区分（`SUB_CHIP_CLASS`）。
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  categories,
  childrenByParent,
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

  /** 分类行的滚动容器：用于横向滚动与溢出判断 */
  const scrollRef = useRef<HTMLDivElement>(null);
  /** 左 / 右是否还有可滚动内容（决定移动端箭头显隐） */
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  /**
   * 重新计算左右溢出状态（滚动、缩放、数据变化后都要调）。
   *
   * 注意"是否可滚动"要看 `scrollWidth > clientWidth`：内容不足一行时整行居中、
   * 根本没得滚，此时两个箭头都该隐藏。
   */
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < maxScroll - 1);
  }, []);

  // 内容变化 / 视口变化时重算溢出状态
  useEffect(() => {
    updateScrollState();

    const el = scrollRef.current;
    if (!el) return;

    // ResizeObserver 比 window.resize 更准：容器宽度会随侧栏折叠等变化，
    // 那些不会触发 window resize
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateScrollState, categories, childrenByParent, expanded]);

  /** 点箭头：按容器宽度滚动一屏 */
  const scrollByPage = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };

  /**
   * 分类平铺列表：首项「推荐」，其后按序展开各分类。
   *
   * 展平规则：父分类若有子级则只保留子级（父级移除，避免重复），
   * 子级经 `parentId` 记录所属父级，点击时用于同步父级选中。
   */
  type Tile = { chip: FlatCategory; sub: boolean; parentId: string };
  const tiles: Tile[] = [
    {
      chip: { id: ALL_CATEGORY_ID, name: ALL_CATEGORY_LABEL, level: 0 },
      sub: false,
      parentId: ALL_CATEGORY_ID,
    },
    ...categories.flatMap((c) => {
      const children = childrenByParent.get(c.id) ?? [];
      // 有子级：只平铺子级，移除父级本身
      if (children.length > 0) {
        return children.map((s) => ({ chip: s, sub: true, parentId: c.id }));
      }
      // 无子级：作为独立分类展示
      return [{ chip: c, sub: false, parentId: c.id }];
    }),
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
        <div className="min-h-0 overflow-hidden">
          {categoryLoading ? (
            // 骨架屏：与真实布局一致的一行胶囊占位，同样居中
            <div className="flex items-center justify-center gap-2 overflow-hidden">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-6 w-[var(--chip-w)] shrink-0 animate-pulse rounded-md bg-black/5 sm:h-9 dark:bg-white/10"
                />
              ))}
            </div>
          ) : (
            <div className="relative">
             
              <button
                type="button"
                aria-label="向左滚动分类"
                onClick={() => scrollByPage(-1)}
                className={`absolute left-0 top-0 bottom-0 z-10 hidden w-7 cursor-pointer items-center justify-start bg-gradient-to-r from-white to-transparent transition-opacity duration-200 max-sm:flex ${
                  canScrollLeft ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
              >
                <ChevronLeft size={16} className="shrink-0" />
              </button>

              <div
                ref={scrollRef}
                onScroll={updateScrollState}
                className="overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <div className="flex w-max min-w-full items-center justify-center gap-2">
                  {tiles.map((t) => {
                  const { chip, sub, parentId } = t;
                  // 二级的选中态看 selectedCat；一级的看 selectedParent
                  const active = sub
                    ? chip.id === selectedCat
                    : chip.id === selectedParent;

                  return (
                    <Button
                      key={`${parentId}-${chip.id || 'all'}`}
                      variant="pill"
                      size="xs-md"
                      active={active}
                      onClick={() => {
                        if (sub) {
                     
                          if (selectedParent !== parentId) {
                            onSelectParent(parentId);
                          }
                          onSelectCategory(chip.id);
                        } else {
                          onSelectParent(chip.id);
                        }
                      }}
                      className={`${CHIP_CLASS} ${sub ? SUB_CHIP_CLASS : ''}`}
                    >
                        <span className="truncate">{chip.name}</span>
                    </Button>
                  );
                })}
                </div>
              </div>

              <button
                type="button"
                aria-label="向右滚动分类"
                onClick={() => scrollByPage(1)}
                className={`absolute right-0 top-0 bottom-0 z-10 hidden w-7 cursor-pointer items-center justify-end bg-gradient-to-l from-white to-transparent transition-opacity duration-200 max-sm:flex ${
                  canScrollRight ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
              >
                <ChevronRight size={16} className="shrink-0" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
