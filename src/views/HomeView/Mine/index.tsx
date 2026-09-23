import { ChevronRight, Download, ExternalLink, Heart, List, ShieldCheck, UserRound, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SiteItem } from '@/api/site';
import { IconButton } from '@/components/IconButton/IconButton';
import { isInAppContainer } from '@/utils/appBridge';
import { openSite } from '@/utils/siteHelper';
import { SOCIAL_LINKS } from '../Sidebar/SocialLinks';
import { SiteCard } from '../WebListPicker/SiteCard';

interface MineProps {
  /** 已收藏的站点（来自本地持久化字段 favoriteSites） */
  favorites: SiteItem[];
  /** 点击收藏按钮：取消收藏 */
  onToggleFavorite: (item: SiteItem) => void;
}

/**
 * 移动端横向滚动区里每张卡片的固定宽度。
 * 160px 时一屏能看到两张多一点，横向滚动的「还有更多」提示足够明显。
 * 桌面端为网格布局，宽度由列数决定，不使用该常量。
 */
const CARD_WIDTH_CLASS = 'w-40';

/**
 * 苹果风格大卡片外壳：结构与排版 + 中性灰底。
 * 大圆角 + 充足内边距 + 最小高度，视觉上比普通信息行更「厚重」。
 */
const BIG_CARD_CLASS =
  'flex min-h-[104px] flex-col justify-center gap-3 rounded-xl border border-black/[0.06] bg-[#F2F2F7] px-4 py-4 dark:border-white/[0.08] dark:bg-white/[0.06]';

/** 卡片内的标题行：图标 + 标题 */
const CardTitle: React.FC<{ icon: React.ReactNode; title: string }> = ({
  icon,
  title,
}) => (
  <div className="flex items-center gap-2.5">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--accent)]/12 text-[color:var(--accent)]">
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

  /** 「全部收藏」模态框开关 */
  const [showAll, setShowAll] = useState(false);
  /** 「关于我」模态框开关 */
  const [showAbout, setShowAbout] = useState(false);

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

  // 任一模态框打开时：ESC 关闭 + 锁定 body 滚动
  const anyModalOpen = showAll || showAbout;
  useEffect(() => {
    if (!anyModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // 同时只可能有一个弹窗打开，关掉当前这个即可
      setShowAll(false);
      setShowAbout(false);
    };
    window.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [anyModalOpen]);

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
            {/* 标题行：「更多」仅移动端使用（PC 端为网格铺开，内容全部可见） */}
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="xl:text-2xl text-lg font-bold">我的收藏</div>
              {overflowing && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="flex shrink-0 cursor-pointer items-center gap-1 rounded-full bg-black/5 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-black/10 sm:hidden dark:bg-white/10 dark:text-slate-200"
                >
                  <List size={14} className="shrink-0" />
                  <span>更多</span>
                </button>
              )}
            </div>

            {/* 移动端：横向滚动单行。
                -mx/px 抵消父级内边距，让卡片可以贴边滑出去，视觉上不留断口 */}
            <div
              ref={scrollerRef}
              className="-mx-3 overflow-x-auto px-3 pb-1 sm:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="flex w-max gap-3">
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

            {/* 桌面端：正常网格布局，从上往下排列；
                外层已有 overflow-y-auto，超出视口自然纵向滚动。
                点击同样走 handleOpen（内部会先上报点击量再打开链接） */}
            <div className="hidden gap-4 sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {favorites.map((item, index) => (
                <SiteCard
                  key={item.id || item.link || `fav-${index}`}
                  item={item}
                  onOpen={handleOpen}
                  favorited
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          </>
        )}

        {/*
          移动端专属：关于我 + 专属 App + 备案信息，固定在整页最下方。
          用更大的上间距（mt-10）与上方内容拉开距离，形成「页脚信息区」，
          避免和收藏列表混成一段。
        */}
        <div className="mt-10 space-y-3 sm:hidden">
          {/* 分区标题：样式与「我的收藏」一致 */}
          <div className="xl:text-2xl text-lg font-bold">更多</div>

          {/* 关于我：独占一行，点击弹出社交账号列表。
              淡蓝底用于与灰底的 App / 备案卡区分，强调这是可交互的入口 */}
          <button
            type="button"
            onClick={() => setShowAbout(true)}
            className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-[#007AFF]/15 bg-[#EAF3FF] px-4 py-4 text-left transition-colors hover:bg-[#DFEDFF] dark:border-[#0A84FF]/20 dark:bg-[#0A84FF]/12 dark:hover:bg-[#0A84FF]/20"
          >
            <CardTitle icon={<UserRound size={17} />} title="关于我" />
            <ChevronRight
              size={18}
              className="shrink-0 text-[#007AFF]/70 dark:text-[#4DA3FF]/70"
            />
          </button>

          {/* 专属 App 下载 */}
          {!inApp && (
            <div className={BIG_CARD_CLASS}>
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

          {/* 备案信息 */}
          <div className={BIG_CARD_CLASS}>
            <CardTitle icon={<ShieldCheck size={17} />} title="备案信息" />
            <a
              href="https://beian.mps.gov.cn/#/query/webSearch?code=44011202003613"
              target="_blank"
              rel="noopener noreferrer"
              title="粤公网安备44011202003613号"
              className="group flex items-center gap-1.5 text-sm leading-relaxed text-[#86868B] transition-colors hover:text-[color:var(--accent)] dark:text-[#98989D]"
            >
              <ShieldCheck size={13} className="shrink-0" />
              <span className="truncate group-hover:underline">
                粤公网安备44011202003613号
              </span>
            </a>
            <p className="text-xs leading-relaxed text-[#A1A1A6] dark:text-[#6E6E73]">
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

      {/*
        关于我（居中弹窗）：以列表形式展示社交账号。
        点击遮罩关闭，因此内层容器需要 stopPropagation 避免误关。
      */}
      {showAbout && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="关于我"
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setShowAbout(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[80dvh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#1C1C1E]"
          >
            {/* 标题栏 */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-black/10 px-4 py-3 dark:border-white/10">
              <div className="text-base font-semibold">关于我</div>
              <IconButton
                label="关闭"
                variant="ghost"
                size="sm"
                icon={<X size={16} />}
                onClick={() => setShowAbout(false)}
              />
            </div>

            {/* 作者信息 */}
            <div className="flex shrink-0 items-center gap-3 px-4 py-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent)]/12 text-[color:var(--accent)]">
                <UserRound size={24} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">吴文龙</p>
                <p className="truncate text-xs text-[#86868B] dark:text-[#98989D]">
                  个人主页作者
                </p>
              </div>
            </div>

            {/* 社交账号列表：每行图标 + 平台 + 跳转图标 */}
            <div className="min-h-0 flex-1 overflow-y-auto pb-2">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                >
                  {/* 品牌色图标作为列表项的标识 */}
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white ${link.bgSolidClass}`}
                  >
                    {link.renderIcon(18)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {link.name}
                  </span>
                  <ExternalLink
                    size={15}
                    className="shrink-0 text-[#A1A1A6] transition-colors group-hover:text-[color:var(--accent)] dark:text-[#6E6E73]"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mine;
