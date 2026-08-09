import { AGENT_TOOLS } from '@/agent';
import type { AgentChatMessage } from '@/agent/chat';
import { MAX_PET_CHAT_MESSAGES, useHomeStore } from '@/store/useHomeStore';
import { chatWithPet } from '@/utils/aiClient';
import { Send, Terminal, Wrench } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function now(): string {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 按 Enter 弹出的「和桌宠对话」输入框。
 * 复用 src/utils/aiClient 的 chatWithPet（内置桌宠系统提示词）进行单轮对话：
 * 输入内容 → 大模型返回 → 回复展示在面板中，
 * 同时通过 role-dialog-speak 事件让桌宠头上气泡同步显示最终回复。
 */
export const CommandDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const aiConfig = useHomeStore((s) => s.aiConfig);
  const petChatHistory = useHomeStore((s) => s.petChatHistory);
  const setPetChatHistory = useHomeStore((s) => s.setPetChatHistory);
  // 持久化的跨轮对话历史上限（最多 10 轮 = 20 条 user/assistant 文本，store 层统一截断）

  // Esc 关闭 + 打开时自动聚焦输入框
  useEffect(() => {
    if (!isOpen) return;
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

  // 新消息/加载状态变化时自动滚动到底部
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: AgentChatMessage = {
      id: 'cmd-user-' + Date.now(),
      role: 'user',
      content: trimmed,
      timestamp: now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // 用封装的桌宠对话方法（一整套闭环：内置提示词→解析→执行→触发气泡）；
      // 携带跨轮历史（chatWithPet 内部会安全清洗，只保留 user/assistant 文本，
      // 不会触发 OpenAI 兼容接口的 400 错误）。
      const historyForModel: import('@/utils/aiClient').ChatMessage[] =
        petChatHistory.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
      const reply = await chatWithPet(aiConfig, trimmed, historyForModel);
      const assistantMsg: AgentChatMessage = {
        id: 'cmd-assistant-' + Date.now(),
        role: 'assistant',
        content: reply,
        timestamp: now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      // 把本轮 user + assistant 追加进持久化的跨轮历史（仅文本，剔除 error 标记）
      const nextHistory = [...petChatHistory, userMsg, assistantMsg].slice(
        -MAX_PET_CHAT_MESSAGES,
      );
      setPetChatHistory(nextHistory);
      // 桌宠气泡由 chatWithPet 内部（执行 ToolTask 时）统一触发，这里不再重复派发
      // 单轮对话完成，关闭对话框（回复通过桌宠头顶气泡显示）
      onClose();
    } catch (err) {
      const errorMsg: AgentChatMessage = {
        id: 'cmd-err-' + Date.now(),
        role: 'assistant',
        content: `调用失败: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: now(),
        error: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
      // 失败也应保留 user 输入到历史，便于下一轮模型理解上下文（不存 error 消息）
      const nextHistory = [...petChatHistory, userMsg].slice(
        -MAX_PET_CHAT_MESSAGES,
      );
      setPetChatHistory(nextHistory);
    } finally {
      setLoading(false);
    }
  };

  // 点击命令列表：把该命令的 title 填入输入框（不自动执行）
  const handleCommandClick = (title: string) => {
    setInput((prev) => (prev ? prev + ' ' + title : title));
    inputRef.current?.focus();
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
          className="w-full max-w-xl glass-panel rounded-2xl shadow-2xl border border-white/50 dark:border-white/15 overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col"
        >
          {/* 底部输入框（textarea 多行） */}
          <form
            onSubmit={handleSend}
            className="border-t border-black/5 dark:border-white/10 p-3 shrink-0"
          >
            <div className="relative flex items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={2}
                placeholder="对桌宠说点什么…（Enter 发送，Shift+Enter 换行）"
                disabled={loading}
                className="w-full pl-3 pr-20 py-2.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 focus:bg-white dark:focus:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 rounded-[12px] transition-colors outline-none focus:ring-2 focus:ring-[#007AFF]/50 placeholder:text-slate-400 disabled:opacity-50 resize-none scrollbar-thin"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-1.5 bottom-1.5 px-3 py-1.5 bg-[#007AFF] hover:bg-blue-600 text-white rounded-[10px] text-xs font-medium transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center space-x-1 shadow-xs"
              >
                <span>发送</span>
                <Send size={11} />
              </button>
            </div>
          </form>

          {/* 输入框下方的 agent 命令列表：点击把 title 填入输入框 */}
          <div className="px-3 pb-3 shrink-0 border-t border-black/5 dark:border-white/10 pt-2">
            <div className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wide">
              <Terminal size={12} className="text-[#007AFF]" />
              <span>Agent 命令</span>
            </div>
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto scrollbar-thin">
              {AGENT_TOOLS.map((tool) => (
                <button
                  key={tool.name}
                  type="button"
                  onClick={() => handleCommandClick(tool.title)}
                  title={tool.description}
                  className="group flex items-start gap-2.5 px-3 py-2.5 rounded-[12px] bg-black/[0.03] dark:bg-white/[0.06] hover:bg-[#007AFF]/10 dark:hover:bg-[#007AFF]/20 transition-colors text-left disabled:opacity-50 disabled:pointer-events-none w-full"
                >
                  <Wrench
                    size={14}
                    className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5 group-hover:text-[#007AFF]"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-slate-800 dark:text-slate-100 font-semibold">
                      {tool.title}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                      {tool.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
