import { useEffect } from 'react';
import { initScheduler } from '../agent/scheduler';
import { registerWidgetAction } from '../data/widgetConfig';
import { initGlobalSound } from '../utils/sound';

interface UseAppInitParams {
  /** Triggered when the user picks the "widget-add" action (e.g. via command dialog). */
  onOpenAddWidget: () => void;
}

/**
 * One-time app startup: register the add-widget action, restore scheduled
 * agent tasks, and wire up the global click sound. Runs only once on mount.
 */
export function useAppInit({ onOpenAddWidget }: UseAppInitParams) {
  useEffect(() => {
    registerWidgetAction('widget-add', onOpenAddWidget);
    initScheduler();
    const disposeSound = initGlobalSound();
    return () => {
      disposeSound();
    };
  }, [onOpenAddWidget]);
}
