import React from 'react';
import PlasmaWave from './PlasmaWave';
import type { PlasmaWaveProps } from './PlasmaWave';

/**
 * Full-screen wrapper for the PlasmaWave WebGL background effect.
 * Used as a dynamic wallpaper preset (`plasma-wave`) in DynamicWallpaperCanvas.
 */
const PlasmaWaveWallpaper: React.FC<
  Partial<PlasmaWaveProps> & { className?: string; style?: React.CSSProperties }
> = ({ className, style, ...rest }) => (
  <div
    className={`fixed inset-0 -z-50 overflow-hidden pointer-events-none select-none ${
      className ?? ''
    }`}
    style={style}
  >
    <PlasmaWave
      colors={['#A855F7', '#06B6D4']}
      speed1={0.05}
      speed2={0.05}
      focalLength={0.8}
      bend1={1}
      bend2={0.5}
      dir2={1}
      rotationDeg={0}
      {...rest}
    />
  </div>
);

export default PlasmaWaveWallpaper;
