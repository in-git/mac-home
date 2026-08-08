import type { AgentTool } from '../types';
import { generalChatTool } from './generalChat';
import { pageActionTools } from './pageActions';
import { scheduledTaskTools } from './scheduledTask';
import { systemSettingsTools } from './systemSettings';
import { stickyNoteTools } from './stickyNotes';

/**
 * 工具注册表：新增 AI 功能模块时，在此把模块的 tools 数组合并进来即可，
 * 上层 executeAgentTool 会自动识别，无需改动其它代码。
 */
export const AGENT_TOOLS: AgentTool[] = [
  ...systemSettingsTools,
  ...scheduledTaskTools,
  ...pageActionTools,
  ...stickyNoteTools,
  generalChatTool,
];

export { generalChatTool } from './generalChat';
export { pageActionTools } from './pageActions';
export { scheduledTaskTools } from './scheduledTask';
export { systemSettingsTools } from './systemSettings';
export { stickyNoteTools } from './stickyNotes';
