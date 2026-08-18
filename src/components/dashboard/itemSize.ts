import { WidgetItem, WidgetType } from '../../types';
import { isWebGrid } from '../../data/widgetConfig';

// ############################################################
// react-grid-layout 辅助参数与工具函数
// ############################################################

/** RGL 网格基准参数（与 DashboardGrid 中 GridLayout 保持一致） */
export const RGL_COLS = 24;
export const RGL_ROW_HEIGHT = 10;
export const RGL_MARGIN: [number, number] = [16, 16];

/** RGL 行数 → 卡片像素高度（含行间距），用于卡片内联高度。 */
export function gridHeightPx(h: number): number {
  return h * RGL_ROW_HEIGHT + (h - 1) * RGL_MARGIN[1];
}

/** 非 web-grid 组件初始默认占用的列数（半宽）。 */
export const DEFAULT_GRID_W = 12;

/** web-grid 初始默认像素宽 */
const DEFAULT_WEB_GRID_PX = 180;

/**
 * 生成初始 react-grid-layout 坐标。
 * - 高度：默认估算行数 h（高度由 grid.h 控制，用户后续拖拽调整）；
 * - 宽度：web-grid 默认列数，其余类型用统一默认列数 DEFAULT_GRID_W。
 */
export function buildInitialGrid(
  type: WidgetType,
  containerWidth?: number,
): { x: number; y: number; w: number; h: number } {
  const h = 8;
  const w = isWebGrid(type)
    ? (() => {
        const colWidth = containerWidth
          ? containerWidth / RGL_COLS - RGL_MARGIN[0]
          : 1440 / RGL_COLS - RGL_MARGIN[0];
        return Math.min(RGL_COLS, Math.max(2, Math.round(DEFAULT_WEB_GRID_PX / colWidth)));
      })()
    : DEFAULT_GRID_W;
  return { x: 0, y: 0, w, h };
}

/** 确保 widget 带有 grid：缺失时生成初始 grid（迁移旧数据用）。 */
export function ensureGrid(
  w: WidgetItem,
  containerWidth?: number,
): WidgetItem {
  const g = (w as { grid?: { x: number; y: number; w: number; h: number } }).grid;
  if (g && typeof g.x === 'number') return w;
  return { ...w, grid: buildInitialGrid(w.type, containerWidth) };
}

/**
 * 寻找网格中可容纳大小为 (w, h) 的首个可用 (x, y) 空闲位置
 * @param existingWidgets 当前已存在的组件列表
 * @param itemWidth 待放置组件的宽度 w
 * @param itemHeight 待放置组件的高度 h
 * @param cols 总列数，默认 12
 */
export function findFirstAvailablePosition(
  existingWidgets: WidgetItem[],
  itemWidth: number,
  itemHeight: number,
  cols: number = RGL_COLS,
): { x: number; y: number } {
  // 如果没有组件，直接放在 (0, 0)
  if (!existingWidgets.length) {
    return { x: 0, y: 0 };
  }

  // 1. 搜集所有已占据单元格的集合 "x,y"
  const occupied = new Set<string>();
  let maxY = 0;

  for (const widget of existingWidgets) {
    const { x, y, w, h } = widget.grid || { x: 0, y: 0, w: 1, h: 1 };
    for (let r = y; r < y + h; r++) {
      for (let c = x; c < x + w; c++) {
        occupied.add(`${c},${r}`);
      }
    }
    if (y + h > maxY) {
      maxY = y + h;
    }
  }

  // 2. 从 y = 0 到 maxY + 1 逐行逐列扫描
  for (let y = 0; y <= maxY + 1; y++) {
    for (let x = 0; x <= cols - itemWidth; x++) {
      let canFit = true;
      // 检查以 (x, y) 为左上角的 (w, h) 区域是否被占用
      for (let r = y; r < y + itemHeight; r++) {
        for (let c = x; c < x + itemWidth; c++) {
          if (occupied.has(`${c},${r}`)) {
            canFit = false;
            break;
          }
        }
        if (!canFit) break;
      }

      if (canFit) {
        return { x, y };
      }
    }
  }

  return { x: 0, y: maxY };
}
