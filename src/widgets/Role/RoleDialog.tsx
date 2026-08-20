import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ROLE_DIALOG_CLOSE_EVENT,
  ROLE_DIALOG_EVENT,
  type DialogChoice,
  type RoleDialogConfig,
} from '../../agent/pet/dialog';
import { DEFAULT_PHYSICS_CONFIG } from './physics';
import { useHomeStore } from '../../store/useHomeStore';
import { getRoleSkin } from '../../data/roles';

/**
 * 角色对话框组件。
 * 由配置驱动，支持两种模式：
 * - base 基础对话：单条气泡，定时自动隐藏。
 * - game 文字游戏式：多行逐句推进（点击/回车继续），行尾可挂确定/取消等按钮。
 *
 * 监听两类事件：
 * - role-dialog-open：完整配置（两种模式均可）
 * - role-dialog-speak：旧事件兼容，转为 base 基础对话
 */
export const RoleDialog: React.FC<{ rolePos: { x: number; y: number } }> = ({
  rolePos,
}) => {
  // 当前角色名（作为基础对话的默认名前缀）
  const selectedRoleId = useHomeStore((s) => s.selectedRoleId);
  const defaultRoleName = getRoleSkin(selectedRoleId).name;
  // 当前对话配置；null 表示无对话
  const [config, setConfig] = useState<RoleDialogConfig | null>(null);
  // 文字游戏模式：当前推进到的行下标
  const [lineIdx, setLineIdx] = useState(0);
  // 基础模式自动隐藏计时器
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  // 关闭对话框
  const close = useCallback(() => {
    clearHideTimer();
    setConfig(null);
    setLineIdx(0);
  }, [clearHideTimer]);

  // 基础对话：按 duration 定时自动隐藏
  const scheduleHide = useCallback(
    (duration?: number) => {
      clearHideTimer();
      const ms = Math.max(0, Number(duration) || 5000);
      hideTimerRef.current = setTimeout(() => setConfig(null), ms);
    },
    [clearHideTimer],
  );

  const openDialog = useCallback(
    (cfg: RoleDialogConfig) => {
      clearHideTimer();
      setLineIdx(0);
      setConfig(cfg);
      if (cfg.mode === 'base') {
        scheduleHide(cfg.duration);
      }
    },
    [clearHideTimer, scheduleHide],
  );

  // 监听事件
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail as RoleDialogConfig | undefined;
      if (detail) openDialog(detail);
    };
    // 兼容旧事件 role-dialog-speak：转为基础对话
    const onSpeak = (e: Event) => {
      const detail = (e as CustomEvent<{ text?: string; duration?: number }>)
        .detail;
      if (detail?.text) {
        openDialog({ mode: 'base', text: detail.text, duration: detail.duration });
      }
    };
    const onClose = () => close();

    window.addEventListener(ROLE_DIALOG_EVENT, onOpen);
    window.addEventListener('role-dialog-speak', onSpeak);
    window.addEventListener(ROLE_DIALOG_CLOSE_EVENT, onClose);
    return () => {
      window.removeEventListener(ROLE_DIALOG_EVENT, onOpen);
      window.removeEventListener('role-dialog-speak', onSpeak);
      window.removeEventListener(ROLE_DIALOG_CLOSE_EVENT, onClose);
      clearHideTimer();
    };
  }, [openDialog, close, clearHideTimer]);

  // 清理计时器
  useEffect(() => clearHideTimer, [clearHideTimer]);

  if (!config) return null;

  // 基础对话：默认拼上当前角色名；显式传入 roleName 时优先用传入值
  const roleName =
    config.mode === 'base' && config.roleName === undefined
      ? defaultRoleName
      : config.roleName;
  const prefix = roleName ? `${roleName}：` : '';

  // —— 基础对话模式 ——
  if (config.mode === 'base') {
    return (
      <Bubble rolePos={rolePos}>
        {prefix}
        {config.text}
      </Bubble>
    );
  }

  // —— 文字游戏模式 ——
  const currentLine = config.lines[lineIdx];
  const isLastLine = lineIdx >= config.lines.length - 1;

  const handleLineClick = () => {
    // 当前行带按钮时，点击空白区域不推进（由按钮决定）
    if (currentLine?.choices?.length) return;
    advance();
  };

  const advance = () => {
    if (isLastLine) {
      close();
    } else {
      setLineIdx((i) => i + 1);
    }
  };

  const handleChoice = (choice: DialogChoice) => {
    if (choice.action === 'close' || choice.closeAfter) {
      close();
      return;
    }
    // action === 'continue' 或未指定：推进到下一行
    if (isLastLine) {
      close();
    } else {
      setLineIdx((i) => i + 1);
    }
  };

  return (
    <Bubble rolePos={rolePos} onClick={handleLineClick}>
      <div className="w-full">
        {prefix}
        {currentLine?.text}
      </div>
      {currentLine?.choices?.length ? (
        <div className="mt-2 flex items-center gap-2 justify-end">
          {currentLine.choices.map((choice) => (
            <button
              key={choice.label}
              onClick={(e) => {
                e.stopPropagation();
                handleChoice(choice);
              }}
              className="px-3 py-1 rounded-[var(--card-radius)] text-xs font-medium bg-[color:var(--accent)] text-white hover:opacity-90 transition-opacity"
            >
              {choice.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-1.5 text-right text-[10px] opacity-60 select-none">
          {isLastLine ? '点击关闭' : '点击继续 ▸'}
        </div>
      )}
    </Bubble>
  );
};

/** 随角色移动的气泡外壳（复用原 RoleCharacterCanvas 的定位/翻转逻辑） */
const Bubble: React.FC<{
  rolePos: { x: number; y: number };
  onClick?: () => void;
  children?: React.ReactNode;
}> = ({ rolePos, children, onClick }) => {
  const centerX = rolePos.x + DEFAULT_PHYSICS_CONFIG.roleWidth / 2;
  const winW = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const half = 140;
  let left = centerX;
  let transform = 'translate(-50%, -100%)';
  let tail = 'left-1/2 -translate-x-1/2';
  if (centerX < half) {
    transform = 'translate(0, -100%)';
    tail = 'left-3 -translate-x-1/2';
  } else if (centerX > winW - half) {
    transform = 'translate(-100%, -100%)';
    tail = 'right-3 translate-x-1/2';
  }
  return (
    <div
      className="absolute z-40 max-w-xs sm:max-w-sm px-3 py-1.5 bg-white/90 dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-100 text-xs sm:text-sm rounded-[var(--card-radius)] shadow-lg border border-zinc-200/50 dark:border-zinc-700/50 backdrop-blur-sm transition-opacity duration-500 opacity-100 break-words whitespace-pre-wrap cursor-pointer"
      style={{ left: `${left}px`, top: `${rolePos.y - 12}px`, transform }}
      onClick={onClick}
    >
      {children}
      {/* 小尾巴：随对齐方向切换位置 */}
      <div
        className={`absolute -bottom-1.5 w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-white/90 dark:border-t-zinc-800/90 ${tail}`}
      />
    </div>
  );
};

export default RoleDialog;
