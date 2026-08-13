/**
 * 时钟组件「个性化」配置的预设选项。
 * 集中在 data/options 下，供 ContextMenu 的 ClockFontSubmenu 读取，
 * 避免把预设列表硬编码在 UI 组件中，便于统一维护与将来扩展。
 */

/** 预设字体颜色；clear 为 true 代表「跟随主题」（清空自定义颜色）。 */
export interface ClockFontColorOption {
  label: string;
  value: string;
  clear?: boolean;
}

/** 预设字体颜色（含「跟随主题」与主题色、常用色）。 */
export const CLOCK_FONT_COLORS: ClockFontColorOption[] = [
  { label: '跟随主题', value: '', clear: true },
  { label: '主题色', value: 'var(--accent)' },
  { label: '白色', value: '#FFFFFF' },
  { label: '黑色', value: '#1a1a1a' },
  { label: '红色', value: '#ef4444' },
  { label: '蓝色', value: '#3b82f6' },
  { label: '绿色', value: '#22c55e' },
  { label: '橙色', value: '#f97316' },
];

/** 预设字号档位。 */
export interface ClockFontSizeOption {
  label: string;
  value: string;
}

/** 预设字号档位（小 / 中 / 大 / 特大，并在「特大」基础上往上拓展三档）。 */
export const CLOCK_FONT_SIZES: ClockFontSizeOption[] = [
  { label: '小', value: '1.25rem' },
  { label: '中', value: '1.75rem' },
  { label: '大', value: '2.25rem' },
  { label: '特大', value: '3rem' },
  { label: '巨大', value: '4rem' },
  { label: '超大', value: '5rem' },
  { label: '极致', value: '6rem' },
];
