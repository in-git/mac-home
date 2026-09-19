import { Download, ShieldCheck } from 'lucide-react';
import React from 'react';
import { isInAppContainer } from '../../../utils/appBridge';

/** 卡片外壳：统一移动端底部小卡片的边框 / 圆角 / 底色 */
const CARD_SHELL =
  'rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-white/5';

/**
 * 专属 App 下载入口卡片。
 *
 * 已经在 App 里时不展示：
 * 用户此刻就身处 App 中，再给一个「下载 App」是自相矛盾的。
 * 判断用 `isInAppContainer()`（桥接 或 Android WebView UA 二选一命中），
 * 这样没内置桥接的旧版 APK 也能正确隐藏。
 *
 * `card` 为 true 时自带卡片外壳（移动端底部独立成卡）；
 * 为 false 时只渲染内容（桌面侧栏内嵌，由父级容器负责分隔线与内边距）。
 */
export const AppDownloadEntry: React.FC<{ card?: boolean }> = ({ card = false }) => {
  if (isInAppContainer()) return null;

  return (
    <div className={card ? `${CARD_SHELL} p-2` : 'border-t border-black/[0.06] px-2 py-2 dark:border-white/[0.08]'}>
      <a
        href="/app-v1.0.apk"
        download="app-v1.0.apk"
        className="flex items-center justify-center gap-1.5 rounded-lg bg-[color:var(--accent)] px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[color:var(--accent-hover)]"
      >
        <Download size={15} className="shrink-0" />
        <span>专属app</span>
      </a>
    </div>
  );
};

/**
 * 备案信息卡片：苹果次级文本风格（细分隔线 + 次级灰文本）。
 *
 * `card` 语义同 AppDownloadEntry。
 */
export const RecordInfo: React.FC<{ card?: boolean }> = ({ card = false }) => (
  <div
    className={
      card
        ? `${CARD_SHELL} space-y-1 px-3 py-2.5 text-xs`
        : 'space-y-1 border-t border-black/[0.06] px-4 py-3 text-xs dark:border-white/[0.08]'
    }
  >
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
);

/**
 * 侧边栏底部：App 下载入口 + 备案信息。
 * 整体采用苹果「设置」分组风格：细分隔线 + 次级灰文本，备案区不再使用黑底块。
 *
 * 「我的数据」统计入口已移除（连同 StatsPage / statItems / useSiteStats）。
 */
export const SidebarFooter: React.FC = () => (
  <div className="shrink-0 border-t border-black/[0.06] dark:border-white/[0.08]">
    <AppDownloadEntry />
    <RecordInfo />
  </div>
);

export default SidebarFooter;
