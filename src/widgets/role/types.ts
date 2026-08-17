import { Texture } from 'pixi.js';

export interface RolePhysicsConfig {
  roleWidth: number;
  roleHeight: number;
  maxSpeed: number;
  acceleration: number;
  friction: number;
  jumpForce: number;
  gravity: number;
  maxJumps: number;
}

export interface RoleState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  jumpCount: number;
  wasJumpPressed: boolean;
  facingDirection: 'idle' | 'left' | 'right';
  animFrameCounter: number;
}

export interface RoleTextures {
  name: string;
  face: Texture;
  leftFrames: Texture[];
  rightFrames: Texture[];
  idleFrames: Texture[];
}

/** role.json 的角色皮肤配置（驱动资源管理，便于换肤） */
export interface RoleSkinConfig {
  id: string;
  name: string;
  author?: string;
  assetDir: string;
  textures: {
    face: string[];
    left: string[];
    right: string[];
    idle: string[];
  };
}

export interface DialogState {
  text: string;
  visible: boolean;
}
