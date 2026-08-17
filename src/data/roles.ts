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
      face: ['b1.png', 'b2.png', 'b3.png', 'b4.png'],
      left: ['l1.png', 'l2.png', 'l3.png', 'l4.png'],
      right: ['r1.png', 'r2.png', 'r3.png', 'r4.png'],
      idle: ['f1.png', 'f2.png', 'f3.png', 'f4.png'],
    },
  },
  {
    id: 'lhzou',
    name: '立华奏',
    author: '',
    assetDir: 'lhzou',
    textures: {
      face: [],
      left: ['l1.webp', 'l2.webp', 'l3.webp', 'l4.webp'],
      right: ['r1.webp', 'r2.webp', 'r3.webp', 'r4.webp'],
      idle: ['f1.webp', 'f2.webp', 'f3.webp', 'f4.webp'],
    },
  },
];

export const DEFAULT_ROLE_ID = ROLE_SKINS[0].id;

export const getRoleSkin = (id: string): RoleSkinConfig =>
  ROLE_SKINS.find((s) => s.id === id) ?? ROLE_SKINS[0];
