package com.example

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.example.ui.theme.BrandBlue
import com.example.ui.theme.MyApplicationTheme

const val TARGET_URL = "https://mx2d.cn/"

/** 首屏停留超过该时长仍未完成渲染时，隐藏加载动画，避免一直转圈挡住页面 */
private const val SPLASH_TIMEOUT_MS = 8_000L

/**
 * 网页触发的全屏 loading 的最长展示时长（ms）。
 *
 * 网页侧已经有一份 10 秒超时，但那只在 JS 正常运行时有效 ——
 * 页面崩溃、被销毁、或 JS 执行出错时都不会发出 hideLoading。
 * 原生这份兜底保证遮罩无论如何都会自己消失。
 */
private const val WEB_LOADING_TIMEOUT_MS = 11_000L

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    setContent {
      MyApplicationTheme {
        Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
          AppContent(modifier = Modifier.padding(innerPadding))
        }
      }
    }
  }
}

@Composable
fun AppContent(modifier: Modifier = Modifier) {
  val context = LocalContext.current
  val lifecycleOwner = LocalLifecycleOwner.current
  var webViewInstance by remember { mutableStateOf<WebView?>(null) }
  var loadingProgress by remember { mutableIntStateOf(0) }
  var hasError by remember { mutableStateOf(false) }
  var showSplash by remember { mutableStateOf(true) }
  var lastBackPressTime by remember { mutableLongStateOf(0L) }
  val exitPrompt = stringResource(R.string.exit_prompt)

  // 网页点击卡片后由 JS 桥接层拉起的全屏 loading（见 WebBridge）
  var webLoading by remember { mutableStateOf(false) }
  var webLoadingLabel by remember { mutableStateOf("") }
  val mainHandler = remember { android.os.Handler(android.os.Looper.getMainLooper()) }
  // 超时兜底：网页若因异常没发来 hideLoading，到点必须自己收掉遮罩
  val webLoadingTimeout = remember {
    Runnable { webLoading = false }
  }

  /** 收起网页 loading，并取消未到期的超时回调 */
  fun dismissWebLoading() {
    mainHandler.removeCallbacks(webLoadingTimeout)
    webLoading = false
  }

  // 离开页面时清掉挂起的超时回调，避免回调在组件销毁后触发
  DisposableEffect(Unit) {
    onDispose { mainHandler.removeCallbacks(webLoadingTimeout) }
  }

  // Handle Android back button
  BackHandler {
    val webView = webViewInstance
    if (webView != null && webView.canGoBack()) {
      webView.goBack()
    } else {
      val currentTime = System.currentTimeMillis()
      if (currentTime - lastBackPressTime < 2000L) {
        (context as? ComponentActivity)?.finish()
      } else {
        lastBackPressTime = currentTime
        Toast.makeText(context, exitPrompt, Toast.LENGTH_SHORT).show()
      }
    }
  }

  // 兜底：首屏渲染迟迟不回调时收起加载动画，防止一直白屏转圈
  DisposableEffect(Unit) {
    val handler = android.os.Handler(android.os.Looper.getMainLooper())
    val runnable = Runnable { showSplash = false }
    handler.postDelayed(runnable, SPLASH_TIMEOUT_MS)
    onDispose { handler.removeCallbacks(runnable) }
  }

  // 页面切到后台时暂停 WebView 的 JS 与定时器，避免后台耗电
  DisposableEffect(lifecycleOwner, webViewInstance) {
    val webView = webViewInstance
    val observer = LifecycleEventObserver { _, event ->
      when (event) {
        Lifecycle.Event.ON_RESUME -> webView?.onResume()
        Lifecycle.Event.ON_PAUSE -> webView?.onPause()
        else -> Unit
      }
    }
    lifecycleOwner.lifecycle.addObserver(observer)
    onDispose {
      lifecycleOwner.lifecycle.removeObserver(observer)
    }
  }

  Box(
    modifier = modifier
      .fillMaxSize()
      .testTag("main_container")
  ) {
    // Web Page container
    WebViewContainer(
      url = TARGET_URL,
      onWebViewCreated = { webView -> webViewInstance = webView },
      onProgressChanged = { progress ->
        loadingProgress = progress
      },
      onPageFinished = {
        hasError = false
        showSplash = false
      },
      onError = {
        hasError = true
        showSplash = false
      },
      // 网页通过 MXBridge 请求展示 / 关闭全屏 loading
      onShowWebLoading = { label ->
        webLoadingLabel = label
        webLoading = true
        // 重置超时：连续点击多个卡片时，以最后一次为准
        mainHandler.removeCallbacks(webLoadingTimeout)
        mainHandler.postDelayed(webLoadingTimeout, WEB_LOADING_TIMEOUT_MS)
      },
      onHideWebLoading = { dismissWebLoading() }
    )

    // 网页触发的全屏 loading：放在 WebView 之后，自然盖在其上。
    // 与底部进度条并存 —— 进度条反映 WebView 自身的加载，
    // 遮罩反映「用户点击后等待目标站点打开」，两者语义不同。
    AppLoadingOverlay(
      visible = webLoading,
      label = webLoadingLabel,
      modifier = Modifier.fillMaxSize()
    )

    // Sleek top progress bar when loading
    if (loadingProgress in 1..99) {
      LinearProgressIndicator(
        progress = { loadingProgress / 100f },
        modifier = Modifier
          .fillMaxWidth()
          .height(3.dp)
          .align(Alignment.TopCenter)
          .testTag("top_progress_bar"),
        color = BrandBlue,
        trackColor = Color.Transparent
      )
    }

    // 首屏加载动画：站点为纯客户端渲染的 SPA，加载期间避免露出空白页
    if (showSplash && !hasError) {
      LoadingScreen(modifier = Modifier.fillMaxSize())
    }

    // Error Screen if network failed
    if (hasError) {
      ErrorStateScreen(
        onRetry = {
          hasError = false
          showSplash = true
          loadingProgress = 0
          webViewInstance?.reload()
        },
        modifier = Modifier.fillMaxSize()
      )
    }
  }
}

