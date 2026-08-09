import { err, ok } from '../config/result';
import type { AgentTool, AgentToolCallResult } from '../types';
import { petJump, petMove, petReset, petSpeak } from './actions';

const PREFIX = 'pet_';

export const petSpeakTool: AgentTool = {
  name: `${PREFIX}speak`,
  title: '让桌宠说话',
  description: '让桌面宠物说一句话（在其头顶弹出对话气泡，展示约 5 秒）。',
  parameters: {
    text: { type: 'string', description: '要说的内容', required: true },
  },
  run: (args): AgentToolCallResult => {
    const text = typeof args.text === 'string' ? args.text : '';
    const res = petSpeak(text);
    return res.ok
      ? ok(PREFIX + 'speak', res.message)
      : err(PREFIX + 'speak', res.message);
  },
};

export const petMoveTool: AgentTool = {
  name: `${PREFIX}move`,
  title: '让桌宠移动',
  description:
    '让桌面宠物向左或向右移动一段距离。direction 必填（left 或 right）；' +
    '可传 distance（像素，默认 200）或 duration（毫秒），两者都传时以 duration 为准。',
  parameters: {
    direction: {
      type: 'string',
      description: '移动方向：left 或 right',
      enum: ['left', 'right'],
      required: true,
    },
    distance: {
      type: 'number',
      description: '移动距离（像素），默认 200',
      required: false,
    },
    duration: {
      type: 'number',
      description: '移动持续时间（毫秒），不传时按 distance 估算',
      required: false,
    },
  },
  run: (args): AgentToolCallResult => {
    const direction =
      args.direction === 'left'
        ? 'left'
        : args.direction === 'right'
          ? 'right'
          : null;
    if (!direction) {
      return err(
        PREFIX + 'move',
        '参数 direction 必填，且只能是 left 或 right。',
      );
    }
    let duration: number;
    if (typeof args.duration === 'number' && args.duration > 0) {
      duration = args.duration;
    } else {
      const distance =
        typeof args.distance === 'number' && args.distance > 0
          ? args.distance
          : 200;
      // 按约 300px/s 的近似速度把距离换算成时长
      duration = Math.round((distance / 300) * 1000);
    }
    const res = petMove(direction, duration);
    return res.ok
      ? ok(PREFIX + 'move', res.message)
      : err(PREFIX + 'move', res.message);
  },
};

export const petJumpTool: AgentTool = {
  name: `${PREFIX}jump`,
  title: '让桌宠跳跃',
  description: '让桌面宠物跳起来，可指定是否二段跳（double）。',
  parameters: {
    double: {
      type: 'boolean',
      description: '是否二段跳，默认 false',
      required: false,
    },
  },
  run: (args): AgentToolCallResult => {
    const double = args.double === true;
    const res = petJump(double);
    return res.ok
      ? ok(PREFIX + 'jump', res.message)
      : err(PREFIX + 'jump', res.message);
  },
};

export const petResetTool: AgentTool = {
  name: `${PREFIX}reset`,
  title: '重置桌宠位置',
  description: '让桌面宠物回到屏幕中央底部并停止当前动作。',
  parameters: {},
  run: (): AgentToolCallResult => {
    const res = petReset();
    return res.ok
      ? ok(PREFIX + 'reset', res.message)
      : err(PREFIX + 'reset', res.message);
  },
};

export const petTools: AgentTool[] = [
  petSpeakTool,
  petMoveTool,
  petJumpTool,
  petResetTool,
];
