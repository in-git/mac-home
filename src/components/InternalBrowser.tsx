import { ExternalLink, RefreshCw, X, ArrowLeft, ArrowRight } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';

interface InternalBrowserProps {
  isOpen: boolean;
  url: string;
  title?: string;
  onClose: () => void;
}

/**
 * 内部浏览器：以全屏 iframe 渲染目标 URL。
 * - 顶部工具条：地址栏、后退、前进、刷新、在外部打开、关闭。
 * - 目标站点若通过 X-Frame-Options / CSP 禁止被嵌入，iframe 会加载失败；
 *   此时展示降级提示并引导用户在外部浏览器打开（无法可靠用 JS 侦测该拦截，故提供兜底按钮）。
 */
export const InternalBrowser: React.FC<InternalBrowserProps> = ({
  isOpen,
  url,
  title,
  onClose,
}) => {
  const [currentUrl, setCurrentUrl] = useState(url);
  const [loadError, setLoadError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const historyRef = useRef<string[]>([]);
  const indexRef = useRef<number>(-1);

  // 每次打开（或切换 url）时重置状态与历史。
  useEffect(() => {
    if (isOpen) {
      setCurrentUrl(url);
      setLoadError(false);
      historyRef.current = [url];
      indexRef.current = 0;
    }
  }, [isOpen, url]);

  // Esc 关闭。
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const navigate = (next: string) => {
    setLoadError(false);
    setCurrentUrl(next);
    // 截断"前进"历史后再压入新地址。
    historyRef.current = historyRef.current.slice(0, indexRef.current + 1);
    historyRef.current.push(next);
    indexRef.current = historyRef.current.length - 1;
  };

  const goBack = () => {
    if (indexRef.current > 0) {
      indexRef.current -= 1;
      setLoadError(false);
      setCurrentUrl(historyRef.current[indexRef.current]);
    }
  };

  const goForward = () => {
    if (indexRef.current < historyRef.current.length - 1) {
      indexRef.current += 1;
      setLoadError(false);
      setCurrentUrl(historyRef.current[indexRef.current]);
    }
  };

  const reload = () => {
    setLoadError(false);
    if (iframeRef.current) {
      // 通过重设 src 触发重新加载。
      iframeRef.current.src = currentUrl;
    }
  };

  const openExternal = () => window.open(currentUrl, '_blank', 'noopener,noreferrer');

  const toolBtn =
    'p-2 rounded-[var(--card-radius)] text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-default transition-colors';

  return createPortal(
    <AnimatedShell isOpen={isOpen} onClose={onClose} title={title}>
      {/* 工具条 */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
        <button className={toolBtn} onClick={goBack} disabled={indexRef.current <= 0} title="后退">
          <ArrowLeft size={18} />
        </button>
        <button
          className={toolBtn}
          onClick={goForward}
          disabled={indexRef.current >= historyRef.current.length - 1}
          title="前进"
        >
          <ArrowRight size={18} />
        </button>
        <button className={toolBtn} onClick={reload} title="刷新">
          <RefreshCw size={18} />
        </button>
        <input
          value={currentUrl}
          onChange={(e) => setCurrentUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const v = e.currentTarget.value.trim();
              navigate(/^https?:\/\//.test(v) ? v : `https://${v}`);
            }
          }}
          className="flex-1 mx-2 px-3 py-1.5 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[color:var(--accent)]/50"
          spellCheck={false}
        />
        <button className={toolBtn} onClick={openExternal} title="在外部浏览器打开">
          <ExternalLink size={18} />
        </button>
        <button
          className={`${toolBtn} hover:bg-red-500/10 hover:text-red-500`}
          onClick={onClose}
          title="关闭"
        >
          <X size={18} />
        </button>
      </div>

      {/* 内容区 */}
      <div className="relative flex-1 bg-white dark:bg-slate-950">
        {loadError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
            <p className="text-slate-600 dark:text-slate-300">
              该网站不允许在内部浏览器中嵌入显示。
            </p>
            <button
              onClick={openExternal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--card-radius)] bg-[color:var(--accent)] text-white text-sm font-medium hover:bg-[color:var(--accent-hover)] transition-colors"
            >
              <ExternalLink size={16} />
              在外部浏览器打开
            </button>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={currentUrl}
            title={title ?? 'Internal Browser'}
            onError={() => setLoadError(true)}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          />
        )}
      </div>
    </AnimatedShell>,
    document.body,
  );
};

/** 全屏外壳：背景模糊 + 居中放大动画。复用 motion 的 spring 入场。 */
const AnimatedShell: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-md"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="w-full h-full flex flex-col bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
