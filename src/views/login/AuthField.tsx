import React from 'react';

interface Props {
  icon: React.ReactNode;
  children: React.ReactNode;
}

/** 苹果风输入框容器：圆角填充、内边距充足、聚焦柔和蓝环 */
export function AuthField({ icon, children }: Props) {
  return (
    <div className="flex items-center gap-2.5 rounded-[var(--card-radius)] border border-slate-200/70 bg-slate-50/80 px-3.5 py-3 transition-colors focus-within:border-[#007AFF]/50 focus-within:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:focus-within:bg-white/[0.06]">
      {icon}
      {children}
    </div>
  );
}
