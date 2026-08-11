import { useState } from 'react';

interface WebPreviewProps {
  url: string | null;
}

/** 网页列表选中站点后的内置预览区（iframe），并提供降级的外链打开入口 */
export const WebPreview: React.FC<WebPreviewProps> = ({ url }) => {
  const [failed, setFailed] = useState(false);

  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs text-slate-400 dark:text-slate-500">
        从左侧选择一个网页开始浏览
      </div>
    );
  }

  // 站点禁止被 iframe 嵌入时，提供外链降级入口
  if (failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-xs text-slate-500 dark:text-slate-400">
        <span>该网页不允许在内部打开</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-[color:var(--accent)]/15 px-3 py-1.5 text-[color:var(--accent)] hover:bg-[color:var(--accent)]/25"
        >
          在外部浏览器打开
        </a>
      </div>
    );
  }

  return (
    <iframe
      key={url}
      title="网页预览"
      src={url}
      onError={() => setFailed(true)}
      className="h-full w-full border-0"
      style={{ background: '#fff' }}
      sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
    />
  );
};
