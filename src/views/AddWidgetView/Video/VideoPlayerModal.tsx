import { SkipForward, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { VideoItem, withBase } from '@/api/video';
import { IconButton } from '@/components/IconButton/IconButton';
import { VideoPlayer } from '@/components/VideoPlayer/VideoPlayer';
import { clearProgress, getProgress, saveProgress } from './playbackMemory';

interface VideoPlayerModalProps {
  item: VideoItem | null;
  onClose: () => void;
  /** 自动连播：播放结束后切到下一个视频（不传则不连播） */
  onNext?: () => void;
  /** 是否存在下一个（决定是否显示「下一个」按钮） */
  hasNext?: boolean;
}

/**
 * 全屏视频播放层（ArtPlayer）。
 *
 * - 铺满整个视口（100dvh），纯黑背景
 * - 播放器占满可用空间，ArtPlayer 的 autoSize 会按视频原始比例适配容器
 * - 右上角大尺寸关闭按钮 + 可选「下一个」按钮
 * - 标题 / 描述以底部渐变浮层压在播放器上，不挤占画面
 * - 播放结束自动连播（若上层提供 onNext）
 * - 关闭方式：右上角按钮 / 点击空白 / ESC（ESC 也由 ArtPlayer 内部处理全屏退出）
 */
export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  item,
  onClose,
  onNext,
  hasNext = false,
}) => {
  /** 播放结束的提示态：显示「即将播放下一个」 */
  const [ended, setEnded] = useState(false);
  const endedTimerRef = useRef<number | null>(null);

  // 切换视频时重置提示态
  useEffect(() => {
    setEnded(false);
    if (endedTimerRef.current) {
      window.clearTimeout(endedTimerRef.current);
      endedTimerRef.current = null;
    }
  }, [item?.id]);

  // ESC 关闭 + 打开期间锁定 body 滚动
  useEffect(() => {
    if (!item) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [item, onClose]);

  /** 播放结束：清除进度（下次从头播），并自动连播下一个 */
  const handleEnded = useCallback(() => {
    if (item?.id) clearProgress(item.id);
    if (!onNext || !hasNext) return;
    setEnded(true);
    endedTimerRef.current = window.setTimeout(() => {
      setEnded(false);
      onNext();
    }, 3000);
  }, [item?.id, onNext, hasNext]);

  if (!item) return null;

  const src = withBase(item.url);
  const poster = withBase(item.cover);
  // 续播位置：来自卡片悬停预览（或上次观看）记录的进度
  const startAt = getProgress(item.id);

  return (
    <div
      className="fixed inset-0 z-[300] flex h-[100dvh] w-screen flex-col bg-black"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      {/* 右上角操作区：下一个 + 关闭（大尺寸） */}
      <div
        className="absolute right-3 top-3 z-20 flex items-center gap-2 sm:right-5 sm:top-5"
        onClick={(e) => e.stopPropagation()}
      >
        {hasNext && !ended && (
          <IconButton
            label="下一个"
            variant="ghost"
            size="lg"
            onClick={onNext}
            icon={<SkipForward size={22} />}
            className="h-11 w-11 bg-black/45 text-white backdrop-blur-md hover:bg-black/70 sm:h-12 sm:w-12"
          />
        )}
        <IconButton
          label="关闭"
          variant="ghost"
          size="lg"
          onClick={onClose}
          icon={<X size={26} />}
          className="h-11 w-11 bg-black/45 text-white backdrop-blur-md hover:bg-black/70 sm:h-12 sm:w-12"
        />
      </div>

      {/* 播放器舞台 */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <VideoPlayer
          // key 保证切换视频时重建播放器实例，避免复用导致的地址串台
          key={item.id}
          src={src}
          poster={poster || undefined}
          autoplay
          startAt={startAt}
          onEnded={handleEnded}
          // 播放中持续记录进度，下次（含刷新后）可续播
          onTimeUpdate={(t) => saveProgress(item.id, t)}
        />

        {/* 播放结束提示：即将自动连播 */}
        {ended && (
          <div className="pointer-events-auto absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm">
            <p className="text-sm text-white/80 sm:text-base">
              即将播放下一个…
            </p>
            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-transform hover:scale-105 active:scale-95 sm:text-base"
            >
              <SkipForward size={18} />
              立即播放
            </button>
          </div>
        )}
      </div>

      {/* 底部渐变浮层：标题 / 描述（不影响播放器控件） */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-4 pb-16 pt-12 text-white sm:px-8 sm:pb-20">
        <p className="line-clamp-1 text-base font-medium sm:text-xl">
          {item.title}
        </p>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-xs text-white/60 sm:text-sm">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default VideoPlayerModal;
