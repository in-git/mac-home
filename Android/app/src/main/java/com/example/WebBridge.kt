package com.example

import android.webkit.JavascriptInterface
import android.webkit.WebView

/**
 * 网页与原生之间的桥接接口。
 *
 * 通过 `WebView.addJavascriptInterface(this, "MXBridge")` 注入，
 * 网页侧以 `window.MXBridge.xxx(...)` 调用。
 *
 * ── 为什么需要它 ─────────────────────────────────────────────
 * 站在网页里做「打开站点」的全屏 loading 效果并不理想：
 * 遮罩画在 WebView 的内容层上，会跟着页面滚动/重绘一起抖动，
 * 层级也比原生控件低；更重要的是网页无法感知「跳转是否真的开始」，
 * 只能靠 10 秒超时这种笨办法兜底。
 *
 * 交给原生做则天然合适：它就是一层独立的 Compose 覆盖物，
 * 与 WebView 平级，不参与页面渲染，动画由系统主线程驱动。
 *
 * ── 安全 ───────────────────────────────────────────────────
 * `addJavascriptInterface` 只在 API 17+ 上对已加载的页面暴露方法，
 * 但**任何**在该 WebView 中打开的页面都能调用这些方法。本应用只加载
 * 自家的 https 站点，不加载任意外部 URL（外链走系统浏览器，见
 * `shouldOverrideUrlLoading`），因此风险可控。
 * 若将来允许 WebView 打开任意第三方页面，必须改为
 * `WebViewCompat.addWebMessageListener`（限定 origin）。
 */
class WebBridge(private val webView: WebView) {

  /** 由 Activity 注入的回调集合；用 lambda 避免桥接层直接持有 UI 状态 */
  var onShowLoading: ((String) -> Unit)? = null
  var onHideLoading: (() -> Unit)? = null

  /**
   * 网页请求展示全屏 loading。
   *
   * 必须在主线程回调：JS 的调用发生在 WebView 的 JS 线程，
   * 而更新 Compose 状态必须在主线程，否则会崩。
   *
   * @param label 展示文案（网页侧传入，如「正在打开…」）
   */
  @JavascriptInterface
  fun showLoading(label: String?) {
    webView.post {
      onShowLoading?.invoke(label?.takeIf { it.isNotBlank() } ?: "正在打开…")
    }
  }

  /** 网页请求关闭全屏 loading */
  @JavascriptInterface
  fun hideLoading() {
    webView.post { onHideLoading?.invoke() }
  }
}
