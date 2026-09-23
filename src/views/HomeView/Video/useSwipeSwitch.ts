import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 竖向轮播：用「原生滚动 + CSS scroll-snap」实现，而非手写 touch 手势。
 *
 * 为什么换掉手写手势：
 * 1. 手写方案要自己处理 touchstart/move/end、touchcancel、边界阻尼、
 *    甩动速度、吸附动画… 而且移动端浏览器随时可能接管手势并补发
 *    touchcancel，表现为「滑了却弹回、切不到下一个」，稳定性依赖运气。
 * 2. 原生滚动容器自带：惯性滚动、速度感知的吸附（一甩即切换）、
 *    a11y（键盘 PageUp/PageDown）。scroll-snap 的吸附动画由合成器
 *    线程执行，不掉帧。
 *
 * 因此这里只做五件事：
 * - 给容器加 `scroll-snap-type: y mandatory`，每层 `scroll-snap-align: start`
 * - 监听 scroll：算出「停在那一层」并上报
 * - 通知滚动中状态：拖动/惯性期间隐藏浮层 UI
 * - 快滚到接近尾部时通知上层分页加载（与网页模块的触底加载一致）
 * - PC 端滚轮一动就翻一屏（仅用冷却时间节流）
 *
 * 关于 ArtPlayer 抢手势：播放器内部声明了自己的 touch-action，
 * 会让浏览器把手势判给播放器而非滚动容器。解决办法在
 * `playerTheme.css` 中统一声明 `touch-action: pan-y`，
 * 让纵向滚动交还父容器、横向保留给播放器拖进度。
 */

/** 滚动停止的判定时长（ms）：多久没有 scroll 事件就认为惯性结束 */
const SCROLL_IDLE_MS = 120;

/**
 * 触发首尾回环所需的「越界」量（层数）。
 *
 * 取 0.6 而非很小值：scroll-snap + iOS 橡皮筋会让 scrollTop 反复越界一点点，
 * 阈值太小会在边界处疯狂来回跳转。0.6 层意味着用户确实「使劲往外拽了」。
 */
const WRAP_OVERFLOW = 0.6;

/**
 * 距尾部还剩多少层时触发分页加载。
 *
 * 取 4：短视频单层即一屏，用户连滑几下就会到尾部；提前 4 层开始拉，
 * 等滑到时候新数据已经就位，不会出现「滑到最后一屏就滑不动」的断档。
 */
const LOAD_MORE_THRESHOLD = 4;

/**
 * 连续翻屏的最小间隔（ms）。
 *
 * 不再设「累计多远才算一格」的门槛：只要滚轮动了就切换一屏。
 * 但一次滚轮手势会被浏览器拆成 5~15 个 wheel 事件连续派发，
 * 没有节流就会一划跳过五六条视频，所以这里保留冷却时间作为唯一闸门。
 *
 * scroll-snap 的吸附动画约 300~400ms，冷却取 420ms 让动画走完再接受下一次，
 * 视觉上才是「一屏一屏地翻」而不是「唰地滑过去」。
 */
const WHEEL_COOLDOWN_MS = 420;

/** 滚轮方向 -> 目标层偏移 */
const WHEEL_DIRECTION: Record<'next' | 'prev', 1 | -1> = {
  next: 1,
  prev: -1,
};

interface UseSwipeSwitchOptions {
  /** 是否启用 */
  enabled: boolean;
  /** 当前项在列表中的下标 */
  activeIndex: number;
  /** 列表总长度 */
  count: number;
  /** 用户滚动停留在某一项时触发 */
  onIndexChange: (index: number) => void;
  /**
   * 是否允许「首尾循环」：末尾继续下滑则滚回第一项，开头继续上滑则滚到最后一项。
   * 需要 count 足够多（>= 3），否则回环时会经过中间项造成连续跳转。
   *
   * 与分页加载互斥：回环意味着末尾后面「又是开头」，
   * 此时再谈「快到尾部要拉下一页」自相矛盾。二者同时开启时以回环为准
   * （见下方 `canLoadMore` 的判定）。
   */
  loop?: boolean;
  /** 是否还有下一页（决定是否触发 onReachEnd） */
  hasMore?: boolean;
  /** 追加加载中（避免重复触发） */
  loadingMore?: boolean;
  /** 滚到接近尾部时触发，用于分页加载下一页 */
  onReachEnd?: () => void;
  /**
   * 是否接管 PC 滚轮。
   *
   * 移动端为 false：触摸板/鼠标滚轮在手机上罕见，且真机上 wheel 事件
   * 与触摸滚动可能同时到达，接管反而会打架。
   */
  wheelEnabled?: boolean;
}

