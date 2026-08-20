import type { AgentToolParam } from '../types';
import {
  dispatchPetDialog,
  type GameDialogConfig,
  type RoleDialogConfig,
} from './dialog';

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

/** 桌宠事件名 —— 行为清单中 event 字段的唯一来源。 */
export const EVENT = {
  speak: 'role-dialog-speak',
  move: 'role-move',
  jump: 'role-jump',
  reset: 'role-reset',
  celebrate: 'role-celebrate',
  dialog: 'role-dialog-open',
} as const;

/**
 * 桌宠事件分发助手。
 * 工具层与桌宠组件（RoleCharacterCanvas）通过 window CustomEvent 解耦通信：
 * 工具层只负责分发事件，桌宠组件监听对应事件并驱动 Pixi 渲染/物理循环。
 * 事件名字符串集中在 EVENT 常量中定义，作为唯一来源。
 */
export function dispatchPetEvent(
  name: string,
  detail?: Record<string, unknown>,
): void {
  window.dispatchEvent(new CustomEvent(name, { detail: detail ?? {} }));
}

/**
 * 基础行为（type: 'base'）：单一、原子的桌宠动作。
 * 每个行为派发一个独立事件（说话/移动/跳跃/重置/庆祝/对话框），由角色组件监听执行。
 */
const coreBasePetActions: PetAction[] = [
  {
    type: 'base',
    name: 'pet_notify',
    event: EVENT.speak,
    title: '让桌宠通知用户',
    description: '让桌面宠物向用户传递信息（在其头顶弹出对话气泡，定时自动消失）。',
    parameters: {
      text: { type: 'string', description: '要传递的信息内容', required: true },
      duration: {
        type: 'number' as const,
        description: '气泡展示时长（毫秒），默认 5000',
        required: false,
      },
    },
    run: (args) => {
      const text = String(args.text ?? '').trim();
      if (!text) return { ok: false, message: '通知内容不能为空。' };
      const duration = Number(args.duration) || undefined;
      dispatchPetEvent(EVENT.speak, { text, duration });
      return { ok: true, message: `桌宠已通知用户：「${text}」` };
    },
  },
  {
    type: 'base',
    name: 'pet_confirm',
    event: EVENT.dialog,
    title: '让桌宠向用户确认信息',
    description: '让桌面宠物向用户确认某些信息，弹出带确认/取消按钮的对话框。',
    parameters: {
      text: { type: 'string', description: '需要确认的信息内容', required: true },
      confirmLabel: {
        type: 'string' as const,
        description: '确认按钮文字，默认"确定"',
        required: false,
      },
      cancelLabel: {
        type: 'string' as const,
        description: '取消按钮文字，默认"取消"',
        required: false,
      },
    },
    run: (args) => {
      const text = String(args.text ?? '').trim();
      if (!text) return { ok: false, message: '确认内容不能为空。' };
      const confirmLabel = String(args.confirmLabel ?? '确定').trim();
      const cancelLabel = String(args.cancelLabel ?? '取消').trim();
      
      const config: RoleDialogConfig = {
        mode: 'game',
        lines: [
          {
            text,
            choices: [
              { label: confirmLabel, action: 'close' },
              { label: cancelLabel, action: 'close' },
            ],
          },
        ],
      };
      dispatchPetDialog(config);
      return { ok: true, message: `桌宠已向用户确认：「${text}」` };
    },
  },
  {
    type: 'base',
    name: 'pet_move',
    event: EVENT.move,
    title: '让桌宠移动',
    description:
      '让桌面宠物向左或向右移动。direction 必填（left 或 right）；可传 distance（像素）或 duration（毫秒）。',
    parameters: {
      direction: {
        type: 'string' as const,
        description: '移动方向：left 或 right',
        required: true,
        enum: ['left', 'right'],
      },
      distance: {
        type: 'number' as const,
        description: '移动距离（像素），默认 200',
        required: false,
      },
      duration: {
        type: 'number' as const,
        description: '移动持续时间（毫秒），不传时按 distance 估算',
        required: false,
      },
    },
    run: (args) => {
      const direction =
        args.direction === 'left' || args.direction === 'right'
          ? (args.direction as 'left' | 'right')
          : null;
      if (!direction) {
        return { ok: false, message: 'direction 只能是 left 或 right。' };
      }
      let duration: number;
      if (typeof args.duration === 'number' && args.duration > 0) {
        duration = args.duration;
      } else {
        const distance =
          typeof args.distance === 'number' && args.distance > 0
            ? args.distance
            : 200;
        duration = Math.round((distance / 300) * 1000); // 约 300px/s
      }
      duration = Math.max(100, Math.min(8000, Math.round(duration)));
      dispatchPetEvent(EVENT.move, { direction, duration });
      return {
        ok: true,
        message: `桌宠正在向${direction === 'left' ? '左' : '右'}移动（约 ${duration} 毫秒）。`,
      };
    },
  },
  {
    type: 'base',
    name: 'pet_jump',
    event: EVENT.jump,
    title: '让桌宠跳跃',
    description: '让桌面宠物跳起来，可指定是否二段跳（double）。',
    parameters: {
      double: {
        type: 'boolean' as const,
        description: '是否二段跳，默认 false',
        required: false,
      },
    },
    run: (args) => {
      const double = args.double === true;
      dispatchPetEvent(EVENT.jump, { double });
      return { ok: true, message: `桌宠${double ? '二段跳' : '跳跃'}中。` };
    },
  },
  {
    type: 'base',
    name: 'pet_reset',
    event: EVENT.reset,
    title: '重置桌宠位置',
    description: '让桌面宠物回到屏幕中央底部并停止当前动作。',
    parameters: {},
    run: () => {
      dispatchPetEvent(EVENT.reset, {});
      return { ok: true, message: '桌宠已回到屏幕中央底部。' };
    },
  },
  {
    type: 'base',
    name: 'pet_celebrate',
    event: EVENT.celebrate,
    title: '让桌宠庆祝',
    description:
      '让桌面宠物播放庆祝动画（celebration 帧序列），固定连续播放 2 次后回退 idle（按次数，不按时长）。',
    parameters: {
      count: {
        type: 'number' as const,
        description: '庆祝动作播放次数，固定为 2，一般无需修改',
        required: false,
      },
    },
    run: (args) => {
      const count =
        typeof args.count === 'number' && args.count > 0 ? Math.round(args.count) : 2;
      dispatchPetEvent(EVENT.celebrate, { count });
      return { ok: true, message: `桌宠正在庆祝（连续 ${count} 次）。` };
    },
  },
  {
    type: 'base',
    name: 'pet_dialog',
    event: EVENT.dialog,
    title: '弹出桌宠对话框',
    description:
      '让桌宠弹出对话框。支持两种模式：base 基础对话（单条气泡，定时隐藏）或 game 文字游戏式对话（多行逐句推进，支持点击继续与确定/取消按钮）。',
    parameters: {
      mode: {
        type: 'string' as const,
        description: '基本对话框，当你需要与用户沟通，想传递信息给用户，则使用这个对话框',
        required: true,
        enum: ['base', 'game'],
      },
      text: {
        type: 'string' as const,
        description: '基础对话的文本内容（mode=base 时必填）',
        required: false,
      },
      duration: {
        type: 'number' as const,
        description: '基础对话展示时长（毫秒），默认 5000',
        required: false,
      },
      lines: {
        type: 'string' as const,
        description:
          '文字游戏式对话的台词 JSON 字符串（mode=game 时必填）。格式：[{"text":"内容"},{"text":"内容","choices":[{"label":"确定"},{"label":"取消"}]}]',
        required: false,
      },
    },
    run: (args) => {
      const mode = args.mode === 'game' ? 'game' : 'base';
      if (mode === 'base') {
        const text = String(args.text ?? '').trim();
        if (!text) return { ok: false, message: '基础对话的 text 不能为空。' };
        const duration =
          typeof args.duration === 'number' && args.duration > 0
            ? args.duration
            : undefined;
        const config: RoleDialogConfig = { mode: 'base', text, duration };
        dispatchPetDialog(config);
        return { ok: true, message: `桌宠已弹出对话框：「${text}」` };
      }
      // game 模式：解析 lines JSON
      let lines: GameDialogConfig['lines'];
      try {
        const parsed = JSON.parse(String(args.lines ?? '[]'));
        if (!Array.isArray(parsed) || parsed.length === 0) {
          return { ok: false, message: '文字游戏式对话的 lines 必须是至少一项的数组。' };
        }
        lines = parsed as GameDialogConfig['lines'];
      } catch {
        return { ok: false, message: 'lines 必须是合法的 JSON 字符串。' };
      }
      const config: RoleDialogConfig = { mode: 'game', lines };
      dispatchPetDialog(config);
      return { ok: true, message: `桌宠已弹出文字游戏式对话框（${lines.length} 句）。` };
    },
  },
];

