import type { WallpaperConfig } from '../../types';

/** 系统预设壁纸：以 gradient 作为唯一标识，与在线静态壁纸（WallpaperItem）彻底区分 */
export type PresetStaticWallpaper = {
  gradient: string;
  /** 明暗适配：亮色模式只显示 'light'，暗色模式只显示 'dark'；'both' 两端均显示 */
  theme?: 'light' | 'dark' | 'both';
  /** 可选图片（有图时用图，无图时以 gradient 兜底） */
  imageUrl?: string;
  thumbnailUrl?: string;
};

/** 默认壁纸（渐变兜底）：无图时的背景渐变 */
export const DEFAULT_WALLPAPER: WallpaperConfig = {
  type: 'dynamic',
  dynamicPreset: 'aurora',
  blur: 0,
  brightness: 100,
  contrast: 1,
  saturation: 1,
  hue: 0,
  sepia: 0,
  grayscale: 0,
  invert: 0,
  gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
};

/** 渐变 / 静态壁纸预设：每个均带渐变背景（无图时兜底生效） */
/** 静态图片壁纸预设：带 imageUrl，与渐变兜底预设区分 */
export const STATIC_IMAGE_WALLPAPERS: PresetStaticWallpaper[] = [
  {
    theme: 'light',
    gradient: 'linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%)',
    imageUrl:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
  },
  {
    theme: 'dark',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
  },
  {
    theme: 'light',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    imageUrl:
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1920&q=80',
  },
];


export const STATIC_WALLPAPERS: PresetStaticWallpaper[] = [
  {
    "theme": "dark",
    "gradient": "linear-gradient(to right, #bdc3c7, #2c3e50)"
  },
  {
    "theme": "dark",
    "gradient": "linear-gradient(to right, #0f2027, #203a43, #2c5364)"
  },
  {
    "theme": "dark",
    "gradient": "linear-gradient(to right, #373b44, #4286f4)"
  },
  {
    "theme": "dark",
    "gradient": "linear-gradient(to right, #ff0099, #493240)"
  },
  {
    "theme": "dark",
    "gradient": "linear-gradient(to right, #c31432, #240b36)"
  },
  {
    "theme": "dark",
    "gradient": "linear-gradient(to right, #ed213a, #93291e)"
  },
  {
    "theme": "dark",
    "gradient": "linear-gradient(to right, #da4453, #89216b)"
  },
  {
    "theme": "dark",
    "gradient": "linear-gradient(to right, #ad5389, #3c1053)"
  },
  {
    "theme": "dark",
    "gradient": "linear-gradient(to right, #333333, #dd1818)"
  },
  {
    "theme": "dark",
    "gradient": "linear-gradient(to right, #c94b4b, #4b134f)"
  },
  {
    "theme": "dark",
    "gradient": "linear-gradient(to right, #23074d, #cc5333)"
  },
  {
    "theme": "dark",
    "gradient": "linear-gradient(to right, #0f0c29, #302b63, #24243e)"
  },
  {
    "theme": "dark",
    "gradient": "linear-gradient(to right, #03001e, #7302c0, #ec38bc, #fdeff9)"
  },
  {
    "theme": "dark",
    "gradient": "linear-gradient(to right, #642b73, #c64266)"
  },
  {
    "theme": "dark",
    "gradient": "linear-gradient(to right, #000000, #0f9b0f)"
  },
  {
    "theme": "dark",
    "gradient": "linear-gradient(to right, #000046, #1cb5e0)"
  },
  {
    "theme": "dark",
    "gradient": "linear-gradient(to right, #eb5757, #000000)"
  },
  {
    "theme": "dark",
    "gradient": "linear-gradient(to right, #20002c, #cb8cd4)"
  },
  {
    "theme": "dark",
    "gradient": "linear-gradient(to right, #c33764, #1d2671)"
  },
  {
    "theme": "dark",
    "gradient": "linear-gradient(to right, #44a08d, #093637)"
  },
  {
    "theme": "light",
    "gradient": "linear-gradient(to right, #ee9ca7, #ffdde1)"
  },
  {
    "theme": "light",
    "gradient": "linear-gradient(to right, #2193b0, #6dd5ed)"
  },
  {
    "theme": "light",
    "gradient": "linear-gradient(to right, #2980b9, #6dd5fa, #ffffff)"
  },
  {
    "theme": "light",
    "gradient": "linear-gradient(to right, #ffefba, #ffffff)"
  },
  {
    "theme": "light",
    "gradient": "linear-gradient(to right, #d3cce3, #e9e4f0)"
  },
  {
    "theme": "light",
    "gradient": "linear-gradient(to right, #ada996, #f2f2f2, #dbdbdb, #eaeaea)"
  },
  {
    "theme": "light",
    "gradient": "linear-gradient(to right, #ef3b36, #ffffff)"
  },
  {
    "theme": "light",
    "gradient": "linear-gradient(to right, #fffc00, #ffffff)"
  },
]