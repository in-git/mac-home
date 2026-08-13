import { Trash2, Plus, ExternalLink } from 'lucide-react';
import React, { useState } from 'react';
import { Skeleton, Tooltip } from '@heroui/react';
import { SiteItem } from '../../api/site';
import { useToast } from '../../components/Toast';

interface SiteCardProps {
  item: SiteItem;
  onOpen: (item: SiteItem) => void;
  onAdd: (item: SiteItem) => void;
  onRemove?: (item: SiteItem) => void;
  exists: boolean;
  addTip: string;
  removeTip?: string;
}

export const SiteCard: React.FC<SiteCardProps> = ({
  item,
  onOpen,
  onAdd,
  onRemove,
  exists,
  addTip,
  removeTip = '删除',
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { showToast } = useToast();
  const coverSrc = item.cover || item.logo;
  return (
    <div
      onClick={() => onOpen(item)}
      className="group relative flex flex-col overflow-hidden rounded-[var(--card-radius)] border border-black/10 dark:border-white/10 hover:border-[color:var(--accent)] hover:ring-2 hover:ring-[color:var(--accent)]/40  bg-white dark:bg-white/5 min-h-[190px] cursor-pointer"
      title={`打开 ${item.name}`}
    >
      <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        {coverSrc && !imgError ? (
          <>
            {!imgLoaded && (
              <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
            )}
            <img
              src={coverSrc}
              alt={item.name}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`h-full w-full object-cover group-hover:scale-105 transition-transform ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
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
          <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/55 text-white text-[13px] font-semibold leading-none shadow-md ring-1 ring-white/15 backdrop-blur-md duration-200 group-hover:scale-105 group-hover:bg-black/65">
            <ExternalLink size={13} className="opacity-90" />
            {item.count > 999 ? '999+' : item.count}
          </span>
        )}

        {/* 右上角操作区：未添加时显示添加按钮（悬停时出现）；已添加时显示红色删除按钮 */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          {exists ? (
            onRemove && (
              <Tooltip>
                <Tooltip.Trigger>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item);
                      showToast(`已从桌面移除「${item.name}」`, 'info');
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md ring-1 ring-white/15 hover:bg-red-600 transition-colors"
                    title={removeTip}
                  >
                    <Trash2 size={13} />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Content showArrow placement="top" className="text-xs">
                  {removeTip}
                </Tooltip.Content>
              </Tooltip>
            )
          ) : (
            <Tooltip>
              <Tooltip.Trigger>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd(item);
                    showToast(`已添加「${item.name}」到桌面`, 'success');
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--accent)] text-white shadow hover:bg-[color:var(--accent-hover)] transition-transform active:scale-95 opacity-0 group-hover:opacity-100"
                >
                  <Plus size={15} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content showArrow placement="top" className="text-xs">
                {addTip}
              </Tooltip.Content>
            </Tooltip>
          )}
        </div>
      </div>
      <div className="p-2.5 text-left">
        <div className="flex items-center gap-2">
          {item.logo && !imgError ? (
            <img
              src={item.logo}
              alt={item.name}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`h-5 w-5 shrink-0 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : (
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{
                background:
                  item.background ||
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              {(item.name || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
            {item.name}
          </p>
        </div>
        {item.des && (
          <p className="truncate text-xs dark:text-slate-400 mt-0.5">
            {item.des}
          </p>
        )}
      </div>
    </div>
  );
};
