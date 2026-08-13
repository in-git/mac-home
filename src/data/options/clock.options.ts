/**
 * 时钟组件「个性化」配置的预设选项。
 * 集中在 data/options 下，供 ContextMenu 的 ClockFontSubmenu 读取，
 * 避免把预设列表硬编码在 UI 组件中，便于统一维护与将来扩展。
 */

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
