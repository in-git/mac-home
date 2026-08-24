import { useEffect } from 'react';
import type { AgentToolParam } from '../types';
import { dispatchPetDialog, ROLE_CLICK_DIALOG } from './dialog';


/** 行为执行结果 */
export interface PetActionResult {
  ok: boolean;
  message: string;
}

/** 行为类型：base 基础（单原子动作）/ expression 表达（组合多个基础行为） */
type PetActionType = 'base' | 'expression';

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

/** 桌宠事件名 —— 行为清单中 event 字段的唯一来源。 */
export const EVENT = {
  speak: 'role-dialog-speak',
  move: 'role-move',
  jump: 'role-jump',
  reset: 'role-reset',
  celebrate: 'role-celebrate',
  dialog: 'role-dialog-open',
  thinkingStart: 'role-thinking-start',
  thinkingEnd: 'role-thinking-end',
} as const;


// 进入页面打招呼只触发一次（module 级 flag，StrictMode 双挂载下也只会发起一次）
let greetingDispatchedRef = false;

/**
 * 进入页面时显示欢迎对话框。
 * 保留 hook 签名以保证调用处（App）无需改动。
 */
export function useGreeting() {
  useEffect(() => {
    if (greetingDispatchedRef) return;
    greetingDispatchedRef = true;

    // 延迟 500ms 显示，避免页面刚加载时立即弹出
    setTimeout(() => {
      dispatchPetDialog(ROLE_CLICK_DIALOG);
    }, 500);
  }, []);
}
