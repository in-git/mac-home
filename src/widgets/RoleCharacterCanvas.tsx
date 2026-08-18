import { Application, Sprite } from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';

import { useHomeStore } from '../store/useHomeStore';
import { loadRoleTextures } from './role/assets';
import { RoleControls } from './role/controls';
import { DEFAULT_PHYSICS_CONFIG, updateRolePhysics } from './role/physics';
import { DialogState, RoleState, RoleTextures } from './role/types';

export const RoleCharacterCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedRoleId = useHomeStore((s) => s.selectedRoleId);

  // 对话框状态与角色实时坐标
  const [dialog, setDialog] = useState<DialogState>({
    text: '',
    visible: false,
  });
  const [rolePos, setRolePos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let app: Application | null = null;
    let isDestroyed = false;
    let hideTimerId: NodeJS.Timeout | null = null;
    let textures: RoleTextures | null = null;
    let lastPosUpdate = 0;

    const controls = new RoleControls();

    // 角色行为事件处理器。键名对应 skill.json 中 action.event，
    // 与 actions.ts 派发的事件保持一致，便于 skill 调用链路对齐。
    // 通过合成输入注入 ticker 物理循环，与键盘操作互不冲突。

    // 说话：弹对话气泡
    const onRoleSpeak = (e: Event) => {
      const customEvent = e as CustomEvent<{ text: string; duration?: number }>;
      if (customEvent.detail?.text) {
        setDialog({
          text: `${textures?.name ?? ''}：${customEvent.detail.text}`,
          visible: true,
        });

        if (hideTimerId) clearTimeout(hideTimerId);
        // 展示指定时长后隐藏，默认 5 秒
        const duration = Math.max(0, Number(customEvent.detail.duration) || 5000);
        hideTimerId = setTimeout(() => {
          if (isDestroyed) return;
          setDialog((prev) => ({ ...prev, visible: false }));
        }, duration);
      }
    };

    // 移动：合成一次方向输入，持续到 until
    let moveCmd: { direction: 'left' | 'right'; until: number } | null = null;
    const onRoleMove = (e: Event) => {
      const detail =
        (e as CustomEvent<{ direction?: string; duration?: number }>).detail ??
        {};
      const direction =
        detail.direction === 'left' || detail.direction === 'right'
          ? detail.direction
          : 'right';
      const duration = Math.max(0, Number(detail.duration) || 1000);
      moveCmd = { direction, until: performance.now() + duration };
    };

    // 跳跃：合成跳跃输入序列（单跳或二段跳）
    let jumpPattern: number[] = [];
    const onRoleJump = (e: Event) => {
      const detail = (e as CustomEvent<{ double?: boolean }>).detail ?? {};
      // 单跳：[按下]；二段跳：[按下, 松开, 再按下]，配合 wasJumpPressed 触发两次起跳
      jumpPattern = detail.double === true ? [1, 0, 1] : [1];
    };

    // 重置：请求回到屏幕中央底部
    let resetRequested = false;
    const onRoleReset = () => {
      resetRequested = true;
    };

    // 庆祝：固定连续播放 count 次 celebration 帧序列后回退 idle
    // 用「剩余次数」驱动，而非时间窗口，确保每次都完整播放一遍
    let celebrateCyclesLeft = 0;
    let celebrateCycleStart = 0;
    // 每帧步进 6 帧、约 60fps，单帧 ≈ 100ms；一遍时长 = 帧数 * 100ms
    const celebrateFrameMs = 100;
    const onRoleCelebrate = (e: Event) => {
      const detail = (e as CustomEvent<{ count?: number }>).detail ?? {};
      const count =
        typeof detail.count === 'number' && detail.count > 0
          ? Math.round(detail.count)
          : 2;
      celebrateCyclesLeft = count;
      celebrateCycleStart = performance.now();
    };

    // 统一注册所有角色行为事件（键 = skill.json 中的 event）。
    // 后续新增行为只需在此表中追加一项即可，注册/卸载统一遍历。
    const roleActionHandlers: Record<string, (e: Event) => void> = {
      'role-dialog-speak': onRoleSpeak,
      'role-move': onRoleMove,
      'role-jump': onRoleJump,
      'role-reset': onRoleReset,
      'role-celebrate': onRoleCelebrate,
    };
    Object.entries(roleActionHandlers).forEach(([type, handler]) => {
      window.addEventListener(type, handler);
    });

    const initPixi = async () => {
      const pixiApp = new Application();
      await pixiApp.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundAlpha: 0,
        resizeTo: window,
      });

      if (isDestroyed) {
        pixiApp.destroy(true);
        return;
      }

      app = pixiApp;
      container.appendChild(pixiApp.canvas);

      // Load character textures（按当前选中的角色皮肤加载）
      textures = await loadRoleTextures(selectedRoleId);

      if (isDestroyed || !app) return;

      // Create Pixi Sprite（初始纹理取 idle 首帧）
      const sprite = new Sprite(textures.idleFrames[0]);
      sprite.width = DEFAULT_PHYSICS_CONFIG.roleWidth;
      sprite.height = DEFAULT_PHYSICS_CONFIG.roleHeight;

      // Role initial state
      const state: RoleState = {
        x: (app.screen.width - DEFAULT_PHYSICS_CONFIG.roleWidth) / 2,
        y: app.screen.height - DEFAULT_PHYSICS_CONFIG.roleHeight,
        vx: 0,
        vy: 0,
        isGrounded: true,
        jumpCount: 0,
        wasJumpPressed: false,
        facingDirection: 'idle',
        animFrameCounter: 0,
      };

      sprite.x = state.x;
      sprite.y = state.y;
      app.stage.addChild(sprite);

      setRolePos({ x: state.x, y: state.y });

      // Game Ticker Loop
      app.ticker.add(() => {
        if (!app) return;

        // AI 指令：重置到屏幕中央底部
        if (resetRequested) {
          state.x = (app.screen.width - DEFAULT_PHYSICS_CONFIG.roleWidth) / 2;
          state.y = app.screen.height - DEFAULT_PHYSICS_CONFIG.roleHeight;
          state.vx = 0;
          state.vy = 0;
          state.isGrounded = true;
          resetRequested = false;
        }

        // 合并键盘输入与 AI 合成输入
        const inputs = controls.getKeyState();
        let effLeft = inputs.isLeft;
        let effRight = inputs.isRight;
        let effJump = inputs.isJump;
        if (moveCmd) {
          if (performance.now() < moveCmd.until) {
            if (moveCmd.direction === 'left') effLeft = true;
            else effRight = true;
          } else {
            moveCmd = null;
          }
        }
        if (jumpPattern.length > 0) {
          if (jumpPattern.shift() === 1) effJump = true;
        }

        updateRolePhysics(
          state,
          { isLeft: effLeft, isRight: effRight, isJump: effJump },
          app.screen,
          DEFAULT_PHYSICS_CONFIG,
        );

        // Sync Pixi Sprite Position
        sprite.x = state.x;
        sprite.y = state.y;

        // 更新 React 状态以同步气泡位置（节流 ~80ms，避免每帧 setState 造成高频重渲染）
        const now = performance.now();
        if (now - lastPosUpdate > 80) {
          lastPosUpdate = now;
          setRolePos({ x: state.x, y: state.y });
        }

        // Texture / Animation switching (6帧除数，降低一档切帧频率)
        if (
          textures.celebrationFrames.length > 0 &&
          celebrateCyclesLeft > 0
        ) {
          // 庆祝动作优先播放（来自 role.json 的 celebration 帧组）
          const celIndex =
            Math.floor(state.animFrameCounter / 6) %
            textures.celebrationFrames.length;
          sprite.texture = textures.celebrationFrames[celIndex];

          // 当前这一遍播放完整一遍帧序列后，次数 -1；归零回退 idle
          const cycleMs = textures.celebrationFrames.length * celebrateFrameMs;
          const nowMs = performance.now();
          if (nowMs - celebrateCycleStart >= cycleMs) {
            celebrateCycleStart = nowMs;
            celebrateCyclesLeft -= 1;
          }
        } else if (state.facingDirection === 'left') {
          const frameIndex =
            Math.floor(state.animFrameCounter / 6) % textures.leftFrames.length;
          sprite.texture = textures.leftFrames[frameIndex];
        } else if (state.facingDirection === 'right') {
          const frameIndex =
            Math.floor(state.animFrameCounter / 6) % textures.rightFrames.length;
          sprite.texture = textures.rightFrames[frameIndex];
        } else {
          // 静止态循环播放 idle 帧序列（皮肤驱动，其余帧来自 role.json）
          const idleIndex =
            Math.floor(state.animFrameCounter / 6) % textures.idleFrames.length;
          sprite.texture = textures.idleFrames[idleIndex];
        }
      });
    };

    initPixi();

    return () => {
      isDestroyed = true;
      Object.entries(roleActionHandlers).forEach(([type, handler]) => {
        window.removeEventListener(type, handler);
      });
      if (hideTimerId) clearTimeout(hideTimerId);
      controls.destroy();
      if (app) {
        app.destroy(true, { children: true, texture: false });
      }
    };
  }, [selectedRoleId]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[190] overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />

      {/* 随角色移动的对话框气泡（靠近屏幕边缘时翻转对齐，避免被挤出视口） */}
      {dialog.visible &&
        (() => {
          const centerX = rolePos.x + DEFAULT_PHYSICS_CONFIG.roleWidth / 2;
          const winW = typeof window !== 'undefined' ? window.innerWidth : 1280;
          const half = 140; // 气泡半宽余量，约等于 max-w 的一半
          let left = centerX;
          let transform = 'translate(-50%, -100%)';
          let tail = 'left-1/2 -translate-x-1/2';
          if (centerX < half) {
            // 靠近左边缘：气泡向右展开，尾巴靠左
            transform = 'translate(0, -100%)';
            tail = 'left-3 -translate-x-1/2';
          } else if (centerX > winW - half) {
            // 靠近右边缘：气泡向左展开，尾巴靠右
            transform = 'translate(-100%, -100%)';
            tail = 'right-3 translate-x-1/2';
          }
          return (
            <div
              className="absolute z-40 max-w-xs sm:max-w-sm px-3 py-1.5 bg-white/90 dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-100 text-xs sm:text-sm  rounded-[var(--card-radius)] shadow-lg border border-zinc-200/50 dark:border-zinc-700/50 backdrop-blur-sm transition-opacity duration-500 opacity-100 break-words whitespace-pre-wrap"
              style={{
                left: `${left}px`,
                top: `${rolePos.y - 12}px`,
                transform,
              }}
            >
              {dialog.text}
              {/* 小尾巴：随对齐方向切换位置 */}
              <div
                className={`absolute -bottom-1.5 w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-white/90 dark:border-t-zinc-800/90 ${tail}`}
              />
            </div>
          );
        })()}
    </div>
  );
};
