import { Download, ShieldCheck } from 'lucide-react';
import React from 'react';
import { isInAppContainer } from '../../../utils/appBridge';

/**
 * 侧边栏底部：App 下载入口 + 备案信息。
 * 整体采用苹果「设置」分组风格：细分隔线 + 次级灰文本，备案区不再使用黑底块。
 *
 * 「我的数据」统计入口已移除（连同 StatsPage / statItems / useSiteStats）。
 */
export const SidebarFooter: React.FC = () => {
  /**
   * 已经在 App 里时不展示下载入口：
   * 用户此刻就身处 App 中，再给一个「下载 App」是自相矛盾的。
   * 判断用 `isInAppContainer()`（桥接 或 Android WebView UA 二选其一命中），
   * 这样没内置桥接的旧版 APK 也能正确隐藏。
   */
  const inApp = isInAppContainer();

  return (
    <div className="shrink-0 border-t border-black/[0.06] dark:border-white/[0.08]">
      {/* 专属 App 下载入口：仅在非 App 环境（浏览器）展示 */}
      {!inApp && (
        <div className="border-t border-black/[0.06] px-2 py-2 dark:border-white/[0.08]">
          <a
            href="/app-v1.0.apk"
            download="app-v1.0.apk"
            className="flex items-center justify-center gap-1.5 rounded-lg bg-[color:var(--accent)] px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[color:var(--accent-hover)]"
          >
            <Download size={15} className="shrink-0" />
            <span>专属app</span>
          </a>
        </div>
      )}

      {/* 备案信息：苹果次级文本风格 */}
      <div className="space-y-1 border-t border-black/[0.06] text-xs px-4 py-3 dark:border-white/[0.08]">
        <a
          href="https://beian.mps.gov.cn/#/query/webSearch?code=44011202003613"
          target="_blank"
          rel="noopener noreferrer"
          title="粤公网安备44011202003613号"
          className="group flex items-center gap-1.5  leading-relaxed text-[#86868B] transition-colors hover:text-[color:var(--accent)] dark:text-[#98989D]"
        >
          <ShieldCheck size={13} className="shrink-0" />
          <span className="truncate group-hover:underline">
            粤公网安备44011202003613号
          </span>
        </a>
        <p className=" leading-relaxed text-[#A1A1A6] dark:text-[#6E6E73]">
          © {new Date().getFullYear()} 吴文龙的个人主页
        </p>
      </div>
    </div>
  );
};

export default SidebarFooter;
