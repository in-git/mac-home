import { Application, Sprite } from 'pixi.js';
import React, { useEffect, useRef } from 'react';

import { loadRoleTextures } from './role/assets';
import { RoleControls } from './role/controls';
import { DEFAULT_PHYSICS_CONFIG, updateRolePhysics } from './role/physics';
import { RoleState } from './role/types';

export const RoleCharacterCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let app: Application | null = null;
    let isDestroyed = false;

    const controls = new RoleControls();

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
        facingDirection: 'idle',
        animFrameCounter: 0,
      };

      sprite.x = state.x;
      sprite.y = state.y;
      app.stage.addChild(sprite);

      // Game Ticker Loop
      app.ticker.add(() => {
        if (!app) return;

        const inputs = controls.getKeyState();
        updateRolePhysics(state, inputs, app.screen, DEFAULT_PHYSICS_CONFIG);

        // Sync Pixi Sprite Position
        sprite.x = state.x;
        sprite.y = state.y;

        // Texture / Animation switching
        const frameIndex = Math.floor(state.animFrameCounter / 8) % 3;
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
      controls.destroy();
      if (app) {
        app.destroy(true, { children: true, texture: false });
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-30 overflow-hidden"
    />
  );
};
