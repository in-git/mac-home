/**
 * 主题色板：壁纸/弹窗等场景统一使用的强调色集合。
 * 抽离到全局 options，避免在各组件内重复硬编码。
 */
export const THEME_COLORS = [
  '#007AFF',
  '#FF3B30',
  '#FF9500',
  '#FFCC00',
  '#34C759',
  '#AF52DE',
  '#FF2D55',
  '#5AC8FA',
] as const;

export type ThemeColor = (typeof THEME_COLORS)[number];
