import React, { useEffect, useRef, useState } from 'react';
import { saveProgress } from './playbackMemory';

interface VideoHoverPreviewProps {
  /** 视频地址（完整 URL） */
  src: string;
  /** 视频 id，用于记录进度 */
  videoId: string;
  /** 当前是否悬停 */
  active: boolean;
  /** 已有进度（秒）；>0 时从该位置继续预览 */
  startAt?: number;
}

/** 预览静音播放时的音量（几乎无声，只作画面前瞻） */
const PREVIEW_VOLUME = 0;

/**
 * 卡片悬停预览：鼠标移入后静音播放视频，移出即停并记录进度。
 *
 * 设计要点：
 * - 用原生 `<video>` 而非 ArtPlayer：卡片里只需画面，无需控件，
 *   原生元素更轻（不加载播放器 UI），且多个卡片同时存在时开销低。
 * - **静音自动播放**：浏览器对 `autoplay` + `muted` 放行，无需用户手势。
 * - 只在悬停时挂载 video 元素，移出后卸载，避免 N 个卡片同时拉流。
 * - 进度通过 `timeupdate` 持续写入 playbackMemory，模态框打开时读取即可续播。
 */
export const VideoHoverPreview: React.FC<VideoHoverPreviewProps> = ({
  src,
  videoId,
  active,
  startAt = 0,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  // 记录最新进度，供卸载时落盘（卸载后 timeupdate 不再触发）
  const latestRef = useRef(startAt);

  useEffect(() => {
    if (!active) return;
    const video = videoRef.current;
    if (!video) return;

    // 从上次进度续播；接近结尾时从头开始，避免「一进入就播完」
    const apply = () => {
      const dur = video.duration;
      const canResume =
        startAt > 0 && Number.isFinite(dur) && startAt < dur - 3;
      if (canResume) {
        video.currentTime = startAt;
      }
      latestRef.current = video.currentTime;
      setReady(true);
    };

    video.addEventListener('loadedmetadata', apply);
    if (video.readyState >= 1) apply();

    // 静音播放（部分浏览器仍需在元数据就绪后调用 play）
    video.muted = true;
    video.volume = PREVIEW_VOLUME;
    const playPromise = video.play();
    // 自动播放被策略拦截时静默失败，仅停留在封面帧
    playPromise?.catch(() => {
      /* noop：保持封面展示 */
    });

    return () => {
      video.removeEventListener('loadedmetadata', apply);
      video.pause();
      // 记录进度，供模态框续播
      saveProgress(videoId, latestRef.current);
    };
  }, [active, src, videoId, startAt]);

  // 播放中持续记录进度（节流写入由 saveProgress 内部处理）
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    latestRef.current = video.currentTime;
    saveProgress(videoId, video.currentTime);
  };

  return (
    <video
      ref={videoRef}
      src={src}
      muted
      playsInline
      preload="metadata"
      onTimeUpdate={handleTimeUpdate}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
        ready ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
};

export default VideoHoverPreview;
