/**
 * Agent 定时任务调度器：
 * - 支持延迟执行：每个任务带 delay（毫秒），默认 0 表示立即执行；
 * - 任务持久化到 localStorage，刷新页面后自动恢复未执行的任务；
 * - 到达执行时间后调用统一工具入口 executeAgentTool 执行。
 *
 * 注意：这里不静态 import executeAgentTool（避免与 index/tools 形成循环依赖），
 * 在执行时通过动态 import 获取。
 */

export interface ScheduledTask {
  id: string;
  /** 任务名称（便于识别） */
  name: string;
  /** 要执行的目标工具名 */
  tool: string;
  /** 传给目标工具的参数 */
  args?: Record<string, unknown>;
  /** 延迟毫秒数，默认 0 */
  delay: number;
  /** 计划执行的时间戳（创建时刻 + delay） */
  runAt: number;
  status: 'pending' | 'running' | 'done' | 'failed' | 'cancelled';
  createdAt: number;
  resultMessage?: string;
}

const STORAGE_KEY = 'agent-scheduled-tasks';
// 已注册到全局的定时器（按任务 id 记录，便于取消）
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function loadAll(): ScheduledTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as ScheduledTask[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(tasks: ScheduledTask[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    /* localStorage 不可用时静默失败，任务仅内存生效 */
  }
}

function updateStatus(
  id: string,
  status: ScheduledTask['status'],
  resultMessage?: string,
) {
  const tasks = loadAll();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return;
  tasks[idx] = { ...tasks[idx], status, resultMessage };
  saveAll(tasks);
}

async function runTask(task: ScheduledTask) {
  timers.delete(task.id);
  updateStatus(task.id, 'running');
  try {
    // 动态加载统一执行入口，避免模块循环依赖
    const { executeAgentTool } = await import('./index');
    const result = await executeAgentTool({
      name: task.tool,
      args: task.args,
    });
    updateStatus(task.id, result.ok ? 'done' : 'failed', result.message);
  } catch (e) {
    updateStatus(
      task.id,
      'failed',
      `执行异常：${(e as Error)?.message || '未知错误'}`,
    );
  }
}

/**
 * 注册一个定时任务。
 * @param opts.delay 延迟毫秒数，默认 0（立即执行）
 */
export function scheduleTask(opts: {
  name: string;
  tool: string;
  args?: Record<string, unknown>;
  delay?: number;
}): ScheduledTask {
  const delay = Math.max(0, Math.round(opts.delay ?? 0));
  const task: ScheduledTask = {
    id: `sched-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: opts.name,
    tool: opts.tool,
    args: opts.args ?? {},
    delay,
    runAt: Date.now() + delay,
    status: 'pending',
    createdAt: Date.now(),
  };
  const tasks = loadAll();
  tasks.push(task);
  saveAll(tasks);
  timers.set(
    task.id,
    setTimeout(() => runTask(task), delay),
  );
  return task;
}

/** 列出全部定时任务（含已结束的，供界面展示） */
export function listScheduledTasks(): ScheduledTask[] {
  return loadAll();
}

/** 按 id 取消一个定时任务；取消成功返回 true */
export function cancelScheduledTask(id: string): boolean {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
  const tasks = loadAll();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  tasks[idx] = { ...tasks[idx], status: 'cancelled' };
  saveAll(tasks);
  return true;
}

/**
 * 页面挂载时调用：恢复刷新前尚未执行（pending）的定时任务。
 * 已结束（done/failed/cancelled）的任务会被清理，避免无限累积。
 */
export function initScheduler(): void {
  const tasks = loadAll();
  const now = Date.now();
  const kept: ScheduledTask[] = [];
  for (const t of tasks) {
    if (t.status === 'pending') {
      // 过期任务立即补执行，未到期则重新设定时器
      const wait = Math.max(0, t.runAt - now);
      kept.push(t);
      timers.set(
        t.id,
        setTimeout(() => runTask(t), wait),
      );
    }
  }
  saveAll(kept);
}
