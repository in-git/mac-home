import { useState } from 'react';
import type { WidgetProps, WebSite } from '../../types';
import { WebListItem } from './WebListItem';
import { WebPreview } from './WebPreview';
import { DEFAULT_WEBSITES } from './defaultWebsites';

interface WebListWidgetProps extends WidgetProps {
  /** 要展示的网页条目列表 */
  websites?: WebSite[];
  /** 兼容旧数据：直接渲染到 iframe 的 HTML 源码（经 srcDoc 注入） */
  html?: string;
}

/**
 * 网页列表组件：将多个网页以列表形式展示，点击后在组件内预览区（iframe）打开。
 * 若未提供 websites 但提供了 html，则回退为直接渲染该 HTML 源码（兼容旧用法）。
 */
export const WebListWidget: React.FC<WebListWidgetProps> = ({ websites, html }) => {
  const list = websites && websites.length > 0 ? websites : DEFAULT_WEBSITES;
  const [active, setActive] = useState<WebSite | null>(null);

  // 兼容旧数据：有 html 且无 websites 时，直接渲染 HTML 源码
  if (html && (!websites || websites.length === 0)) {
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

  return (
    <div className="flex h-full w-full gap-2">
      {/* 网页列表 */}
      <div className="flex w-28 shrink-0 flex-col gap-1 overflow-auto pr-1">
        {list.map((site) => (
          <WebListItem
            key={site.url}
            site={site}
            active={active?.url === site.url}
            onSelect={setActive}
          />
        ))}
      </div>
      {/* 预览区 */}
      <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-black/5 dark:border-white/10">
        <WebPreview url={active?.url ?? null} />
      </div>
    </div>
  );
};

export default WebListWidget;
