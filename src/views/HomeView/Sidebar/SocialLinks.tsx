import React from 'react';

/** 社交账号入口 */
export interface SocialLink {
  /** 平台名，同时作为无障碍标签 */
  name: string;
  href: string;
  /** 卡片底色（品牌色）+ 悬停态，用于并排卡片 */
  bgClass: string;
  /**
   * 纯品牌底色（不含 hover），用于列表项图标等只需静态底色的场景。
   * 与 bgClass 分开而非从中截取，避免依赖类名字符串顺序。
   */
  bgSolidClass: string;
  /** 品牌图标工厂：按卡片尺寸生成不同大小的图标 */
  renderIcon: (size: number) => React.ReactNode;
}

/** B 站标志图标（lucide 无品牌图标，用官方轮廓手绘） */
const BilibiliIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {/* 电视头轮廓 */}
    <rect x="2.5" y="6.5" width="19" height="14" rx="3" />
    {/* 天线 */}
    <path d="M7 3.5 10 6.5" />
    <path d="M17 3.5 14 6.5" />
    {/* 两只眼睛 */}
    <path d="M9 11.5v2" />
    <path d="M15 11.5v2" />
  </svg>
);

/** 抖音标志图标（音符轮廓） */
const DouyinIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M16.6 2h-3.1v13.2a2.5 2.5 0 1 1-2.5-2.5c.17 0 .34.02.5.05V9.6a5.7 5.7 0 0 0-.5-.02 5.6 5.6 0 1 0 5.6 5.6V8.9a6.9 6.9 0 0 0 4.1 1.33V7.1a3.9 3.9 0 0 1-3.9-3.9V2z" />
  </svg>
);

/**
 * B 站：官方粉 `#FB7299`。
 * 饱和度较高，白字在其上对比度充足，无需额外描边。
 */
const BILIBILI: SocialLink = {
  name: '哔哩哔哩',
  href: 'https://space.bilibili.com/3706965849016893',
  bgClass: 'bg-[#FB7299] hover:bg-[#FA5A88]',
  bgSolidClass: 'bg-[#FB7299]',
  renderIcon: (size) => <BilibiliIcon size={size} />,
};

/**
 * 抖音：官方主色为黑（`#000`），品牌辨识靠图标本身的青红霓虹。
 * 这里用近黑 `#161823`（抖音官方暗色），比纯黑在浅色背景上层次更稳。
 */
const DOUYIN: SocialLink = {
  name: '抖音',
  href: 'https://www.douyin.com/user/MS4wLjABAAAANF0kIN2qpFT2Bcq0Q2ZVZRjlazE7KnNAvDHyk7ePFzhHJCJFgu8ot7srJoO0aqvc',
  bgClass: 'bg-[#161823] hover:bg-[#2B2B33]',
  bgSolidClass: 'bg-[#161823]',
  renderIcon: (size) => <DouyinIcon size={size} />,
};

/** 全部社交账号（「关于我」弹窗的列表数据源与此共用） */
export const SOCIAL_LINKS: SocialLink[] = [BILIBILI, DOUYIN];

/**
 * 社交账号入口：B 站 + 抖音，并排两张品牌色卡片。
 *
 * 目前只在桌面端左侧栏底部使用（移动端改为「关于我」弹窗内的列表）。
 * 卡片只显示品牌图标 + 平台名，整卡可点击并新标签页打开。
 */
export const SocialLinks: React.FC = () => (
  <div className="flex gap-2">
    {SOCIAL_LINKS.map((link) => (
      <a
        key={link.name}
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        title={link.name}
        aria-label={link.name}
        className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors ${link.bgClass}`}
      >
        <span className="shrink-0">{link.renderIcon(18)}</span>
        <span className="truncate">{link.name}</span>
      </a>
    ))}
  </div>
);

export default SocialLinks;
