import { Assets, Texture } from 'pixi.js';

import { getRoleSkin } from '../../data/roles';
import type { RoleSkinConfig, RoleTextures } from './types';

// 按角色配置批量导入所有角色资源目录下的图片（皮肤化：换图只需改 roles.ts 与目录）
const skinImages = import.meta.glob('../../assets/*/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

// 额外支持 .webp（立华奏等较小体积皮肤）
const skinImagesWebp = import.meta.glob('../../assets/*/*.webp', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const allSkinImages: Record<string, string> = {
  ...skinImages,
  ...skinImagesWebp,
};

/** 单例缓存：同一 URL 只发起一次加载，避免重复请求（HMR / 多次调用均复用） */
const textureCache = new Map<string, Promise<Texture>>();

const resolveUrl = (config: RoleSkinConfig, fileName: string): string => {
  const matchedKey = Object.keys(allSkinImages).find(
    (k) => k.endsWith(`/${config.assetDir}/${fileName}`),
  );
  if (!matchedKey) {
    throw new Error(
      `[role] 找不到皮肤图片: ${fileName}（目录 ${config.assetDir}）`,
    );
  }
  return allSkinImages[matchedKey];
};

const loadOne = (config: RoleSkinConfig, fileName: string): Promise<Texture> => {
  const url = resolveUrl(config, fileName);
  let task = textureCache.get(url);
  if (!task) {
    task = Assets.load<Texture>(url);
    textureCache.set(url, task);
  }
  return task;
};

const loadGroup = (config: RoleSkinConfig, fileNames: string[]) =>
  Promise.all(fileNames.map((f) => loadOne(config, f)));

export const loadRoleTextures = async (
  roleId: string,
): Promise<RoleTextures> => {
  const config = getRoleSkin(roleId);

  // 去重后的全部 URL 一次性并行加载，Pixi 内部也会按 URL 去重
  const allNames = [
    ...config.textures.face,
    ...config.textures.left,
    ...config.textures.right,
    ...config.textures.idle,
  ];
  await Promise.all([...new Set(allNames)].map((f) => loadOne(config, f)));

  const [faceGroup, leftFrames, rightFrames, idleFrames] = await Promise.all([
    loadGroup(config, config.textures.face),
    loadGroup(config, config.textures.left),
    loadGroup(config, config.textures.right),
    loadGroup(config, config.textures.idle),
  ]);

  // 无正面表情帧时回退到 idle 首帧
  const face = faceGroup.length > 0 ? faceGroup[0] : idleFrames[0];

  return {
    name: config.name,
    face,
    leftFrames,
    rightFrames,
    idleFrames,
  };
};
