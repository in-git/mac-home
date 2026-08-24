/**
 * 桌宠对话框类型定义。
 * 与运行时逻辑（事件派发 / 预设配置）分离，便于在配置方与渲染方之间共享类型。
 */

/** 单行文本（文字游戏模式用） */
export interface DialogLine {
  text: string;
  /** 行尾可选按钮，如「确定」「取消」；不配置则整行可点击继续。 */
  choices?: DialogChoice[];
  /** 显示模式：normal-普通对话 | monologue-内心独白 | system-系统消息 */
  displayMode?: 'normal' | 'monologue' | 'system';
}

/** 对话选择按钮 */
export interface DialogChoice {
  label: string;
  /**
   * 选中后的回调：由配置方自行决定副作用（派发气泡 / 打开模态框 / 跳转等），
   * RoleDialog 仅负责调用并按 closeAfter 决定是否关闭/推进。
   */
  onClick: () => void;
  /** 选中后是否关闭当前对话框（默认 true）；置 false 则推进到下一行。 */
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
export type RoleDialogConfig =
  | BaseDialogConfig
  | GameDialogConfig
  | MenuDialogConfig;
