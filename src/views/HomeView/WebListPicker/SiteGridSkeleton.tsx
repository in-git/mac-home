import React from 'react';
import {
  FEATURED_CLASS,
  FEATURED_GRID_CARD_CLASS,
  FEATURED_HERO_CLASS,
  FEATURED_TILES_CLASS,
  FEATURED_TILE_FIRST_CLASS,
  FEATURED_TILE_LAST_CLASS,
  SITE_GRID_CLASS,
} from './constants';

/**
 * 网页列表首屏骨架屏。
 *
 * 设计要点：**复用真实布局的栅格类名**（FEATURED_* / SITE_GRID_CLASS），
 * 而不是另写一套尺寸。这样骨架与成品的位置、列数、间距、各卡跨列完全一致，
 * 数据到达后不会出现跳位；同时所有断点调整只需改 constants 一处，骨架自动跟随。
 *
 * 各块高度用与真实卡片一致的内部比例（如超大卡 2:1、推荐卡 1:1）来撑开，
 * 避免骨架偏矮导致加载完成后整页跳动。
 */

/** 基础灰块：统一圆角与脉冲动画 */
const Block: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className = '',
  style,
}) => (
  <div
    className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-700/70 ${className}`}
    style={style}
  />
);

/** 骨架里的单行文字条（标题 / 描述占位） */
const Line: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-pulse rounded bg-slate-200 dark:bg-slate-700/70 ${className}`}
  />
);

/**
 * 超大卡（推荐轮播）骨架：与 SiteHeroCarousel 同比例（2:1）与同结构 ——
 * 底部压标题与描述的浮层，右下角留出序号圆点的位置。
 */
const HeroSkeleton: React.FC = () => (
  <div
    className={`relative overflow-hidden rounded-lg border border-black/5 bg-slate-200 dark:border-white/5 dark:bg-slate-700/70 ${FEATURED_HERO_CLASS}`}
  >
    <div className="aspect-[2/1] w-full animate-pulse" />
    <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/30 to-transparent p-3 pb-6 sm:p-4 sm:pb-7">
      <Line className="h-4 w-1/3 bg-white/40 dark:bg-white/30" />
      <Line className="h-3 w-2/3 bg-white/25 dark:bg-white/20" />
    </div>
    {/* 序号圆点占位：与真实轮播的底部居中圆点同位置、同尺寸 */}
    <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 sm:bottom-3 sm:gap-2">
      <Block className="h-1.5 w-4 rounded-full bg-white/50" />
      <Block className="h-1.5 w-1.5 rounded-full bg-white/50" />
      <Block className="h-1.5 w-1.5 rounded-full bg-white/50" />
    </div>
  </div>
);

/**
 * 排行榜卡骨架：顶部 tabbar 两条 + 5 行榜单，结构与真实 `GridCard` 严格一致。
 *
 * 高度分配必须与真实卡片**同一套规则**：整卡纵向等分为 `RANK_SIZE + 1` 份，
 * tabbar 占 1 份（`flex-1`）、榜单容器占 `RANK_SIZE` 份（`flex-[5]`，
 * 其下各行再均分）。否则骨架里 tabbar 是固定高度、真实卡片里是弹性高度，
 * 数据到达并切回真实卡片时 tabbar 会突然变矮/变高，形成可见跳动。
 *
 * 对应常量见 `GridCard`：`RANK_SIZE` 与 `RANK_ROWS_FLEX_CLASS`。
 */
const RankSkeleton: React.FC = () => (
  <div
    className={`flex h-full w-full flex-col overflow-hidden rounded-md border border-black/5 bg-slate-100 dark:border-white/5 dark:bg-white/5 ${FEATURED_GRID_CARD_CLASS}`}
  >
    {/* tabbar 占位：与真实布局同结构（两个 tab 平分整行、flex-1 参与等分）+ 白底 */}
    <div className="flex flex-1 items-stretch border-b border-black/5 bg-white dark:border-white/10 dark:bg-white/10">
      {[0, 1].map((idx) => (
        <div key={idx} className="flex flex-1 items-center justify-center">
          <Line className="h-4 w-8 sm:h-5 sm:w-10" />
        </div>
      ))}
    </div>
    {/* 榜单行占位：与真实布局同样按 5 份等分，行高随卡片高度自适应；
        只占「名次 + 标题」两段，与真实行一致（榜单已不含站点 icon）。
        行之间加 gap 避免移动端 5 行贴在一起，gap 也会让每行高度相应变小。 */}
    <div className="flex min-h-0 flex-[5] flex-col gap-1.5 sm:gap-2">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="flex min-h-0 flex-1 items-center gap-2 px-3">
          <Block className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]" />
          <Line className="h-4 min-w-0 flex-1 sm:h-5" />
        </div>
      ))}
    </div>
  </div>
);

