import { Check } from 'lucide-react';
import React from 'react';
import {
  CARD_RADIUS,
  FONT_VARIANT,
} from '@/types';
import { ACCENT_COLORS } from '../constants';
import { SegmentedControl } from '@/components/SegmentedControl';
import type { AppearancePanelProps } from '../types';

/**
 * 外观面板：严格遵循 macOS macOS System Settings 设计规范，
 * 采用“分组列表”结构：左侧项目/标题，右侧控件/选项。
 */
export const AppearancePanel: React.FC<AppearancePanelProps> = ({
  isDarkMode,
  setDarkMode,
  themeColor,
  setThemeColor,
  fontVariant,
  setFontVariant,
  cardRadius,
  setCardRadius,
}) => {
  return (
    <div className="px-5 py-6 space-y-6 text-sm">
      {/* 外观模式与主题分组卡片 */}
      <div className="bg-black/[0.03] dark:bg-white/[0.06] rounded-[var(--card-radius)] overflow-hidden divide-y divide-black/5 dark:divide-white/10 border border-black/5 dark:border-white/10">
        {/* 外观 */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className=" ">
            外观
          </span>
          <SegmentedControl
            ariaLabel="外观模式"
            value={isDarkMode ? 'dark' : 'light'}
            onChange={(v) => setDarkMode(v === 'dark')}
            options={[
              { value: 'light', label: '浅色' },
              { value: 'dark', label: '深色' },
            ]}
          />
        </div>

        {/* 强调色 */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className=" ">
            主题色
          </span>
          <div className="flex items-center space-x-2">
            {ACCENT_COLORS.map((c) => {
              const active = themeColor.toLowerCase() === c.value.toLowerCase();
              return (
                <button
                  key={c.value}
                  onClick={() => setThemeColor(c.value)}
                  title={c.name}
                  className={`relative w-5 h-5 rounded-full transition-transform hover:scale-110 active:scale-95 ${
                    active
                      ? 'ring-2 ring-offset-2 ring-[color:var(--accent)] dark:ring-white/80'
                      : ''
                  }`}
                  style={{ backgroundColor: c.value }}
                >
                  {active && (
                    <Check
                      size={11}
                      className="mx-auto text-white drop-shadow-xs"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 排版与排版尺寸分组 */}
      <div className="bg-black/[0.03] dark:bg-white/[0.06] rounded-[var(--card-radius)] overflow-hidden divide-y divide-black/5 dark:divide-white/10 border border-black/5 dark:border-white/10">
        {/* 字体大小 */}
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className=" ">
              字体大小
            </div>
            <div className="text-xs  mt-0.5">
              小 {FONT_VARIANT.find((f) => f.value === fontVariant)!.px.sm} / 中{' '}
              {FONT_VARIANT.find((f) => f.value === fontVariant)!.px.md} / 大{' '}
              {FONT_VARIANT.find((f) => f.value === fontVariant)!.px.lg} px
            </div>
          </div>
          <SegmentedControl
            ariaLabel="字体大小"
            value={fontVariant}
            onChange={setFontVariant}
            size='sm'
            options={FONT_VARIANT.map((f) => ({
              value: f.value,
              label: f.label,
            }))}
          />
        </div>

        {/* 卡片圆角 */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className=" ">
            卡片圆角
          </span>
          <SegmentedControl
            ariaLabel="卡片圆角"
            value={cardRadius}
            onChange={setCardRadius}
            options={(['tiny', 'small', 'medium', 'large'] as const).map(
              (v) => ({
                value: v,
                label: CARD_RADIUS[v].label,
              }),
            )}
          />
        </div>
      </div>
    </div>
  );
};
