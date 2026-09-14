import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isSameSite } from '../utils/siteHelper';
import { SiteItem } from '../api/site';

interface HomeState {
  /** 「我的」收藏的网页站点（唯一持久化的数据） */
  favoriteSites: SiteItem[];
  /** 收藏 / 取消收藏切换（「我的」列表与网页列表共用） */
  toggleFavoriteSite: (item: SiteItem) => void;
}

export const useHomeStore = create<HomeState>()(
  persist(
    (set) => ({
      favoriteSites: [],

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
    }),
    {
      name: 'apple-homepage-store',
    },
  ),
);
