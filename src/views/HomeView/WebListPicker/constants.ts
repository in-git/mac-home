/**
 * 站点卡片网格：网页列表用。
 * 移动端 1 列，向上递进到 2 / 3 列，xl / 2xl 及以上 4~5 列（一排最多 5 个）。
 *
 * 间距分档（避免小屏桌面被迫吃下大屏才该有的间距）：
 * - < sm：gap-3（12px）
 * - sm ~ xl：gap-4（16px）
 * - xl ~ 2xl（1280~1536px，含 1300 / 1440 这类偏小桌面屏）：gap-5（20px）
 * - 2xl 起（≥ 1536px）：gap-8（32px）
 *
 * 列数同理：xl 档先给 4 列，2xl 才上 5 列。
 * 早期直接在 xl 跳 5 列 + gap-8，导致 1300px 屏每卡仅约 228px 宽、内容被压得过挤。
 */
export const SITE_GRID_CLASS =
  'grid gap-3 sm:gap-4 xl:gap-5 2xl:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';

/** 头条区：推荐轮播与右侧 2×2 宫格共用站点网格的列线和间距。 */
export const FEATURED_CLASS =
  'grid gap-3 sm:gap-4 xl:gap-5 2xl:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 lg:items-stretch';

export const FEATURED_HERO_CLASS =
  'col-span-1 lg:col-span-2 xl:col-span-2 2xl:col-span-3';

export const FEATURED_TILES_CLASS =
  'col-span-1 xl:col-span-2 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-rows-2 xl:gap-5 2xl:gap-8';
