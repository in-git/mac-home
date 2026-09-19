import { SkipForward, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { VideoItem, withBase } from '@/api/video';
import { IconButton } from '@/components/IconButton/IconButton';
import { VideoPlayer } from '@/components/VideoPlayer/VideoPlayer';
import { isMobileDevice } from '@/utils/device';
import { clearProgress, getProgress, saveProgress } from './playbackMemory';
import { useSwipeSwitch } from './useSwipeSwitch';

interface VideoPlayerModalProps {
  item: VideoItem | null;
  onClose: () => void;
  /** 自动连播：播放结束后切到下一个视频（不传则不连播） */
  onNext?: () => void;
  /** 切换到上一个视频（不传则禁用该方向） */
  onPrev?: () => void;
  /**
   * 播放列表，竖向轮播直接以它为数据源（两端共用）。
   * 传入后渲染全量列表，靠 scroll-snap 整屏吸附切换。
   */
  items?: VideoItem[];
  /** 列表首尾相接（配合列表长度 >= 3 生效） */
  loop?: boolean;
  /** 是否还有下一页（移动端滑到接近尾部时触发 onLoadMore） */
  hasMore?: boolean;
  /** 追加加载中 */
  loadingMore?: boolean;
  /** 滑到接近尾部：加载下一页（与网页模块的触底加载一致） */
  onLoadMore?: () => void;
  /** 是否存在下一个（决定是否显示「下一个」按钮） */
  hasNext?: boolean;
  /** 是否存在上一个 */
  hasPrev?: boolean;
}

/**
 * 全屏视频播放层（ArtPlayer）。
 *
 * 两端都是竖向轮播，用**原生滚动 + CSS scroll-snap** 做整屏吸附：
 * - 移动端：手指上下拖动，带惯性；一甩即切换一屏
 * - PC：滚轮翻页，累计位移 + 冷却时间双重节流，动画走完才接受下一次
 * 滚到接近尾部时自动分页加载下一页（与网页模块的滚动分页同构）。
 *
 * 其它约定：
 * - 只有「当前层」会创建 ArtPlayer 实例：相邻层只渲染封面，
 *   避免同时解码多个视频导致卡顿与音频叠加
 * - 标题 / 描述以底部渐变浮层压在播放器上，不挤占画面
 * - 播放结束自动连播（若上层提供 onNext）
 * - 关闭方式：右上角按钮 / 点击空白 / ESC
 */
export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  item,
  onClose,
  onNext,
  onPrev,
  items,
  loop = false,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  hasNext = false,
  hasPrev = false,
}) => {
  /** 播放结束的提示态：显示「即将播放下一个」 */
  const [ended, setEnded] = useState(false);
  const endedTimerRef = useRef<number | null>(null);

  /**
   * 是否为移动端。用 state 持有便于在视口变化（旋转 / 调整窗口）时复评。
   * SSR 首帧按非移动端渲染，避免误挂载轮播。
   */
  const [mobile, setMobile] = useState(() =>
    typeof window === 'undefined' ? false : isMobileDevice(),
  );

  useEffect(() => {
    const onResize = () => setMobile(isMobileDevice());
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  /**
   * 轮播数据源：有完整列表（items）时直接用它，滚动即切换。
   * 列表还在首屏加载时退化为「当前项」单项，至少能播放。
   */
  const list = React.useMemo<VideoItem[]>(() => {
    if (items && items.length > 0) return items;
    return item ? [item] : [];
  }, [items, item]);

  /** 当前视频在数据源中的下标；找不到（列表刷新丢项）时回退到 0 */
  const activeIndex = React.useMemo(() => {
    if (!item) return 0;
    const idx = list.findIndex((v) => v.id === item.id);
    return idx < 0 ? 0 : idx;
  }, [list, item]);

  /** 当前层（滚动中即时跟随，仅用于文案，不决定播放） */
  const [currentIndex, setCurrentIndex] = useState(activeIndex);
  /**
   * 「停稳层」：滚动彻底结束后才更新，是**唯一**决定播哪个视频的下标。
   *
   * 与 `currentIndex` 分开是刻意的：
   * - 标题 / 描述用 `currentIndex`，滚动过程中即时变化，文字跟手
   * - 播放器挂载用 `playIndex`，滚动中被整段拖动时它不动，
   *   只有确认停在某一屏才切过去
   *
   * 若不分开，一次快速甩动会依次经过中间层，每层都被判为「当前层」
   * 而触发一次播放器挂载 —— 画面会连续闪几个视频、音频也跟着抢，
   * 到最后一屏反而在解码上落后。
   */
  const [playIndex, setPlayIndex] = useState(activeIndex);

  /** 停止滚动的判定时长（ms），与 useSwipeSwitch 的 SCROLL_IDLE_MS 对齐 */
  const PLAY_SETTLE_MS = 160;
  const settleTimerRef = useRef<number | null>(null);
  /** 在滚动期间是否被挪动过；只有挪动过才需要延迟确认停稳 */
  const pendingSettleRef = useRef(false);

  /** 播放结束的提示态重置（切换视频时） */
  useEffect(() => {
    setEnded(false);
    if (endedTimerRef.current) {
      window.clearTimeout(endedTimerRef.current);
      endedTimerRef.current = null;
    }
  }, [item?.id]);

  /**
   * 吸附层变化：把「开始滚动」和「滚动停稳」两件事分开处理。
   *
   * 只有停稳才真正切播放（`playIndex`），滚动中新经过的层一律不播。
   * 停稳的确认靠 `scrolling` 回落，而非定时器空等：
   * `scrolling` 由 useSwipeSwitch 在滚动停稳后置为 false，是权威信号，
   * 用户松手后又继续滑的话它会重新变 true，延迟会自然顺延。
   */
  const handleIndexChange = useCallback((index: number) => {
    // 文案先跟上，滚动过程中标题就能跟着变
    setCurrentIndex(index);
    // 标记「滚动中动过」：等 scrolling 回落时再确认停在哪一层
    pendingSettleRef.current = true;
  }, []);

  const { containerRef, scrolling } = useSwipeSwitch({
    // 两端都启用：移动端靠触摸滚动吸附，PC 靠滚轮翻屏
    enabled: !!item && list.length > 1,
    activeIndex,
    count: list.length,
    onIndexChange: handleIndexChange,
    loop: loop && list.length >= 3,
    hasMore,
    loadingMore,
    onReachEnd: onLoadMore,
    // 滚轮只接管桌面端；移动端真机上 wheel 与触摸滚动会互相打架
    wheelEnabled: !mobile,
  });

  /**
   * 滚动停稳确认：`scrolling` 回落后再等 `PLAY_SETTLE_MS` 才切播放。
   *
   * 为什么不能只听 `scrolling`：滚轮翻屏时 scroll 事件可能在吸附动画
   * 刚结束那一帧才补齐，紧接着又置回 `scrolling = true`。多留一小段
   * 静默期，能避开这种「刚判定停稳就又动起来」的抖动。
   *
   * 为什么不能只听定时器：用户松手后继续滑时，`scrolling` 会重新变 true，
   * 本效果随即清掉待执行的切换 —— 延迟自然顺延到真正停稳之后。
   */
  useEffect(() => {
    if (scrolling) return;
    if (!pendingSettleRef.current) return;
    if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => {
      settleTimerRef.current = null;
      if (!pendingSettleRef.current) return;
      pendingSettleRef.current = false;
      // 到这里才算「滚动彻底完成」，此时才允许换视频开始播放
      setPlayIndex(currentIndex);
      // 上层负责计数上报与状态同步；方向由下标大小判定，
      // 连滚多屏时也只是一次「前进 / 后退」
      const target = list[currentIndex];
      if (!target || target.id === item?.id) return;
      if (currentIndex > activeIndex) onNext?.();
      else onPrev?.();
    }, PLAY_SETTLE_MS);
    return () => {
      if (settleTimerRef.current) {
        window.clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
    };
  }, [scrolling, currentIndex, list, item?.id, activeIndex, onNext, onPrev]);

  // ESC 关闭 + 打开期间锁定 body 滚动
  useEffect(() => {
    if (!item) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [item, onClose]);

  /**
   * 加载失败：仅记录日志，便于排查失效地址 / 网络问题。
   *
   * 原先这里还要收掉全屏 loading，现已移除 loading 效果 ——
   * 播放器挂载时会先显示封面（`CarouselSlide` 的 poster），
   * 本身就能盖住「首帧未出」的间隙，不需要额外遮罩。
   */
  const handlePlayError = useCallback(
    (error: unknown) => {
      console.warn('[video] 播放失败', item?.id, error);
    },
    [item?.id],
  );

  /** 播放结束：清除进度（下次从头播），并自动连播下一个 */
  const handleEnded = useCallback(() => {
    if (item?.id) clearProgress(item.id);
    if (!onNext || !hasNext) return;
    setEnded(true);
    endedTimerRef.current = window.setTimeout(() => {
      setEnded(false);
      onNext();
    }, 3000);
  }, [item?.id, onNext, hasNext]);

  if (!item || list.length === 0) return null;

  /** 文案层（滚动中即时跟随，避免文字滞后于画面） */
  const shown = list[Math.min(currentIndex, list.length - 1)] ?? item;
  /** 播放层：停稳后才更新，决定哪个 slide 挂载 ArtPlayer */
  const playItem = list[Math.min(playIndex, list.length - 1)] ?? item;
  /** 只有一项时没有「翻屏」可言，加载占位也就不必展示 */
  const canScroll = list.length > 1;

  return (
    <div
      className="fixed inset-0 z-[300] flex h-[100dvh] w-screen flex-col overflow-hidden bg-black"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      {/*
        两端共用同一个滚动容器：
        - 移动端：手指上下拖动，scroll-snap 吸附整屏
        - PC：滚轮翻屏（见 useSwipeSwitch 的 wheelEnabled）
        差别只在交互媒介，结构没必要分叉 —— 早先桌面端是另一套
        「单视频静态容器」，结果 PC 完全滑不动，正是分叉带来的。
      */}
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        className="video-carousel min-h-0 flex-1 overflow-y-scroll overscroll-y-contain"
      >
        {list.map((v) => (
          <CarouselSlide
            key={v.id}
            item={v}
            // 只有「停稳的那一层」挂载播放器：滚动中经过的中间层不播，
            // 避免连续闪几个视频、音频互相抢，同时避免多路解码
            active={v.id === playItem.id}
            // 已停稳、播放还没开始：先显示封面，不要留一块黑屏
            pending={v.id === shown.id && v.id !== playItem.id}
            onEnded={handleEnded}
            onError={handlePlayError}
          />
        ))}

        {/* 尾部分页占位：把「加载下一页」的反馈留在列表里，
            与网页模块底部的加载态一致；滚到最后一层即可看到 */}
        {(loadingMore || (hasMore && !loop)) && (
          <div className="video-carousel-slide flex h-full w-full items-center justify-center">
            {loadingMore ? (
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                <span className="text-sm text-white/60">加载中…</span>
              </div>
            ) : (
              <span className="text-sm text-white/40">
                {mobile ? '上滑加载更多' : '继续滚动加载更多'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 右上角操作区：下一个 + 关闭（大尺寸）。滚动中淡出，避免遮挡 */}
      <div
        className="absolute right-3 top-3 z-20 flex items-center gap-2 transition-opacity duration-200 sm:right-5 sm:top-5"
        style={{
          opacity: scrolling ? 0 : 1,
          pointerEvents: scrolling ? 'none' : 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {hasNext && !ended && (
          <IconButton
            label="下一个"
            variant="ghost"
            size="lg"
            onClick={onNext}
            icon={<SkipForward size={22} />}
            className="h-11 w-11 bg-black/45 text-white backdrop-blur-md hover:bg-black/70 sm:h-12 sm:w-12"
          />
        )}
        <IconButton
          label="关闭"
          variant="ghost"
          size="lg"
          onClick={onClose}
          icon={<X size={26} />}
          className="h-11 w-11 bg-black/45 text-white backdrop-blur-md hover:bg-black/70 sm:h-12 sm:w-12"
        />
      </div>

      {/* 播放结束提示：即将自动连播 */}
      {ended && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm text-white/80 ">即将播放下一个…</p>
          <button
            type="button"
            onClick={onNext}
            className="flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-transform hover:scale-105 active:scale-95 "
          >
            <SkipForward size={18} />
            立即播放
          </button>
        </div>
      )}

      {/* 底部渐变浮层：标题 / 描述（不影响播放器控件），滚动中淡出。
          标题用实时吸附层，滚动时文字与画面同步变化。 */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-4 pb-16 pt-12 text-white transition-opacity duration-200 sm:px-8 sm:pb-20"
        style={{ opacity: scrolling ? 0 : 1 }}
      >
        <p className="line-clamp-1 text-base font-medium sm:text-xl">
          {shown.title}
        </p>
        {shown.description && (
          <p className="mt-1 line-clamp-2 text-xs text-white/60 sm:text-sm">
            {shown.description}
          </p>
        )}
      </div>

      {/* 滑动 / 滚轮引导：仅在可滑动时短暂提示，两端文案不同 */}
      {canScroll && <SwipeHint hint={mobile ? '上滑看下一个' : '滚动看下一个'} />}
    </div>
  );
};

/**
 * 轮播中的一层（一屏高）。
 *
 * 只有 `active` 为真时才渲染 ArtPlayer 实例；其余层渲染封面 ——
 * 同时存在多个 ArtPlayer 会带来明显的解码压力与音频叠加。
 * 每一层都是流内的普通块，靠 scroll-snap 吸附对齐。
 *
 * `pending` 是「已经停在这一屏、但还没到播放时机」的过渡态：
 * 此时仍显示封面，等停稳判定结束由 `active` 接管成播放器。
 * 不加这个态的话，停稳等待的那 160ms 里这一屏是**全黑**的 ——
 * 因为 `active` 还没轮到它，而 `img` 分支又只在 `!active` 时才渲染。
 */
const CarouselSlide: React.FC<{
  item: VideoItem;
  /** 是否挂载播放器（停稳后的那一层） */
  active: boolean;
  /** 是否已停稳但仍在等待播放（先显示封面，避免黑屏） */
  pending?: boolean;
  /** 播放结束回调（仅当前层会触发，默认用于自动连播） */
  onEnded?: () => void;
  /** 加载失败：仅用于记录日志 */
  onError?: (error: unknown) => void;
}> = ({ item, active, pending = false, onEnded, onError }) => {
  const poster = withBase(item.cover);

  return (
    <section
      // h-full 让每层正好等于滚动容器高度，scroll-snap 才能整屏吸附
      className="video-carousel-slide relative flex h-full w-full items-center justify-center overflow-hidden"
      aria-label={item.title}
      aria-hidden={!(active || pending)}
    >
      {active ? (
        <VideoPlayer
          // key 保证切换视频时重建播放器实例，避免复用导致的地址串台
          key={item.id}
          src={withBase(item.url)}
          poster={poster || undefined}
          autoplay
          startAt={getProgress(item.id)}
          onEnded={onEnded}
          onTimeUpdate={(t) => saveProgress(item.id, t)}
          onError={onError}
        />
      ) : poster ? (
        <img
          src={poster}
          alt=""
          className="h-full w-full object-contain"
          draggable={false}
        />
      ) : (
        <span className="px-6 text-center text-sm text-white/50 line-clamp-3">
          {item.title}
        </span>
      )}

      {/* 非播放层不接收指针事件：避免滚动时误触到别的层的播放器控件 */}
      {!active && <span className="absolute inset-0" aria-hidden="true" />}
    </section>
  );
};

/**
 * 首次打开时的切换引导：箭头 + 文案，2 秒后自动淡出。
 * 文案由调用方区分端（移动端「上滑」/ PC「滚动」）。
 */
const SwipeHint: React.FC<{ hint: string }> = ({ hint }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 2200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-2 transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden="true"
    >
      <div className="animate-bounce rounded-full bg-black/50 p-2.5 backdrop-blur-md">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 19V5" />
          <path d="M5 12l7-7 7 7" />
        </svg>
      </div>
      <span className="rounded-full bg-black/50 px-3 py-1 text-xs text-white/90 backdrop-blur-md">
        {hint}
      </span>
    </div>
  );
};

export default VideoPlayerModal;
