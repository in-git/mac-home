import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { VideoItem, videoMetaOf, withBase } from '@/api/video';
import { IconButton } from '@/components/IconButton/IconButton';
import { LazyImage } from '@/components/LazyImage/LazyImage';

interface VideoBannerProps {
  items: VideoItem[];
  onPlay: (item: VideoItem) => void;
  /** 自动轮播间隔（ms），0 表示不自动播放 */
  interval?: number;
}

/**
 * 首页横幅轮播（对齐设计稿左侧大图）：
 * 整块铺满封面，标题与元信息以渐变浮层压在左下角，
 * 右侧为左右切换箭头，左下为序号圆点。
 * 未提供 items 时整块不渲染（由父级决定布局）。
 */
export const VideoBanner: React.FC<VideoBannerProps> = ({
  items,
  onPlay,
  interval = 5000,
}) => {
  const [index, setIndex] = useState(0);
  const count = items.length;

  // 切换数据源后若越界，回到第一张
  useEffect(() => {
    setIndex((i) => (i < count ? i : 0));
  }, [count]);

  // 自动轮播；鼠标悬停或仅一张时暂停
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!interval || count <= 1 || paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => clearInterval(t);
  }, [interval, count, paused]);

  if (count === 0) return null;

  const item = items[Math.min(index, count - 1)];
  const cover = withBase(item.cover);
  const meta = videoMetaOf(item);
  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onClick={() => onPlay(item)}
      className="group relative aspect-video w-full cursor-pointer overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800"
    >
      {cover ? (
        <LazyImage
          src={cover}
          alt={item.title}
          ratio="fill"
          fit="cover"
          fullWidth
          rounded="rounded-none"
          className="bg-transparent transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-white">
          <Play size={40} className="opacity-70" />
        </div>
      )}

      {/* 底部渐变浮层：标题 + 浏览量 / 日期 */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-4 pt-14 text-white">
        <p className="line-clamp-2 text-base font-semibold leading-snug sm:text-xl">
          {item.title}
        </p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-white/75 sm:text-sm">
          {meta.playCount && (
            <span className="flex shrink-0 items-center gap-1">
              <Play size={12} className="fill-current" />
              {meta.playCount}
            </span>
          )}
          {meta.date && (
            <>
              {meta.playCount && <span className="shrink-0">·</span>}
              <span className="shrink-0">{meta.date}</span>
            </>
          )}
        </div>
      </div>

      {/* 左右切换箭头：悬停显示，移动端常驻 */}
      {count > 1 && (
        <>
          <IconButton
            label="上一张"
            variant="ghost"
            size="sm"
            icon={<ChevronLeft size={18} />}
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/35 text-white opacity-0 backdrop-blur-md transition-opacity hover:bg-black/55 group-hover:opacity-100 max-sm:opacity-100"
          />
          <IconButton
            label="下一张"
            variant="ghost"
            size="sm"
            icon={<ChevronRight size={18} />}
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/35 text-white opacity-0 backdrop-blur-md transition-opacity hover:bg-black/55 group-hover:opacity-100 max-sm:opacity-100"
          />
        </>
      )}

      {/* 序号圆点：置于右下角，避开左下角的标题浮层 */}
      {count > 1 && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`第 ${i + 1} 张`}
              onClick={(e) => {
                e.stopPropagation();
                setIndex(i);
              }}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoBanner;
