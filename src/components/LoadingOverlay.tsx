import { Loader2 } from 'lucide-react';
import React from 'react';

interface LoadingOverlayProps {
  /** 是否显示全屏 loading 遮罩 */
  visible: boolean;
  /** 提示文字 */
  label?: string;
}

/**
 * 全屏磨砂 loading 遮罩：fixed 覆盖整个视口，绝对定位在内容上层，
 * 背板模糊 + 半透明底色（磨砂玻璃效果）。
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  label = '正在加载…',
}) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-3 bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-2xl">
      <Loader2 size={28} className="animate-spin text-[color:var(--accent)]" />
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
};
