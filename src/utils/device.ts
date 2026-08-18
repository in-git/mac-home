/**
 * 设备/环境检测工具。
 */

/**
 * 是否为移动设备：常见移动端 UA，或触屏 + 窄屏（竖屏或横屏最小边 < 768）。
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const mobileUA =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const touchAndNarrow =
    typeof window !== 'undefined' &&
    'ontouchstart' in window &&
    Math.min(window.innerWidth, window.innerHeight) < 768;
  return mobileUA || touchAndNarrow;
}
