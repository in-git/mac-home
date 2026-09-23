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
 * 二级胶囊的降级样式。
 *
 * 二级与一级是同一套胶囊，靠**降低不透明度**区分层级 ——
 * 比换一套配色更轻，也不会让它看起来像另一种控件。
 */
const SUB_CHIP_CLASS = 'opacity-80';

/**
 * 网页列表顶部筛选区：搜索框 + 分类行。
 *
 * 分类**全部平铺在同一行**（推荐 / 一级 / 其下的二级），而不是把二级藏进
 * 下拉或浮层 —— 一眼能看到所有可选项，少一次交互。
 *
 * 布局：**单行横向排布**。
 * - 内容不足一行：整行居中（`w-max min-w-full justify-center`）；
 * - 内容超出一行：横向滚动，移动端左右两侧出现滚动箭头。
 *
 * 层级用两件事表达，而不是靠"藏起来"：
 * - 二级胶囊紧跟在其一级之后，且降低不透明度（`SUB_CHIP_CLASS`）；
 * - **不用箭头图标提示"有子级"** —— 二级已直接平铺在旁，箭头纯属冗余噪音。
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
    // 留 1px 容差：子像素舍入会让 scrollWidth 与 clientWidth 差出零点几像素，
    // 严格比较会导致"明明滚到头了箭头还亮着"
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
   * 分类平铺列表：首项「推荐」，其后每个一级都紧跟其全部二级。
   *
   * 用扁平数组（而非两级嵌套）渲染：层级已由「紧跟其后 + 降低透明度」表达，
   * 扁平化后布局只需一种居中换行规则，不必为两级各写一套。
   */
  type Tile = { chip: FlatCategory; sub: boolean; parentId: string };
  const tiles: Tile[] = [
    {
      chip: { id: ALL_CATEGORY_ID, name: ALL_CATEGORY_LABEL, level: 0 },
      sub: false,
      parentId: ALL_CATEGORY_ID,
    },
    ...categories
      .filter((c) => c.level === 0)
      .flatMap((c) => [
        { chip: c, sub: false, parentId: c.id },
        // 二级跟在其一级之后；`parentId` 指向所属一级，点击时用于同步父级
        ...(childrenByParent.get(c.id) ?? []).map((s) => ({
          chip: s,
          sub: true,
          parentId: c.id,
        })),
      ]),
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
            /* `relative` 是左右箭头的定位基准 */
            <div className="relative">
              {/*
                移动端左箭头：仅当左侧还有内容时出现。

                做成**贴边渐隐**样式而不是居中浮起的圆形按钮：
                圆形按钮必然要压在胶囊上（或被留白顶开），
                那样分类就无法与下方卡片左右对齐。渐隐则是"压在边缘",
                视觉上像内容延伸出去被截断，天然提示"左边还有"。
                用 `pointer-events-none` + 透明度过渡隐藏，
                避免透明箭头仍拦截下方胶囊的点击。
              */}
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

              {/*
                分类行：单行横向排布 + 溢出滚动。

                居中做法是「内层 `w-max mx-auto`」，**不是**滚动容器直接
                `justify-center`：后者在内容溢出时会把起始部分推到滚动起点左侧，
                左侧内容永远滚不到（浏览器不会把负向滚动区算进去），
                表现为「第一个分类点不到」。用 `mx-auto` 让内层在容器更宽时
                自动居中，溢出时则老老实实从 0 开始，两端都能滚到。

                `overscroll-x-contain` 防止滑到头时带动页面整体左右晃动；
                滚动条隐藏 —— 移动端有箭头提示，桌面端滚轮 / 触控板已足够。
              */}
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
                          /*
                            点二级：先把一级切过去（保证 selectedParent 与
                            selectedCat 同属一条分支），再设二级。
                            两者都是 setState，同一次事件里批量生效。
                          */
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

              {/* 移动端右箭头：仅当右侧还有内容时出现，与左箭头同为贴边渐隐 */}
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
