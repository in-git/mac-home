import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 方向判定阈值（非对称）：
 * - 恢复（向上）阈值小：轻微上滑即恢复，避免「滚上去了但没还原」
 * - 收起（向下）阈值大：需要明确的向下意图，避免惯性滚动抖动误触发
 * - 单帧位移超过 JUMP_DELTA 视为「跳变」（首次滚动 / 浏览器恢复位置 / 程序化滚动），
 *   不作为方向依据，否则首帧就会被误判为大幅下滑而直接收起
 */
const RESTORE_DELTA = 2;
const COLLAPSE_DELTA = 10;
const JUMP_DELTA = 200;

/**
 * 允许收起所需的最小可滚动余量。
 * 内容不足一屏时，收起后可能变为不可滚动，scrollTop 被强制归零，
 * 同样会派发反向 scroll 事件引发抖动；此时收起也无收益，直接跳过。
 */
const MIN_SCROLLABLE = 60;

/**
 * 按滚动方向显隐元素（顶部导航 / 分类栏等）。
 *
 * 关键在于「过渡锁」：目标元素通常是滚动容器的 flex 兄弟节点，其高度变化会改变
 * 容器 clientHeight —— 收起时容器变高，浏览器会钳制 scrollTop 往下调，
 * 进而派发出「看起来像反向滚动」的 scroll 事件。若不忽略这段过渡期，
 * 伪事件会与用户真实滚动互相打架，表现为滚动条反复上下跳动。
 *
 * @param scrollRef 滚动容器
 * @param lockMs 过渡锁时长，需略大于目标元素的高度过渡时长（默认 360ms，对应 300ms 动画）
 */
export function useScrollDirection(
  scrollRef: React.RefObject<HTMLElement | null>,
  lockMs = 360,
) {
  const [visible, setVisible] = useState(true);
  const visibleRef = useRef(true);
  const rafRef = useRef<number | null>(null);
  const lastTopRef = useRef(0);
  const lockUntilRef = useRef(0);

  // 卸载时取消未执行的帧，避免在已卸载组件上 setState
  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const apply = useCallback(
    (next: boolean) => {
      // 仅在真正翻转时加锁，避免持续滚动时反复续锁导致恢复迟钝
      if (visibleRef.current === next) return;
      visibleRef.current = next;
      lockUntilRef.current = Date.now() + lockMs;
      setVisible(next);
    },
    [lockMs],
  );

  /** 挂到滚动容器的 onScroll；内部以 rAF 节流 */
  const onScroll = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = scrollRef.current;
      if (!el) return;

      // 先刷新基准值，保证锁定期内的位移也被正确跟踪
      const top = el.scrollTop;
      const delta = top - lastTopRef.current;
      lastTopRef.current = top;

      // 过渡锁定期内（高度动画引发的伪滚动）或跳变，均忽略
      if (Date.now() < lockUntilRef.current) return;
      if (Math.abs(delta) > JUMP_DELTA) return;

      const scrollable = el.scrollHeight - el.clientHeight;

      if (top <= 8) {
        apply(true);
      } else if (delta < -RESTORE_DELTA) {
        apply(true);
      } else if (delta > COLLAPSE_DELTA && scrollable > MIN_SCROLLABLE) {
        apply(false);
      }
    });
  }, [apply, scrollRef]);

  /** 手动恢复（如切换分类后回到顶部） */
  const show = useCallback(() => apply(true), [apply]);

  return { visible, onScroll, show };
}
