import { useCallback, useRef, useState } from 'react';
import { useHomeStore } from '../store/useHomeStore';
import { runAgentTurn } from '../agent/run';
import type { AgentChatMessage } from '../agent/types';

/**
 * 让大模型接管桌宠的 React Hook。
 *
 * 对外暴露 send()，调用方（聊天输入框 / 问候 / 定时活动）只需传入一句话，
 * 引擎就会让模型决策要执行哪些桌宠行为（petTools）并驱动 RoleCharacterCanvas。
 * 对话历史统一存放在全局 store（petChatHistory），自动截断到最近 N 轮。
 */
export function usePetAgent() {
  const petChatHistory = useHomeStore((s) => s.petChatHistory);
  const setPetChatHistory = useHomeStore((s) => s.setPetChatHistory);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runningRef = useRef(false);

  const send = useCallback(
    async (input: string, opts?: { keepHistory?: boolean }): Promise<string> => {
      if (runningRef.current) return '';
      runningRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const shouldKeep = opts?.keepHistory !== false;
        const history: AgentChatMessage[] = shouldKeep ? petChatHistory : [];
        const res = await runAgentTurn(history, input);
        if (!res.ok) {
          setError(res.error);
          return '';
        }
        const reply = res.data;
        if (shouldKeep) {
          const now = Date.now();
          setPetChatHistory([
            ...history,
            {
              id: 'u-' + now,
              role: 'user',
              content: input,
              timestamp: new Date(now).toLocaleTimeString(),
            },
            {
              id: 'a-' + now,
              role: 'assistant',
              content: reply ?? '',
              timestamp: new Date(now).toLocaleTimeString(),
            },
          ]);
        }
        return reply ?? '';
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        return '';
      } finally {
        setLoading(false);
        runningRef.current = false;
      }
    },
    [petChatHistory, setPetChatHistory],
  );

  return {
    send,
    loading,
    error,
    /** 清空对话记忆，让模型重新开始（不影响桌宠当前状态） */
    reset: useCallback(() => setPetChatHistory([]), [setPetChatHistory]),
  };
}
