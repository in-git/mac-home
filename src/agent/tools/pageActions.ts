import type { AgentTool } from '../types';

/**
 * 页面级操作工具：
 * - refresh_page：刷新当前页面
 * - open_link：打开指定的网址链接
 */

const refreshPageTool: AgentTool = {
  name: 'refresh_page',
  description: '刷新当前页面（重新加载主页）。',
  parameters: {},
  run: () => {
    window.location.reload();
    return { ok: true, tool: 'refresh_page', message: '正在刷新页面。' };
  },
};

const openLinkTool: AgentTool = {
  name: 'open_link',
  description: '在新标签页中打开指定的网址链接。',
  parameters: {
    url: {
      type: 'string',
      description: '要打开的网址，例如 https://www.google.com。',
      required: true,
    },
    newTab: {
      type: 'boolean',
      description: '是否在新标签页打开，默认 true；false 则在当前页跳转。',
      required: false,
    },
  },
  run: (args) => {
    const raw = args.url;
    if (typeof raw !== 'string' || !raw.trim()) {
      return {
        ok: false,
        tool: 'open_link',
        message: '参数 url 必须是合法的网址字符串。',
      };
    }
    const url = /^https?:\/\//i.test(raw.trim())
      ? raw.trim()
      : `https://${raw.trim()}`;
    if (args.newTab === false) {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener');
    }
    return { ok: true, tool: 'open_link', message: `正在打开链接 ${url}。` };
  },
};

/** 本模块导出的页面级操作 AI 工具 */
export const pageActionTools: AgentTool[] = [refreshPageTool, openLinkTool];
