/**
 * 主题色板（唯一数据源）：设置面板强调色与壁纸/弹窗等场景统一使用的苹果风配色。
 * 抽离到全局 options，避免在各组件内重复硬编码。
 * 默认主题色为苹果蓝 #007AFF，与 useHomeStore 的 themeColor 默认值一致。
 */
export const ACCENT_COLORS = [
  { name: '蓝', value: '#007AFF' },
  { name: '绿', value: '#5BBF8A' },
  { name: '橙', value: '#F3A463' },
  { name: '粉', value: '#F07C97' },
  { name: '紫', value: '#B07CD6' },
  { name: '石墨', value: '#8A8F98' },
  { name: '青', value: '#54C1D6' },
  { name: '黄', value: '#F0CF6B' },
] as const;

export type ThemeColor = (typeof ACCENT_COLORS)[number]['value'];

/** 纯色值集合，由 ACCENT_COLORS 派生，供壁纸/弹窗等场景循环渲染使用。 */
export const THEME_COLORS: readonly ThemeColor[] = ACCENT_COLORS.map(
  (c) => c.value,
);
