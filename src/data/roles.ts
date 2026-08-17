import type { RoleSkinConfig } from '../widgets/role/types';

/**
 * 角色皮肤注册表：新增角色只需在此追加一项，并放入对应资源目录。
 * - assetDir：src/assets/<assetDir> 下需包含 textures 中列出的图片文件。
 * - face：正面表情帧（可选，缺省时回退到 idle 首帧）。
 * - idle：静止待机帧；left/right：左右行走帧。
 */
export const ROLE_SKINS: RoleSkinConfig[] = [
  {
    id: 'klrx',
    name: '姬路瑞希',
    author: '',
    assetDir: 'klrx',
    textures: {
      face: ['face/b1.webp', 'face/b2.webp', 'face/b3.webp', 'face/b4.webp'],
      left: ['left/l1.webp', 'left/l2.webp', 'left/l3.webp', 'left/l4.webp'],
      right: ['right/r1.webp', 'right/r2.webp', 'right/r3.webp', 'right/r4.webp'],
      idle: ['idle/f1.webp', 'idle/f2.webp', 'idle/f3.webp', 'idle/f4.webp'],
    },
  },
];

export const DEFAULT_ROLE_ID = ROLE_SKINS[0].id;

export const getRoleSkin = (id: string): RoleSkinConfig =>
  ROLE_SKINS.find((s) => s.id === id) ?? ROLE_SKINS[0];
