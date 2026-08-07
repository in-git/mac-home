/**
 * 壁纸 CSS 滤镜参数 → 标准 CSS filter 字符串。
 * 供 DynamicWallpaperCanvas（实际渲染背景）与 WallpaperModal（主题预览）共用，
 * 保证“预览所见”与“实际生效”完全一致。
 */
export interface WallpaperFilterValues {
  blur: number; // px
  brightness: number; // %（100 = 原始）
  contrast: number; // 1 = 原始
  saturation: number; // 1 = 原始
  hue: number; // deg
  sepia: number; // 0 - 1
  grayscale: number; // 0 - 1
  invert: number; // 0 - 1
}

export function buildWallpaperFilter(v: WallpaperFilterValues): string {
  return [
    `blur(${v.blur}px)`,
    `brightness(${v.brightness}%)`,
    `contrast(${v.contrast * 100}%)`,
    `saturate(${v.saturation * 100}%)`,
    `hue-rotate(${v.hue}deg)`,
    `sepia(${v.sepia})`,
    `grayscale(${v.grayscale})`,
    `invert(${v.invert})`,
  ].join(' ');
}
