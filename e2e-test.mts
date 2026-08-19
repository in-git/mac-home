import { chromium } from 'playwright';

const URL = 'http://localhost:14580/';

// 构造一个"旧数据"（无 version 字段，用户之前设过背景）模拟本地存储
const oldStore = {
  widgets: [
    { id: 'clock1', type: 'clock', grid: { x: 0, y: 0, w: 4, h: 5 }, cardStyle: { background: '#ff0000', backgroundTheme: 'dark' } },
  ],
  current: { roleId: 'default', compact: false, wallpaperIndex: 0 },
  background: '#000000',
  accent: '#0a84ff',
  themeMode: 'dark',
  showClockSeconds: true,
  use24Hour: false,
  reduceMotion: false,
  showDockLabels: true,
  showBattery: true,
  layoutLock: false,
  showWallpaper: true,
  autoHideDock: false,
  dockBlur: true,
  roundedCorners: true,
  showWidgetTitles: true,
  searchEngine: 'google',
  shortcuts: [],
  frequentSites: [],
  recentBookmarks: [],
  lastLocation: { pathname: '/' },
};

const browser = await chromium.launch();
const page = await browser.newPage();
const logs: string[] = [];
page.on('console', (m) => logs.push(`[console.${m.type()}] ${m.text()}`));

// 1. 注入旧 localStorage
await page.goto(URL);
await page.evaluate((s) => {
  localStorage.setItem('apple-homepage-store', s);
}, JSON.stringify(oldStore));

// 2. 刷新，触发 hydrate + migration
await page.reload();
await page.waitForTimeout(2500);

// 3. 读取合并后的 localStorage 与页面渲染的背景
const afterStore = await page.evaluate(() => localStorage.getItem('apple-homepage-store'));
const parsed = JSON.parse(afterStore || '{}');
const stateObj = parsed.state ?? parsed;
console.log('=== RESULT ===');
console.log('full persisted keys:', Object.keys(parsed));
console.log('full persisted version:', parsed.version);
console.log('widget count:', stateObj.widgets?.length);
console.log('widget[0] cardStyle:', JSON.stringify(stateObj.widgets?.[0]?.cardStyle));
console.log('first 2 widget ids:', stateObj.widgets?.slice(0,2).map((w:any)=>w.id));
console.log('=== console logs ===');
console.log(logs.join('\n'));

await browser.close();
