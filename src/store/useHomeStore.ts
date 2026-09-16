import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isSameSite } from '../utils/siteHelper';
import { SiteItem } from '../api/site';

/** 侧边栏可选的分类 id（与 Sidebar/CATEGORIES 保持一致） */
export type CategoryId = 'mine' | 'web' | 'video';

/** 允许的取值，用于持久化数据校验 */
const CATEGORY_IDS: CategoryId[] = ['mine', 'web', 'video'];

interface HomeState {
  /** 「我的」收藏的网页站点 */
  favoriteSites: SiteItem[];
  /** 收藏 / 取消收藏切换（「我的」列表与网页列表共用） */
  toggleFavoriteSite: (item: SiteItem) => void;

  /**
   * 当前选中的侧边栏分类。
   * 持久化后刷新会回到上次浏览的标签页；默认「网页」。
   */
  activeCategory: CategoryId;
  /** 切换侧边栏分类 */
  setActiveCategory: (id: CategoryId) => void;
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

      activeCategory: 'web',
      setActiveCategory: (id) =>
        set((state) =>
          // 非法值忽略，避免持久化脏数据把界面卡在空白分类
          CATEGORY_IDS.includes(id) && state.activeCategory !== id
            ? { activeCategory: id }
            : state,
        ),
    }),
    {
      name: 'apple-homepage-store',
      version: 1,
      /**
       * 兼容 v0 的持久化数据（当时只有 favoriteSites）。
       * 缺少 / 非法的 activeCategory 一律回落到「网页」。
       */
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<HomeState>;
        if (version < 1) {
          return {
            ...state,
            activeCategory: CATEGORY_IDS.includes(
              state.activeCategory as CategoryId,
            )
              ? (state.activeCategory as CategoryId)
              : 'web',
          } as HomeState;
        }
        return state as HomeState;
      },
    },
  ),
);