/**
 * 组动作 pet_perform：大模型一次提交一整组基础动作，按顺序执行。
 * actions 兼容两种形态：
 *   - JSON 字符串：'[{"name":"pet_celebrate"},{"name":"pet_speak","args":{"text":"你好呀～"}}]'
 *   - 数组对象：[{ name: 'pet_celebrate' }, { name: 'pet_speak', args: { text: '你好呀～' } }]
 */
const petPerformAction: PetAction = {
  type: 'expression',
  name: 'pet_perform',
  event: 'role-perform',
  title: '执行一组桌宠行为',
  description:
    '依次执行一组基础动作。actions 是动作数组（或其 JSON 字符串），元素格式：{"name":"动作名","args":{参数}}，按顺序执行。',
  parameters: {
    actions: {
      type: 'string' as const,
      description:
        '一组动作的数组（JSON 字符串或数组），元素为 {name, args?}，name 必须是基础动作清单中的动作名',
      required: true,
    },
  },
  run: (args) => {
    let list: unknown = args.actions;
    if (typeof list === 'string') {
      try {
        list = JSON.parse(list);
      } catch {
        return { ok: false, message: 'actions 必须是合法的 JSON 数组字符串。' };
      }
    }
    if (!Array.isArray(list) || list.length === 0) {
      return { ok: false, message: 'actions 必须是至少包含一个动作的数组。' };
    }
    const coreMap: Record<string, PetAction> = Object.fromEntries(
      coreBasePetActions.map((a) => [a.name, a]),
    );
    const results: string[] = [];
    let allOk = true;
    for (const item of list) {
      const act = item as { name?: string; args?: Record<string, unknown> };
      const target = act?.name ? coreMap[act.name] : undefined;
      if (!target) {
        allOk = false;
        results.push(`未知动作：${act?.name ?? 'undefined'}`);
        continue;
      }
      const res = target.run(act.args ?? {});
      if (!res.ok) allOk = false;
      results.push(res.message);
    }
    return { ok: allOk, message: results.join('；') };
  },
};

/**
 * 角色行为注册表（聚合）：基础行为 + 组动作 pet_perform。
 * tools.ts 的 petTools 与 skill.json 会自动与之对齐，无需在多处重复维护。
 */
export const petActions: PetAction[] = [
  ...coreBasePetActions,
  petPerformAction,
];
