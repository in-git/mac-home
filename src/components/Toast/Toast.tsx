import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
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
  /** 正在播出场动画；动画结束后才真正从列表移除 */
  closing?: boolean;
}

/**
 * 图标尺寸：移动端 16px、sm 起 18px。
 *
 * 用 className 而非 size 属性控制：lucide 的 size 只能给固定值，
 * 无法响应式；而 CSS 的 width/height 优先级高于元素上的同名属性，
 * 因此 className 能覆盖它。
 */
const ICON_CLASS = 'h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]';

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className={`${ICON_CLASS} text-emerald-500`} />,
  error: <XCircle className={`${ICON_CLASS} text-rose-500`} />,
  info: <Info className={`${ICON_CLASS} text-sky-500`} />,
};

/** 出场动画时长（ms），需与 index.css 里 toastOut 的时长保持一致 */
const CLOSE_ANIM_MS = 180;

// ---- 模块级状态：脱离 React 树，任何位置都可命令式调用 ----
let items: ToastItem[] = [];
let listeners: Array<() => void> = [];
let root: Root | null = null;
let idRef = 0;

/** 自动关闭定时器：id → timeout handle */
const autoTimers = new Map<number, number>();
/** 自动关闭的起点时间戳，用于「悬停暂停」时算剩余时长 */
const autoStartedAt = new Map<number, number>();
/** 自动关闭的剩余时长（ms） */
const autoRemaining = new Map<number, number>();

function emit() {
  listeners.forEach((l) => l());
}

/** 清掉某个 toast 的所有定时器与记账，防止内存泄漏 */
function clearTimers(id: number) {
  const handle = autoTimers.get(id);
  if (handle !== undefined) window.clearTimeout(handle);
  autoTimers.delete(id);
  autoStartedAt.delete(id);
  autoRemaining.delete(id);
}

/**
 * 立即移除（不做动画）。
 * 仅供出场动画播完后的收尾，以及 panic 清空使用。
 */
function removeNow(id: number) {
  clearTimers(id);
  items = items.filter((t) => t.id !== id);
  emit();
}

/**
 * 开始关闭：先标记 closing 播出场动画，动画结束后才真正移除。
 *
 * 直接 remove 会让弹窗「啪」地消失；标了 closing 后由 CSS
 * 播 toastOut，视觉上与入场对称。
 */
function beginClose(id: number) {
  const target = items.find((t) => t.id === id);
  // 已移除或已在关闭中：避免重复触发导致定时器叠加
  if (!target || target.closing) return;
  clearTimers(id);
  items = items.map((t) => (t.id === id ? { ...t, closing: true } : t));
  emit();
  window.setTimeout(() => removeNow(id), CLOSE_ANIM_MS);
}

/** 安排自动关闭 */
function scheduleAutoClose(id: number, ms: number) {
  if (ms <= 0) return;
  autoStartedAt.set(id, Date.now());
  autoRemaining.set(id, ms);
  autoTimers.set(id, window.setTimeout(() => beginClose(id), ms));
}

/**
 * 悬停暂停自动关闭。
 *
 * 这不是锦上添花：带 `action`（如「撤销」）的提示如果 2.2 秒就消失，
 * 用户往往来不及点。指针停上去就暂停，是这类组件的标准行为。
 */
function pauseAutoClose(id: number) {
  const handle = autoTimers.get(id);
  if (handle === undefined) return;
  window.clearTimeout(handle);
  autoTimers.delete(id);
  const started = autoStartedAt.get(id) ?? Date.now();
  const left = (autoRemaining.get(id) ?? 0) - (Date.now() - started);
  autoRemaining.set(id, Math.max(0, left));
}

/** 移出后恢复自动关闭，从剩余时长接着算 */
function resumeAutoClose(id: number) {
  if (autoTimers.has(id)) return;
  const left = autoRemaining.get(id);
  if (left === undefined) return;
  // 给一个最小停留时间，否则「刚好在最后一刻移出」会立刻消失
  scheduleAutoClose(id, Math.max(600, left));
}

function ToastCard({ item }: { item: ToastItem }) {
  return (
    <div
      /**
       * 移动端 12px / 桌面端 14px。
       *
       * 尺寸档位集中在这里，不散落到各子元素，避免「标题大了描述没跟上」。
       * 图标与操作按钮都从父级继承字号（见下方 text-[1em] 的说明）。
       */
      className={`pointer-events-auto flex w-full max-w-md items-start gap-2 rounded-lg bg-white/95 px-3 py-2.5 text-xs text-[#1D1D1F] shadow-lg ring-1 ring-black/[0.08] backdrop-blur-md sm:gap-2.5 sm:px-3.5 sm:py-2 sm:text-sm ${
        item.closing
          ? 'animate-[toastOut_0.18s_ease-out_forwards]'
          : 'animate-[toastIn_0.2s_ease-out]'
      }`}
      onMouseEnter={() => pauseAutoClose(item.id)}
      onMouseLeave={() => resumeAutoClose(item.id)}
    >
      <span className="mt-px inline-flex">{ICONS[item.type]}</span>

      <div className="min-w-0 flex-1">
        <p className="break-words font-medium leading-snug">{item.message}</p>
        {item.description && (
          // 描述降一级：更小、更淡，与标题形成层级
          <p className="mt-0.5 break-words leading-snug text-[#6E6E73]">
            {item.description}
          </p>
        )}
      </div>

      {item.action && (
        <button
          type="button"
          onClick={() => {
            item.action?.onClick();
            beginClose(item.id);
          }}
          // 字号跟随父级（`text-[1em]`），避免按钮比正文大一号
          className="ml-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[1em] font-medium text-blue-500 transition-colors hover:bg-black/5 sm:px-2 sm:py-1"
        >
          {item.action.label}
        </button>
      )}

      <button
        type="button"
        onClick={() => beginClose(item.id)}
        // 命中区域略大于图标本身，手指点得到（移动端最小 ~28px）
        className="-mr-1 -mt-0.5 flex shrink-0 items-center justify-center rounded-md p-1 text-[#A1A1A6] transition-colors hover:bg-black/5 hover:text-[#6E6E73]"
        aria-label="关闭提示"
      >
        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
    /**
     * 用 `inset-x-0 + px` 而非 `left-1/2 -translate-x-1/2` 居中：
     * 后者在窄屏上遇到长文案会把容器撑出视口，出现横向滚动。
     * 宽度交给子项的 `max-w-md + w-full` 控制，容器只负责留边距。
     *
     * `aria-live` 让屏幕阅读器播报提示；`pointer-events-none` 保证
     * 空白区域不挡住下层交互，可点部分由子项单独开启。
     */
    <div
      className="pointer-events-none fixed inset-x-0 top-3 z-[200] flex flex-col items-center gap-2 px-3 sm:top-4"
      role="region"
      aria-live="polite"
      aria-label="通知"
    >
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
  scheduleAutoClose(id, duration);
  return id;
}

/** 关闭指定 toast（无参则关闭全部）。 */
toast.dismiss = (id?: number) => {
  if (id == null) {
    // 清空：连同所有挂起的定时器一起清掉，否则会有回调打到已移除的 id 上
    autoTimers.forEach((handle) => window.clearTimeout(handle));
    autoTimers.clear();
    autoStartedAt.clear();
    autoRemaining.clear();
    items = [];
    emit();
    return;
  }
  beginClose(id);
};
toast.clear = () => toast.dismiss();

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
