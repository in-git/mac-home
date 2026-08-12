import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { SiteItem } from '../../api/site';

interface WebListItemProps {
  site: SiteItem;
  active: boolean;
  onSelect: (site: SiteItem) => void;
  onDirectVisit: (site: SiteItem) => void;
}

/** 站点封面图：16:9、带最小尺寸，加载失败时显示首字母占位 */
function Cover({ site }: { site: SiteItem }) {
  const [broken, setBroken] = useState(false);
  const imgSrc = site.cover || site.logo;
  const fallbackBg = site.background || 'linear-gradient(135deg,#667eea,#764ba2)';

  if (!imgSrc || broken) {
    return (
      <span
        className="flex h-full w-full items-center justify-center font-bold text-white"
        style={{ background: fallbackBg }}
      >
        {(site.name || '?').charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={site.name}
      loading="lazy"
      onError={() => setBroken(true)}
      className="h-full w-full object-cover"
    />
  );
}

/** 网页列表中的单个站点卡片（封面 16:9 + 名称/描述/点击量/推荐/分类/关键字） */
export const WebListItem: React.FC<WebListItemProps> = ({
  site,
  active,
  onSelect,
  onDirectVisit,
}) => {
  const categoryName = site.categoryList?.[0]?.name;
  const keywordText = site.keyword
    ? Array.isArray(site.keyword)
      ? site.keyword.join(' · ')
      : site.keyword
    : '';

  return (
    <div
      className={`group relative overflow-hidden rounded-[var(--card-radius)] border transition-colors ${
        active
          ? 'border-[color:var(--accent)] ring-2 ring-[color:var(--accent)]/40'
          : 'border-black/10 hover:border-[color:var(--accent)]/60 dark:border-white/10'
      }`}
    >
      {/* 封面：16:9，带最小高度；点击切换预览 */}
      <button
        type="button"
        onClick={() => onSelect(site)}
        className="relative block w-full overflow-hidden bg-black/5 dark:bg-white/5"
        title={`${site.name}${site.des ? ` · ${site.des}` : ''}`}
        style={{ aspectRatio: '16 / 9', minHeight: '60px' }}
      >
        <Cover site={site} />
        {site.recommend && (
          <span className="absolute left-1 top-1 rounded bg-amber-400/90 px-1 text-font-xs font-medium text-white">
            荐
          </span>
        )}
        {site.count !== undefined && site.count > 0 && (
          <span className="absolute right-1 top-1 flex items-center gap-0.5 rounded bg-black/55 px-1 text-font-xs text-white backdrop-blur-sm">
            <ExternalLink size={9} />
            {site.count}
          </span>
        )}
      </button>

      {/* 信息区 */}
      <div className="p-1.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSelect(site)}
            className={`min-w-0 flex-1 truncate text-left text-font-sm font-medium ${
              active ? 'text-[color:var(--accent)]' : 'text-slate-800 dark:text-slate-100'
            }`}
            title={site.name}
          >
            {site.name}
          </button>
          {/* 直接访问：新窗口打开外链 */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDirectVisit(site);
            }}
            title="直接访问"
            className="shrink-0 rounded p-0.5  transition-colors hover:bg-black/5 hover:text-[color:var(--accent)] dark:hover:bg-white/10"
          >
            <ExternalLink size={12} />
          </button>
        </div>

        {site.des && (
          <p className="mt-0.5 line-clamp-2 text-font-xs dark:text-slate-400">
            {site.des}
          </p>
        )}

        {(categoryName || keywordText) && (
          <p className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-0.5 truncate text-font-xs  dark:text-slate-500">
            {categoryName && <span>· {categoryName}</span>}
            {keywordText && <span>· {keywordText}</span>}
          </p>
        )}
      </div>
    </div>
  );
};
