import { Loader2, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { VideoItem, withBase } from '@/api/video';
import { IconButton } from '@/components/IconButton/IconButton';

interface VideoPlayerModalProps {
  item: VideoItem | null;
  onClose: () => void;
}

/**
 * 全屏视频播放层。
 *
 * - 铺满整个视口（100dvh，移动端不受地址栏影响），背景纯黑
 * - 视频按原始比例（`max-w-full max-h-full` + `object-contain`）尽可能放大，
 *   宽度优先吃满，超出高度时按比例收缩，永不变形、不裁切
 * - 关闭按钮固定在右上角，尺寸较大（移动端 44px 触摸热区）
 * - 标题 / 描述以底部渐变浮层压在视频上，不挤占视频高度
 * - 关闭方式：右上角按钮 / 点击空白处 / ESC
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
      className="fixed inset-0 z-[300] flex h-[100dvh] w-screen flex-col bg-black"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      {/* 关闭按钮：固定在右上角，大尺寸 */}
      <IconButton
        label="关闭"
        variant="ghost"
        size="lg"
        onClick={onClose}
        icon={<X size={26} />}
        className="absolute right-3 top-3 z-20 h-11 w-11 bg-black/45 text-white backdrop-blur-md hover:bg-black/70 sm:right-5 sm:top-5 sm:h-12 sm:w-12"
      />

      {/* 视频舞台：占满可用空间并居中 */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-white/70" />
          </div>
        )}
        {/* object-contain + max 尺寸：宽度优先吃满，同时保持原始比例不变形 */}
        <video
          ref={videoRef}
          src={src}
          poster={poster || undefined}
          controls
          autoPlay
          playsInline
          onLoadedData={() => setReady(true)}
          className="max-h-full max-w-full object-contain"
        />
      </div>

      {/* 底部渐变浮层：标题 / 描述，不占视频高度 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-4 pb-16 pt-12 text-white sm:px-8 sm:pb-20">
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
