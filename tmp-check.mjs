import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });

const COVERS = ['https://www.mx2d.cn/2026/9/16/2100079701135286273.png', 'https://www.mx2d.cn/2026/9/16/2100061891134840833.png'];
// 用可区分的 count 值定位
const ALL = Array.from({ length: 10 }, (_, i) => ({
  id: `vid-${i}`, title: `视频编号 ${i + 1} 期`, url: 'https://www.mx2d.cn/a.mp4',
  cover: COVERS[i % 2], description: 'd', count: 1000 + i, status: 'ENABLE',
  duration: 120, createTime: '2026-09-16 12:00:00',
}));

await page.route('**/api/public/video/page*', (route) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: { records: ALL, total: 10, size: 20, current: 1, pages: 1 } }) }));
await page.route('**/api/public/video/click*', (route) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: null, message: 'success' }) }));

await page.goto('http://localhost:14579', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.locator('a').filter({ hasText: /^视频$/ }).last().click({ force: true });
await page.waitForTimeout(2800);

const dump = () => page.evaluate(() => {
  return [...document.querySelectorAll('p')].filter((p) => p.textContent.includes('视频编号'))
    .slice(0, 6).map((p) => {
      const card = p.closest('div[class*="group"]');
      const ov = card?.querySelector('[class*="from-black"]');
      return `${p.textContent.trim()} -> ${ov?.textContent.trim()}`;
    });
});

console.log('点击前:'); console.log(dump().then ? '' : '');
console.log(JSON.stringify(await dump(), null, 1));

// 点击「视频编号 5 期」
await page.locator('p', { hasText: '视频编号 5 期' }).first().click();
await page.waitForTimeout(2000);
console.log('\n点击后:'); console.log(JSON.stringify(await dump(), null, 1));
await browser.close();
