/**
 * 站点卡片网格：网页列表与「我的」收藏共用同一套列数 / 间距，
 * 保证两处卡片在不同屏幕宽度下的响应式大小完全一致。
 * 移动端 1 列，向上递进到 2 / 3 列，xl 及以上固定 5 列（一排最多 5 个）。
 *
 * 间距：仅移动端（< sm）收紧为 gap-3（12px），
 * sm 起恢复原值 gap-4，xl 放大到 gap-8。
 */
export const SITE_GRID_CLASS =
  'grid gap-3 sm:gap-4 xl:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';

/**
 * 「我的」收藏网格：与 SITE_GRID_CLASS 的区别只在**移动端列数**。
 *
 * 网页列表移动端的卡是「大封面 + 信息条」，1 列才有足够宽度；
 * 收藏页用户是在自己的列表里快速扫找，2 列一屏能看到更多，
 * 且卡片结构与网页卡一致（同样有封面 + 标题），2 列仍能看清。
 *
 * sm 之后与网页列表保持一致（2 → 3 → 5 列）。
 */
export const FAVORITES_GRID_CLASS =
  'grid gap-3 sm:gap-4 xl:gap-8 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';

/**
 * 头条区（抖音式）：左侧 1 张超大卡片（2:1）+ 右侧 2×2 共 4 张卡片。
 * 行高由左侧大卡的 16:9 推导，右侧四宫格通过 items-stretch 撑满同高；
 * 小屏为纵向堆叠，高度由卡片自身决定。
 */
export const FEATURED_CLASS =
  'grid grid-cols-1 gap-3 sm:gap-4 xl:gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-stretch';

/** 头条区右侧四宫格 */
export const FEATURED_TILES_CLASS =
  'grid grid-cols-2 grid-rows-2 gap-3 sm:gap-4 xl:gap-8';

