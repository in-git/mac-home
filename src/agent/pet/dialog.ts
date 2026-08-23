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
  /** 显示模式：normal-普通对话 | monologue-内心独白 | system-系统消息 */
  displayMode?: 'normal' | 'monologue' | 'system';
}

/** 对话选择按钮选中后要触发的「效果」 */

/** 1) 气泡对话：弹出一个基础气泡 */
export interface ChoiceEffectBubble {
  type: 'bubble';
  text: string;
  /** 展示时长（毫秒），默认 5000 */
  duration?: number;
  /** 气泡前的角色名（默认用当前角色） */
  roleName?: string;
  /** 是否在文案前拼上角色名（默认 true） */
  showRoleName?: boolean;
}

/** 2) 跳转：打开链接 / 路由 */
export interface ChoiceEffectNavigate {
  type: 'navigate';
  /** 目标地址；external=false 时为应用内路由（如 '#/about'），true 时为外链 */
  url: string;
  external?: boolean;
}

/** 3) 打开模态框 */
export type ChoiceModalName =
  | 'settings'
  | 'addWidget'
  | 'wallpaper';
export interface ChoiceEffectModal {
  type: 'modal';
  /** 要打开的模态框 */
  name: ChoiceModalName;
}

/** 4) 执行一个已注册的功能命令（由 App 监听 role-dialog-action 事件处理） */
export interface ChoiceEffectAction {
  type: 'action';
  /** 命令名，例如 'toggle-dark-mode' | 'open-settings-ai' 等 */
  command: string;
}

export type ChoiceEffect =
  | ChoiceEffectBubble
  | ChoiceEffectNavigate
  | ChoiceEffectModal
  | ChoiceEffectAction;

/** 对话选择按钮 */
export interface DialogChoice {
  label: string;
  /**
   * 选中后触发的副作用（支持的四种效果：气泡对话 / 跳转 / 打开模态框 / 执行功能）。
   * 配置全部集中在 dialog.ts，RoleDialog 统一解释执行。
   */
  effect?: ChoiceEffect;
  /** 选中后执行的副作用（旧式字符串 action，保留兼容）：'continue' 推进下一行、'close' 关闭、其他值会关闭对话框。 */
  action?: 'continue' | 'close' | string;
  /** 选中后是否关闭当前对话框（默认 true）。effect 为气泡对话时建议保持关闭，由气泡接管展示。 */
  closeAfter?: boolean;
}

/** 菜单选项（menu 模式用） */
export interface MenuOption {
  label: string;
  /** 选项的唯一标识，用于回调 */
  value: string;
}

/** 文字游戏式对话配置 */
export interface GameDialogConfig {
  mode: 'game';
  /** 逐句推进的文本行 */
  lines: DialogLine[];
  /** 角色名前缀（可选） */
  roleName?: string;
  /** 整段对话总展示时长（毫秒），到点自动关闭；不传则一直等待用户点击 */
  duration?: number;
  /** 打字机效果配置 */
  typewriter?: {
    enabled: boolean;
    speed?: number; // 每个字符间隔（毫秒），默认50
  };
  /** 配色方案：anime-二次元柔和版 | dark-悬疑暗黑版 */
  theme?: 'anime' | 'dark';
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

/** 菜单式对话配置（上方对话信息 + 下方可点击选项列表） */
export interface MenuDialogConfig {
  mode: 'menu';
  /** 上方的对话文本 */
  text: string;
  /** 下方的选项列表 */
  options: MenuOption[];
  /** 角色名前缀（可选） */
  roleName?: string;
  /** 整段对话总展示时长（毫秒），到点自动关闭；不传则一直等待用户点击 */
  duration?: number;
}

/** 统一对话配置（三种模式共用） */
export type RoleDialogConfig = BaseDialogConfig | GameDialogConfig | MenuDialogConfig;

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
          // 效果①：气泡对话
          effect: {
            type: 'bubble',
            text: '这是一个专门收录奇奇怪怪的网页的网页～',
            duration: 6000,
          },
        },
        {
          label: '有哪些玩法？',
          // 效果①：气泡对话（介绍玩法）
          effect: {
            type: 'bubble',
            text: '点我可以聊聊天、换壁纸，还能把奇奇怪怪的网页收藏成小组件～',
            duration: 6000,
          },
        },
        {
          label: '如何自定义桌宠',
          // 效果③：打开设置模态框
          effect: { type: 'modal', name: 'settings' },
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* 选项效果运行时支持：集中在此处，供 RoleDialog 调用。               */
/* ------------------------------------------------------------------ */

/** 选项副作用派发事件名（由 App 监听，处理 modal / navigate / action） */
export const ROLE_DIALOG_ACTION_EVENT = 'role-dialog-action';

/**
 * 统一执行一个选项的效果：
 * - bubble：直接派发一段基础气泡对话（RoleDialog 内部即可完成，无需跨组件）。
 * - navigate：外链用 window.open，应用内路由派发 action 事件交给 App 处理。
 * - modal / action：派发 ROLE_DIALOG_ACTION_EVENT 事件，由 App 统一监听处理。
 */
export function runChoiceEffect(effect: ChoiceEffect): void {
  switch (effect.type) {
    case 'bubble': {
      dispatchPetDialog({
        mode: 'base',
        text: effect.text,
        duration: effect.duration,
        roleName: effect.roleName,
        showRoleName: effect.showRoleName,
      });
      return;
    }
    case 'navigate': {
      if (effect.external) {
        window.open(effect.url, '_blank', 'noopener,noreferrer');
      } else {
        // 应用内路由也通过 action 事件交 App 处理（保持解耦）
        window.dispatchEvent(
          new CustomEvent(ROLE_DIALOG_ACTION_EVENT, {
            detail: { command: 'navigate', url: effect.url },
          }),
        );
      }
      return;
    }
    case 'modal':
    case 'action': {
      window.dispatchEvent(
        new CustomEvent(ROLE_DIALOG_ACTION_EVENT, {
          detail: effect.type === 'modal' ? { modal: effect.name } : { command: effect.command },
        }),
      );
      return;
    }
  }
}
