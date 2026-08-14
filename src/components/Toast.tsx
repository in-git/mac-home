import React, { createRoot, type Root } from 'react-dom/client';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  /** 提示类型，决定左侧图标与配色。默认 success。 */
  type?: ToastType;
  /** 次要描述文本，显示在标题下方。 */
  description?: string;
  /** 自动关闭时长（毫秒），0 表示不自动关闭。默认 2200。 */
  duration?: number;
  /** 右侧操作按钮（如「撤销」「Dismiss」）。 */
  action?: ToastAction;
}

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  description?: string;
  duration: number;
  action?: ToastAction;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} className="text-emerald-500" />,
  error: <XCircle size={18} className="text-rose-500" />,
  info: <Info size={18} className="text-sky-500" />,
};

// ---- 模块级状态：脱离 React 树，任何位置都可命令式调用 ----
let items: ToastItem[] = [];
let listeners: Array<() => void> = [];
let root: Root | null = null;
let idRef = 0;

function emit() {
  listeners.forEach((l) => l());
}

function removeToast(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

function ToastCard({ item }: { item: ToastItem }) {
  return (
    <div className="flex items-center gap-2 px-3.5 py-2 rounded-[var(--card-radius)] bg-white/90 dark:bg-[#2C2C2E]/90 backdrop-blur shadow-lg ring-1 ring-black/5 dark:ring-white/10 text-sm text-slate-700 dark:text-slate-100 pointer-events-auto animate-[toastIn_0.2s_ease-out]">
      {ICONS[item.type]}
      <div className="flex flex-col">
        <span>{item.message}</span>
        {item.description && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {item.description}
          </span>
        )}
      </div>
      {item.action && (
        <button
          onClick={() => {
            item.action?.onClick();
            removeToast(item.id);
          }}
          className="ml-1 rounded-[var(--card-radius)] px-2 py-1 text-xs font-medium text-[color:var(--accent)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          {item.action.label}
        </button>
      )}
      <button
        onClick={() => removeToast(item.id)}
        className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        aria-label="关闭"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function Viewport() {
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    listeners.push(force);
    return () => {
      listeners = listeners.filter((l) => l !== force);
    };
  }, []);
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-2 pointer-events-none">
      {items.map((t) => (
        <ToastCard key={t.id} item={t} />
      ))}
    </div>
  );
}

function ensureMounted() {
  if (root) return;
  const container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  root.render(<Viewport />);
}

/**
 * 命令式 toast。用法：
 *   toast('已保存')
 *   toast('邀请你加入团队', { type: 'info', description: '...', action: { label: '撤销', onClick } })
 */
export function toast(message: string, options?: ToastOptions): number {
  ensureMounted();
  const id = ++idRef;
  const duration = options?.duration ?? 2200;
  items = [
    ...items,
    {
      id,
      message,
      type: options?.type ?? 'success',
      description: options?.description,
      duration,
      action: options?.action,
    },
  ];
  emit();
  if (duration > 0) window.setTimeout(() => removeToast(id), duration);
  return id;
}

/** 关闭指定 toast（无参则关闭全部）。 */
toast.dismiss = (id?: number) => {
  if (id == null) items = [];
  else removeToast(id);
  emit();
};
toast.clear = () => {
  items = [];
  emit();
};

// ---- 兼容层：保留原有 useToast / ToastProvider 用法，调用方无需改动 ----
interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

export function useToast(): ToastContextValue {
  return {
    showToast: (message: string, type?: ToastType) =>
      toast(message, type ? { type } : undefined),
  };
}

/** 兼容旧写法；命令式 toast 已无需 Provider，此处仅透传 children。 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <>{children}</>;

export default toast;
