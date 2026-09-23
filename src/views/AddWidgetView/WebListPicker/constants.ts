/**
 * 站点卡片网格：网页列表用。
 * 移动端 1 列，向上递进到 2 / 3 列，xl 及以上固定 5 列（一排最多 5 个）。
 *
 * 间距：仅移动端（< sm）收紧为 gap-3（12px），
 * sm 起恢复原值 gap-4，xl 放大到 gap-8。
 */
export const SITE_GRID_CLASS =
  'grid gap-3 sm:gap-4 xl:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';

/**
 * 头条区（抖音式）：左侧 1 张超大卡片 + 右侧宫格（排行榜卡 + 推荐站点卡）。
 *
 * 复用与下方 SITE_GRID_CLASS 完全相同的列定义（列数 + gap），
 * 再通过 col-span 让大卡与宫格各占整数列，
 * 从而与下方卡片逐列对齐、宽度严格一致：
 *   - 移动端 / sm（< 1024px）：大卡与宫格各占满 1 列（纵向堆叠）
 *   - lg（3 列）：大卡跨 2 列，宫格跨 1 列（合计 3 列）
 *   - xl（5 列）：大卡跨 3 列，宫格跨 2 列（合计 5 列）
 *
 * lg 档（1024~1280px，平板横屏 / 小笔记本）必须与 xl 一样左右并排：
 * 若此处仍是各占 1 列，大卡会被压在 1/3 宽度里、且右侧空出 1/3 整行，
 * 这一档设备数量不少，属于必须覆盖的主流量区间。
 *
 * 行高：lg 起由左侧大卡推导（`lg:items-stretch`），宫格四格撑满同高；
 * 移动端为纵向堆叠，行高由宫格自身内容决定。
 */
export const FEATURED_CLASS =
  'grid gap-3 sm:gap-4 xl:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 lg:items-stretch';

/** 头条区左侧超大卡片：按网格列数跨列 */
export const FEATURED_HERO_CLASS =
  'col-span-1 lg:col-span-2 xl:col-span-3';

/**
 * 头条区右侧宫格：lg 起占 1 整列、xl 占 2 整列，内部为 2 列。
 *
 * **行数分两档，两端互不影响**：
 * - 移动端（< lg）：宫格占满整行、只有 2 列，排行榜卡跨 2 行独占左列，
 *   右列 2 格放推荐卡 —— 隐式两行（不写 `grid-rows`，行高由两卡内容决定）。
 * - lg 起：宫格与超大卡左右并排，恢复标准 2×2，四格撑满大卡推导出的统一高度。
 *
 * 因此 `grid-rows-2` 只加在 `lg:` 上：移动端若也写死两行行高，
 * 会让「排行榜跨 2 行 + 右列 2 卡」的行高被压缩得不均匀。
 */
export const FEATURED_TILES_CLASS =
  'col-span-1 xl:col-span-2 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-rows-2 xl:gap-8';

/**
 * 排行榜卡：
 * - 移动端（< lg）：跨 2 行独占左列，让它拿到足够宽度、避免被压得看不见
 * - lg 起：只占左上角**单格**（`row-span-1`），其余 3 格留给推荐站点卡
 *
 * `row-span-2` 必须限定在移动端 —— 早期漏写断点导致 PC 端也跨 2 行、
 * 多占了一格，属于两端样式相互影响。
 */
export const FEATURED_GRID_CARD_CLASS =
  'col-start-1 row-span-2 lg:row-span-1';

/**
 * 宫格内首张推荐站点卡：从第 2 列起排，让开左上角的排行榜卡。
 * 移动端宫格为 2 列（右上 / 右下），lg 起为 2×2（右上 / 左下 / 右下）。
 */
export const FEATURED_TILE_FIRST_CLASS = 'col-start-2';

/**
 * 宫格内**末张**推荐站点卡的显隐控制。
 *
 * 移动端（< lg）宫格只跨 1 列、内部 2 列：排行榜卡已占满左列上下 2 格，
 * 右列只有 2 格，第 3 张会溢出到第 3 行且左侧空一格，视觉上「多出来一张」，
 * 故此处隐藏，只保留填满右列的 2 张；
 * lg 起宫格为 2×2、排行榜只占 1 格，3 张正好铺满其余 3 格，需要显示。
 */
export const FEATURED_TILE_LAST_CLASS = 'max-lg:hidden';
