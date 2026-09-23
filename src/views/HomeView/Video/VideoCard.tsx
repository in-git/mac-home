import { Clock, Play, Subtitles } from 'lucide-react';
import React, { useState } from 'react';
import { VideoItem, videoMetaOf, withBase } from '@/api/video';
import { LazyImage } from '@/components/LazyImage/LazyImage';
import { VideoHoverPreview } from './VideoHoverPreview';

interface VideoCardProps {
  item: VideoItem;
  onPlay: (item: VideoItem) => void;
}

/**
 * 视频卡片（对齐设计稿）：
 * 16:9 封面（左上角类型标、右上角弹幕数、右下角时长）
 * + 两行标题。
 * 浏览量 / 发布时间以渐变浮层压在封面底部（图片右下角）；
 * 鼠标悬停时静音预览播放并记录进度，点击进入模态框从该进度续播（移动端无悬停，仅显示播放浮层）。
 */
export const VideoCard: React.FC<VideoCardProps> = ({ item, onPlay }) => {
  const cover = withBase(item.cover);
  const videoSrc = withBase(item.url);
  const meta = videoMetaOf(item);
  /** 是否悬停（触发静音预览播放） */
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => onPlay(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group flex h-full cursor-pointer flex-col"
    >
      {/* 封面区：圆角卡片，悬停放大 + 播放浮层 */}
      <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
        {cover ? (
          <LazyImage
            src={cover}
            alt={item.title}
            ratio="16/9"
            fit="cover"
            fullWidth
            rounded="rounded-none"
            className="bg-transparent"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-white">
            <Play size={32} className="opacity-70" />
          </div>
        )}

        {/* 悬停静音预览：覆盖在封面上，移出即卸载并记录进度。
            只在悬停时挂载，避免整页卡片同时拉流 */}
        {hovered && videoSrc && (
          <VideoHoverPreview src={videoSrc} videoId={item.id} active={hovered} />
        )}

        {/* 播放按钮浮层：悬停出现，移动端常驻 */}
        <div className="absolute inset-0 z-[1] flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100 max-sm:opacity-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/30 backdrop-blur-md">
            <Play size={20} className="ml-0.5 fill-current" />
          </span>
        </div>

        {/* 左上角：「自制」类型标（设计稿为 B 站出品/自制角标） */}
        <span className="absolute left-1.5 top-1.5 rounded bg-[#fb7299] px-1.5 py-0.5 text-xs font-medium leading-tight text-white">
          自制
        </span>

        {/* 右上角：弹幕数（仅在有数据时展示） */}
        {meta.danmakuCount && (
          <span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded bg-black/55 px-1.5 py-0.5 text-xs leading-tight text-white backdrop-blur-md">
            <Subtitles size={12} />
            {meta.danmakuCount}
          </span>
        )}

        {/* 图片底部渐变浮层：浏览量 · 发布时间（压在封面内） */}
        {(meta.playCount || meta.date) && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-2 pb-1.5 pt-8 text-xs leading-tight text-white">
            {meta.playCount && (
              <span className="flex shrink-0 items-center gap-1">
                <Play size={11} className="fill-current" />
                {meta.playCount}
              </span>
            )}
            {meta.date && (
              <>
                {meta.playCount && <span className="shrink-0">·</span>}
                <span className="flex shrink-0 items-center gap-1">
                  <Clock size={11} />
                  {meta.date}
                </span>
              </>
            )}
          </div>
        )}

        {/* 右下角：时长（压在渐变浮层之上，避免被遮住） */}
        {meta.duration && (
          <span className="absolute bottom-1.5 right-1.5 z-[1] rounded bg-black/55 px-1.5 py-0.5 text-xs leading-tight text-white backdrop-blur-md">
            {meta.duration}
          </span>
        )}
      </div>

      {/* 标题：最多两行 */}
      <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug transition-colors group-hover:text-[color:var(--accent)] ">
        {item.title}
      </p>
    </div>
  );
};

export default VideoCard;
