import { Globe, Heart } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { createPortal } from 'react-dom';
import type { SiteItem } from '../../api/site';
import { useHomeStore } from '../../store/useHomeStore';
import { isSameSite } from '../../utils/siteHelper';
import { useToast } from '../../components/Toast/Toast';
import { WebListPicker } from './WebListPicker';
import { FavoriteList } from './FavoriteList';
import { SidebarFooter } from './SidebarFooter';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/** 侧边栏分类配置 */
const CATEGORIES: { id: string; label: string; icon: React.ReactNode }[] = [
  {
    id: 'mine',
    label: '我的',
    icon: (
      <span className="flex items-center justify-center w-7 h-7 rounded-[var(--card-radius)] bg-gradient-to-br from-rose-400 to-pink-500 text-white">
        <Heart size={15} />
      </span>
    ),
  },
  {
    id: 'web',
    label: '网页',
    icon: (
      <span className="flex items-center justify-center w-7 h-7 rounded-[var(--card-radius)] bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
        <Globe size={15} />
      </span>
    ),
  },
];

const MODAL_TRANSITION_MS = 150;

export const AddWidgetModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(isOpen);
  const [activeCategory, setActiveCategory] = useState<string>('web');

  // 「我的」收藏：本地持久化字段 favoriteSites
  const { favoriteSites, toggleFavoriteSite } = useHomeStore(
    useShallow((s) => ({
      favoriteSites: s.favoriteSites,
      toggleFavoriteSite: s.toggleFavoriteSite,
    })),
  );
  const { showToast } = useToast();

  const handleToggleFavorite = (item: SiteItem) => {
    const already = favoriteSites.some((s) => isSameSite(s, item));
    toggleFavoriteSite(item);
    showToast(
      already ? `已取消收藏「${item.name}」` : `已收藏「${item.name}」`,
      already ? 'info' : 'success',
    );
  };

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setActiveCategory('web');
      const raf = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(raf);
    }
    setVisible(false);
    const t = window.setTimeout(() => setMounted(false), MODAL_TRANSITION_MS);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);


  return createPortal(
    mounted && (
      <div
        className="fixed inset-0 h-[100dvh] z-[100] flex items-center justify-center bg-black/30 backdrop-blur-md"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          style={{
            transform: visible ? 'scale(1)' : 'scale(0.98)',
            opacity: visible ? 1 : 0,
            transition: `transform ${MODAL_TRANSITION_MS}ms ease-out, opacity ${MODAL_TRANSITION_MS}ms ease-out`,
          }}
          className="flex flex-col sm:flex-row w-full h-full rounded-none overflow-hidden bg-white dark:bg-[#1C1C1E]"
        >
          {/* 左侧栏 */}
          <div className="flex flex-col bg-[#F2F2F7] dark:bg-[#2C2C2E] sm:w-52 shrink-0 border-b sm:border-b-0 sm:border-r border-black/5 dark:border-white/10">
            {/* 分类区：可滚动，备案信息固定在底部 */}
            <div className="flex sm:flex-col gap-1 p-2 sm:flex-1 sm:min-h-0 sm:overflow-y-auto overflow-x-auto">
              <div className="hidden sm:block px-2.5 pt-2 pb-3">
                <h1 className="text-font-title dark:text-white">
                  {'添加应用'}
                </h1>
              </div>
              {CATEGORIES.map((cat) => {
                const active = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center space-x-2.5 px-2.5 py-2 rounded-[var(--card-radius)] transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-white dark:bg-[#3A3A3C] shadow-xs'
                        : 'hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    {cat.icon}
                    <span
                      className={` ${
                        active
                          ? 'text-[color:var(--accent)] dark:text-white'
                          : ' '
                      }`}
                    >
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 底部备案信息（黑底） */}
            <SidebarFooter />
          </div>

          {/* 右侧内容区 */}
          <div className="relative flex-1 min-w-0 flex flex-col">
            {/* 我的收藏 / 网页：使用公共「网页列表」选择器，收藏态与本地持久化字段联动 */}
            {activeCategory === 'mine' ? (
              <div className="flex-1 min-h-0 overflow-y-auto p-5">
                <FavoriteList
                  favorites={favoriteSites}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-hidden">
                <WebListPicker
                  title="应用市场"
                  favorites={favoriteSites}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    document.body,
  );
};
