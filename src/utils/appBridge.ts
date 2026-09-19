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
  /** 请求在当前 WebView 内打开链接（不新开窗口） */
  openUrl?: (url: string) => void;
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
 * 是否为 Android WebView（User-Agent 判定）。
 *
 * Android WebView 的 UA 会在设备信息后带一个 `; wv` 标记，
 * 而 Chrome for Android 没有 —— 这是官方推荐的区分方式。
 *
 * 存在的意义：**已发布的旧版 APK 里还没有注入 MXBridge**（桥接是后加的），
 * `isNativeApp()` 对它们恒为 false。要让这类已安装的 App 也能立刻
 * 享受到「复用窗口」的修复，就需要这条不依赖桥接的判断。
 */
export function isAndroidWebView(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Android/i.test(ua) && /;\s*wv\b/.test(ua);
}

/**
 * 是否已经身处 App 容器里（用于隐藏「下载 App」这类入口）。
 *
 * 用「有桥接」或「UA 是 Android WebView」两者取或：
 * 只看 `isNativeApp()` 会漏掉**没内置桥接的旧版 APK**，
 * 结果就是已经装了 App 的用户还能看到「专属app 下载」按钮。
 */
export function isInAppContainer(): boolean {
  return isNativeApp() || isAndroidWebView();
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

/**
 * 在**系统浏览器**里打开链接，不在当前 WebView 内加载。
 *
 * 链路：
 * 1. 原生桥接 `openInExternal` —— App 内由原生发起 Intent.ACTION_VIEW，
 *    启动系统浏览器接管链接；当前 WebView 维持主页不动
 * 2. 桥接不存在（普通浏览器）→ 直接 `window.open` 新标签页
 *
 * 之所以放弃「同 WebView 加载」：那样会替换主页，用户从原生返回键
 * 回不到当前页，体验割裂。走系统浏览器后，原生返回可直接回到 App 主页。
 *
 * 不存在失败场景：系统总会兜到一个浏览器；调用方可放心忽略返回值。
 */
export function openInExternal(url: string): boolean {
  const bridge = getBridge();
  if (bridge && typeof bridge.openInExternal === 'function') {
    try {
      bridge.openInExternal(url);
      return true;
    } catch (error) {
      console.warn('[appBridge] openInExternal 调用失败，回退到 window.open', error);
    }
  }
  // 普通浏览器 / bridge 不可用：开新标签页
  window.open(url, '_blank', 'noreferrer');
  return true;
}
