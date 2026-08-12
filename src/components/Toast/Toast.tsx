import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastContextValue {
  success: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

let globalApi: ToastContextValue | null = null;

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={16} className="text-[var(--accent)]" />,
  warning: <AlertTriangle size={16} className="text-amber-500" />,
  error: <XCircle size={16} className="text-red-500" />,
  info: <Info size={16} className="dark:text-slate-400" />,
};

const DISMISS_DURATION = 3500;
const TOAST_TRANSITION_MS = 200;

export const toast: ToastContextValue = {
  success: (message, duration = DISMISS_DURATION) =>
    globalApi?.success(message, duration),
  warning: (message, duration = DISMISS_DURATION) =>
    globalApi?.warning(message, duration),
  error: (message, duration = DISMISS_DURATION) =>
    globalApi?.error(message, duration),
  info: (message, duration = DISMISS_DURATION) =>
    globalApi?.info(message, duration),
};

interface ToastProviderProps {
  children?: React.ReactNode;
}

interface ToastItemProps {
  message: ToastMessage;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ message, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // 挂载后触发进入动画
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // 时长到期后开始退出
  useEffect(() => {
    const timer = window.setTimeout(() => setLeaving(true), message.duration);
    return () => clearTimeout(timer);
  }, [message.duration]);

  // 退出动画结束后真正移除
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(
      () => onClose(message.id),
      TOAST_TRANSITION_MS,
    );
    return () => clearTimeout(timer);
  }, [leaving, message.id, onClose]);

  const dismiss = () => setLeaving(true);

  return (
    <div
      role="status"
      onClick={dismiss}
      className="pointer-events-auto flex w-[420px] max-w-full items-center gap-2.5 rounded-full border border-white/40 bg-white/75 px-4 py-2.5 text-[13px] text-slate-700 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.12)] backdrop-blur-xl cursor-pointer dark:border-white/15 dark:bg-[rgba(30,30,32,0.85)] dark:text-[#f5f5f7]"
      style={{
        transition: `opacity ${TOAST_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${TOAST_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        opacity: leaving ? 0 : visible ? 1 : 0,
        transform: leaving
          ? 'translateY(-10px) scale(0.95)'
          : visible
            ? 'translateY(0) scale(1)'
            : 'translateY(-20px) scale(0.95)',
      }}
    >
      {ICONS[message.type]}
      <span className="font-medium leading-tight">{message.message}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          dismiss();
        }}
        className="ml-1 rounded-full p-0.5 text-slate-400 transition-colors hover:bg-black/5 hover:text-slate-600 dark:dark:hover:bg-white/10 dark:hover:text-slate-200"
        aria-label="关闭"
      >
        <X size={12} />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const remove = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const push = useCallback((type: ToastType, message: string, duration: number) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setMessages((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  useEffect(() => {
    globalApi = {
      success: (msg, d) => push('success', msg, d ?? DISMISS_DURATION),
      warning: (msg, d) => push('warning', msg, d ?? DISMISS_DURATION),
      error: (msg, d) => push('error', msg, d ?? DISMISS_DURATION),
      info: (msg, d) => push('info', msg, d ?? DISMISS_DURATION),
    };
    return () => {
      globalApi = null;
    };
  }, [push]);

  const portal =
    typeof document !== 'undefined'
      ? createPortal(
          <div className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex flex-col items-center gap-2">
            {messages.map((m) => (
              <ToastItem key={m.id} message={m} onClose={remove} />
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {children}
      {portal}
    </>
  );
};
