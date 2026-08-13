import { Button } from '@heroui/react';
import {
  Download,
  RefreshCw,
  RotateCcw,
  Upload,
  Volume2,
  VolumeX,
} from 'lucide-react';
import React, { useState } from 'react';
import { ToggleDot } from '../ToggleDot';
import { confirm } from '@/components/confirm';
import type { SystemPanelProps } from '../types';

/**
 * 系统面板：遵循 macOS System Settings 列表式分组卡片规范。
 * 左侧显示标题/图标，右侧显示交互控件（Switch / Button / File drop）。
 */
export const SystemPanel: React.FC<SystemPanelProps> = ({
  soundEnabled,
  onToggleSound,
  onExport,
  onReset,
  justReset,
  importMsg,
  onImportFile,
  fileInputRef,
  justResetSystem,
  onResetSystem,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleResetSystem = () =>
    confirm({
      title: '重置系统？',
      body: '将恢复默认布局、墙纸、便签、外观、主题色、点击音效、字号与屏幕亮度等所有设置，此操作不可撤销。',
      confirmText: '确定重置',
      danger: true,
      onConfirm: onResetSystem,
    });
  return (
    <div className=" px-5 py-6 space-y-6 text-sm">
      {/* 基础系统偏好 */}
      <div className="bg-black/[0.03] dark:bg-white/[0.06] rounded-[var(--card-radius)] overflow-hidden divide-y divide-black/5 dark:divide-white/10 border border-black/5 dark:border-white/10">
        {/* 点击音效 */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center space-x-3">
            <span
              className={`w-7 h-7 rounded-[var(--card-radius)] flex items-center justify-center transition-colors ${
                soundEnabled
                  ? 'bg-[color:var(--accent)] text-white'
                  : 'bg-black/5 dark:bg-white/10 '
              }`}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              点击音效
            </span>
          </span>
          <button onClick={onToggleSound} aria-label="切换点击音效">
            <ToggleDot active={soundEnabled} />
          </button>
        </div>
      </div>

      {/* 布局配置与备份数据 */}
      <div className="bg-black/[0.03] dark:bg-white/[0.06] rounded-[var(--card-radius)] overflow-hidden divide-y divide-black/5 dark:divide-white/10 border border-black/5 dark:border-white/10">
        {/* 导出布局 */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center space-x-3">
            <span className="w-7 h-7 rounded-[var(--card-radius)] flex items-center justify-center bg-[color:var(--accent)]/15 text-[color:var(--accent)]">
              <Download size={15} />
            </span>
            <div>
              <div className="font-medium text-slate-800 dark:text-[#F1F5F9]">
                导出配置文件
              </div>
              <div className="text-xs ">
                将组件布局与便签导出为 JSON
              </div>
            </div>
          </span>
          <button
            onClick={onExport}
            className="px-3 py-1.5 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-medium transition-colors"
          >
            导出
          </button>
        </div>

        {/* 恢复默认布局 */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center space-x-3">
            <span className="w-7 h-7 rounded-[var(--card-radius)] flex items-center justify-center bg-black/5 dark:bg-white/10 text-slate-500">
              <RotateCcw size={15} />
            </span>
            <div>
              <div className="font-medium text-slate-800 dark:text-[#F1F5F9]">
                重置组件布局
              </div>
              <div className="text-xs ">
                恢复为系统预设卡片摆放模式
              </div>
            </div>
          </span>
          <button
            onClick={onReset}
            className={`px-3 py-1.5 rounded-[var(--card-radius)] text-xs font-medium transition-colors ${
              justReset
                ? 'bg-[#28C840]/15 text-[#28C840]'
                : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15'
            }`}
          >
            {justReset ? '已重置' : '重置'}
          </button>
        </div>

        {/* 导入配置 */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center space-x-3">
            <span className="w-7 h-7 rounded-[var(--card-radius)] flex items-center justify-center bg-black/5 dark:bg-white/10 text-slate-500">
              <Upload size={15} />
            </span>
            <div>
              <div className="font-medium text-slate-800 dark:text-[#F1F5F9]">
                导入配置文件
              </div>
              <div className="text-xs ">
                {importMsg ? (
                  <span
                    className={
                      importMsg.type === 'error'
                        ? 'text-red-500'
                        : 'text-[#28C840]'
                    }
                  >
                    {importMsg.text}
                  </span>
                ) : (
                  '拖拽 JSON 文件到此处或点击导入'
                )}
              </div>
            </div>
          </span>

          <div
            role="button"
            tabIndex={0}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) onImportFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`px-3 py-1.5 rounded-[var(--card-radius)] border border-dashed text-xs font-medium cursor-pointer transition-colors ${
              isDragging
                ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/10 text-[color:var(--accent)]'
                : 'border-black/15 dark:border-white/20 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15'
            }`}
          >
            <span>选择文件</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportFile(file);
                e.target.value = '';
              }}
            />
          </div>
        </div>
      </div>

      {/* 危险区/擦除恢复 */}
      <div className="bg-black/[0.03] dark:bg-white/[0.06] rounded-[var(--card-radius)] overflow-hidden divide-y divide-black/5 dark:divide-white/10 border border-black/5 dark:border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center space-x-3">
            <span className="w-7 h-7 rounded-[var(--card-radius)] flex items-center justify-center bg-red-500/15 text-red-500">
              <RefreshCw size={15} />
            </span>
            <div>
              <div className="font-medium text-red-500">重置整个系统</div>
              <div className="text-xs ">
                清除本地所有缓存、壁纸、便签及自定义偏好
              </div>
            </div>
          </span>

          <Button
            className={`px-3 py-1.5 rounded-[var(--card-radius)] text-xs font-medium transition-colors ${
              justResetSystem
                ? 'bg-[#28C840]/15 text-[#28C840]'
                : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
            }`}
            onPress={handleResetSystem}
          >
            {justResetSystem ? '已全部重置' : '重置系统'}
          </Button>
        </div>
      </div>
    </div>
  );
};
