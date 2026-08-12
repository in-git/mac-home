import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

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

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const remove = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string, duration: number) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setMessages((prev) => [...prev, { id, type, message, duration }]);
      const timer = window.setTimeout(() => remove(id), duration);
      timers.current.set(id, timer);
    },
    [remove],
  );

  useEffect(() => {
    globalApi = {
      success: (msg, d) => push('success', msg, d ?? DISMISS_DURATION),
      warning: (msg, d) => push('warning', msg, d ?? DISMISS_DURATION),
      error: (msg, d) => push('error', msg, d ?? DISMISS_DURATION),
      info: (msg, d) => push('info', msg, d ?? DISMISS_DURATION),
    };
    return () => {
      globalApi = null;
      timers.current.forEach((t) => clearTimeout(t));
      timers.current.clear();
    };
  }, [push]);

  const portal =
    typeof document !== 'undefined'
      ? createPortal(
          <div className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex flex-col items-center gap-2">
            <AnimatePresence>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ y: -20, opacity: 0, scale: 0.95 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -10, opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="pointer-events-auto flex max-w-[420px] items-center gap-2.5 rounded-full border border-white/40 bg-white/75 px-4 py-2.5 text-[13px] text-slate-700 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-white/15 dark:bg-[rgba(30,30,32,0.85)] dark:text-[#f5f5f7]"
                  onClick={() => remove(m.id)}
                  role="status"
                >
                  {ICONS[m.type]}
                  <span className="font-medium leading-tight">{m.message}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(m.id);
                    }}
                    className="ml-1 rounded-full p-0.5 text-slate-400 transition-colors hover:bg-black/5 hover:text-slate-600 dark:dark:hover:bg-white/10 dark:hover:text-slate-200"
                    aria-label="关闭"
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
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
