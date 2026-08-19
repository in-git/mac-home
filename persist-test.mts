// Mock browser globals before importing the store
const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => (k in store ? store[k] : null),
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
};
(globalThis as any).window = globalThis;

import { useHomeStore } from './src/store/useHomeStore';

// 1. 模拟：已有旧 localStorage（无 version 字段，用户之前设过背景）
store['apple-homepage-store'] = JSON.stringify({
  widgets: [
    { id: 'clock1', type: 'clock', grid: { x: 0, y: 0, w: 4, h: 5 }, cardStyle: { background: '#1a1a1a', backgroundTheme: 'dark' } },
  ],
});

// 2. 触发 hydration
const s1 = useHomeStore.getState();
console.log('[hydrate] version:', (s1 as any).version);
console.log('[hydrate] bg:', s1.widgets[0]?.cardStyle?.background, 'count:', s1.widgets.length);

// 3. 模拟用户改背景
useHomeStore.getState().updateWidgetBackground('clock1', '#ff0000', 'light');
const s2 = useHomeStore.getState();
console.log('[set] bg:', s2.widgets[0]?.cardStyle?.background);

// 4. 模拟持久化已写入（persist 自动写 localStorage），再"重新加载"
const persisted = JSON.parse(store['apple-homepage-store']);
console.log('[persist] version stored:', persisted.version, 'bg:', persisted.widgets[0]?.cardStyle?.background);

// 5. 重新 hydration（清空内存，重建 store）
delete (globalThis as any).localStorage;
const store2: Record<string, string> = { 'apple-homepage-store': JSON.stringify(persisted) };
(globalThis as any).localStorage = {
  getItem: (k: string) => (k in store2 ? store2[k] : null),
  setItem: (k: string, v: string) => { store2[k] = v; },
  removeItem: (k: string) => { delete store2[k]; },
};
const { useHomeStore: useHomeStore2 } = await import('./src/store/useHomeStore');
const s3 = useHomeStore2.getState();
console.log('[reload] bg (期望 #ff0000):', s3.widgets[0]?.cardStyle?.background);
