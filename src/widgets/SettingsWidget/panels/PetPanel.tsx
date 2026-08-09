import { PawPrint, Zap } from 'lucide-react';
import React from 'react';
import { SegmentedControl } from '../SegmentedControl';
import { ToggleDot } from '../ToggleDot';
import type { PetPanelProps } from '../types';

/** 触发间隔预设档位（秒） */
const INTERVAL_OPTIONS: { value: number; label: string }[] = [
  { value: 10, label: '10 秒' },
  { value: 30, label: '30 秒' },
  { value: 60, label: '1 分钟' },
  { value: 120, label: '2 分钟' },
];

/**
 * 宠物设置面板：遵循 macOS System Settings 列表式分组卡片规范。
 * 可配置桌宠是否开启「自由活动」（模型定时驱动移动 / 跳跃 / 问候）
 * 以及触发间隔，并提示开启后会更频繁消耗模型 Token。
 */
export const PetPanel: React.FC<PetPanelProps> = ({
  enabled,
  onToggleEnabled,
  interval,
  onIntervalChange,
}) => {
  return (
    <div className="px-5 py-6 space-y-6 text-sm">
      {/* 自由活动开关 */}
      <div className="bg-black/[0.03] dark:bg-white/[0.06] rounded-[var(--card-radius)] overflow-hidden divide-y divide-black/5 dark:divide-white/10 border border-black/5 dark:border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center space-x-3">
            <span
              className={`w-7 h-7 rounded-[var(--card-radius)] flex items-center justify-center transition-colors ${
                enabled
                  ? 'bg-[#007AFF] text-white'
                  : 'bg-black/5 dark:bg-white/10 text-slate-400'
              }`}
            >
              <PawPrint size={15} />
            </span>
            <div>
              <div className="font-medium text-slate-800 dark:text-slate-200">
                自由活动
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                模型定时驱动桌宠移动、跳跃或说一句问候
              </div>
            </div>
          </span>
          <button onClick={onToggleEnabled} aria-label="切换桌宠自由活动">
            <ToggleDot active={enabled} />
          </button>
        </div>

        {/* Token 消耗提示 */}
        <div className="flex items-start space-x-2.5 px-4 py-3 bg-amber-500/10 dark:bg-amber-500/15">
          <Zap size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-amber-600 dark:text-amber-400">
            开启自由活动后，桌宠将按设定间隔持续向 AI 模型发起请求，
            会明显消耗更多 Token，请根据用量预算自行选择是否开启。
          </p>
        </div>
      </div>

      {/* 触发间隔 */}
      <div className="bg-black/[0.03] dark:bg-white/[0.06] rounded-[var(--card-radius)] overflow-hidden divide-y divide-black/5 dark:divide-white/10 border border-black/5 dark:border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-medium text-slate-800 dark:text-slate-200">
            触发间隔
          </span>
          <SegmentedControl
            ariaLabel="自由活动触发间隔"
            value={String(interval)}
            onChange={(v) => onIntervalChange(Number(v))}
            options={INTERVAL_OPTIONS.map((o) => ({
              value: String(o.value),
              label: o.label,
            }))}
          />
        </div>
      </div>
    </div>
  );
};
