import type { AgentTool } from '../types';
import {
  cancelScheduledTask,
  listScheduledTasks,
  scheduleTask,
} from '../scheduler';

/**
 * 定时任务工具：
 * - create_scheduled_task：创建延迟/定时执行的任务（delay 毫秒，默认 0）
 * - list_scheduled_tasks：列出所有定时任务
 * - cancel_scheduled_task：按 id 取消定时任务
 */

const createScheduledTaskTool: AgentTool = {
  name: 'create_scheduled_task',
  title: '创建定时任务',
  description:
    '创建一个定时任务：延迟指定毫秒数后自动执行某个系统功能工具（如 set_dark_mode、set_font_variant）。delay 默认 0 表示立即执行。',
  parameters: {
    name: {
      type: 'string',
      description: '任务名称，便于识别与取消。',
      required: false,
    },
    tool: {
      type: 'string',
      description: '要延迟执行的目标工具名，例如 set_dark_mode、set_font_variant。',
      required: true,
    },
    args: {
      type: 'object',
      description: '传给目标工具的参数字段名与值。',
      required: false,
    },
    delay: {
      type: 'number',
      description: '延迟执行的毫秒数，默认 0（立即执行）。例如 5000 表示 5 秒后执行。',
      required: false,
    },
  },
  run: (args) => {
    const tool = args.tool;
    if (typeof tool !== 'string' || tool.trim().length === 0) {
      return {
        ok: false,
        tool: 'create_scheduled_task',
        message: '参数 tool 必填，且必须是可用的系统功能工具名。',
      };
    }
    const taskArgs =
      args.args && typeof args.args === 'object'
        ? (args.args as Record<string, unknown>)
        : {};
    const delay = typeof args.delay === 'number' && !Number.isNaN(args.delay)
      ? Math.max(0, Math.round(args.delay))
      : 0;
    const task = scheduleTask({
      name:
        typeof args.name === 'string' && args.name.trim().length > 0
          ? args.name.trim()
          : tool,
      tool: tool.trim(),
      args: taskArgs,
      delay,
    });
    const when = delay > 0 ? `${delay} 毫秒后` : '立即';
    return {
      ok: true,
      tool: 'create_scheduled_task',
      message: `已创建定时任务「${task.name}」：${when}执行 ${tool}。`,
      data: task,
    };
  },
};

const listScheduledTasksTool: AgentTool = {
  name: 'list_scheduled_tasks',
  title: '列出定时任务',
  description: '列出当前所有定时任务（含执行状态）。',
  parameters: {},
  run: () => {
    const tasks = listScheduledTasks();
    if (tasks.length === 0) {
      return { ok: true, tool: 'list_scheduled_tasks', message: '当前没有定时任务。' };
    }
    const summary = tasks
      .map((t) => `${t.name}(${t.status})${t.resultMessage ? `：${t.resultMessage}` : ''}`)
      .join('\n');
    return {
      ok: true,
      tool: 'list_scheduled_tasks',
      message: `共 ${tasks.length} 个定时任务：\n${summary}`,
      data: tasks,
    };
  },
};

const cancelScheduledTaskTool: AgentTool = {
  name: 'cancel_scheduled_task',
  title: '取消定时任务',
  description: '按 id 取消一个尚未执行的定时任务。',
  parameters: {
    id: {
      type: 'string',
      description: '要取消的定时任务 id。',
      required: true,
    },
  },
  run: (args) => {
    const id = args.id;
    if (typeof id !== 'string' || id.trim().length === 0) {
      return { ok: false, tool: 'cancel_scheduled_task', message: '参数 id 必填。' };
    }
    const ok = cancelScheduledTask(id.trim());
    return ok
      ? { ok: true, tool: 'cancel_scheduled_task', message: `已取消定时任务 ${id}。` }
      : { ok: false, tool: 'cancel_scheduled_task', message: `未找到定时任务 ${id}。` };
  },
};

/** 本模块导出的定时任务 AI 工具 */
export const scheduledTaskTools: AgentTool[] = [
  createScheduledTaskTool,
  listScheduledTasksTool,
  cancelScheduledTaskTool,
];
