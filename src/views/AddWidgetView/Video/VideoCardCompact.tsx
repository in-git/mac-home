import { Clock, Play } from 'lucide-react';
import React from 'react';
import { VideoItem, videoMetaOf, withBase } from '@/api/video';
import { LazyImage } from '@/components/LazyImage/LazyImage';

interface VideoCardCompactProps {
  item: VideoItem;
  onPlay: (item: VideoItem) => void;
}

/**
 * 推荐区右侧的普通卡片（hero 旁的 6 张）：
 * 封面（右下角时长、底部浮层显示浏览量 / 日期）+ 两行标题。
 *
 * 封面高度：PC 由父级 `lg:grid-rows-2` 等分决定（`flex-1` 撑满），
 * 6 张卡片平铺撑满列高，与左侧 hero 等高对齐；移动端退回 16:9。
 */
export const VideoCardCompact: React.FC<VideoCardCompactProps> = ({
  item,
  onPlay,
}) => {
  const cover = withBase(item.cover);
  const meta = videoMetaOf(item);

  return (
    <div
      onClick={() => onPlay(item)}
      className="group flex h-full min-h-0 cursor-pointer flex-col"
    >
      {/* 封面区：
          - PC（lg 起）：父级为 grid-rows-2 等分高度，用 flex-1 撑满剩余高度，与 hero 等高
          - 移动端：父级为自动行高、卡片无确定高度，flex-1 会塌成 0，
            因此这里退回固定 16:9 比例，保证封面可见 */}
      <div className="relative aspect-video min-h-0 shrink-0 overflow-hidden rounded-lg bg-slate-100 lg:aspect-auto lg:flex-1 dark:bg-slate-800">
        {cover ? (
          <LazyImage
            src={cover}
            alt={item.title}
            ratio="fill"
            fit="cover"
            fullWidth
            rounded="rounded-none"
            className="bg-transparent transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-white">
            <Play size={24} className="opacity-70" />
          </div>
        )}

        {/* 图片底部渐变浮层：浏览量 · 发布时间（压在封面内） */}
        {(meta.playCount || meta.date) && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-1.5 pb-1 pt-6 text-xs leading-tight text-white">
            {meta.playCount && (
              <span className="flex shrink-0 items-center gap-1">
                <Play size={10} className="fill-current" />
                {meta.playCount}
              </span>
            )}
            {meta.date && (
              <>
                {meta.playCount && <span className="shrink-0">·</span>}
                <span className="flex shrink-0 items-center gap-1">
                  <Clock size={10} />
                  {meta.date}
                </span>
              </>
            )}
          </div>
        )}

        {/* 右下角时长（压在渐变浮层之上，避免被遮住） */}
        {meta.duration && (
          <span className="absolute bottom-1 right-1 z-[1] rounded bg-black/55 px-1.5 py-0.5 text-xs leading-tight text-white backdrop-blur-md">
            {meta.duration}
          </span>
        )}
      </div>

      <p className="mt-1.5 line-clamp-2 shrink-0 text-xs font-medium leading-snug transition-colors group-hover:text-[color:var(--accent)] sm:text-sm">
        {item.title}
      </p>
    </div>
  );
};

export default VideoCardCompact;
