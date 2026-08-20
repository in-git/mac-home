import type { AgentToolParam } from '../types';
import { basePetActions } from './baseActions';

export { EVENT } from './baseActions';

/** 行为执行结果 */
export interface PetActionResult {
  ok: boolean;
  message: string;
}

/** 行为类型：base 基础（单原子动作）/ expression 表达（组合多个基础行为） */
export type PetActionType = 'base' | 'expression';

/**
 * 单个角色行为定义。
 * 字段同时兼容 AgentTool（name/title/description/parameters），便于自动生成工具。
 */
export interface PetAction {
  /** 行为类型：base（基础）/ expression（表达组合） */
  type: PetActionType;
  /** 工具名，与 skill.json action.name 一致，如 'pet_speak' */
  name: string;
  /** 对应派发的 window 事件名，与 skill.json action.event 一致 */
  event: string;
  /** 行为标题 */
  title: string;
  /** 行为描述 */
  description: string;
  /** 参数 schema（复用 AgentToolParam，与工具层完全一致），供工具生成与 AI 调用 */
  parameters: Record<string, AgentToolParam>;
  /** 执行行为：接收参数对象，派发事件并返回结果 */
  run: (args: Record<string, unknown>) => PetActionResult;
}

/**
 * 角色行为注册表（聚合）：基础行为 + 组动作。
 * 基础行为在 baseActions.ts 追加；组动作 pet_perform 亦在其中。
 * tools.ts 的 petTools 与 skill.json 会自动与之对齐，无需在多处重复维护。
 */
export const petActions: PetAction[] = [...basePetActions];
