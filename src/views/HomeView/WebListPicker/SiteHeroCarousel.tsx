import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { SiteItem } from '@/api/site';
import { IconButton } from '@/components/IconButton/IconButton';
import { LazyImage } from '@/components/LazyImage/LazyImage';
import { openSite } from '@/utils/siteHelper';
import {
  CARD_ROOT_CLASS,
  CardTopRightBar,
  gradientOf,
  isNewSite,
  NewBadge,
  SiteAvatar,
  SiteSignal,
} from './cardParts';

type SiteHeroCarouselProps = {
  /**
   * 轮播的推荐站点列表（调用方需保证与宫格推荐卡**互不重复**）。
   * 为空时不渲染。
   */
  items: SiteItem[];
  /** 点击卡片打开站点时的回调；缺省时新窗口打开 */
  onOpen?: (item: SiteItem) => void;
  /** 判断某个站点是否已收藏 */
  favoritedOf: (item: SiteItem) => boolean;
  /** 切换某个站点的收藏状态；不传则不展示收藏按钮 */
  onToggleFavorite?: (item: SiteItem) => void;
  /** 追加到根节点的类名（用于网格跨列等布局控制） */
  className?: string;
};

/**
 * 自动轮播间隔（ms）。
 * 与 VideoBanner 保持同一节奏，站点区也取 5s。
 */
const AUTO_INTERVAL = 5000;

/**
 * 自动轮播的「用户已干预」暂停时长（ms）。
 *
 * 手动切换 / 点击圆点后暂停一段时间，让用户看清自己刚选中的那张；
 * 之后自动续播，避免手动操作后轮播永久停摆。
 */
const RESUME_DELAY = 8000;

/** 单张切换的过渡时长，需与下方 `duration-*` 类名一致 */
const SLIDE_MS = 500;

/**
 * 左右切换箭头的公共类名。
 *
 * 按钮本体尺寸交给 `IconButton` 的 `sm-lg` 档（移动端 28px → sm 起 40px），
 * PC 上大卡宽度可观，小按钮在大面积封面上显得局促、也不够好点。
 * 图标随外层容器一起用 `sm:` 断点放大，与按钮尺寸同步。
 */
const HERO_ARROW_CLASS =
  'absolute top-1/2 z-[2] -translate-y-1/2 bg-black/35 text-white ' +
  'opacity-0 backdrop-blur-md transition-opacity hover:bg-black/55 ' +
  'group-hover:opacity-100 max-sm:opacity-100';

const SLIDE_DURATION_CLASS: Record<number, string> = {
  300: 'duration-300',
  500: 'duration-500',
  700: 'duration-700',
};

/**
 * 头条区左侧**推荐轮播大卡**：整卡铺满封面（2:1），底部渐变浮层承载
 * Logo / 标题 / 描述 / 信号条 / 点击量，右上角收藏按钮。
 *
 * 相对旧的静态超大卡（SiteHeroCard）多出：
 * - 自动轮播 + 左右箭头手动切换 + 右下序号圆点
 * - 横向滑动切换（用 `overflow-x-auto` + `scroll-snap-type: x mandatory`
 *   的原生滚动实现，一甩即切，不手写 touch 手势）
 * - 鼠标悬停 / 聚焦时暂停自动轮播
 *
 * 结构上与 SiteHeroCard 一致（同样的 CARD_ROOT_CLASS、2:1、底部浮层），
 * 差异只在「封面是一组可切换的幻灯片」。
 *
 * 高度：外层格子给出列宽，本组件内部按 2:1 自己撑高。
 */
