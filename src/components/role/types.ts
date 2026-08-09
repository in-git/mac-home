import { Texture } from 'pixi.js';

export interface RolePhysicsConfig {
  roleWidth: number;
  roleHeight: number;
  maxSpeed: number;
  acceleration: number;
  friction: number;
  jumpForce: number;
  gravity: number;
}

export interface RoleState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  facingDirection: 'idle' | 'left' | 'right';
  animFrameCounter: number;
}

export interface RoleTextures {
  face: Texture;
  leftFrames: Texture[];
  rightFrames: Texture[];
}
