import { useCallback, useEffect, useRef } from 'react';
import { useScrollDirection } from '../useScrollDirection';

interface UseListScrollOptions {
  /** 触底回调（距底 80px 内触发） */
  onReachBottom?: () => void;
  /** 触底回调是否可用（如「还有更多」为 false 时不触发） */
  canReachBottom?: boolean;
  /** 方向显隐变化回调，用于联动移动端顶部导航 */
  onVisibilityChange?: (visible: boolean) => void;
}

/**
 * 列表滚动通用逻辑（网页 / 视频列表共用）：
 * - 按滚动方向折叠 / 展开顶部筛选区（内部的 useScrollDirection 含过渡锁）
 * - 触底回调（rAF 节流，避免高频触发）
 *
 * @returns scrollRef 需要挂到可滚动容器上；onScroll 挂到 onScroll。
 */
export function useListScroll(options: UseListScrollOptions = {}) {
  const { onReachBottom, canReachBottom = true, onVisibilityChange } = options;

  const scrollRef = useRef<HTMLDivElement>(null);
  const { visible, onScroll: onDirectionScroll } = useScrollDirection(scrollRef);

  // 显隐变化通知外部（移动端顶部导航联动）
  useEffect(() => {
    onVisibilityChange?.(visible);
  }, [visible, onVisibilityChange]);

  // 触底：与方向判定解耦，不受过渡锁影响；用 rAF 去重
  const rafRef = useRef<number | null>(null);
  const onReachBottomRef = useRef(onReachBottom);
  onReachBottomRef.current = onReachBottom;

  const handleReachBottom = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = scrollRef.current;
      if (!el || !canReachBottom) return;
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
        onReachBottomRef.current?.();
      }
    });
  }, [canReachBottom]);

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const onScroll = useCallback(() => {
    onDirectionScroll();
    handleReachBottom();
  }, [onDirectionScroll, handleReachBottom]);

  return { scrollRef, onScroll, scrollVisible: visible };
}

export default useListScroll;
