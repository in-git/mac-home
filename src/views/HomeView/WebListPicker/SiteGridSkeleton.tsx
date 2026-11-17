import React from 'react';
import {
  FEATURED_CLASS,
  FEATURED_HERO_CLASS,
  FEATURED_TILES_CLASS,
  SITE_GRID_CLASS,
} from './constants';

/**
 * 网页列表首屏骨架屏。
 *
 * 头条区与常规网格复用真实布局的栅格类名和卡片比例，
 * 避免数据到达后页面跳动。
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
    className={`relative w-full overflow-hidden rounded-lg border border-black/5 bg-slate-200 dark:border-white/5 dark:bg-slate-700/70 ${FEATURED_HERO_CLASS}`}
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

/** Banner 旁宫格卡片骨架 */
const TileSkeleton: React.FC = () => (
  <div className="relative h-full min-h-[7rem] w-full overflow-hidden rounded-md border border-black/5 bg-slate-200 dark:border-white/5 dark:bg-slate-700/70 lg:min-h-0">
    <div className="h-full w-full animate-pulse" />
    <div className="absolute inset-x-0 bottom-0 flex items-center px-2 pb-1.5 pt-6">
      <Line className="h-3 min-w-0 flex-1 bg-white/35 dark:bg-white/25" />
    </div>
  </div>
);

/** 常规卡片骨架：对应 SiteCard（封面 + 信息条） */
const CardSkeleton: React.FC = () => (
  <div className="overflow-hidden rounded-lg border border-black/5 bg-white dark:border-white/5 dark:bg-[#1C1C1E]">
    {/* 封面：与卡片封面同比例 */}
    <div className="aspect-[16/10] w-full animate-pulse bg-slate-200 dark:bg-slate-700/70" />
    {/* 信息条：logo + 标题 + 描述。移动端真实卡片走 mobileImageOnly 只留封面，
        骨架同步隐藏，避免数据到达后高度塌陷跳动 */}
    <div className="flex items-center gap-2 p-2 max-sm:hidden sm:p-2.5">
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
   * 是否渲染推荐轮播与右侧宫格骨架。
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
    {/* 头条区：推荐轮播 + 右侧 2×2 宫格 */}
    {showFeatured && (
      <div className={`mb-4 xl:mb-5 2xl:mb-8 ${FEATURED_CLASS}`}>
        <HeroSkeleton />
        <div className={FEATURED_TILES_CLASS}>
          {[0, 1, 2, 3].map((idx) => (
            <TileSkeleton key={idx} />
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
