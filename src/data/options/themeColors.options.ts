/**
 * 主题色板：壁纸/弹窗等场景统一使用的强调色集合。
 * 抽离到全局 options，避免在各组件内重复硬编码。
 * 与设置面板 ACCENT_COLORS 保持一致的柔和苹果风配色。
 */
export const THEME_COLORS = [
  '#4F9DE0',
  '#5BBF8A',
  '#F3A463',
  '#F0CF6B',
  '#B07CD6',
  '#F07C97',
  '#8A8F98',
  '#54C1D6',
] as const;

export type ThemeColor = (typeof THEME_COLORS)[number];
