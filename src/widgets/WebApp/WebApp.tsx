import{ useState } from 'react';
import { Globe } from 'lucide-react';
import type { SiteItem } from '../../api/site';

interface WebAppProps {
  editing?: boolean;
  /** 图标固定像素尺寸；不传则由父容器 flex 撑满（默认行为）。 */
  iconSize?: number;
  /** 站点数据：图标图片取 site.logo、标签取 site.name、链接取 site.link、背景取 site.background。 */
  site?: SiteItem;
  /** 为 true 时不渲染站点名文本（如 1:1 正方形档位）。 */
  hideLabel?: boolean;
}

export function WebApp({ site, iconSize, hideLabel = false, editing = false }: WebAppProps) {
  const [imgError, setImgError] = useState(false);
  const label = site?.name || '';
  const hasValidLogo = !!site?.logo && !imgError;
  const link = site?.link || '';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (editing || !link) return;
    // 阻止冒泡，避免触发卡片整体 onClick（如进入编辑/布局逻辑）
    e.stopPropagation();
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      type="button"
      title={label}
      onClick={handleClick}
      disabled={editing}
      style={{ ['--label-size' as string]: iconSize ? `${Math.max(10, Math.round(iconSize * 0.18))}px` : '12px' }}
      className="group  flex h-full w-full flex-col items-center justify-center gap-1 disabled:cursor-default"
    >
      <div
        className="min-h-0 min-w-0 aspect-square rounded-[var(--card-radius)] overflow-hidden flex items-center justify-center bg-white/10"
        style={{
          background: site?.background || undefined,
          ...(iconSize ? { width: iconSize, height: iconSize, flex: '0 0 auto' } : { height: '100%', flex: '1 1 min-0' }),
        }}
      >
        {hasValidLogo ? (
          <img
            src={site.logo}
            alt={label}
            title={label}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[color:var(--card-fg)]">
            <Globe className="h-2/3 w-2/3" strokeWidth={1.75} />
          </div>
        )}
      </div>

      {label && !hideLabel && (
        <span className="w-full min-w-0 shrink-0 truncate text-center text-white text-sm">
          {label}
        </span>
      )}
    </button>
  );
}

export default WebApp;
