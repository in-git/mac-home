import { RolePhysicsConfig, RoleState } from './types';

export const DEFAULT_PHYSICS_CONFIG: RolePhysicsConfig = {
  roleWidth: 40,
  roleHeight: 60, // 468x702 ratio (1 : 1.5), 缩小 50%
  maxSpeed: 5.5,
  acceleration: 0.35,
  friction: 0.92,
  jumpForce: -8, // 模型缩小后微调跳跃冲量，保持舒适的弹跳高度
  gravity: 0.6,
  maxJumps: 2, // 支持二段跳
};

export const updateRolePhysics = (
  state: RoleState,
  inputs: { isLeft: boolean; isRight: boolean; isJump: boolean },
  screen: { width: number; height: number },
  config: RolePhysicsConfig = DEFAULT_PHYSICS_CONFIG,
): void => {
  const { isLeft, isRight, isJump } = inputs;

  // Horizontal movement (Acceleration & Inertia)
  if (isLeft && !isRight) {
    state.vx -= config.acceleration;
    if (state.vx < -config.maxSpeed) state.vx = -config.maxSpeed;
    state.facingDirection = 'left';
  } else if (isRight && !isLeft) {
    state.vx += config.acceleration;
    if (state.vx > config.maxSpeed) state.vx = config.maxSpeed;
    state.facingDirection = 'right';
  } else {
    state.vx *= config.friction;
    if (Math.abs(state.vx) < 0.1) {
      state.vx = 0;
      state.facingDirection = 'idle';
    } else {
      state.facingDirection = state.vx > 0 ? 'right' : 'left';
    }
  }

  // 二级跳与跳跃控制（检测按键单次按下事件，避免长按连续消耗二段跳）
  const isJumpJustPressed = isJump && !state.wasJumpPressed;
  state.wasJumpPressed = isJump;

  if (isJumpJustPressed) {
    if (state.isGrounded) {
      state.vy = config.jumpForce;
      state.isGrounded = false;
      state.jumpCount = 1;
    } else if (state.jumpCount < config.maxJumps) {
      // 二段跳
      state.vy = config.jumpForce;
      state.jumpCount += 1;
    }
  }

  // Apply Gravity
  state.vy += config.gravity;

  // Update position
  state.x += state.vx;
  state.y += state.vy;

  // Ground & Ceiling boundaries
  const groundY = screen.height - config.roleHeight;
  if (state.y >= groundY) {
    state.y = groundY;
    state.vy = 0;
    state.isGrounded = true;
    state.jumpCount = 0;
  }

  if (state.y < 0) {
    state.y = 0;
    state.vy = 0;
  }

  // Screen Wrap-Around (Horizontal Teleporting)
  if (state.x > screen.width) {
    state.x = -config.roleWidth;
  } else if (state.x < -config.roleWidth) {
    state.x = screen.width;
  }

  // 动画帧计数累加：动画播放速率与水平实际速度 Math.abs(vx) 动态绑定
  // 移动速度越快，AnimFrame 增加越快，切帧频率更高
  const speed = Math.abs(state.vx);
  if (speed > 0.1) {
    state.animFrameCounter += speed / 3;
  } else {
    state.animFrameCounter = 0;
  }
};
