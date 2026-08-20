/**
 * 桌宠对话框：统一由「配置」驱动，分两种模式：
 * - base 基础对话：单条文本气泡，展示指定时长后自动隐藏（默认 5 秒）。
 * - game 文字游戏式对话：多行逐句推进（点击/回车继续），行尾可挂选择按钮（确定/取消等）。
 *
 * 任何入口（AI 行为、自由活动、UI）只需通过 dispatchPetDialog(config) 派发配置，
 * RoleDialog 组件会据此渲染对应模式，无需关心具体实现。
 */

/** 单行文本（文字游戏模式用） */
export interface DialogLine {
  text: string;
  /** 行尾可选按钮，如「确定」「取消」；不配置则整行可点击继续。 */
  choices?: DialogChoice[];
}

/** 对话选择按钮 */
export interface DialogChoice {
  label: string;
  /** 选中后执行的副作用（可选）；默认由调用方通过事件回调处理。 */
  action?: 'continue' | 'close' | string;
  closeAfter?: boolean;
}

/** 文字游戏式对话配置 */
export interface GameDialogConfig {
  mode: 'game';
  /** 逐句推进的文本行 */
  lines: DialogLine[];
  /** 角色名前缀（可选） */
  roleName?: string;
}

/** 基础对话配置 */
export interface BaseDialogConfig {
  mode: 'base';
  text: string;
  /** 展示时长（毫秒），默认 5000 */
  duration?: number;
  /** 是否在文案前拼上角色名（默认 true） */
  showRoleName?: boolean;
  roleName?: string;
}

/** 统一对话配置（两种模式共用） */
export type RoleDialogConfig = BaseDialogConfig | GameDialogConfig;

/** 对话框派发事件名（RoleDialog 组件监听此事件渲染） */
export const ROLE_DIALOG_EVENT = 'role-dialog-open';

/** 对话框关闭事件名（由 RoleDialog 派发，调用方可选监听） */
export const ROLE_DIALOG_CLOSE_EVENT = 'role-dialog-close';

/**
 * 派发一段对话。任何入口调用此函数即可弹出对应的对话框：
 * 基础对话：dispatchPetDialog({ mode: 'base', text: '你好呀～' })
 * 文字游戏：dispatchPetDialog({
 *   mode: 'game',
 *   lines: [
 *     { text: '要和我一起玩吗？' },
 *     { text: '确认加入冒险吗？', choices: [
 *       { label: '确定' },
 *       { label: '取消' },
 *     ]},
 *   ],
 * })
 */
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

/** 随机网页的自言自语台词池（基础对话示例） */
export const IDLE_SPEECH: RoleDialogConfig[] = [
  { mode: 'base', text: '发呆中…' },
  { mode: 'base', text: '今天天气不错呀～' },
  { mode: 'base', text: '要不要来点音乐？' },
  { mode: 'base', text: '嗯…刚才想到一件事' },
  { mode: 'base', text: '偷偷打个盹' },
  { mode: 'base', text: '在等你来找我玩呢' },
  { mode: 'base', text: '我是你的桌面小伙伴！' },
  { mode: 'base', text: '好无聊，动一动吧' },
];

/** 打招呼对话（进入页面时展示，文字游戏式示例：逐句 + 确认/取消） */
export const GREETING_DIALOG: RoleDialogConfig = {
  mode: 'game',
  lines: [
    { text: '欢迎回来～今天也想我了吗？' },
    {
      text: '要不要一起玩个小游戏？',
      choices: [
        { label: '确定', action: 'continue' },
        { label: '取消', action: 'close', closeAfter: true },
      ],
    },
    { text: '好嘞！那我们开始吧！' },
  ],
};

/** 问候后的简短反馈（基础对话示例） */
export const THANKS_DIALOG: RoleDialogConfig = {
  mode: 'base',
  text: '谢谢你的陪伴～',
};
