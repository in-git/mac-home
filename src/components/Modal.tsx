import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Header title. When omitted, no header (and no close button) is rendered. */
  title?: React.ReactNode;
  /** Optional icon rendered before the title. */
  icon?: React.ReactNode;
  /** Tailwind max-width utility for the card, e.g. 'max-w-2xl'. */
  maxWidth?: string;
  /** Extra Tailwind classes merged onto the glass card, e.g. responsive overrides like 'md:max-w-4xl'. */
  className?: string;
  /** Close when clicking the backdrop. Defaults to true. */
  closeOnBackdrop?: boolean;
  /** Show the X close button. Defaults to true (only meaningful with a title). */
  showCloseButton?: boolean;
  children: React.ReactNode;
}

/** 卡片进入/退出动画时长，与 inline transition 保持一致 */
const MODAL_TRANSITION_MS = 150;

/**
 * Generic centered modal: backdrop blur + glass card with a scale-in/out
 * animation (pure CSS transition), optional header (title + close button),
 * Esc-to-close and click-backdrop-to-close. Reused by every local modal.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  maxWidth = 'max-w-2xl',
  closeOnBackdrop = true,
  showCloseButton = true,
  className = '',
  children,
}) => {
  // mounted 控制是否挂载 DOM；visible 控制 CSS transition 的进入/退出状态。
  // 这样可以在真正卸载前先播放 150ms 的"缩小 + 淡出"退出动画，
  // 等价于原先 AnimatePresence + motion 的 exit 阶段语义。
  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // 下一帧再切到 visible：保证浏览器先以"初始态"布局，再从下一帧开始
      // 播放 transition，否则初始 transform 会被当作 baseline 不播动画。
      const raf = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(raf);
    }
    // 退出：先触发 visible → false 播放退出动画，动画结束后卸载 DOM。
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
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-md"
        onMouseDown={(e) => {
          if (closeOnBackdrop && e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          style={{
            transform: visible ? 'scale(1)' : 'scale(0.92)',
            opacity: visible ? 1 : 0,
            transition: `transform ${MODAL_TRANSITION_MS}ms ease-out, opacity ${MODAL_TRANSITION_MS}ms ease-out`,
          }}
          className={` glass-panel rounded-[var(--card-radius)] shadow-2xl overflow-hidden border border-white/50 dark:border-white/15 text-slate-800 dark:text-slate-100 flex flex-col ${className}`}
        >
          {title && (
            <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {icon}
                <h2 className="text-base font-semibold">{title}</h2>
              </div>
              {showCloseButton && (
                <button
                  onClick={() => {
                    onClose();
                  }}
                  className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    ),
    document.body,
  );
};
