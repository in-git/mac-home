import { useEffect } from 'react';
import { initGlobalSound } from '../utils/sound';

/**
 * One-time app startup: wire up the global click sound. Runs only once on mount.
 */
export function useAppInit() {
  useEffect(() => {
    const disposeSound = initGlobalSound();
    return () => {
      disposeSound();
    };
  }, []);
}
