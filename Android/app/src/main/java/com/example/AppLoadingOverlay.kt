package com.example

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
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
 * 这里是**覆盖在 WebView 之上**的半透明磨砂遮罩，用于网页点击卡片后
 * 等待目标站点打开的过程。
 *
 * 用原生而非网页内遮罩的原因见 [WebBridge] 的注释。
 *
 * 层级由调用方在 `Box` 中靠声明顺序决定：放在 WebView 之后即盖在其上。
 */
@Composable
fun AppLoadingOverlay(
  visible: Boolean,
  label: String,
  modifier: Modifier = Modifier,
) {
  AnimatedVisibility(
    visible = visible,
    enter = fadeIn(),
    exit = fadeOut(),
    modifier = modifier,
  ) {
    Box(
      // 半透明白 + 轻微模糊感：既遮住底层内容，又暗示「还在这个应用里」
      modifier = Modifier
        .fillMaxSize()
        .background(Color.White.copy(alpha = 0.92f))
        .testTag("app_loading_overlay"),
      contentAlignment = Alignment.Center,
    ) {
      Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
      ) {
        CircularProgressIndicator(
          color = BrandBlue,
          strokeWidth = 3.dp,
          modifier = Modifier.size(36.dp),
        )
        Spacer(modifier = Modifier.height(16.dp))
        Surface(
          color = Color.Transparent,
          shape = RoundedCornerShape(8.dp),
        ) {
          Text(
            text = label,
            color = Color(0xFF4B5563),
            fontSize = 15.sp,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.padding(horizontal = 16.dp),
          )
        }
      }
    }
  }
}
