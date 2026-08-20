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
  /** 庆祝动作帧序列（可选，未配置则为空数组并回退 idle） */
  celebrationFrames: Texture[];
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
    /** 庆祝动作帧序列（可选） */
    celebration?: string[];
  };
}

export interface DialogState {
  text: string;
  visible: boolean;
}

/** AVG 对话框显示模式 */
export type DialogDisplayMode = 'normal' | 'monologue' | 'system';

/** 打字机效果配置 */
export interface TypewriterConfig {
  enabled: boolean;
  speed: number; // 每个字符间隔（毫秒）
}
