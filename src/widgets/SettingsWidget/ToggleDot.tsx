import React from 'react';

/** Small pill toggle indicator shown on the right of each setting row. */
export const ToggleDot: React.FC<{ active: boolean }> = ({ active }) => (
  <span
    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
      active ? 'bg-[#007AFF]' : 'bg-black/15 dark:bg-white/15'
    }`}
  >
    <span
      className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${
        active ? 'translate-x-3.5' : 'translate-x-0.5'
      }`}
    />
  </span>
);
