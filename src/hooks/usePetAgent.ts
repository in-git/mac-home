import { useCallback, useRef, useState } from 'react';
import { runAgentTurn } from '../agent/run';
import { petTools } from '../agent/pet';

/**
 * 让大模型接管桌宠的 React Hook。
 *
 * 对外暴露 send()，调用方（聊天输入框 / 问候 / 定时活动）只需传入一句话，
 * 引擎就会让模型决策要执行哪些桌宠行为（petTools）并驱动 RoleCharacterCanvas。
 */
export function usePetAgent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runningRef = useRef(false);

  const send = useCallback(
    async (input: string): Promise<string> => {
      if (runningRef.current) return '';
      runningRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const res = await runAgentTurn([], input, { tools: petTools });
        if (!res.ok) {
          setError(res.error);
          return '';
        }
        const reply = res.data;
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
    [],
  );

  return {
    send,
    loading,
    error,
  };
}
