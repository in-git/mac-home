import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { SidebarNav } from './SidebarNav';
import { SidebarFooter } from './SidebarFooter';

const TRANSITION_MS = 250;

interface MobileMenuDrawerProps {
  open: boolean;
  onClose: () => void;
  activeCategory: string;
  onSelectCategory: (id: string) => void;
}

/**
 * 移动端菜单抽屉：点击顶栏三横杠打开，全屏且从左向右滑入，
 * 右上角为关闭按钮；选中分类 / 按返回键 / 点关闭图标均会关闭。
 */
export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  open,
  onClose,
  activeCategory,
  onSelectCategory,
}) => {
  // 关闭时先播放滑出动画再卸载
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  /**
   * 统一关闭入口：若本抽屉压入了历史记录则走 history.back()，
   * 由 popstate 统一收口关闭，避免重复压栈导致返回键「要按多次」。
   */
  const handleClose = () => {
    if ((window.history.state as { drawer?: boolean } | null)?.drawer) {
      window.history.back();
    } else {
      onClose();
    }
  };

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const t = window.setTimeout(() => setMounted(false), TRANSITION_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  // 抽屉打开时：ESC 关闭，并接管系统返回键（Android 返回手势/键）用于关闭抽屉
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    window.history.pushState({ drawer: true }, '');
    const onPopState = () => onClose();
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('popstate', onPopState);
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] sm:hidden">
      <div
        style={{
          transform: visible ? 'translateX(0)' : 'translateX(-100%)',
          transition: `transform ${TRANSITION_MS}ms ease-out`,
        }}
        className="flex h-full w-full flex-col bg-[#F2F2F7] dark:bg-[#2C2C2E]"
      >
        {/* 顶部标题栏：右侧关闭图标 */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-black/5 px-3 dark:border-white/10">
          <h1 className="text-font-title dark:text-white">添加应用</h1>
          <button
            type="button"
            onClick={handleClose}
            aria-label="关闭菜单"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5 active:scale-95 dark:hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        <SidebarNav
          activeCategory={activeCategory}
          onSelect={(id) => {
            onSelectCategory(id);
            handleClose();
          }}
        />

        <div className="mt-auto">
          <SidebarFooter />
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default MobileMenuDrawer;
