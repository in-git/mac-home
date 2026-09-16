import { Loader2, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { VideoItem, withBase } from '@/api/video';

interface VideoPlayerModalProps {
  item: VideoItem | null;
  onClose: () => void;
}

/**
 * 视频播放弹层（B 站风格：暗色遮罩 + 居中播放器 + 标题信息条）。
 * 关闭方式：右上角按钮 / 点击遮罩 / ESC。
 */
export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  item,
  onClose,
}) => {
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 切换视频时重置加载态
  useEffect(() => {
    setReady(false);
  }, [item?.id]);

  // ESC 关闭，并在打开期间锁定 body 滚动
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

  // 关闭时暂停播放，避免声音继续
  useEffect(() => {
    if (!item) videoRef.current?.pause();
  }, [item]);

  if (!item) return null;

  const src = withBase(item.url);
  const poster = withBase(item.cover);

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      <div
        className="flex w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-[#18181b] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 播放器：保持 16:9 */}
        <div className="relative aspect-video w-full bg-black">
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={28} className="animate-spin text-white/70" />
            </div>
          )}
          <video
            ref={videoRef}
            src={src}
            poster={poster || undefined}
            controls
            autoPlay
            playsInline
            onLoadedData={() => setReady(true)}
            className="h-full w-full"
          />
        </div>

        {/* 信息条 */}
        <div className="flex items-start gap-3 px-4 py-3 text-white">
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-medium sm:text-xl">
              {item.title}
            </p>
            {item.description && (
              <p className="mt-1 line-clamp-2 text-xs text-white/60 sm:text-sm">
                {item.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerModal;
