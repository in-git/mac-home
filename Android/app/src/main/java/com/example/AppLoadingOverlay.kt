package com.example

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.BrandBlue

/**
 * 全屏加载遮罩（原生实现）。
 *
 * 与首屏的 [LoadingScreen] 区别：那是启动时铺满整个屏幕的不透明页，
 * 这里是**覆盖在 WebView 之上**的半透明遮罩，用于网页点击卡片后
 * 等待目标站点打开的过程。
 *
 * 用原生而非网页内遮罩的原因见 [WebBridge] 的注释。
 *
 * ── 半透明背景 ────────────────────────────────────────
 * 背景采用 alpha 0.3 的黑色，让用户能透过遮罩看到底层 WebView 正在加载
 * 的内容（站点首屏往往已经能呈现大致结构），既保持阻断重复点击的能力，
 * 又不掩盖加载进度。
 *
 * ── 取消按钮 ──────────────────────────────────────────
 * 用户在等待不耐烦时可主动中断；具体行为（停止加载、回到原页面等）
 * 由调用方在 [onCancel] 中决定。本组件只负责 UI。
 *
 * 层级由调用方在 `Box` 中靠声明顺序决定：放在 WebView 之后即盖在其上。
 */
@Composable
fun AppLoadingOverlay(
  visible: Boolean,
  label: String,
  onCancel: () -> Unit,
  modifier: Modifier = Modifier,
) {
  AnimatedVisibility(
    visible = visible,
    enter = fadeIn(),
    exit = fadeOut(),
    modifier = modifier,
  ) {
    Box(
      // 半透明黑底：能看到 WebView 正在加载的内容，又能阻断重复点击
      modifier = Modifier
        .fillMaxSize()
        .background(Color.Black.copy(alpha = 0.3f))
        .testTag("app_loading_overlay"),
      contentAlignment = Alignment.Center,
    ) {
      Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp),
      ) {
        CircularProgressIndicator(
          color = BrandBlue,
          strokeWidth = 3.dp,
          modifier = Modifier.size(36.dp),
        )
        Surface(
          color = Color.Transparent,
          shape = RoundedCornerShape(8.dp),
        ) {
          Text(
            text = label,
            color = Color.White,
            fontSize = 15.sp,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.padding(horizontal = 16.dp),
          )
        }
        // 取消按钮：白底灰字 + 圆角，在黑色半透明背景上形成对比，容易识别
        Button(
          onClick = onCancel,
          colors = ButtonDefaults.buttonColors(
            containerColor = Color.White.copy(alpha = 0.92f),
            contentColor = Color(0xFF4B5563),
          ),
          shape = RoundedCornerShape(20.dp),
          modifier = Modifier.testTag("loading_cancel_button"),
        ) {
          Text(
            text = "取消",
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
          )
        }
      }
    }
  }
}