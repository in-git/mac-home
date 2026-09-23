import { useEffect, useState } from 'react';

/**
 * 搜索关键词状态（网页 / 视频列表共用）：
 * - 输入值（keyword）即时更新，供受控输入框使用
 * - 防抖值（debouncedKw）延迟 400ms 生效，用于实际请求，避免每次按键都打接口
 * - submit() 用于「点搜索按钮 / 回车」立即生效（同步防抖值并递增 nonce，
 *   保证关键词与上次相同时也重新请求）
 */
export function useSearch(delay = 400) {
  const [keyword, setKeyword] = useState('');
  const [debouncedKw, setDebouncedKw] = useState('');
  /** 立即搜索计数器：关键词未变时也用于触发重新请求 */
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKw(keyword), delay);
    return () => clearTimeout(timer);
  }, [keyword, delay]);

  const submit = () => {
    setDebouncedKw(keyword);
    setNonce((n) => n + 1);
  };

  return { keyword, setKeyword, debouncedKw, nonce, submit };
}

export default useSearch;
