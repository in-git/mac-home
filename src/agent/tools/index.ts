import type { AgentTool } from '../types';
import { systemSettingsTools } from './systemSettings';

/**
 * 工具注册表：新增 AI 功能模块时，在此把模块的 tools 数组合并进来即可，
 * 上层 executeAgentTool 会自动识别，无需改动其它代码。
 */
export const AGENT_TOOLS: AgentTool[] = [...systemSettingsTools];

export { systemSettingsTools } from './systemSettings';
