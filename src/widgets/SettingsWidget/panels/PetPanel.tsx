import { PawPrint } from 'lucide-react';
import React from 'react';
import { ToggleDot } from '../ToggleDot';
import type { PetPanelProps } from '../types';

/**
 * 宠物设置面板：遵循 macOS System Settings 列表式分组卡片规范。
 * 可配置桌宠是否开启「自由活动」（定时驱动移动 / 跳跃 / 问候，
 * 触发间隔在 10~60 秒之间随机）。
 * 可在此切换桌宠形象（角色皮肤）。
 */
export const PetPanel: React.FC<PetPanelProps> = ({
  enabled,
  onToggleEnabled,
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
                  ? 'bg-[color:var(--accent)] text-white'
                  : 'bg-black/5 dark:bg-white/10 '
              }`}
            >
              <PawPrint size={15} />
            </span>
            <div>
              <div className=" ">
                自由活动
              </div>
              <div className="text-xs  mt-0.5">
                定时驱动桌宠移动、跳跃或说一句问候
              </div>
            </div>
          </span>
          <button onClick={onToggleEnabled} aria-label="切换桌宠自由活动">
            <ToggleDot active={enabled} />
          </button>
        </div>
      </div>
    </div>
  );
};
