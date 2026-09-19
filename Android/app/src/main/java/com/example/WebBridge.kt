package com.example

import android.content.Intent
import android.net.Uri
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView

/**
 * 网页与原生之间的桥接接口。
 *
 * 通过 `WebView.addJavascriptInterface(this, "MXBridge")` 注入，
 * 网页侧以 `window.MXBridge.xxx(...)` 调用。
 *
 * ── 安全 ───────────────────────────────────────────────────
 * `addJavascriptInterface` 只在 API 17+ 上对已加载的页面暴露方法，
 * 但**任何**在该 WebView 中打开的页面都能调用这些方法。本应用只加载
 * 自家的 https 站点，因此风险可控。
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

  /**
   * 网页请求打开链接 —— **交由系统浏览器**接管，不在当前 WebView 内加载。
   *
   * 为什么不用 `webView.loadUrl`：那样会把新页面替换到当前 WebView，
   * 用户从原生返回键回不到主页，体验割裂。
   * 走 Intent.ACTION_VIEW 后：
   * - 当前 WebView 维持主页不动，用户操作不被打断
   * - 系统浏览器接管新页面，原生返回键可回到本 App
   *
   * 没有可用浏览器时静默失败（极少见），调用方可在 JS 侧 catch 后 fallback
   * 到 `window.open`。
   */
  @JavascriptInterface
  fun openInExternal(url: String?) {
    val target = url?.takeIf { it.isNotBlank() } ?: return
    webView.post {
      try {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(target))
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        webView.context.startActivity(intent)
      } catch (e: Exception) {
        Log.w("MXBridge", "openInExternal 失败", e)
      }
    }
  }
}