@Composable
fun LoadingScreen(modifier: Modifier = Modifier) {
  Surface(
    modifier = modifier.testTag("loading_screen"),
    color = MaterialTheme.colorScheme.background
  ) {
    Column(
      modifier = Modifier.fillMaxSize(),
      horizontalAlignment = Alignment.CenterHorizontally,
      verticalArrangement = Arrangement.Center
    ) {
      CircularProgressIndicator(color = BrandBlue)
      Spacer(modifier = Modifier.height(16.dp))
      Text(
        text = stringResource(R.string.loading_title),
        style = MaterialTheme.typography.titleMedium,
        color = MaterialTheme.colorScheme.onBackground
      )
      Spacer(modifier = Modifier.height(4.dp))
      Text(
        text = stringResource(R.string.loading_subtitle),
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        textAlign = TextAlign.Center
      )
    }
  }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebViewContainer(
  url: String,
  onWebViewCreated: (WebView) -> Unit,
  onProgressChanged: (Int) -> Unit,
  onPageFinished: () -> Unit,
  onError: () -> Unit,
  onShowWebLoading: (String) -> Unit,
  onHideWebLoading: () -> Unit,
  modifier: Modifier = Modifier
) {
  val context = LocalContext.current

  AndroidView(
    modifier = modifier
      .fillMaxSize()
      .testTag("webview_view"),
    factory = { ctx ->
      val webView = WebView(ctx)
      webView.apply {
        layoutParams = FrameLayout.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.MATCH_PARENT
        )
        // 深色底色：深色模式加载时不再闪白
        setBackgroundColor(0xFFFFFFFF.toInt())

        settings.apply {
          javaScriptEnabled = true
          domStorageEnabled = true
          databaseEnabled = true
          // 站点未声明 charset 时，默认按 UTF-8 解析，避免中文乱码（WebView 无自动嗅探 API）
          defaultTextEncodingName = "UTF-8"
          // 站点为 ES module 打包产物，禁用缓存可规避旧资源导致的空白页
          cacheMode = WebSettings.LOAD_DEFAULT
          loadWithOverviewMode = true
          useWideViewPort = true
          setSupportZoom(true)
          builtInZoomControls = true
          displayZoomControls = false
          allowFileAccess = true
          allowContentAccess = true
          mediaPlaybackRequiresUserGesture = false
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
          }
        }

        CookieManager.getInstance().apply {
          setAcceptCookie(true)
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            setAcceptThirdPartyCookies(webView, true)
          }
        }

        // 注入 JS 桥：网页通过 window.MXBridge 请求原生全屏 loading
        val bridge = WebBridge(webView).apply {
          onShowLoading = onShowWebLoading
          onHideLoading = onHideWebLoading
        }
        addJavascriptInterface(bridge, "MXBridge")

        webChromeClient = object : WebChromeClient() {
          override fun onProgressChanged(view: WebView?, newProgress: Int) {
            super.onProgressChanged(view, newProgress)
            onProgressChanged(newProgress)
          }
        }

        webViewClient = object : WebViewClient() {
          override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
            super.onPageStarted(view, url, favicon)
            onProgressChanged(1)
          }

          override fun onPageFinished(view: WebView?, url: String?) {
            super.onPageFinished(view, url)
            onProgressChanged(100)
            onPageFinished()
          }

          override fun onReceivedError(
            view: WebView?,
            request: WebResourceRequest?,
            error: WebResourceError?
          ) {
            super.onReceivedError(view, request, error)
            if (request?.isForMainFrame == true) {
              onError()
            }
          }

          override fun onReceivedHttpError(
            view: WebView?,
            request: WebResourceRequest?,
            errorResponse: WebResourceResponse?
          ) {
            super.onReceivedHttpError(view, request, errorResponse)
            val status = errorResponse?.statusCode ?: 0
            if (request?.isForMainFrame == true && status >= 400) {
              onError()
            }
          }

          override fun shouldOverrideUrlLoading(
            view: WebView?,
            request: WebResourceRequest?
          ): Boolean {
            val requestUri = request?.url ?: return false
            val scheme = requestUri.scheme?.lowercase() ?: ""
            // http/https 一律留在应用内浏览，保证是「网页容器」体验
            if (scheme == "http" || scheme == "https") {
              return false
            }
            // tel / mailto / 支付等外部 scheme 交给系统处理
            return try {
              val intent = Intent(Intent.ACTION_VIEW, Uri.parse(requestUri.toString()))
              intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
              context.startActivity(intent)
              true
            } catch (e: Exception) {
              false
            }
          }
        }

        loadUrl(url)
        onWebViewCreated(this)
      }
    },
    update = { webView ->
      // 目标地址变化时（例如重试）重新加载
      if (webView.url == null) {
        webView.loadUrl(url)
      }
    }
  )
}

