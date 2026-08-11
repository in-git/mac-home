import type { WebSite } from '../../types';

interface WebListItemProps {
  site: WebSite;
  active: boolean;
  onSelect: (site: WebSite) => void;
}

/** 网页列表中的单个站点条目 */
export const WebListItem: React.FC<WebListItemProps> = ({ site, active, onSelect }) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(site)}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
        active
          ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent)]'
          : 'text-slate-700 hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10'
      }`}
      title={site.url}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[13px]">
        🌐
      </span>
      <span className="truncate">{site.title}</span>
    </button>
  );
};
