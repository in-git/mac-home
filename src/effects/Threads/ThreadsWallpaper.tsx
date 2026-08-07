import React from 'react';
import Threads from './Threads';
import type { ThreadsProps } from './Threads';

/**
 * Full-screen wrapper for the Threads WebGL background effect.
 * Used as a dynamic wallpaper preset (`threads`) in DynamicWallpaperCanvas.
 */
const ThreadsWallpaper: React.FC<
  Partial<ThreadsProps> & { className?: string; style?: React.CSSProperties }
> = ({ className, style, ...rest }) => (
  <div
    className={`fixed inset-0 -z-50 overflow-hidden pointer-events-none select-none ${
      className ?? ''
    }`}
    style={style}
  >
    <Threads
      color={[1, 1, 1]}
      amplitude={1}
      distance={0}
      enableMouseInteraction
      {...rest}
    />
  </div>
);

export default ThreadsWallpaper;
