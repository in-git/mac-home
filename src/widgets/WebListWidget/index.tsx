import { useEffect, useState } from 'react';
import type { WidgetProps } from '../../types';
import { siteApi, type SiteItem } from '../../api/site';
import { WebListItem } from './WebListItem';

interface WebListWidgetProps extends WidgetProps {
  /** 手动配置的单个站点（优先级高于接口拉取） */
  site?: SiteItem;
}

/**
 * 网页列表组件：拉取（或接收）站点数据，以卡片网格展示，点击后在组件内预览区打开，
 * 同时提供「直接访问」外链入口并调用后端 click 接口使点击量 +1。
 * 无 site 时从 /public/site/page 拉取公开站点。
 */
export const WebListWidget: React.FC<WebListWidgetProps> = ({ site }) => {
  const [items, setItems] = useState<SiteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<SiteItem | null>(null);

  useEffect(() => {
    // 手动配置的 site 优先
    if (site) {
      setItems([site]);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await siteApi.getPage({
          current: 1,
          size: 30,
          sortField: 'orderNum',
          sortOrder: 'ASC',
        });
        if (!cancelled && res?.records) setItems(res.records);
      } catch {
        // 忽略拉取失败，保持空列表
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();

    return () => {
      cancelled = true;
    };
  }, []);

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
      <div className="flex h-full w-full items-center justify-center text-font-sm  dark:text-slate-500">
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
