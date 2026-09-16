import { Loader2, TriangleAlert } from 'lucide-react';
import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { getServerSnapshot, getSnapshot, subscribe } from './loadingStore';

/** 失败提示的展示时长（ms） */
const FAIL_HINT_MS = 2400;

/**
 * 全屏磨砂 loading 遮罩。
 *
 * 挂在应用的根节点（见 `App.tsx`），由 `loadingStore` 驱动：
 * 任何地方调用 `showLoading()` / `hideLoading()` 都会反映到这里，
 * 无需逐层透传 props。
 *
 * 两种展示形态：
 * - 加载中：磨砂玻璃 + 旋转 spinner
 * - 超时 / 异常：换成警告图标 + 失败文案，短暂展示后收起。
 *   直接静默消失会让用户以为「点了没反应」，给一句说明更好。
 */
export const LoadingOverlay: React.FC = () => {
  const { current, timedOut } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  /**
   * 超时后延迟收起：`timedOut` 变 true 时遮罩仍在，先切成失败文案，
   * 过了 FAIL_HINT_MS 再真正卸载。
   */
  const [showFailHint, setShowFailHint] = useState(false);

  useEffect(() => {
    if (!timedOut) {
      setShowFailHint(false);
      return;
    }
    setShowFailHint(true);
    const timer = window.setTimeout(() => setShowFailHint(false), FAIL_HINT_MS);
    return () => window.clearTimeout(timer);
  }, [timedOut]);

  // 超时提示结束后彻底隐藏
  if (!current && !showFailHint) return null;

  const failed = showFailHint && !current;

  return (
    <div
      /**
       * z-index 必须高于所有弹层，否则视频播放层（z-[300]）会把它盖住：
       * 视频走的是「先弹 modal、再等首帧出画」的路径，遮罩正好要盖在
       * modal 之上才有意义。当前项目最高的弹层是 Toast（z-[200]）与
       * 视频 modal（z-[300]），这里取 400 留出余量。
       */
      className="fixed inset-0 z-[400] flex flex-col items-center justify-center gap-3 bg-white/70 backdrop-blur-2xl"
      role="status"
      aria-live="polite"
      aria-busy={!failed}
    >
      {failed ? (
        <>
          <TriangleAlert size={28} className="text-amber-500" />
          <span className="text-md text-slate-600">打开超时，请重试</span>
        </>
      ) : (
        <>
          <Loader2 size={28} className="animate-spin text-blue-500" />
          <span className="text-md text-slate-600">
            {current?.label ?? '正在打开…'}
          </span>
        </>
      )}
    </div>
  );
};

export default LoadingOverlay;
