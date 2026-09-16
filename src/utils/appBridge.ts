/**
 * 原生 App 桥接层（网页 → Android）。
 *
 * App 侧通过 `WebView.addJavascriptInterface(..., "MXBridge")` 注入，
 * 在网页里表现为 `window.MXBridge` 对象（见 Android 的 `WebBridge.kt`）。
 *
 * 只在 App 的 WebView 里存在；在普通浏览器中 `window.MXBridge` 为 undefined，
 * 所有调用都会安全地降级为「什么都不做」。
 *
 * ── 为什么把 loading 交给原生 ─────────────────────────────
 * 网页内画的全屏遮罩效果不理想，原因有三：
 * 1. 它和页面内容同层，会随页面滚动 / 重绘一起抖动
 * 2. 层级低于原生控件，被系统 UI 遮挡时观感破碎
 * 3. 网页无法感知「跳转是否真的开始」，只能靠超时兜底
 *
 * 原生遮罩则是一层独立的 Compose 覆盖物，与 WebView 平级，
 * 不参与页面渲染，动画由系统主线程驱动，稳定得多。
 */

/** 桥接对象在 window 上的挂载名，需与 Android 侧 `addJavascriptInterface` 的第二个参数一致 */
const BRIDGE_NAME = 'MXBridge';

/** 桥接对象的方法签名（原生方法返回值会被忽略，故用 void 可兼容） */
interface NativeBridge {
  /** 请求展示全屏 loading，label 为展示文案 */
  showLoading?: (label: string) => void;
  /** 请求关闭全屏 loading */
  hideLoading?: () => void;
}

/** 读取桥接对象；不存在（普通浏览器）时返回 null */
function getBridge(): NativeBridge | null {
  if (typeof window === 'undefined') return null;
  const candidate = (window as unknown as Record<string, unknown>)[BRIDGE_NAME];
  return candidate && typeof candidate === 'object'
    ? (candidate as NativeBridge)
    : null;
}

/** 当前是否运行在原生 App 容器内 */
export function isNativeApp(): boolean {
  const bridge = getBridge();
  return !!bridge && typeof bridge.showLoading === 'function';
}

/**
 * 请求原生展示全屏 loading。
 *
 * 原生方法调用本身是同步的（跨进程通信由 WebView 内部处理），
 * 但用 try/catch 包住：不同 Android 版本对注入方法的调用约定略有差异，
 * 桥接调用失败不应该中断页面主流程。
 *
 * @returns 是否成功交由原生处理。false 表示当前不在 App 内，
 *   调用方应自行决定是否退回到网页内的 loading 方案。
 */
export function showNativeLoading(label = '正在打开…'): boolean {
  const bridge = getBridge();
  if (!bridge || typeof bridge.showLoading !== 'function') return false;
  try {
    bridge.showLoading(label);
    return true;
  } catch (error) {
    console.warn('[appBridge] showLoading 调用失败', error);
    return false;
  }
}

/**
 * 请求原生关闭全屏 loading。
 *
 * @returns 是否成功交由原生处理
 */
export function hideNativeLoading(): boolean {
  const bridge = getBridge();
  if (!bridge || typeof bridge.hideLoading !== 'function') return false;
  try {
    bridge.hideLoading();
    return true;
  } catch (error) {
    console.warn('[appBridge] hideLoading 调用失败', error);
    return false;
  }
}
