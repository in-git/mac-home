import React from 'react';
import MoltenMetal from './MoltenMetal';
import type { MoltenMetalProps } from './MoltenMetal';

/**
 * Full-screen wrapper for the MoltenMetal WebGL background effect.
 * Used as a dynamic wallpaper preset (`molten-metal`) in DynamicWallpaperCanvas.
 */
const MoltenMetalWallpaper: React.FC<
  Partial<MoltenMetalProps> & { className?: string; style?: React.CSSProperties }
> = ({ className, style, ...rest }) => (
  <div
    className={`fixed inset-0 -z-50 overflow-hidden pointer-events-none select-none ${
      className ?? ''
    }`}
    style={style}
  >
    <MoltenMetal
      color1="#5227FF"
      color2="#FF9FFC"
      color3="#FFFFFF"
      speed={0.35}
      scale={4}
      detail={3}
      glow={1.6}
      coreSize={0.1}
      swirl={1}
      fold={-0.2}
      blackPoint={0.05}
      brightness={1.3}
      colorMode="molten"
      grain
      grainIntensity={0.05}
      mouseInteraction
      mouseStrength={0.3}
      opacity={1}
      {...rest}
    />
  </div>
);

export default MoltenMetalWallpaper;
