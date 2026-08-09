import { Application, Sprite } from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';

import { loadRoleTextures } from './role/assets';
import { RoleControls } from './role/controls';
import { getRandomGreeting, getRandomInterval } from './role/dialog';
import { DEFAULT_PHYSICS_CONFIG, updateRolePhysics } from './role/physics';
import { DialogState, RoleState } from './role/types';

export const RoleCharacterCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

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
    let timerId: NodeJS.Timeout | null = null;
    let hideTimerId: NodeJS.Timeout | null = null;

    const controls = new RoleControls();

    // 监听外部 AI 对话发出的 Speak 事件（定义在 effect 作用域，供注册与卸载共用）
    const handleRoleSpeak = (e: Event) => {
      const customEvent = e as CustomEvent<{ text: string }>;
      if (customEvent.detail?.text) {
        setDialog({
          text: customEvent.detail.text,
          visible: true,
        });

        if (hideTimerId) clearTimeout(hideTimerId);
        // AI 回复展示 5 秒后隐藏
        hideTimerId = setTimeout(() => {
          if (isDestroyed) return;
          setDialog((prev) => ({ ...prev, visible: false }));
          scheduleNextDialog();
        }, 5000);
      }
    };
    window.addEventListener('role-dialog-speak', handleRoleSpeak);

    // 随机弹出对话框调度
    const scheduleNextDialog = () => {
      const interval = getRandomInterval();
      timerId = setTimeout(() => {
        if (isDestroyed) return;
        setDialog({
          text: getRandomGreeting(),
          visible: true,
        });

        // 2.5 秒后自动隐藏气泡
        if (hideTimerId) clearTimeout(hideTimerId);
        hideTimerId = setTimeout(() => {
          if (isDestroyed) return;
          setDialog((prev) => ({ ...prev, visible: false }));
          // 对话框关闭后再调度下一次显示
          scheduleNextDialog();
        }, 2500);
      }, interval);
    };

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

      // Load character textures
      const textures = await loadRoleTextures();

      if (isDestroyed || !app) return;

      // Create Pixi Sprite
      const sprite = new Sprite(textures.face);
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

      // 启动对话框随机定时器
      scheduleNextDialog();

      // Game Ticker Loop
      app.ticker.add(() => {
        if (!app) return;

        const inputs = controls.getKeyState();
        updateRolePhysics(state, inputs, app.screen, DEFAULT_PHYSICS_CONFIG);

        // Sync Pixi Sprite Position
        sprite.x = state.x;
        sprite.y = state.y;

        // 更新 React 状态以同步气泡位置
        setRolePos({ x: state.x, y: state.y });

        // Texture / Animation switching (6帧除数，降低一档切帧频率)
        const frameIndex = Math.floor(state.animFrameCounter / 6) % 3;
        if (state.facingDirection === 'left') {
          sprite.texture = textures.leftFrames[frameIndex];
        } else if (state.facingDirection === 'right') {
          sprite.texture = textures.rightFrames[frameIndex];
        } else {
          sprite.texture = textures.face;
        }
      });
    };

    initPixi();

    return () => {
      isDestroyed = true;
      window.removeEventListener('role-dialog-speak', handleRoleSpeak);
      if (timerId) clearTimeout(timerId);
      if (hideTimerId) clearTimeout(hideTimerId);
      controls.destroy();
      if (app) {
        app.destroy(true, { children: true, texture: false });
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[190] overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />

      {/* 随角色移动的对话框气泡 */}
      {dialog.visible && (
        <div
          className="absolute z-40 max-w-xs sm:max-w-sm px-3 py-1.5 bg-white/90 dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-100 text-xs sm:text-sm font-medium rounded-2xl shadow-lg border border-zinc-200/50 dark:border-zinc-700/50 backdrop-blur-sm transition-opacity duration-500 opacity-100 break-words whitespace-pre-wrap"
          style={{
            left: `${rolePos.x + DEFAULT_PHYSICS_CONFIG.roleWidth / 2}px`,
            top: `${rolePos.y - 12}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {dialog.text}
          {/* 小尾巴 */}
          <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-white/90 dark:border-t-zinc-800/90" />
        </div>
      )}
    </div>
  );
};
