/**
 * 站点卡片网格：网页列表与「我的」收藏共用同一套列数 / 间距，
 * 保证两处卡片在不同屏幕宽度下的响应式大小完全一致。
 * 移动端 1 列，向上递进到 2 / 3 列，xl 及以上固定 5 列（一排最多 5 个）。
 */
export const SITE_GRID_CLASS =
  'grid gap-4 xl:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';

/**
 * 头条区（抖音式）：左侧 1 张超大卡片（2:1）+ 右侧 2×2 共 4 张卡片。
 * 行高由左侧大卡的 16:9 推导，右侧四宫格通过 items-stretch 撑满同高；
 * 小屏为纵向堆叠，高度由卡片自身决定。
 */
export const FEATURED_CLASS =
  'grid grid-cols-1 gap-4 xl:gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-stretch';

/** 头条区右侧四宫格 */
export const FEATURED_TILES_CLASS = 'grid grid-cols-2 grid-rows-2 gap-4 xl:gap-8';
