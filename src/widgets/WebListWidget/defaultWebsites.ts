import type { WebSite } from '../../types';

/** 网页列表组件在无自定义 websites 时展示的默认站点 */
export const DEFAULT_WEBSITES: WebSite[] = [
  { title: '百度', url: 'https://www.baidu.com' },
  { title: 'GitHub', url: 'https://github.com' },
  { title: '知乎', url: 'https://www.zhihu.com' },
  { title: 'B 站', url: 'https://www.bilibili.com' },
  { title: '微博', url: 'https://weibo.com' },
  { title: 'YouTube', url: 'https://www.youtube.com' },
];
