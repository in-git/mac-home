import hotkeys from 'hotkeys-js';
import { Application, Assets, Sprite } from 'pixi.js';
import React, { useEffect, useRef } from 'react';

import faceImg from '../assets/role/face.webp';
import left1Img from '../assets/role/left-1.webp';
import left2Img from '../assets/role/left-2.webp';
import right1Img from '../assets/role/right-1.webp';
import right2Img from '../assets/role/right-2.webp';

export const RoleCharacterCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let app: Application | null = null;
    let isDestroyed = false;

    // Keys pressed state monitored via hotkeys-js
    const keys = {
      left: false,
      right: false,
      up: false,
    };

    // Bind keyboard events using hotkeys-js
    const hotkeyScope = 'role-character';
    hotkeys.setScope(hotkeyScope);

    // Filter to allow input handling everywhere
    const originalFilter = hotkeys.filter;
    hotkeys.filter = () => true;

    // Key handlers
    const handleLeftDown = (e: KeyboardEvent) => {
      e.preventDefault();
      keys.left = true;
    };
    const handleLeftUp = () => {
      keys.left = false;
    };

    const handleRightDown = (e: KeyboardEvent) => {
      e.preventDefault();
      keys.right = true;
    };
    const handleRightUp = () => {
      keys.right = false;
    };

    const handleJumpDown = (e: KeyboardEvent) => {
      e.preventDefault();
      keys.up = true;
    };
    const handleJumpUp = () => {
      keys.up = false;
    };

    hotkeys('left, a', { keyup: true }, (e, handler) => {
      if (e.type === 'keydown') handleLeftDown(e);
      if (e.type === 'keyup') handleLeftUp();
    });

    hotkeys('right, d', { keyup: true }, (e, handler) => {
      if (e.type === 'keydown') handleRightDown(e);
      if (e.type === 'keyup') handleRightUp();
    });

    hotkeys('up, w, space', { keyup: true }, (e, handler) => {
      if (e.type === 'keydown') handleJumpDown(e);
      if (e.type === 'keyup') handleJumpUp();
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

      // Load textures asynchronously
      const [faceTex, left1Tex, left2Tex, right1Tex, right2Tex] =
        await Promise.all([
          Assets.load(faceImg),
          Assets.load(left1Img),
          Assets.load(left2Img),
          Assets.load(right1Img),
          Assets.load(right2Img),
        ]);

      if (isDestroyed || !app) return;

      // Character Sprite
      const sprite = new Sprite(faceTex);
      const ROLE_SIZE = 80;
      sprite.width = ROLE_SIZE;
      sprite.height = ROLE_SIZE;

      // Initial position at bottom center
      sprite.x = (app.screen.width - ROLE_SIZE) / 2;
      sprite.y = app.screen.height - ROLE_SIZE;

      app.stage.addChild(sprite);

      // Physics variables
      let vx = 0;
      let vy = 0;
      let isGrounded = true;
      let facingDirection: 'idle' | 'left' | 'right' = 'idle';

      const MOVE_SPEED = 6;
      const JUMP_FORCE = -15;
      const GRAVITY = 0.8;
      const FRICTION = 0.82;

      let animFrameCounter = 0;

      // Ticker loop (60 FPS Game Loop using Pixi.js Ticker)
      app.ticker.add(() => {
        if (!app) return;

        // Horizontal movement
        if (keys.left) {
          vx = -MOVE_SPEED;
          facingDirection = 'left';
        } else if (keys.right) {
          vx = MOVE_SPEED;
          facingDirection = 'right';
        } else {
          vx *= FRICTION;
          if (Math.abs(vx) < 0.1) {
            vx = 0;
            facingDirection = 'idle';
          }
        }

        // Jump movement
        if (keys.up && isGrounded) {
          vy = JUMP_FORCE;
          isGrounded = false;
        }

        // Gravity
        vy += GRAVITY;

        // Update positions
        sprite.x += vx;
        sprite.y += vy;

        // Boundary handling
        const groundY = app.screen.height - ROLE_SIZE;
        if (sprite.y >= groundY) {
          sprite.y = groundY;
          vy = 0;
          isGrounded = true;
        }

        if (sprite.x < 0) {
          sprite.x = 0;
          vx = 0;
        }

        if (sprite.x > app.screen.width - ROLE_SIZE) {
          sprite.x = app.screen.width - ROLE_SIZE;
          vx = 0;
        }

        if (sprite.y < 0) {
          sprite.y = 0;
          vy = 0;
        }

        // Frame animation switching
        animFrameCounter++;
        if (facingDirection === 'left') {
          sprite.texture =
            Math.floor(animFrameCounter / 10) % 2 === 0 ? left1Tex : left2Tex;
        } else if (facingDirection === 'right') {
          sprite.texture =
            Math.floor(animFrameCounter / 10) % 2 === 0 ? right1Tex : right2Tex;
        } else {
          sprite.texture = faceTex;
        }
      });
    };

    initPixi();

    return () => {
      isDestroyed = true;
      hotkeys.filter = originalFilter;
      hotkeys.unbind('left, a');
      hotkeys.unbind('right, d');
      hotkeys.unbind('up, w, space');
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
