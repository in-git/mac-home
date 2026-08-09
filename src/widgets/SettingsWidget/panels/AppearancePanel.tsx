import {
  Check,
  ChevronRight,
  Image as ImageIcon,
  Moon,
  Sun,
} from 'lucide-react';
import React from 'react';
import {
  CARD_RADIUS_LABEL,
  FONT_TIER_PX,
  FONT_VARIANT_LABEL,
} from '../../../types';
import { ACCENT_COLORS } from '../constants';
import { SegmentedControl } from '../SegmentedControl';
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
  openWallpaper,
}) => {
  return (
    <div className="px-5 py-6 space-y-6 text-sm">
      {/* 外观模式与主题分组卡片 */}
      <div className="bg-black/[0.03] dark:bg-white/[0.06] rounded-xl overflow-hidden divide-y divide-black/5 dark:divide-white/10 border border-black/5 dark:border-white/10">
        {/* 外观 */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-medium text-slate-800 dark:text-slate-200">
            外观
          </span>
          <SegmentedControl
            ariaLabel="外观模式"
            value={isDarkMode ? 'dark' : 'light'}
            onChange={(v) => setDarkMode(v === 'dark')}
            options={[
              { value: 'light', label: <span className="flex items-center space-x-1.5"><Sun size={13} /><span>浅色</span></span> },
              { value: 'dark', label: <span className="flex items-center space-x-1.5"><Moon size={13} /><span>深色</span></span> },
            ]}
          />
        </div>

        {/* 墙纸 */}
        <button
          onClick={openWallpaper}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors text-left"
        >
          <span className="flex items-center space-x-3">
            <span className="w-7 h-7 rounded-md flex items-center justify-center bg-[#007AFF]/15 text-[#007AFF]">
              <ImageIcon size={15} />
            </span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              墙纸设置
            </span>
          </span>
          <span className="flex items-center space-x-1 text-slate-400 text-xs">
            <span>选定墙纸</span>
            <ChevronRight size={14} />
          </span>
        </button>

        {/* 强调色 */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-medium text-slate-800 dark:text-slate-200">
            强调色
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
                      ? 'ring-2 ring-offset-2 ring-[#007AFF] dark:ring-white/80'
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
      <div className="bg-black/[0.03] dark:bg-white/[0.06] rounded-xl overflow-hidden divide-y divide-black/5 dark:divide-white/10 border border-black/5 dark:border-white/10">
        {/* 字体大小 */}
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="font-medium text-slate-800 dark:text-slate-200">
              字体大小
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              小 {FONT_TIER_PX[fontVariant].sm} / 中{' '}
              {FONT_TIER_PX[fontVariant].md} / 大 {FONT_TIER_PX[fontVariant].lg}{' '}
              px
            </div>
          </div>
          <SegmentedControl
            ariaLabel="字体大小"
            value={fontVariant}
            onChange={setFontVariant}
            options={(['A', 'B', 'C'] as const).map((v) => ({
              value: v,
              label: FONT_VARIANT_LABEL[v],
            }))}
          />
        </div>

        {/* 卡片圆角 */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-medium text-slate-800 dark:text-slate-200">
            卡片圆角
          </span>
          <SegmentedControl
            ariaLabel="卡片圆角"
            value={cardRadius}
            onChange={setCardRadius}
            options={(['tiny', 'small', 'medium', 'large'] as const).map((v) => ({
              value: v,
              label: CARD_RADIUS_LABEL[v],
            }))}
          />
        </div>
      </div>
    </div>
  );
};
