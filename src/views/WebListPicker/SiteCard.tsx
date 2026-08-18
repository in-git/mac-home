import { Trash2, Download, Eye, Check } from 'lucide-react';
import React, { useState } from 'react';
import { Tooltip } from '@heroui/react';
import { SiteItem } from '../../api/site';
import { useToast } from '../../components/Toast';
import { LazyImage } from '../../components/LazyImage';
import Button from '../../components/Button';

interface SiteCardProps {
  item: SiteItem;
  onOpen: (item: SiteItem) => void;
  onAdd: (item: SiteItem) => void;
  onRemove?: (item: SiteItem) => void;
  exists: boolean;
}

export const SiteCard: React.FC<SiteCardProps> = ({
  item,
  onOpen,
  onAdd,
  onRemove,
  exists,
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const installTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const { showToast } = useToast();
  const coverSrc = item.cover || item.logo;
  const logoImgRef = React.useRef<HTMLImageElement | null>(null);

  // 清理安装定时器
  React.useEffect(() => {
    return () => {
      if (installTimerRef.current) clearTimeout(installTimerRef.current);
    };
  }, []);

  // 图片可能来自缓存：已缓存的图片不会触发 onLoad，需主动检查 complete 避免永远空白
  React.useEffect(() => {
    if (logoImgRef.current?.complete) setImgLoaded(true);
  }, [item.logo]);
  return (
    <div
      onClick={() => onOpen(item)}
      className="group relative flex flex-col overflow-hidden rounded-[var(--card-radius)] border border-black/10 dark:border-white/10 hover:border-[color:var(--accent)] hover:ring-2 hover:ring-[color:var(--accent)]/40 bg-white dark:bg-white/5 cursor-pointer"
    >
      <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        {coverSrc ? (
          <LazyImage
            src={coverSrc}
            alt={item.name}
            ratio="16/9"
            fit="cover"
            fullWidth
            rounded="rounded-none"
            className="bg-transparent group-hover:scale-105 transition-transform"
          />
        ) : (
          <div
            className="h-full w-full flex items-center justify-center text-white text-3xl font-bold"
            style={{
              background:
                item.background ||
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            {(item.name || '?').charAt(0).toUpperCase()}
          </div>
        )}
        {item.count !== undefined && item.count > 0 && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/55 text-white text-[13px] font-semibold leading-none shadow-md ring-1 ring-white/15 backdrop-blur-md duration-200 group-hover:scale-105 group-hover:bg-black/65">
            <Eye size={13} className="opacity-90" />
            {item.count > 999 ? '999+' : item.count}
          </span>
        )}
      </div>

      <div className="relative p-2.5 flex items-center gap-3 text-left">
        {/* 左侧：Logo + 标题与描述 */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {item.logo && !imgError ? (
            <img
              ref={logoImgRef}
              src={item.logo}
              alt={item.name}
              loading="lazy"
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : (
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{
                background:
                  item.background ||
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              {(item.name || '?').charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex flex-col flex-1 min-w-0 justify-center">
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {item.name}
            </p>
            {item.des && (
              <p className="truncate text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {item.des}
              </p>
            )}
          </div>
        </div>

        {/* 右侧：安装/状态操作按钮 */}
        <div className="relative h-8 w-8 shrink-0">
          {isInstalling ? (
            /* 安装中：环形进度条动画 */
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 shadow-md"
            >
              <svg className="h-6 w-6 -rotate-90" viewBox="0 0 32 32">
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-black/10 dark:text-white/10"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeDasharray={75.4}
                  strokeDashoffset={75.4}
                  strokeLinecap="round"
                  className="text-[color:var(--accent,#3b82f6)] transition-all duration-[2000ms] ease-linear"
                  style={{
                    animation: 'circleProgress 2s linear forwards',
                  }}
                />
              </svg>
              <style>{`
                @keyframes circleProgress {
                  0% { stroke-dashoffset: 75.4; }
                  100% { stroke-dashoffset: 0; }
                }
              `}</style>
            </div>
          ) : exists ? (
            <>
              {/* 已安装：默认绿色对勾；鼠标移到卡片上切换为红色删除按钮 */}
              {onRemove && (
                <Tooltip delay={100}>
                  <Tooltip.Trigger>
                    <Button
                      iconOnly
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(item);
                        showToast(`已从桌面移除「${item.name}」`, 'info');
                      }}
                      className="absolute inset-0 z-10 !h-8 !w-8 rounded-full bg-red-500 text-white shadow-md ring-1 ring-white/15 hover:bg-red-600 transition-opacity opacity-0 group-hover:opacity-100"
                      title="删除"
                      icon={<Trash2 size={15} />}
                    />
                  </Tooltip.Trigger>
                  <Tooltip.Content showArrow placement="top" className="text-xs">
                    删除
                  </Tooltip.Content>
                </Tooltip>
              )}
              <Button
                iconOnly
                size="sm"
                onClick={(e) => e.stopPropagation()}
                className={`absolute inset-0 !h-8 !w-8 rounded-full bg-green-500 text-white shadow-md ring-1 ring-white/15 transition-opacity ${
                  onRemove ? 'opacity-100 group-hover:opacity-0' : ''
                }`}
                title="已安装"
                icon={<Check size={16} strokeWidth={3} />}
              />
            </>
          ) : (
            <Tooltip delay={100}>
              <Tooltip.Trigger>
                <Button
                  iconOnly
                  size="sm"
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsInstalling(true);
                    installTimerRef.current = setTimeout(() => {
                      setIsInstalling(false);
                      onAdd(item);
                      showToast(`已添加「${item.name}」到桌面`, 'success');
                    }, 2000);
                  }}
                  className="absolute inset-0 !h-8 !w-8 rounded-full shadow-md"
                  icon={<Download size={16} />}
                />
              </Tooltip.Trigger>
              <Tooltip.Content showArrow placement="top" className="text-xs">
                添加
              </Tooltip.Content>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};
