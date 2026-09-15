/**
 * 站点卡片网格：网页列表与「我的」收藏共用同一套列数 / 间距，
 * 保证两处卡片在不同屏幕宽度下的响应式大小完全一致。
 * 移动端 1 列，向上递进到 2 / 3 列，xl 及以上固定 5 列（一排最多 5 个）。
 */
export const SITE_GRID_CLASS =
  'grid gap-4 xl:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';