@Composable
fun ErrorStateScreen(
  onRetry: () -> Unit,
  modifier: Modifier = Modifier
) {
  Surface(
    modifier = modifier.testTag("error_screen"),
    color = MaterialTheme.colorScheme.background
  ) {
    Column(
      modifier = Modifier
        .fillMaxSize()
        .padding(32.dp),
      horizontalAlignment = Alignment.CenterHorizontally,
      verticalArrangement = Arrangement.Center
    ) {
      Box(
        modifier = Modifier
          .size(80.dp)
          .clip(CircleShape)
          .background(MaterialTheme.colorScheme.errorContainer),
        contentAlignment = Alignment.Center
      ) {
        Icon(
          imageVector = Icons.Default.WifiOff,
          contentDescription = null,
          tint = MaterialTheme.colorScheme.onErrorContainer,
          modifier = Modifier.size(40.dp)
        )
      }

      Spacer(modifier = Modifier.height(24.dp))

      Text(
        text = stringResource(R.string.network_error_title),
        style = MaterialTheme.typography.titleLarge.copy(
          fontWeight = FontWeight.Bold
        ),
        color = MaterialTheme.colorScheme.onBackground
      )

      Spacer(modifier = Modifier.height(8.dp))

      Text(
        text = stringResource(R.string.network_error_msg),
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        textAlign = TextAlign.Center
      )

      Spacer(modifier = Modifier.height(32.dp))

      Button(
        onClick = onRetry,
        modifier = Modifier
          .height(48.dp)
          .testTag("retry_button"),
        colors = ButtonDefaults.buttonColors(containerColor = BrandBlue),
        shape = RoundedCornerShape(24.dp)
      ) {
        Icon(
          imageVector = Icons.Default.Refresh,
          contentDescription = null,
          modifier = Modifier.size(18.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(text = stringResource(R.string.retry_button))
      }
    }
  }
}
