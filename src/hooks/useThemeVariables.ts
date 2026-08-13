import { useEffect } from 'react';
import { CARD_RADIUS, CardRadiusTier, FONT_VARIANT, FontVariant } from '../types';
import { darkenHex } from '../utils/color';

interface UseThemeVariablesParams {
  isDarkMode: boolean;
  themeColor: string;
  fontVariant: FontVariant;
  cardRadius: CardRadiusTier;
}

/**
 * Apply persisted dark mode + theme color + font scale + card radius to the
 * document root via CSS variables. Split into three independent effects so
 * each only re-runs when its own dependency changes.
 */
export function useThemeVariables({
  isDarkMode,
  themeColor,
  fontVariant,
  cardRadius,
}: UseThemeVariablesParams) {
  // Apply persisted dark mode + theme color to the document root.
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.style.setProperty('--accent', themeColor);
    root.style.setProperty('--accent-hover', darkenHex(themeColor, 12));
  }, [isDarkMode, themeColor]);

  // Write the three font-size CSS variables directly from the chosen font variant.
  useEffect(() => {
    const root = document.documentElement;
    const t = FONT_VARIANT[fontVariant].px;
    root.style.setProperty('--font-sm', `${t.sm}px`);
    root.style.setProperty('--font-md', `${t.md}px`);
    root.style.setProperty('--font-lg', `${t.lg}px`);
  }, [fontVariant]);

  // Write the card corner-radius CSS variable from the chosen radius tier.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--card-radius', `${CARD_RADIUS[cardRadius].px}px`);
  }, [cardRadius]);
}