export interface UseSwipeSwitchResult {
  /** 挂在滚动容器上（`overflow-y-auto` + `scroll-snap-type: y mandatory`） */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** 当前吸附所在的层下标（0-based，对应 items 里的位置） */
  activeIndex: number;
  /** 是否正在滚动（含吸附动画 / 翻屏过渡，用于暂时淡出浮层） */
  scrolling: boolean;
  /** 滚动到指定层（带平滑动画） */
  scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
}

/**
 * 竖向轮播（scroll-snap 版）。
 *
 * 使用约定：
 * - 容器高度必须是「一屏」，每一层由其内部撑满滚动容器高度
 * - 层的顺序即列表顺序（上一个是前一层，下一个是后一层）
 * - `onIndexChange` 必须幂等：内部按「停稳的层下标」去重后再上报
 */
export function useSwipeSwitch({
  enabled,
  activeIndex,
  count,
  onIndexChange,
  loop = false,
  hasMore = false,
  loadingMore = false,
  onReachEnd,
  wheelEnabled = false,
}: UseSwipeSwitchOptions): UseSwipeSwitchResult {
  const containerRef = useRef<HTMLDivElement>(null);

  /** 吸附所在的层下标（0-based） */
  const [snapped, setSnapped] = useState(Math.max(0, activeIndex));
  /** 滚动中（含惯性阶段） */
  const [scrolling, setScrolling] = useState(false);

  /** 上次上报的层下标，避免同一层重复上报 */
  const reportedRef = useRef(activeIndex);
  /** 滚动静止定时器 */
  const idleTimerRef = useRef<number | null>(null);
  /** 是否正在进行「程序化滚动」（回环跳转 / 外部切换），期间不响应 scroll 推导 */
  const programmaticRef = useRef(false);
  /** 回环跳转的定时器 */
  const loopTimerRef = useRef<number | null>(null);
  /** 一次「到尾」期间只触发一次分页加载，滚离尾部后复位 */
  const reachedEndRef = useRef(false);

  /** 上次翻屏的时间戳，用于滚轮冷却判定 */
  const lastWheelTurnRef = useRef(0);

  /** 回调 / 参数放 ref，供事件监听读取最新值而不必重建监听 */
  const onIndexChangeRef = useRef(onIndexChange);
  const onReachEndRef = useRef(onReachEnd);
  const countRef = useRef(count);
  const loopRef = useRef(loop);
  const activeIndexRef = useRef(activeIndex);
  const hasMoreRef = useRef(hasMore);
  const loadingMoreRef = useRef(loadingMore);
  const snappingRef = useRef(false);
  onIndexChangeRef.current = onIndexChange;
  onReachEndRef.current = onReachEnd;
  countRef.current = count;
  loopRef.current = loop;
  activeIndexRef.current = activeIndex;
  hasMoreRef.current = hasMore;
  loadingMoreRef.current = loadingMore;

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const clearLoopTimer = useCallback(() => {
    if (loopTimerRef.current !== null) {
      window.clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
  }, []);

  /** 单层高度（= 滚动容器可视高度），用于把 scrollTop 换算成层下标 */
  const layerHeight = useCallback(() => {
    const el = containerRef.current;
    return el && el.clientHeight > 0 ? el.clientHeight : 1;
  }, []);

  /** 从当前 scrollTop 推导吸附层下标（四舍五入到最近一层） */
  const readIndex = useCallback(() => {
    const el = containerRef.current;
    if (!el) return 0;
    const h = layerHeight();
    return Math.max(
      0,
      Math.min(countRef.current - 1, Math.round(el.scrollTop / h)),
    );
  }, [layerHeight]);

  /**
   * 滚动到指定层。
   *
   * 回环场景（末尾 → 第一项）不能用平滑滚动：那会「倒着快速滚过」中间所有层，
   * 看起来像倒放。此时改用 `auto` 直接跳，跳过中间过程。
   */
  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      const el = containerRef.current;
      if (!el) return;
      const clamped = Math.max(0, Math.min(countRef.current - 1, index));
      const h = layerHeight();
      const distance = Math.abs(clamped - Math.round(el.scrollTop / h));
      const wrap = behavior === 'smooth' && distance > 1;
      programmaticRef.current = true;
      el.scrollTo({ top: clamped * h, behavior: wrap ? 'auto' : behavior });
      // 跳转完成后释放：留一帧给浏览器派发 scroll
      window.requestAnimationFrame(() => {
        programmaticRef.current = false;
      });
    },
    [layerHeight],
  );

  /**
   * 滚动事件：更新滚动中状态、推导吸附层、处理首尾回环、分页加载、上报切换。
   *
   * 上报时机放在「滚动停稳后」（idle）而非溢出瞬间：
   * 一次快速甩动可能连滚两三层，中间层只是路过，不该触发播放与计数上报。
   */
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled) return;

    const onScroll = () => {
      const total = countRef.current;
      setScrolling(true);

      const current = readIndex();
      setSnapped(current);

      // 目标层：按滚动方向决定取上取整还是下取整
      const h = layerHeight();
      const raw = el.scrollTop / h;

      // 滚动过程中就同步上报：标题 / 文案需要跟着当前层即时变化，
      // 等停稳再改会有明显的「文字不同步」观感。
      if (current !== reportedRef.current && !programmaticRef.current) {
        reportedRef.current = current;
        onIndexChangeRef.current(current);
      }

      /**
       * 分页加载：与网页模块的触底加载同构，只是「触底」换成「接近尾部」。
       *
       * 回环开启时不做分页：那意味着末尾后面接的是开头，不存在「下一页」。
       */
      const canLoadMore = !loopRef.current && hasMoreRef.current;
      if (canLoadMore && !loadingMoreRef.current && onReachEndRef.current) {
        if (raw >= total - 1 - LOAD_MORE_THRESHOLD) {
          if (!reachedEndRef.current) {
            reachedEndRef.current = true;
            onReachEndRef.current();
          }
        } else if (raw < total - 1 - LOAD_MORE_THRESHOLD - 1) {
          // 滚离触发区（留 1 层迟滞）后复位，允许下一次继续触发
          reachedEndRef.current = false;
        }
      } else if (!canLoadMore) {
        reachedEndRef.current = false;
      }

      // 首尾回环：末尾使劲下滑 → 第一项；开头使劲上滑 → 最后一项
      if (loopRef.current && total >= 3 && !programmaticRef.current) {
        const overflowingDown = raw > total - 1 + WRAP_OVERFLOW;
        const overflowingUp = raw < -WRAP_OVERFLOW;
        if (overflowingDown || overflowingUp) {
          const dest = overflowingDown ? 0 : total - 1;
          clearLoopTimer();
          loopTimerRef.current = window.setTimeout(() => {
            loopTimerRef.current = null;
            reportedRef.current = dest;
            scrollToIndex(dest, 'auto');
            onIndexChangeRef.current(dest);
          }, 80);
        }
      }

      clearIdleTimer();
      idleTimerRef.current = window.setTimeout(() => {
        idleTimerRef.current = null;
        setScrolling(false);
        snappingRef.current = false;
        // 停稳后按最终层校正一次，避免 scroll 事件被合并导致的偏差
        const settled = readIndex();
        setSnapped(settled);
        if (settled !== reportedRef.current) {
          reportedRef.current = settled;
          onIndexChangeRef.current(settled);
        }
      }, SCROLL_IDLE_MS);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      clearIdleTimer();
      clearLoopTimer();
    };
  }, [
    enabled,
    readIndex,
    layerHeight,
    scrollToIndex,
    clearIdleTimer,
    clearLoopTimer,
  ]);

  /**
   * PC 滚轮翻屏。
   *
   * 挂载在 window 而非容器上：播放器会铺满整个视口、且 ArtPlayer 内部
   * 有自己的 overlay 层，容器上的 wheel 很容易被覆盖元素截走。
   * 因为播放层是全屏模态，window 级监听等价于「页面上任何地方滚动」。
   */
  useEffect(() => {
    if (!enabled || !wheelEnabled) return;

    const onWheel = (e: WheelEvent) => {
      // 允许用户按住 Ctrl/⌘ + 滚轮做浏览器缩放，不要吞掉
      if (e.ctrlKey || e.metaKey) return;

      /**
       * 播放器内部带滚轮的浮层（设置面板里的音量/倍速列表、
       * 右键菜单）需要自己滚动，不能被我们截走。
       */
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('.art-settings, .art-contextmenus, .art-selector')) {
        return;
      }

      // 只看方向，不看大小：滚轮动了就翻一屏
      if (e.deltaY === 0) return;

      /**
       * 必须 `preventDefault` 并用 `{ passive: false }` 注册：
       * 1. 容器本身是 `overflow-y-scroll`，不拦的话浏览器会同时做原生滚动，
       *    与我们按层换算的结果叠加，出现「滚一次跳两屏」。
       * 2. 拦住原生滚动的另一个好处：原生滚动的 delta 是线性像素，
       *    一屏动 100px 毫无观感；按层翻才有「换了个视频」的确定感。
       */
      e.preventDefault();

      // 吸附动画进行中：吞掉事件，等动画走完再接受下一次
      if (snappingRef.current) return;

      /**
       * 冷却：唯一的节流闸门。
       *
       * 没有累计距离门槛后，这里就是防止「一次滚动跳五六条」的全部依靠：
       * 浏览器会把一次滚轮手势拆成 5~15 个 wheel 事件连续派发，
       * 只靠吸附动画的空档不够稳（惯性尾巴可能在动画结束后才到），
       * 所以显式记时间戳。
       */
      const now = Date.now();
      if (now - lastWheelTurnRef.current < WHEEL_COOLDOWN_MS) return;
      lastWheelTurnRef.current = now;

      const direction = WHEEL_DIRECTION[e.deltaY > 0 ? 'next' : 'prev'];
      const total = countRef.current;
      const from = readIndex();
      let dest = from + direction;

      if (dest < 0 || dest >= total) {
        // 到边界：回环时绕到另一端，否则这次滚轮丢弃（不产生任何视觉反馈，
        // 用户自然会理解为「已经到底了」）
        if (!loopRef.current || total < 3) return;
        dest = dest < 0 ? total - 1 : 0;
      }

      snappingRef.current = true;
      reportedRef.current = dest;
      setSnapped(dest);
      setScrolling(true);
      scrollToIndex(dest);
      onIndexChangeRef.current(dest);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', onWheel);
      snappingRef.current = false;
    };
  }, [enabled, wheelEnabled, readIndex, scrollToIndex]);

  /**
   * 外部切换（连播 / 按钮）后把滚动位置对齐到新的当前层。
   * 用 `activeIndex` 与已吸附层比对：不等才滚，避免与用户拖动打架。
   */
  useEffect(() => {
    if (!enabled) return;
    if (activeIndex === snapped) return;
    reportedRef.current = activeIndex;
    scrollToIndex(activeIndex);
    // snapped 有意不入依赖：它由滚动结果驱动，入依赖会和本效果互相触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, activeIndex, scrollToIndex]);

  // 关闭播放层 / 列表变化：复位到当前层并清掉所有挂起状态
  useEffect(() => {
    if (enabled) return;
    clearIdleTimer();
    clearLoopTimer();
    setScrolling(false);
    setSnapped(Math.max(0, activeIndexRef.current));
    reportedRef.current = activeIndexRef.current;
    reachedEndRef.current = false;
    snappingRef.current = false;
  }, [enabled, clearIdleTimer, clearLoopTimer]);

  // 卸载时清空定时器，避免在组件销毁后 setState
  useEffect(
    () => () => {
      clearIdleTimer();
      clearLoopTimer();
    },
    [clearIdleTimer, clearLoopTimer],
  );

  return {
    containerRef,
    activeIndex: snapped,
    scrolling,
    scrollToIndex,
  };
}

export default useSwipeSwitch;
