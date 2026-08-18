import { Check, PawPrint, Zap, Send } from 'lucide-react';
import React, { useState } from 'react';
import { ROLE_SKINS } from '../../../data/roles';
import { ToggleDot } from '../ToggleDot';
import { usePetAgent } from '../../../hooks/usePetAgent';
import type { PetPanelProps } from '../types';

/**
 * 宠物设置面板：遵循 macOS System Settings 列表式分组卡片规范。
 * 可配置桌宠是否开启「自由活动」（模型定时驱动移动 / 跳跃 / 问候），
 * 触发间隔在 10~60 秒之间随机，并提示开启后会更频繁消耗模型 Token。
 * 可在此切换桌宠形象（角色皮肤）。
 */
export const PetPanel: React.FC<PetPanelProps> = ({
  enabled,
  onToggleEnabled,
  selectedRoleId,
  onSelectRole,
}) => {
  const { send, loading } = usePetAgent();
  const [input, setInput] = useState('');

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    void send(text);
  };

  return (
    <div className="px-5 py-6 space-y-6 text-sm">
      {/* 形象选择 */}
      <div className="bg-black/[0.03] dark:bg-white/[0.06] rounded-[var(--card-radius)] overflow-hidden border border-black/5 dark:border-white/10">
        <div className="px-4 py-3 border-b border-black/5 dark:border-white/10">
          <div className=" text-slate-800 dark:text-slate-200">
            桌宠形象
          </div>
          <div className="text-xs mt-0.5 text-slate-500 dark:text-slate-400">
            选择桌面上显示的桌宠角色
          </div>
        </div>
        <div className="divide-y divide-black/5 dark:divide-white/10">
          {ROLE_SKINS.map((skin) => {
            const active = skin.id === selectedRoleId;
            return (
              <button
                key={skin.id}
                onClick={() => onSelectRole(skin.id)}
                className={`flex items-center justify-between w-full px-4 py-3 transition-colors ${
                  active
                    ? 'bg-[color:var(--accent)]/10'
                    : 'hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <span className="flex items-center space-x-3">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-[color:var(--accent)] text-white'
                        : 'bg-black/5 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {skin.name.slice(0, 1)}
                  </span>
                  <span className=" text-slate-800 dark:text-slate-200">
                    {skin.name}
                  </span>
                </span>
                {active && (
                  <Check size={16} className="text-[color:var(--accent)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

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
              <div className=" text-slate-800 dark:text-slate-200">
                自由活动
              </div>
              <div className="text-xs  mt-0.5">
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
            开启自由活动后，桌宠将每隔 10~60 秒（随机）持续向 AI 模型发起请求，
            会明显消耗更多 Token，请根据用量预算自行选择是否开启。
          </p>
        </div>
      </div>

      {/* 和桌宠说话：用户一句话，模型决策调用桌宠行为（petTools） */}
      <div className="bg-black/[0.03] dark:bg-white/[0.06] rounded-[var(--card-radius)] overflow-hidden border border-black/5 dark:border-white/10">
        <div className="px-4 py-3 border-b border-black/5 dark:border-white/10">
          <div className=" text-slate-800 dark:text-slate-200">
            和桌宠说话
          </div>
          <div className="text-xs mt-0.5 text-slate-500 dark:text-slate-400">
            输入一句话，由大模型决定让桌宠做什么（说话 / 移动 / 跳跃 / 庆祝）
          </div>
        </div>
        <div className="flex items-center space-x-2 px-4 py-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder={loading ? '桌宠思考中…' : '例如：跟我说声嗨，然后跳一下'}
            disabled={loading}
            className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg bg-white/70 dark:bg-black/30 border border-black/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-[color:var(--accent)] disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            aria-label="发送给桌宠"
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-[color:var(--accent)] text-white disabled:opacity-40 transition-opacity"
          >
            <Send size={15} />
          </button>
        </div>
      </div>


    </div>
  );
};