/** 推荐卡骨架：纯图 + 底部标题浮层，对应 SiteTileCard / ThumbCard */
const TileSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`relative h-full w-full overflow-hidden rounded-md border border-black/5 bg-slate-200 dark:border-white/5 dark:bg-slate-700/70 ${className}`}
  >
    <div className="h-full w-full animate-pulse" />
    <div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/30 to-transparent px-2 pb-1.5 pt-6">
      <Line className="h-3 min-w-0 flex-1 bg-white/35 dark:bg-white/25" />
    </div>
  </div>
);

/** 常规卡片骨架：对应 SiteCard（封面 + 信息条） */
const CardSkeleton: React.FC = () => (
  <div className="overflow-hidden rounded-lg border border-black/5 bg-white dark:border-white/5 dark:bg-[#1C1C1E]">
    {/* 封面：与卡片封面同比例 */}
    <div className="aspect-[16/10] w-full animate-pulse bg-slate-200 dark:bg-slate-700/70" />
    {/* 信息条：logo + 标题 + 描述 */}
    <div className="flex items-center gap-2 p-2 sm:p-2.5">
      <Block className="h-8 w-8 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Line className="h-4 w-2/3" />
        <Line className="h-3 w-full" />
      </div>
    </div>
  </div>
);

interface SiteGridSkeletonProps {
  /**
   * 是否渲染头条区（推荐轮播 + 排行榜 + 推荐宫格）的骨架。
   *
   * 必须与真实渲染的显隐条件保持一致：选中分类 / 输入搜索词后头条区收起，
   * 骨架若仍铺那一整块，数据到达时会出现「骨架有、内容没有」的塌陷跳动。
   */
  showFeatured?: boolean;
  /**
   * 是否渲染下方**常规卡片网格**的骨架。
   *
   * 常规列表与头条区聚合是两个独立请求，可能一个已就绪、另一个还在路上。
   * 此时只该为「仍未就绪」的那部分出骨架 ——
   * 若一律铺满，已到达的真实卡片会被骨架盖住，白等一轮。
   */
  showCards?: boolean;
}

export const SiteGridSkeleton: React.FC<SiteGridSkeletonProps> = ({
  showFeatured = true,
  showCards = true,
}) => (
  <div aria-hidden="true">
    {/* 头条区：超大卡 + 宫格（排行榜卡 + 推荐卡），栅格与真实布局共用类名 */}
    {showFeatured && (
      <div className={`mb-4 xl:mb-5 2xl:mb-8 ${FEATURED_CLASS}`}>
        <HeroSkeleton />
        <div className={FEATURED_TILES_CLASS}>
          <RankSkeleton />
          {/* 与真实渲染一致：移动端 2 张、lg 起 3 张，末张的显隐类名直接复用 */}
          {[0, 1, 2].map((idx) => (
            <TileSkeleton
              key={idx}
              className={`${idx === 0 ? FEATURED_TILE_FIRST_CLASS : ''} ${
                idx === 2 ? FEATURED_TILE_LAST_CLASS : ''
              }`}
            />
          ))}
        </div>
      </div>
    )}

    {/* 常规卡片网格：首屏骨架铺两行，行数与常见首屏可视范围相当 */}
    {showCards && (
      <div className={SITE_GRID_CLASS}>
        {Array.from({ length: showFeatured ? 8 : 10 }).map((_, idx) => (
          <CardSkeleton key={idx} />
        ))}
      </div>
    )}
  </div>
);

export default SiteGridSkeleton;
