import { useEffect, useState } from 'react';
import type { WidgetProps, WebSite } from '../../types';
import { siteApi, type SiteItem } from '../../api/site';
import { WebListItem } from './WebListItem';

interface WebListWidgetProps extends WidgetProps {
  /** 要展示的网页条目列表（手动配置，优先级高于接口拉取） */
  websites?: WebSite[];
  /** 兼容旧数据：直接渲染到 iframe 的 HTML 源码（经 srcDoc 注入） */
  html?: string;
}

/** 将兼容用的旧 WebSite 结构转换为统一的 SiteItem */
function toSiteItem(site: WebSite): SiteItem {
  return { name: site.title, link: site.url };
}

/**
 * 网页列表组件：拉取（或接收）站点数据，以卡片网格展示，点击后在组件内预览区打开，
 * 同时提供「直接访问」外链入口并调用后端 click 接口使点击量 +1。
 * 无 websites 时从 /public/site/page 拉取公开站点。
 */
export const WebListWidget: React.FC<WebListWidgetProps> = ({ websites, html }) => {
  const [items, setItems] = useState<SiteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<SiteItem | null>(null);

  // 兼容旧数据：有 html 且无 websites 时，直接渲染 HTML 源码
  if (html && (!websites || websites.length === 0) && items.length === 0) {
    return (
      <div className="max-h-[400px] w-full overflow-auto">
        <iframe
          title="网页"
          srcDoc={html}
          sandbox="allow-scripts allow-forms allow-popups allow-modals"
          className="min-h-full w-full border-0"
          style={{ background: 'transparent' }}
        />
      </div>
    );
  }

  useEffect(() => {
    // 手动配置的 websites 优先
    if (websites && websites.length > 0) {
      setItems(websites.map(toSiteItem));
      return;
    }
    setLoading(true);
    siteApi
      .getPage({ current: 1, size: 30, sortField: 'orderNum', sortOrder: 'ASC' })
      .then((res) => {
        if (res?.records) setItems(res.records);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [websites]);

  // 选中后切换预览（不额外计次，计次在「直接访问」时触发）
  const handleSelect = (site: SiteItem) => {
    setActive(site);
  };

  // 直接访问：新窗口打开外链 + 调用后端 click 接口使点击量 +1
  const handleDirectVisit = (site: SiteItem) => {
    if (site.link) window.open(site.link, '_blank', 'noopener,noreferrer');
    if (site.id) {
      siteApi.recordClick(site.id).catch(() => {});
      setItems((prev) =>
        prev.map((it) =>
          it.id === site.id ? { ...it, count: (it.count ?? 0) + 1 } : it,
        ),
      );
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-font-sm text-slate-400 dark:text-slate-500">
        加载站点中…
      </div>
    );
  }

  return (
    <div className="flex h-full w-full gap-2">
      {/* 网页卡片列表（网格） */}
      <div className="flex w-48 shrink-0 flex-col gap-2 overflow-auto pr-1">
        <div className="grid grid-cols-1 gap-2">
          {items.map((site) => (
            <WebListItem
              key={site.id ?? site.link}
              site={site}
              active={active?.id === site.id || active?.link === site.link}
              onSelect={handleSelect}
              onDirectVisit={handleDirectVisit}
            />
          ))}
        </div>
      </div>

    </div>
  );
};

export default WebListWidget;