export const SiteHeroCarousel: React.FC<SiteHeroCarouselProps> = ({
  items,
  onOpen,
  favoritedOf,
  onToggleFavorite,
  className = '',
}) => {
  const count = items.length;

  // 底部轨道：overlay 与轨道共用同一层滚动容器，切换时同步位移
  const trackRef = useRef<HTMLDivElement>(null);
  /** 程序化滚动 / 用户拖动进行中的标记，避免 scroll 事件与 setIndex 互相打架 */
  const programmaticRef = useRef(false);
  /** 滚动停止判定定时器 */
  const idleTimerRef = useRef<number | null>(null);

  const [index, setIndex] = useState(0);
  /** 悬停（鼠标进入）时暂停自动轮播 */
  const [hovered, setHovered] = useState(false);
  /** 手动干预后的暂停截止时间戳（0 表示未暂停） */
  const [pausedUntil, setPausedUntil] = useState(0);
  /**
   * 首次渲染用「无动画」落位：数据到达时若是平滑滚动，
   * 会看到第一张幻灯片从右侧滑入，属于无谓的干扰。
   */
  const [animate, setAnimate] = useState(false);

  const clampedIndex = count > 0 ? Math.min(index, count - 1) : 0;
  const item = items[clampedIndex];

  // 数据源变化（如切换分类后重新拉取）后越界时回到第一张
  useEffect(() => {
    setIndex((i) => (i < count ? i : 0));
  }, [count]);

  // 落位后开启过渡动画（下一帧起生效，不影响首次定位）
  useEffect(() => {
    const t = window.setTimeout(() => setAnimate(true), 32);
    return () => window.clearTimeout(t);
  }, []);

  /** 滚动到指定张（带过渡动画） */
  const scrollToIndex = (next: number) => {
    const el = trackRef.current;
    if (!el) return;
    programmaticRef.current = true;
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
  };

  const clearIdleTimer = () => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  /** 切换：同步滚动轨道，并暂停自动轮播一段时间 */
  const goTo = (next: number, pause = false) => {
    if (count === 0) return;
    const wrapped = (next + count) % count;
    setIndex(wrapped);
    scrollToIndex(wrapped);
    if (pause) setPausedUntil(Date.now() + RESUME_DELAY);
  };

  const go = (delta: number) => goTo(clampedIndex + delta, true);

  // 点击圆点：跳转到指定张
  const handleDotClick = (i: number) => {
    if (i === clampedIndex) return;
    goTo(i, true);
  };

  // 自动轮播：间隔切下一张；悬停 / 聚焦 / 手动干预后暂停
  useEffect(() => {
    if (count <= 1 || hovered) return;
    const t = window.setInterval(() => {
      if (pausedUntil > Date.now()) return;
      setIndex((i) => {
        const next = (Math.min(i, count - 1) + 1) % count;
        scrollToIndex(next);
        return next;
      });
    }, AUTO_INTERVAL);
    return () => window.clearInterval(t);
  }, [count, hovered, pausedUntil]);

  // 轨道滚动：以「停在那一张」反推下标（手势滑动 / 箭头 / 自动轮播统一走这里）
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const onScroll = () => {
      const width = el.clientWidth;
      if (width <= 0) return;
      const current = Math.max(
        0,
        Math.min(count - 1, Math.round(el.scrollLeft / width)),
      );
      if (!programmaticRef.current) setIndex(current);

      // 停稳后校正一次并释放程序化标记，避免拖动被误判
      clearIdleTimer();
      idleTimerRef.current = window.setTimeout(() => {
        idleTimerRef.current = null;
        programmaticRef.current = false;
        const settled = Math.max(
          0,
          Math.min(count - 1, Math.round(el.scrollLeft / width)),
        );
        setIndex(settled);
      }, 160);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      clearIdleTimer();
    };
  }, [count]);

  // 卸载时清掉挂起的定时器，避免在已销毁组件上 setState
  useEffect(() => () => clearIdleTimer(), []);

  if (!item) return null;

  const coverSrc = item.cover || item.logo;
  const showNew = isNewSite(item.createTime);
  const favorited = favoritedOf(item);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
      className={`${CARD_ROOT_CLASS} aspect-[2/1] w-full ${className}`}
    >
      {/* 轨道：横向滚动 + scroll-snap，拖动 / 甩动即为切换 */}
      <div
        ref={trackRef}
        className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((it, i) => {
          const src = it.cover || it.logo;
          const active = i === clampedIndex;
          return (
            <div
              key={it.id || it.link || `${it.name}-${i}`}
              role="button"
              tabIndex={active ? 0 : -1}
              aria-label={it.name}
              aria-hidden={!active}
              onClick={() => {
                // 只有当前可见的那张才响应点击：其余卡片是拖动目标，误点不应跳转
                if (!active) return;
                openSite(it, onOpen);
              }}
              onKeyDown={(e) => {
                if (!active) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openSite(it, onOpen);
                }
              }}
              className="relative h-full w-full shrink-0 basis-full snap-start overflow-hidden bg-slate-100 dark:bg-slate-800"
            >
              {src ? (
                <LazyImage
                  src={src}
                  alt={it.name}
                  ratio="fill"
                  fit="cover"
                  fullWidth
                  rounded="rounded-none"
                  className="bg-transparent group-hover:scale-105 transition-transform"
                />
              ) : (
                <div
                  className="absolute inset-0 flex h-full w-full items-center justify-center text-white text-5xl font-bold"
                  style={{ background: gradientOf(it) }}
                >
                  {(it.name || '?').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/*
        信息浮层：压在轨道之上，只展示**当前那张**的内容。
        由 index 驱动（而非跟随滚动像素位移），切换时整体淡入淡出，
        避免叠在滑动过程中的封面之间来回闪烁。
      */}
      <div
        key={item.id || item.link || item.name}
        className={`absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pt-12 text-white transition-opacity ease-out sm:px-4 sm:pt-16 ${
          count > 1 ? 'pb-7 sm:pb-8' : 'pb-3 sm:pb-4'
        } ${animate ? SLIDE_DURATION_CLASS[SLIDE_MS] : 'duration-0'} opacity-100`}
      >
        <div className="flex items-end gap-2 sm:gap-3">
          <SiteAvatar item={item} size="lg" />
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            {/* 标题行：信号强度在最左，NEW 贴在标题右侧
                （self-start 对齐行顶，即「标题右上角」）。
                浏览量已移到卡片右上角与收藏按钮同排（见下方 Toolbar） */}
            <div className="flex min-w-0 items-start gap-1.5">
              <SiteSignal item={item} className="self-center" />
              <p className="truncate text-sm font-semibold sm:text-2xl">
                {item.name}
              </p>
              {showNew && <NewBadge />}
            </div>
            {/* 描述：各端统一 16px（text-base） */}
            {item.des && (
              <p className="mt-0.5 line-clamp-2 text-base text-white/80 sm:mt-1 ">
                {item.des}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 右上角工具条：浏览量 + 收藏。与常规卡 / 宫格卡共用同一组件，样式完全一致 */}
      <CardTopRightBar
        item={item}
        favorited={favorited}
        onToggleFavorite={onToggleFavorite}
      />

      {/* 左右切换箭头：悬停显示，移动端常驻。
          按钮用 sm-lg 档随断点放大（28px → 40px），PC 上更好点、也更显眼 */}
      {count > 1 && (
        <>
          <IconButton
            label="上一张"
            variant="ghost"
            size="sm-lg"
            icon={<ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />}
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className={`left-2 ${HERO_ARROW_CLASS}`}
          />
          <IconButton
            label="下一张"
            variant="ghost"
            size="sm-lg"
            icon={<ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />}
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className={`right-2 ${HERO_ARROW_CLASS}`}
          />
        </>
      )}

      {/* 序号圆点：水平居中贴底，压在底部渐变浮层上 */}
      {count > 1 && (
        <div className="absolute bottom-2 left-1/2 z-[2] flex -translate-x-1/2 items-center gap-1.5 sm:bottom-3 sm:gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`第 ${i + 1} 张`}
              aria-current={i === clampedIndex}
              onClick={(e) => {
                e.stopPropagation();
                handleDotClick(i);
              }}
              className={`h-1.5 cursor-pointer rounded-full transition-all ${
                i === clampedIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SiteHeroCarousel;
