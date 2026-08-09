import { motion } from 'motion/react';
import React from 'react';

interface Props {
  /** 左侧大图（iPad 风格，md 及以上显示） */
  imageUrl?: string;
  imageAlt?: string;
  onBackdropClick?: () => void;
  children: React.ReactNode;
}

/** 苹果/iPad 质感登录卡片外壳：左大图 + 右表单，毛玻璃、动态圆角、柔和阴影 */
export function AuthCard({
  imageUrl,
  imageAlt,
  onBackdropClick,
  children,
}: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onBackdropClick}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 8 }}
        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        className="relative flex w-full max-w-[860px] overflow-hidden rounded-[var(--card-radius)] border border-white/60 bg-white/80 shadow-[0_24px_70px_-12px_rgba(0,0,0,0.45)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/80"
      >
        {/* 左侧大图（iPad 风格） */}
        {imageUrl && (
          <div className="relative hidden w-1/2 md:block">
            <img
              src={imageUrl}
              alt={imageAlt ?? ''}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-xl font-semibold text-white drop-shadow">
                欢迎回来
              </p>
              <p className="mt-1 text-sm text-white/80">登录以同步你的工作台</p>
            </div>
          </div>
        )}

        {/* 右侧表单区 */}
        <div className="w-full p-8 md:w-1/2 md:p-10">{children}</div>
      </motion.div>
    </div>
  );
}
