import { useHomeStore } from '../../store/useHomeStore';
import type { NoteColor, StickyNote } from '../../types';
import type { AgentTool, AgentToolCallResult } from '../types';
import { ok, err } from '../config/result';

/**
 * 便签组件（Sticky Notes）—— AI 可操作的便签数据入口。
 *
 * 便签数据存于全局 store（useHomeStore.notes），store 仅暴露
 * `updateNotes(notes)` 整体替换，因此这里封装「读取 + 改后写回」的底层方法，
 * 并基于它们定义供 AI 调用的 AgentTool（增删改查 + 置顶切换）。
 * 业务组件（便签 widget）复用同一份 store，故 AI 改动会即时反映到界面。
 */

// ---------------------------------------------------------------------------
// 可全局复用的底层方法
// ---------------------------------------------------------------------------

export function readNotes(): StickyNote[] {
  return useHomeStore.getState().notes ?? [];
}

export function createNote(
  partial: Partial<StickyNote> & { title?: string; content?: string },
): StickyNote {
  const notes = readNotes();
  const note: StickyNote = {
    id: `note-${Date.now()}`,
    title: partial.title?.trim() || '新便签',
    content: partial.content ?? '',
    color: (partial.color as NoteColor) || 'yellow',
    updatedAt: new Date().toISOString(),
    pinned: partial.pinned ?? false,
    ...(partial.isChecklist !== undefined ? { isChecklist: partial.isChecklist } : {}),
  };
  useHomeStore.getState().updateNotes([note, ...notes]);
  return note;
}

export function updateNote(
  id: string,
  fields: Partial<StickyNote>,
): StickyNote | null {
  const notes = readNotes();
  const idx = notes.findIndex((n) => n.id === id);
  if (idx === -1) return null;
  const updated: StickyNote = {
    ...notes[idx],
    ...fields,
    id: notes[idx].id, // id 不可变
    updatedAt: new Date().toISOString(),
  };
  const next = notes.slice();
  next[idx] = updated;
  useHomeStore.getState().updateNotes(next);
  return updated;
}

export function deleteNote(id: string): boolean {
  const notes = readNotes();
  const next = notes.filter((n) => n.id !== id);
  if (next.length === notes.length) return false;
  useHomeStore.getState().updateNotes(next);
  return true;
}

// ---------------------------------------------------------------------------
// AI 工具定义（复用上面的底层方法）
// ---------------------------------------------------------------------------

// 工具统一前缀，避免与其它模块命名冲突
const PREFIX = 'sticky_';

export const listNotesTool: AgentTool = {
  name: `${PREFIX}list`,
  title: '列出便签',
  description: '读取当前所有便签列表（含 id、标题、内容摘要、颜色、是否置顶）。',
  parameters: {},
  run: (): AgentToolCallResult => {
    const notes = readNotes();
    const list = notes.map((n) => ({
      id: n.id,
      title: n.title,
      color: n.color,
      pinned: n.pinned,
      contentPreview: (n.content || '').slice(0, 50),
      updatedAt: n.updatedAt,
    }));
    return ok(`${PREFIX}list`, `共 ${notes.length} 条便签。`, list);
  },
};

export const createNoteTool: AgentTool = {
  name: `${PREFIX}create`,
  title: '新建便签',
  description: '新建一条便签。可指定标题(title)、内容(content)、颜色(color)。',
  parameters: {
    title: { type: 'string', description: '便签标题', required: false },
    content: { type: 'string', description: '便签正文内容', required: false },
    color: {
      type: 'string',
      description: '便签颜色',
      enum: ['yellow', 'mint', 'pink', 'blue', 'glass'],
      required: false,
    },
  },
  run: (args): AgentToolCallResult => {
    const note = createNote({
      title: typeof args.title === 'string' ? args.title : undefined,
      content: typeof args.content === 'string' ? args.content : '',
      color: (args.color as NoteColor) || 'yellow',
    });
    return ok(`${PREFIX}create`, `已新建便签「${note.title}」。`, note);
  },
};

export const updateNoteTool: AgentTool = {
  name: `${PREFIX}update`,
  title: '修改便签',
  description:
    '修改一条便签。必须提供 id，可修改 title/content/color/pinned 等字段。',
  parameters: {
    id: { type: 'string', description: '要修改的便签 id', required: true },
    title: { type: 'string', description: '新的标题', required: false },
    content: { type: 'string', description: '新的正文内容', required: false },
    color: {
      type: 'string',
      description: '新的颜色',
      enum: ['yellow', 'mint', 'pink', 'blue', 'glass'],
      required: false,
    },
    pinned: { type: 'boolean', description: '是否置顶', required: false },
  },
  run: (args): AgentToolCallResult => {
    const id = args.id;
    if (typeof id !== 'string' || id.length === 0) {
      return err(`${PREFIX}update`, '参数 id 必须是非空字符串。');
    }
    const fields: Partial<StickyNote> = {};
    if (typeof args.title === 'string') fields.title = args.title;
    if (typeof args.content === 'string') fields.content = args.content;
    if (typeof args.color === 'string') fields.color = args.color as NoteColor;
    if (typeof args.pinned === 'boolean') fields.pinned = args.pinned;

    const updated = updateNote(id, fields);
    if (!updated) {
      return err(`${PREFIX}update`, `未找到 id 为「${id}」的便签。`);
    }
    return ok(`${PREFIX}update`, `已更新便签「${updated.title}」。`, updated);
  },
};


export const togglePinNoteTool: AgentTool = {
  name: `${PREFIX}toggle_pin`,
  title: '切换便签置顶',
  description: '切换某条便签的置顶状态（置顶/取消置顶）。',
  parameters: {
    id: { type: 'string', description: '要切换置顶的便签 id', required: true },
  },
  run: (args): AgentToolCallResult => {
    const id = args.id;
    if (typeof id !== 'string' || id.length === 0) {
      return err(`${PREFIX}toggle_pin`, '参数 id 必须是非空字符串。');
    }
    const note = readNotes().find((n) => n.id === id);
    if (!note) {
      return err(`${PREFIX}toggle_pin`, `未找到 id 为「${id}」的便签。`);
    }
    const updated = updateNote(id, { pinned: !note.pinned });
    return ok(
      `${PREFIX}toggle_pin`,
      `便签「${updated?.title}」已${updated?.pinned ? '置顶' : '取消置顶'}。`,
      updated,
    );
  },
};

export const stickyNoteTools: AgentTool[] = [
  listNotesTool,
  createNoteTool,
  updateNoteTool,
  togglePinNoteTool,
];
