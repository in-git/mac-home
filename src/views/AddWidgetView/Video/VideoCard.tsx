import { Play } from 'lucide-react';
import React, { useState } from 'react';
import { VideoItem, withBase } from '@/api/video';
import { LazyImage } from '@/components/LazyImage/LazyImage';

interface VideoCardProps {
  item: VideoItem;
  onPlay: (item: VideoItem) => void;
}

/**
 * 视频卡片（B 站风格）：16:9 封面 + 播放浮层 + 时长/时长角标，
 * 下方为标题（最多两行）与描述。移动端字号收窄，sm 起恢复。
 */
export const VideoCard: React.FC<VideoCardProps> = ({ item, onPlay }) => {
  const [hovered, setHovered] = useState(false);
  const cover = withBase(item.cover);

  return (
    <div
      onClick={() => onPlay(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-md border border-black/10 bg-white transition-colors hover:border-[color:var(--accent)] dark:border-white/10 dark:bg-white/5"
    >
      {/* 封面区：16:9，悬停放大并浮现播放按钮 */}
      <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
        {cover ? (
          <LazyImage
            src={cover}
            alt={item.title}
            ratio="16/9"
            fit="cover"
            fullWidth
            rounded="rounded-none"
            className="bg-transparent transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-white">
            <Play size={32} className="opacity-70" />
          </div>
        )}

        {/* 播放按钮浮层 */}
        <div
          className={`absolute inset-0 flex items-center justify-center bg-black/25 transition-opacity duration-200 ${
            hovered ? 'opacity-100' : 'opacity-0 max-sm:opacity-100'
          }`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/30 backdrop-blur-md">
            <Play size={20} className="ml-0.5 fill-current" />
          </span>
        </div>

        {/* 浏览量角标 */}
        {item.count !== undefined && item.count > 0 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/55 px-1.5 py-0.5 text-xs leading-none text-white ring-1 ring-white/15 backdrop-blur-md sm:text-sm">
            {item.count > 999 ? '999+' : item.count} 次播放
          </span>
        )}
      </div>

      {/* 信息区 */}
      <div className="flex flex-1 flex-col p-2 sm:p-2.5">
        <p className="line-clamp-2 text-sm font-medium sm:text-lg">
          {item.title}
        </p>
        {item.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 sm:mt-1 sm:text-base">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default VideoCard;
