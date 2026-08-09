import { Assets } from 'pixi.js';

import faceImg from '../../assets/role/face.webp';
import left1Img from '../../assets/role/left-1.webp';
import left2Img from '../../assets/role/left-2.webp';
import left3Img from '../../assets/role/left-3.webp';
import right1Img from '../../assets/role/right-1.webp';
import right2Img from '../../assets/role/right-2.webp';
import right3Img from '../../assets/role/right-3.webp';
import { RoleTextures } from './types';

export const loadRoleTextures = async (): Promise<RoleTextures> => {
  const [
    faceTex,
    left1Tex,
    left2Tex,
    left3Tex,
    right1Tex,
    right2Tex,
    right3Tex,
  ] = await Promise.all([
    Assets.load(faceImg),
    Assets.load(left1Img),
    Assets.load(left2Img),
    Assets.load(left3Img),
    Assets.load(right1Img),
    Assets.load(right2Img),
    Assets.load(right3Img),
  ]);

  return {
    face: faceTex,
    leftFrames: [left1Tex, left2Tex, left3Tex],
    rightFrames: [right1Tex, right2Tex, right3Tex],
  };
};
