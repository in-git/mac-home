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
   * 是否由「系统返回键 / 手势」关闭。
   * 返回键在移动端同时承担「退出页面」的语义，因此由 popstate 关闭后，
   * 需要再消费一次历史记录让用户真正离开页面（否则停留在原位、
   * 表现为「点了返回但页面没走」）。
   */
  const [pendingExit, setPendingExit] = useState(false);

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

    // 记录打开前的历史长度，用于在不依赖 history.state 的前提下安全回退
    const entryBeforeOpen = window.history.length;
    const canInterceptBack =
      window.history.length > entryBeforeOpen - 1 && window.history.length > 1;

    if (canInterceptBack) {
      window.history.pushState({ drawer: true }, '');
    }

    const onPopState = () => {
      // 仅当栈里确实还压着抽屉记录时，视为「返回键关闭抽屉」
      if ((window.history.state as { drawer?: boolean } | null)?.drawer) return;
      setPendingExit(true);
      onClose();
    };
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('popstate', onPopState);
      // 组件卸载时若本抽屉压入的记录仍在栈顶（例如点关闭图标关闭），
      // 主动清掉，避免残留一条记录让用户下次返回「按了没反应」
      if ((window.history.state as { drawer?: boolean } | null)?.drawer) {
        window.history.back();
      }
    };
  }, [open, onClose]);

  // 返回键关闭抽屉后，再消费一次历史记录，让用户真正离开页面
  useEffect(() => {
    if (!pendingExit) return;
    const t = window.setTimeout(() => {
      window.history.back();
      setPendingExit(false);
    }, TRANSITION_MS);
    return () => window.clearTimeout(t);
  }, [pendingExit]);

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
