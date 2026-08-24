/**
 * 桌宠对话框：统一由「配置」驱动，分两种模式：
 * - base 基础对话：单条文本气泡，展示指定时长后自动隐藏（默认 5 秒）。
 * - game 文字游戏式对话：多行逐句推进（点击/回车继续），行尾可挂选择按钮（确定/取消等）。
 *
 * 任何入口（AI 行为、UI）只需通过 dispatchPetDialog(config) 派发配置，
 * RoleDialog 组件会据此渲染对应模式，无需关心具体实现。
 *
 * 类型定义已分离到 ./types，这里 re-export 以保持原有导入路径可用。
 */
export type {
  BaseDialogConfig,
  DialogChoice,
  DialogLine,
  GameDialogConfig,
  MenuDialogConfig,
  MenuOption,
  RoleDialogConfig,
} from './types';
import type { RoleDialogConfig } from './types';

/** 对话框派发事件名（RoleDialog 组件监听此事件渲染） */
export const ROLE_DIALOG_EVENT = 'role-dialog-open';

/** 对话框关闭事件名（由 RoleDialog 派发，调用方可选监听） */
export const ROLE_DIALOG_CLOSE_EVENT = 'role-dialog-close';


export function dispatchPetDialog(config: RoleDialogConfig): void {
  window.dispatchEvent(new CustomEvent(ROLE_DIALOG_EVENT, { detail: config }));
}

/** 派发「关闭当前对话框」事件 */
export function closeRoleDialog(): void {
  window.dispatchEvent(new CustomEvent(ROLE_DIALOG_CLOSE_EVENT));
}

/* ------------------------------------------------------------------ */
/* 以下为对话框预设配置：所有对话统一在此声明，供事件入口引用。          */
/* 新增对话只需在此追加一项配置即可复用 RoleDialog 的渲染能力。          */
/* ------------------------------------------------------------------ */



/** 点击角色时弹出的欢迎对话（文字游戏式：逐句点击继续，5s 后自动关闭） */
export const ROLE_CLICK_DIALOG: RoleDialogConfig = {
  mode: 'game',
  duration: 5000,
  lines: [
    { text: '你好啊，我是柳如烟' },
    { text: '点我可以看到更多功能' },
  ],
};

/** 点击角色时弹出的帮助对话（文字游戏式，与欢迎对话界面统一） */
export const HELP_MENU_DIALOG: RoleDialogConfig = {
  mode: 'game',
  lines: [
    {
      text: '我能帮助你吗？',
      choices: [
        {
          label: '这个页面是干什么的',
          onClick() {
            
            dispatchPetDialog({
              mode: 'base',
              text: '这是一个专门收录奇奇怪怪的网页的网页～',
              duration: 6000,
            });
          }
        },
        {
          label: '柳如烟有哪些玩法？',
          onClick() {
            dispatchPetDialog({
              mode: 'base',
              text: '按方向键移动，支持二级跳',
              duration: 6000,
            });
          }
        },
        {
          label: '如何自定义桌宠',
          onClick() {
            window.dispatchEvent(
              new CustomEvent(ROLE_DIALOG_ACTION_EVENT, {
                detail: { modal: 'settings' },
              }),
            );
          }
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* 跨组件副作用派发事件                                                */
/* ------------------------------------------------------------------ */

/**
 * 选项副作用派发事件名：由配置方在 onClick 中按需派发，App 统一监听后
 * 处理 modal / navigate / action 等需要跨组件协作的副作用。
 */
export const ROLE_DIALOG_ACTION_EVENT = 'role-dialog-action';
