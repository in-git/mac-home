import { useEffect } from 'react';
import { initScheduler } from '../agent/scheduler';
import { initGlobalSound } from '../utils/sound';

interface UseAppInitParams {
  /** Triggered when the user picks the add-widget action (e.g. via command dialog). */
  onOpenAddWidget: () => void;
}

/**
 * One-time app startup: restore scheduled agent tasks and wire up the global
 * click sound. Runs only once on mount.
 */
export function useAppInit({ onOpenAddWidget }: UseAppInitParams) {
  useEffect(() => {
    initScheduler();
    const disposeSound = initGlobalSound();
    return () => {
      disposeSound();
    };
  }, [onOpenAddWidget]);
}
