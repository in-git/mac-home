import clsx from 'clsx';
import React, {useState} from 'react';
import {ImageOff} from 'lucide-react';
import {LazyLoadImage} from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import {Skeleton} from '@heroui/react';

/** 支持的比例档位：默认 16/9，另提供 1/1 方形。 */
export type LazyImageRatio = '16/9' | '1/1';

export interface LazyImageProps {
  src: string;
  alt?: string;
  /** 比例档位，控制容器宽高比。默认 16/9。 */
  ratio?: LazyImageRatio;
  /** 图片填充方式，同 CSS object-fit。默认 cover。 */
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  className?: string;
  /** 是否占满父容器宽度。默认 true。 */
  fullWidth?: boolean;
  /** 圆角类名，跟随项目卡片风格。默认 rounded-xl。 */
  rounded?: string;
  onClick?: () => void;
}

const RATIO_CLASS: Record<LazyImageRatio, string> = {
  '16/9': 'aspect-[16/9]',
  '1/1': 'aspect-square',
};

/** 基于 react-lazy-load-image-component 的通用懒加载图片组件。 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt = '',
  ratio = '16/9',
  fit = 'cover',
  className = '',
  fullWidth = true,
  rounded = 'rounded-xl',
  onClick,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      onClick={onClick}
      className={clsx(
        'relative overflow-hidden bg-black/5 dark:bg-white/5',
        rounded,
        RATIO_CLASS[ratio],
        fullWidth ? 'w-full' : 'w-fit',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {error ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-slate-400">
          <ImageOff className="h-5 w-5" />
          加载失败
        </div>
      ) : (
        <>
          {!loaded && (
            <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
          )}
          <LazyLoadImage
            src={src}
            alt={alt}
            effect="blur"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            wrapperClassName="absolute inset-0 h-full w-full"
            className={clsx(
              'h-full w-full transition-opacity duration-300',
              fit === 'cover' && 'object-cover',
              fit === 'contain' && 'object-contain',
              fit === 'fill' && 'object-fill',
              fit === 'none' && 'object-none',
              fit === 'scale-down' && 'object-scale-down',
              loaded ? 'opacity-100' : 'opacity-0',
            )}
          />
        </>
      )}
    </div>
  );
};

export default LazyImage;
