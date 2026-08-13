/**
 * 时钟组件「个性化」配置的预设选项。
 * 集中在 data/options 下，供 ContextMenu 的 ClockFontSubmenu 读取，
 * 避免把预设列表硬编码在 UI 组件中，便于统一维护与将来扩展。
 */

import { ACCENT_COLORS } from './themeColors.options';

/** 预设字号档位。 */
export interface ClockFontSizeOption {
  label: string;
  value: string;
}

/** 预设字号档位（小 / 中 / 大 / 特大，并在「特大」基础上往上拓展三档）。 */
export const CLOCK_FONT_SIZES: ClockFontSizeOption[] = [
  { label: '极小', value: '1.75rem' },
  { label: '小', value: '2.25rem' },
  { label: '默认', value: '3rem' },
  { label: '中', value: '4rem' },
  { label: '大', value: '5rem' },
  { label: '特大', value: '6rem' },
];

/** 字体颜色选项：首项「跟随主题」用于清空自定义颜色，其余为纯色（含黑白 + 主题色板）。 */
export interface ClockFontColorOption {
  label: string;
  value: string;
  /** 纯黑/纯白按钮在浅/深背景下不可见，用文字标识保证可辨识。 */
  text?: string;
}

export const CLOCK_FONT_COLORS: ClockFontColorOption[] = [
  { label: '跟随主题', value: '' },
  { label: '黑', value: '#000000', text: '黑' },
  { label: '白', value: '#FFFFFF', text: '白' },
  ...ACCENT_COLORS.map((c) => ({ label: c.name, value: c.value })),
];
