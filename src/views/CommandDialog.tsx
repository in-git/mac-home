import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CornerDownLeft,
  Search,
  RefreshCw,
  ExternalLink,
  Clock,
  StickyNote,
  Settings,
  MessageSquare,
  Bot,
} from 'lucide-react';
import { AGENT_TOOLS } from '../agent/tools';
import type { AgentTool } from '../agent/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/** 按工具名归类到合适的图标。 */
function iconForTool(name: string): React.ComponentType<{ size?: number; className?: string }> {
  if (name === 'refresh_page') return RefreshCw;
  if (name === 'open_link') return ExternalLink;
  if (name.startsWith('create_scheduled_task') || name.startsWith('cancel_scheduled_task') || name.startsWith('list_scheduled_tasks'))
    return Clock;
  if (name.startsWith('sticky_')) return StickyNote;
  if (name.startsWith('set_') || name === 'reset_settings') return Settings;
  if (name === 'general_chat') return MessageSquare;
  if (name === 'agent_chat') return Bot;
  return Settings;
}

interface ToolCommand {
  tool: AgentTool;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

/**
 * Command palette dialog anchored to the bottom-center of the screen.
 * Opened by pressing Enter anywhere on the desktop (when no input is focused).
 * Lists the commands from src/agent/tools and runs the selected one directly.
 */
export const CommandDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<ToolCommand[]>(
    () =>
      AGENT_TOOLS.map((tool) => ({ tool, icon: iconForTool(tool.name) })),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.tool.name.toLowerCase().includes(q) ||
        c.tool.description.toLowerCase().includes(q),
    );
  }, [query, commands]);

  // Esc to close + auto-focus the input on open.
  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setResult(null);
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const runCommand = async (cmd: ToolCommand) => {
    try {
      const res = await cmd.tool.run({});
      setResult(`${res.ok ? '✓' : '✗'} ${cmd.tool.name}：${res.message}`);
    } catch (e) {
      setResult(`✗ ${cmd.tool.name} 执行出错：${(e as Error).message}`);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[120] flex items-end justify-center pb-24 px-4 bg-black/20 backdrop-blur-xs"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl glass-panel rounded-2xl shadow-2xl border border-white/50 dark:border-white/15 overflow-hidden text-slate-800 dark:text-slate-100"
        >
          {/* Search Bar */}
          <div className="flex items-center px-4 py-3.5 border-b border-black/5 dark:border-white/10">
            <Search size={20} className="text-[#007AFF] shrink-0 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入命令或搜索…"
              className="w-full bg-transparent border-none text-base outline-none placeholder-slate-400 font-normal"
            />
            <span className="text-xs text-slate-400 px-2 py-0.5 rounded bg-black/5 dark:bg-white/10">
              ESC 退出
            </span>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-3 text-xs">
            {filtered.length === 0 && (
              <div className="px-3 py-6 text-center text-slate-400 dark:text-slate-500">
                没有匹配的命令
              </div>
            )}
            {filtered.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.tool.name}
                  onClick={() => runCommand(cmd)}
                  className="w-full px-3 py-2 rounded-xl hover:bg-[#007AFF] hover:text-white flex items-start space-x-3 transition-colors text-left"
                >
                  <Icon size={16} className="mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium flex items-center gap-2">
                      <span>{cmd.tool.title}</span>
                      <CornerDownLeft size={13} className="opacity-50 shrink-0" />
                    </div>
                    <div className="opacity-70 line-clamp-1">
                      {cmd.tool.description}
                    </div>
                    <div className="text-[10px] opacity-50 mt-0.5 font-mono">
                      {cmd.tool.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Result Footer */}
          {result && (
            <div className="border-t border-black/5 dark:border-white/10 px-4 py-3 text-xs text-slate-600 dark:text-slate-300 bg-black/5 dark:bg-white/5">
              {result}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
