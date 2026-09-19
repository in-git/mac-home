import { Download, Heart, List, ShieldCheck, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SiteItem } from '@/api/site';
import { IconButton } from '@/components/IconButton/IconButton';
import { isInAppContainer } from '@/utils/appBridge';
import { openSite } from '@/utils/siteHelper';
import { SiteCard } from '../WebListPicker/SiteCard';

interface MineProps {
  /** 已收藏的站点（来自本地持久化字段 favoriteSites） */
  favorites: SiteItem[];
  /** 点击收藏按钮：取消收藏 */
  onToggleFavorite: (item: SiteItem) => void;
}

/** 横向滚动区里每张卡片的固定宽度（与卡片自身比例配合，保证一排看得到下一张的边） */
const CARD_WIDTH_CLASS = 'w-40 sm:w-44';

/**
 * 苹果风格大卡片外壳（结构与排版）：
 * - 大圆角 + 充足内边距 + 最小高度，视觉上比普通信息行更「厚重」
 * - 底色单独由调用方给出（见 CARD_BG_NEUTRAL / CARD_BG_BLUE），
 *   避免两个 bg-* 类互相覆盖时依赖书写顺序
 */
const BIG_CARD_BASE =
  'flex min-h-[104px] flex-col justify-center gap-3 rounded-xl border px-4 py-4';

/** 中性分组底色（浅灰），用于「专属 App」卡 */
const CARD_BG_NEUTRAL =
  'border-black/[0.06] bg-[#F2F2F7] dark:border-white/[0.08] dark:bg-white/[0.06]';

/**
 * 淡蓝底：用于「备案信息」卡。
 *
 * 备案属于合规信息，用中性灰会和「专属 App」显得同等随意；
 * 换成低饱和的淡蓝（iOS 系统蓝的极浅色调）后更像一块正式的官方信息区，
 * 描边同步偏蓝，让边框与底色属于同一色相、不显脏。
 */
const CARD_BG_BLUE =
  'border-[#007AFF]/15 bg-[#EAF3FF] dark:border-[#0A84FF]/20 dark:bg-[#0A84FF]/12';

/** 卡片内的标题行：图标 + 标题 */
const CardTitle: React.FC<{
  icon: React.ReactNode;
  title: string;
  /** 图标底色/图标色的类名，默认浅强调色块（在淡蓝底卡片上需换成更实的一档） */
  iconClass?: string;
}> = ({
  icon,
  title,
  iconClass = 'bg-[color:var(--accent)]/12 text-[color:var(--accent)]',
}) => (
  <div className="flex items-center gap-2.5">
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
    >
      {icon}
    </span>
    <span className="text-base font-semibold">{title}</span>
  </div>
);

/**
 * 「我的」模块：本地收藏的网页站点。
 *
 * 收藏列表两端（PC / 移动端）统一为**横向滚动单行**：
 * 卡片定宽，超出一屏的部分横向滚动查看，避免纵向列表把底部信息顶出视口。
 *
 * 「更多」按钮仅在内容确实溢出（scrollWidth > clientWidth）时出现，
 * 点击后用模态框以网格形式铺开全部收藏 —— 横向滚动适合快速浏览，
 * 但找具体某一项时逐张横滑效率低，需要一个「全量视图」。
 *
 * 移动端在收藏区下方另有「专属 App」与「备案信息」两张苹果风格大卡片，
 * 随内容一起滚动（不再固定在底部）；桌面端由左侧栏承担，本页不重复。
 */
