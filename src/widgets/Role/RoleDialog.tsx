import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ROLE_DIALOG_CLOSE_EVENT,
  ROLE_DIALOG_EVENT,
  type DialogChoice,
  type MenuOption,
  type RoleDialogConfig,
} from '../../agent/pet/dialog';
import { DEFAULT_PHYSICS_CONFIG } from './physics';
import { useHomeStore } from '../../store/useHomeStore';
import { getRoleSkin } from '../../data/roles';
import { usePetAgent } from '../../hooks/usePetAgent';
import avatarUrl from '../../assets/images/avatar.png';

/**
 * 角色对话框组件。
 * 支持三种模式：
 * - base 基础对话：单条气泡，定时自动隐藏。
 * - game 文字游戏式：AVG 风格，多行逐句推进，支持打字机效果、选择分支。
 * - menu 菜单式：上方对话 + 下方选项列表，点击后发送给 AI。
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
  // AI 对话
  const { send } = usePetAgent();

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
        // 基础对话：默认 5s 自动隐藏
        scheduleHide(cfg.duration);
      } else if (cfg.duration !== undefined) {
        // 文字游戏式对话：显式配置 duration 时，整段到点自动关闭
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
      <Bubble rolePos={rolePos} onClick={close}>
        {prefix}
        {config.text}
      </Bubble>
    );
  }

  // —— 菜单式对话模式 ——
  if (config.mode === 'menu') {
    const handleOptionClick = async (option: MenuOption) => {
      console.log('用户选择了选项：', option);
      
      // 根据选项构建问题
      const question = option.label;
      
      // 先关闭菜单对话框
      close();
      
      // 发送给大模型并等待回答
      const reply = await send(`用户问：${question}。请简短回答（1-2句话），并可以做一个相关的动作。`);
      
      console.log('AI 回答：', reply);
    };

    return (
      <Bubble rolePos={rolePos} className="w-[320px] p-4" onClick={close}>
        <div className="w-full min-h-[100px] mb-3 bg-white/90 dark:bg-white/90 rounded-xl flex items-center justify-center p-4">
          <div className="text-center text-sm font-medium text-slate-800 leading-[1.6]">
            {config.text}
          </div>
        </div>
        <div className="w-full flex flex-col gap-1.5">
          {config.options.map((option, idx) => (
            <button
              key={option.value}
              onClick={(e) => {
                e.stopPropagation();
                handleOptionClick(option);
              }}
              className="w-full px-3 py-2.5 text-left text-xs rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition-colors border border-black/5 dark:border-white/10 active:scale-[0.98]"
            >
              <span className="font-medium text-[color:var(--accent)] mr-1.5">
                {idx + 1}.
              </span>
              <span className="text-slate-800 dark:text-white">{option.label}</span>
            </button>
          ))}
        </div>
      </Bubble>
    );
  }

  // —— 文字游戏模式（AVG 风格）——
  if (config.mode !== 'game') return null;
  
  const currentLine = config.lines[lineIdx];
  const isLastLine = lineIdx >= config.lines.length - 1;

  const handleLineClick = () => {
    // 当前行带按钮时,点击空白区域不推进（由按钮决定）
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

  const handleChoice = async (choice: DialogChoice) => {
    if (choice.action === 'close' || choice.closeAfter) {
      close();
      return;
    }
    // 自定义 action（如帮助菜单的 page_intro / gameplay / customize）：把选项内容发送给大模型
    if (choice.action && choice.action !== 'continue') {
      close();
      const reply = await send(
        `用户问：${choice.label}。请简短回答（1-2句话）`,
      );
      console.log('AI 回答：', reply);
      return;
    }
    // action === 'continue' 或未指定：推进到下一行
    if (isLastLine) {
      close();
    } else {
      setLineIdx((i) => i + 1);
    }
  };

  // 判断显示模式
  const displayMode = currentLine?.displayMode || 'normal';
  const isMonologue = displayMode === 'monologue';
  const isSystem = displayMode === 'system';

  // AVG 风格对话框：屏幕底部、半透明背景、圆角设计
  return (
    <div 
      className="fixed inset-0 z-50 pointer-events-auto" 
      onClick={(e) => {
        // 只有点击遮罩本身（target === currentTarget）才关闭，点击子元素不关闭
        if (e.target === e.currentTarget) {
          close();
        }
      }}
    >
      <div
        className="absolute inset-x-0 flex justify-center px-4"
        style={{ bottom: `${DEFAULT_PHYSICS_CONFIG.roleHeight + 24}px` }}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleLineClick();
          }}
          className="w-full max-w-[37rem] bg-[rgba(20,22,35,0.8)] backdrop-blur-md rounded-[18px] border border-white/20 shadow-2xl px-7 py-6 cursor-pointer transition-opacity duration-300"
        >
        {/* 左上角头像 + 角色名标签（内心独白和系统消息隐藏角色名，头像保留） */}
        <div className="flex items-center gap-3 mb-3">
          <img
            src={avatarUrl}
            alt="角色头像"
            className="w-11 h-11 rounded-full object-cover border border-white/20 shrink-0"
          />
          {prefix && !isMonologue && !isSystem && (
            <div className="inline-block px-3 py-1.5 bg-[#6378ff] rounded-lg text-white text-sm font-bold">
              {prefix.replace('：', '')}
            </div>
          )}
        </div>

        {/* 对话正文 */}
        <div
          className={`text-base leading-[1.7] whitespace-pre-wrap ${
            isSystem
              ? 'text-slate-400 text-center'
              : isMonologue
                ? 'text-slate-300'
                : 'text-white'
          }`}
        >
          {currentLine?.text}
        </div>

        {/* 选择分支 - 系统消息不显示 */}
        {!isSystem && currentLine?.choices?.length ? (
          <div className="flex flex-col gap-2 mt-6">
            {currentLine.choices.map((choice, idx) => (
              <button
                key={choice.label}
                onClick={(e) => {
                  e.stopPropagation();
                  handleChoice(choice);
                }}
                className="w-full px-5 py-3 text-left text-sm rounded-xl bg-white/12 hover:bg-[rgba(99,120,255,0.4)] text-white transition-colors duration-200 border border-white/10 active:scale-[0.98]"
              >
                <span className="font-medium text-[#6378ff] mr-2">
                  {idx + 1}.
                </span>
                {choice.label}
              </button>
            ))}
          </div>
        ) : !isSystem ? (
          /* 继续指示器 - 系统消息不显示 */
          <div className="flex justify-end items-center mt-2">
            <div className="text-white/60 text-xs select-none flex items-center gap-1">
              {isLastLine ? '点击关闭' : '点击继续'}
              {!isLastLine && <span className="text-base">▸</span>}
            </div>
          </div>
        ) : null}
        </div>
      </div>
    </div>
  );
};

/** 随角色移动的气泡外壳（复用原 RoleCharacterCanvas 的定位/翻转逻辑） */
const Bubble: React.FC<{
  rolePos: { x: number; y: number };
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}> = ({ rolePos, children, onClick, className = '' }) => {
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
    <>
      {/* 点击遮罩层关闭对话框 */}
      <div 
        className="fixed inset-0 z-[39] pointer-events-auto bg-transparent"
        onClick={onClick}
      />
      <div
        className={`absolute z-40 pointer-events-auto max-w-xs sm:max-w-sm bg-white/95 dark:bg-zinc-800/95 text-slate-800 dark:text-white text-xs sm:text-sm rounded-xl shadow-lg border border-black/10 dark:border-white/10 backdrop-blur-sm transition-opacity duration-300 opacity-100 break-words whitespace-pre-wrap cursor-pointer p-3 ${className}`}
        style={{ left: `${left}px`, top: `${rolePos.y - 12}px`, transform }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        {/* 小尾巴：随对齐方向切换位置 */}
        <div
          className={`absolute -bottom-1.5 w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-white/95 dark:border-t-zinc-800/95 ${tail}`}
        />
      </div>
    </>
  );
};

export default RoleDialog;
