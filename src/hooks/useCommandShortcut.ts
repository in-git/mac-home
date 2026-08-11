import { useEffect } from 'react';

interface UseCommandShortcutParams {
  isCommandOpen: boolean;
  isSpotlightOpen: boolean;
  isWallpaperModalOpen: boolean;
  isAddWidgetModalOpen: boolean;
  isSettingsModalOpen: boolean;
  onOpen: () => void;
}

/**
 * Global "/"-to-open-command-dialog. Ignored when an input/textarea/contenteditable
 * is focused so it never hijacks typing, and ignored if a modal is already open.
 * 使用 e.code === 'Slash' 以兼容中文/英文输入法下按 / 键。
 */
export function useCommandShortcut({
  isCommandOpen,
  isSpotlightOpen,
  isWallpaperModalOpen,
  isAddWidgetModalOpen,
  isSettingsModalOpen,
  onOpen,
}: UseCommandShortcutParams) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Slash' && e.key !== '/') return;
      const el = document.activeElement as HTMLElement | null;
      const typing =
        !!el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.isContentEditable);
      if (typing || isCommandOpen) return;
      if (
        isSpotlightOpen ||
        isWallpaperModalOpen ||
        isAddWidgetModalOpen ||
        isSettingsModalOpen
      )
        return;
      e.preventDefault();
      onOpen();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isCommandOpen,
    isSpotlightOpen,
    isWallpaperModalOpen,
    isAddWidgetModalOpen,
    isSettingsModalOpen,
    onOpen,
  ]);
}