export const Mine: React.FC<MineProps> = ({
  favorites,
  onToggleFavorite,
}) => {
  // 点击卡片：上报点击量并打开站点
  const handleOpen = useCallback((item: SiteItem) => {
    openSite(item);
  }, []);

  /** 模态框开关 */
  const [showAll, setShowAll] = useState(false);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  /** 横向内容是否溢出（决定「更多」按钮是否出现） */
  const [overflowing, setOverflowing] = useState(false);

  /**
   * 溢出检测：收藏数量变化、容器尺寸变化、窗口尺寸变化时都要重算。
   *
   * 留 1px 容差：某些缩放下 scrollWidth 会比 clientWidth 多出小数进位，
   * 严格大于会误判为溢出，导致不必要时也显示「更多」。
   */
  const measureOverflow = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setOverflowing(el.scrollWidth - el.clientWidth > 1);
  }, []);

  useEffect(() => {
    measureOverflow();
    const el = scrollerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measureOverflow);
    observer.observe(el);
    // 子项尺寸变化（如卡片文字换行导致高度变化）不改变宽度，
    // 但容器宽度变化必须捕捉，故同时观察滚动内容层
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    window.addEventListener('resize', measureOverflow);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measureOverflow);
    };
  }, [measureOverflow, favorites.length]);

  // 模态框打开时：ESC 关闭 + 锁定 body 滚动
  useEffect(() => {
    if (!showAll) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAll(false);
    };
    window.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [showAll]);

  /** 模态框内的卡片：点击即打开站点并收起模态框 */
  const handleOpenInModal = useCallback(
    (item: SiteItem) => {
      handleOpen(item);
      setShowAll(false);
    },
    [handleOpen],
  );

  // 已在 App 内时不再提供「下载 App」入口
  const inApp = isInAppContainer();

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24">
            <Heart size={36} strokeWidth={1} />
            <p className="text-base">还没有收藏的网页</p>
            <p className=" text-slate-400">
              在「网页」中把鼠标移到卡片上，点击右上角爱心即可收藏
            </p>
          </div>
        ) : (
          <>
            {/* 标题行：「更多」只在横向内容溢出时出现 */}
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="xl:text-2xl text-lg font-bold">我的收藏</div>
              {overflowing && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="flex shrink-0 cursor-pointer items-center gap-1 rounded-full bg-black/5 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-black/10 dark:bg-white/10 dark:text-slate-200"
                >
                  <List size={14} className="shrink-0" />
                  <span>更多</span>
                </button>
              )}
            </div>

            {/* 横向滚动单行：两端布局一致。
                -mx/px 抵消父级内边距，让卡片可以贴边滑出去，视觉上不留断口 */}
            <div
              ref={scrollerRef}
              className="-mx-3 overflow-x-auto px-3 pb-1 sm:-mx-5 sm:px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="flex w-max gap-3 sm:gap-4">
                {favorites.map((item, index) => (
                  <div
                    key={item.id || item.link || `fav-${index}`}
                    className={`${CARD_WIDTH_CLASS} shrink-0`}
                  >
                    <SiteCard
                      item={item}
                      onOpen={handleOpen}
                      favorited
                      onToggleFavorite={onToggleFavorite}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/*
          移动端专属：两张苹果风格大卡片，跟随内容滚动（不再固定在底部）。
          桌面端（sm 起）由左侧栏常驻展示，故整块隐藏。
        */}
        <div className="mt-5 space-y-3 sm:hidden">
          {/* 专属 App 下载 */}
          {!inApp && (
            <div className={`${BIG_CARD_BASE} ${CARD_BG_NEUTRAL}`}>
              <CardTitle icon={<Download size={17} />} title="专属 App" />
              <p className="text-sm leading-relaxed text-[#86868B] dark:text-[#98989D]">
                下载手机客户端，随时随地访问你的主页与收藏。
              </p>
              <a
                href="/app-v1.0.apk"
                download="app-v1.0.apk"
                className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[color:var(--accent)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[color:var(--accent-hover)]"
              >
                <Download size={15} className="shrink-0" />
                <span>下载安装</span>
              </a>
            </div>
          )}

          {/* 备案信息：淡蓝底，视觉上更接近正式合规信息区 */}
          <div className={`${BIG_CARD_BASE} ${CARD_BG_BLUE}`}>
            <CardTitle
              icon={<ShieldCheck size={17} />}
              title="备案信息"
              iconClass="bg-[#007AFF] text-white shadow-sm dark:bg-[#0A84FF]"
            />
            <a
              href="https://beian.mps.gov.cn/#/query/webSearch?code=44011202003613"
              target="_blank"
              rel="noopener noreferrer"
              title="粤公网安备44011202003613号"
              className="group flex items-center gap-1.5 text-sm leading-relaxed text-[#007AFF] transition-colors hover:underline dark:text-[#4DA3FF]"
            >
              <ShieldCheck size={13} className="shrink-0" />
              <span className="truncate">
                粤公网安备44011202003613号
              </span>
            </a>
            <p className="text-xs leading-relaxed text-[#6E8CB0] dark:text-[#8FA9C7]">
              © {new Date().getFullYear()} 吴文龙的个人主页
            </p>
          </div>
        </div>
      </div>

      {/* 全部收藏模态框（全屏）：点击卡片打开站点后自动收起 */}
      {showAll && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="全部收藏"
          className="fixed inset-0 z-[300] flex h-[100dvh] w-screen flex-col overflow-hidden bg-white dark:bg-[#1C1C1E]"
        >
          {/* 模态框标题栏（固定在顶部） */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-black/10 px-4 py-3 dark:border-white/10">
            <div className="text-base font-semibold sm:text-lg">
              全部收藏
              <span className="ml-2 text-sm font-normal text-slate-400">
                {favorites.length}
              </span>
            </div>
            <IconButton
              label="关闭"
              variant="ghost"
              icon={<X size={18} />}
              onClick={() => setShowAll(false)}
            />
          </div>

          {/* 全部内容：网格铺开 */}
          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {favorites.map((item, index) => (
                <SiteCard
                  key={item.id || item.link || `all-${index}`}
                  item={item}
                  onOpen={handleOpenInModal}
                  favorited
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mine;
