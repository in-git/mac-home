import { dispatchPetEvent, PetAction } from './index';
import {
  dispatchPetDialog,
  type GameDialogConfig,
  type RoleDialogConfig,
} from './dialog';

/**
 * 基础行为（type: 'base'）：单一、原子的桌宠动作。
 * 每个行为派发一个独立事件（说话/移动/跳跃/重置/庆祝/对话框），由角色组件监听执行。
 */

/** 桌宠事件名 —— 行为清单中 event 字段的唯一来源。 */
export const EVENT = {
  speak: 'role-dialog-speak',
  move: 'role-move',
  jump: 'role-jump',
  reset: 'role-reset',
  celebrate: 'role-celebrate',
  dialog: 'role-dialog-open',
} as const;

/** 核心基础动作（不含 pet_perform，作为其可组合元素池） */
const coreBasePetActions: PetAction[] = [
  {
    type: 'base',
    name: 'pet_speak',
    event: EVENT.speak,
    title: '让桌宠说话',
    description: '让桌面宠物说一句话（在其头顶弹出对话气泡，展示约 5 秒）。',
    parameters: {
      text: { type: 'string', description: '要说的内容', required: true },
      duration: {
        type: 'number' as const,
        description: '气泡展示时长（毫秒），默认 5000',
        required: false,
      },
    },
    run: (args) => {
      const text = String(args.text ?? '').trim();
      if (!text) return { ok: false, message: '说话内容不能为空。' };
      const duration = Number(args.duration) || undefined;
      dispatchPetEvent(EVENT.speak, { text, duration });
      return { ok: true, message: `桌宠已说话：「${text}」` };
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


/** 基础行为注册表（含组动作 pet_perform） */
export const basePetActions: PetAction[] = [
  ...coreBasePetActions,
];
