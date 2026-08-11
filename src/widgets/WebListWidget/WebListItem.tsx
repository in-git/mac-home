import { ExternalLink } from 'lucide-react';
import type { SiteItem } from '../../api/site';

interface WebListItemProps {
  site: SiteItem;
  active: boolean;
  onSelect: (site: SiteItem) => void;
}

/** 网页列表中的单个站点条目（渲染 logo/名称/描述/点击量/推荐等） */
export const WebListItem: React.FC<WebListItemProps> = ({ site, active, onSelect }) => {
  const imgSrc = site.logo || site.cover;
  const categoryName = site.categoryList?.[0]?.name;
  const keywordText = site.keyword
    ? Array.isArray(site.keyword)
      ? site.keyword.join(' · ')
      : site.keyword
    : '';

  return (
    <button
      type="button"
      onClick={() => onSelect(site)}
      className={`relative flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
        active
          ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent)]'
          : 'text-slate-700 hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10'
      }`}
      title={`${site.name}${site.des ? ` · ${site.des}` : ''}`}
    >
      {/* LOGO / 首字母占位（按 background 着色） */}
      <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md text-[11px] font-bold">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={site.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center text-white"
            style={{
              background: site.background || 'linear-gradient(135deg,#667eea,#764ba2)',
            }}
          >
            {(site.name || '?').charAt(0).toUpperCase()}
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 truncate text-sm font-medium">
          {site.name}
          {site.recommend && (
            <span className="shrink-0 rounded bg-amber-400/20 px-1 text-[9px] font-normal text-amber-600 dark:text-amber-300">
              荐
            </span>
          )}
        </span>
        {site.des && (
          <span className="block truncate text-[10px] text-slate-400 dark:text-slate-500">
            {site.des}
          </span>
        )}
        {(site.count !== undefined || categoryName || keywordText) && (
          <span className="mt-0.5 flex items-center gap-1 truncate text-[9px] text-slate-400 dark:text-slate-500">
            {site.count !== undefined && site.count > 0 && (
              <span className="flex items-center gap-0.5">
                <ExternalLink size={8} />
                {site.count}
              </span>
            )}
            {categoryName && <span>· {categoryName}</span>}
            {keywordText && <span>· {keywordText}</span>}
          </span>
        )}
      </span>
    </button>
  );
};
