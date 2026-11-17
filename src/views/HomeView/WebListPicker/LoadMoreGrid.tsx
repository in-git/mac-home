import React, { useEffect, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import viewMoreImage from '@/assets/查看更多.webp';

/** 网格断点配置：cols 为该档列数，hideBelow 为低于该档时隐藏所用的 Tailwind 变体 */
export interface GridBreakpoint {
  cols: number;
  hideBelow: string;
}

/** 默认展示 2 排，每点一次「查看更多」多放出一排 */
const BASE_ROWS = 2;

interface UseLoadMoreRowsOptions {
  breakpoints: readonly GridBreakpoint[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void | Promise<void>;
  /** 变化时重置已放量的排数（如分类 / 搜索条件变化） */
  resetKey?: string;
}

/**
 * 「查看更多」分批放量，最新内容与高赞内容共用同一套规则：
 * 各断点显示的卡片数 = 列数 × 排数 - 1，末位留给「查看更多」卡片，
 * 因此该卡片始终落在最后一排最后一格。
 *
 * 移动端与 PC 只是列数不同，公式一致；断点切换由 CSS 变体完成，无需 JS 监听视口。
 */
export function useLoadMoreRows<T>(
  items: T[],
  {
    breakpoints,
    hasMore,
    loadingMore,
    onLoadMore,
    resetKey,
  }: UseLoadMoreRowsOptions,
) {
  const [step, setStep] = useState(0);

  // 条件变化回到第一页时重置放量，避免沿用上一次展开的排数
  const prevResetKeyRef = useRef(resetKey);
  useEffect(() => {
    if (prevResetKeyRef.current !== resetKey) {
      prevResetKeyRef.current = resetKey;
      setStep(0);
    }
  }, [resetKey]);

  const rows = BASE_ROWS + step;
  const maxCols = Math.max(...breakpoints.map((b) => b.cols));

  // 数据不足一整排时向下对齐，避免「查看更多」前出现空缺格；
  // 数据已全部加载完（hasMore=false）则放出所有卡片，按钮也随之隐藏。
  const counts = breakpoints.map(({ cols }) => {
    if (!hasMore) return items.length;
    const cap = cols * rows - 1;
    return Math.max(
      0,
      Math.floor((Math.min(items.length, cap) + 1) / cols) * cols - 1,
    );
  });
  const visibleItems = items.slice(0, Math.max(...counts));

  /** 卡片在哪些断点可见：低于其所属档位时隐藏 */
  const classNameFor = (idx: number) => {
    const level = counts.findIndex((count) => idx < count);
    return level < 0 ? '' : breakpoints[level].hideBelow;
  };

  const handleLoadMore = () => {
    setStep((s) => s + 1);
    // 下一批按最大列数估算所需数据量，不足时才追加一页
    const nextCap = maxCols * (rows + 1) - 1;
    if (hasMore && !loadingMore && items.length < nextCap) {
      void onLoadMore();
    }
  };

  return { visibleItems, classNameFor, handleLoadMore, showMore: hasMore };
}

/** 网格末尾的「查看更多」卡片：点击追加下一页，加载中显示旋转图标 */
export const ViewMoreTile: React.FC<{
  loading: boolean;
  onClick: () => void;
  label?: string;
}> = ({ loading, onClick, label = '查看更多' }) => (
  <button
    type="button"
    aria-label={label}
    aria-busy={loading}
    disabled={loading}
    onClick={onClick}
    className="flex min-h-40 cursor-pointer items-center justify-center rounded-md border border-dashed border-black/10 bg-[#f8f8f8] dark:border-white/10 disabled:cursor-default"
  >
    {loading ? (
      <LoaderCircle size={40} className="animate-spin text-blue-500" />
    ) : (
      <img
        src={viewMoreImage}
        alt={label}
        className="-translate-y-1/5 w-1/2 object-contain"
      />
    )}
  </button>
);
