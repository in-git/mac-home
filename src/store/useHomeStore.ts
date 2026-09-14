import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CardRadiusTier, FontVariant } from '../types';
import { isSameSite } from '../utils/siteHelper';
import { SiteItem } from '../api/site';

/**
 * 默认配置：首次进入与「重置」统一使用。
 * 取值沿用重构前 data.json 中的默认外观配置。
 */
const DEFAULT_STATE = {
  // 是否开启暗黑模式
  isDarkMode: false,
  // 主题颜色
  themeColor: '#007AFF',
  // 字体方案（小 / 中 / 大，见 types.ts FONT_VARIANT）
  fontVariant: 'B' as FontVariant,
  // 卡片圆角档位（极小 / 小 / 中 / 大，见 types.ts CARD_RADIUS）
  cardRadius: 'small' as CardRadiusTier,
  // 「我的」收藏的网页站点
  favoriteSites: [] as SiteItem[],
};

type PersistedState = typeof DEFAULT_STATE;

interface HomeState extends PersistedState {
  setDarkMode: (value: boolean) => void;
  setThemeColor: (color: string) => void;
  setFontVariant: (variant: FontVariant) => void;
  setCardRadius: (tier: CardRadiusTier) => void;

  /** 收藏 / 取消收藏切换（「我的」列表与网页列表共用） */
  toggleFavoriteSite: (item: SiteItem) => void;

  /** 重置：恢复收藏与外观为默认配置 */
  resetAll: () => void;
}

export const useHomeStore = create<HomeState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      setDarkMode: (value) => set({ isDarkMode: value }),
      setThemeColor: (color) => set({ themeColor: color }),
      setFontVariant: (variant) => set({ fontVariant: variant }),
      setCardRadius: (tier) => set({ cardRadius: tier }),

      toggleFavoriteSite: (item) =>
        set((state) =>
          state.favoriteSites.some((s) => isSameSite(s, item))
            ? {
                favoriteSites: state.favoriteSites.filter(
                  (s) => !isSameSite(s, item),
                ),
              }
            : { favoriteSites: [item, ...state.favoriteSites] },
        ),

      resetAll: () => set(DEFAULT_STATE),
    }),
    {
      name: 'apple-homepage-store',
      // 只持久化本模块使用的字段，旧版本遗留的桌面/壁纸等数据不再写入
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        themeColor: state.themeColor,
        fontVariant: state.fontVariant,
        cardRadius: state.cardRadius,
        favoriteSites: state.favoriteSites,
      }),
    },
  ),
);
