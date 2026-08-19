// 在 import store 之前 mock 浏览器 localStorage（zustand persist 格式）
const mem: Record<string, string> = {};
const ls = {
  getItem: (k: string) => (k in mem ? mem[k] : null),
  setItem: (k: string, v: string) => { mem[k] = v; },
  removeItem: (k: string) => { delete mem[k]; },
};
(globalThis as any).localStorage = ls;
(globalThis as any).window = globalThis;

// 模拟 zustand persist 写入格式：{ state: {...}, version: 0 }
// 用户老数据：无顶层 version，widgets 里设了背景 #ff0000
mem['apple-homepage-store'] = JSON.stringify({
  state: {
    widgets: [
      { id: 'clock1', type: 'clock', grid: { x: 0, y: 0, w: 4, h: 5 }, cardStyle: { background: '#ff0000', backgroundTheme: 'dark' } },
    ],
    current: { roleId: 'default' },
  },
  version: 0,
});

const { useHomeStore } = await import('./src/store/useHomeStore');
const s = useHomeStore.getState();
console.log('[hydrate] widget count:', s.widgets.length);
console.log('[hydrate] bg (期望 #ff0000):', s.widgets[0]?.cardStyle?.background);

// 用户改背景
useHomeStore.getState().updateWidgetBackground('clock1', '#00ff00', 'light');
console.log('[set] bg:', useHomeStore.getState().widgets[0]?.cardStyle?.background);

// 模拟重新加载：读 localStorage 重新 hydrate
const persisted = JSON.parse(mem['apple-homepage-store']);
const mem2: Record<string, string> = { 'apple-homepage-store': JSON.stringify(persisted) };
(globalThis as any).localStorage = {
  getItem: (k: string) => (k in mem2 ? mem2[k] : null),
  setItem: (k: string, v: string) => { mem2[k] = v; },
  removeItem: (k: string) => { delete mem2[k]; },
};
const { useHomeStore: use2 } = await import('./src/store/useHomeStore?reload');
const s2 = use2.getState();
console.log('[reload] bg (期望 #00ff00):', s2.widgets[0]?.cardStyle?.background);
