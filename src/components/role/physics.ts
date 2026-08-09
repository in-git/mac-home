import { RolePhysicsConfig, RoleState } from './types';

export const DEFAULT_PHYSICS_CONFIG: RolePhysicsConfig = {
  roleWidth: 80,
  roleHeight: 120, // 468x702 ratio (1 : 1.5)
  maxSpeed: 9,
  acceleration: 0.6,
  friction: 0.94,
  jumpForce: -15,
  gravity: 0.8,
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

  // Jump movement
  if (isJump && state.isGrounded) {
    state.vy = config.jumpForce;
    state.isGrounded = false;
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

  state.animFrameCounter++;
};
