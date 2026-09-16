import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));

await page.goto('http://localhost:14579', { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await page.locator('a').filter({ hasText: /^视频$/ }).last().click();
await page.waitForTimeout(3500);
await page.locator('p').filter({ hasText: '豆包建站' }).first().click();
await page.waitForTimeout(4500);

const st = () => page.evaluate(() => {
  const v = document.querySelector('video');
  return { t: +(v?.currentTime ?? 0).toFixed(1), vol: +(v?.volume ?? 0).toFixed(2), paused: v?.paused, muted: v?.muted };
});

console.log('初始:', JSON.stringify(await st()));

// 空格：暂停
await page.keyboard.press('Space');
await page.waitForTimeout(800);
const a = await st();
console.log('空格:', JSON.stringify(a), a.paused ? '✓ 已暂停' : '✗ 未暂停');

// 空格：恢复
await page.keyboard.press('Space');
await page.waitForTimeout(700);
const b = await st();
console.log('再空格:', JSON.stringify(b), !b.paused ? '✓ 已播放' : '✗ 仍暂停');

// 暂停后测快进（避免播放时间干扰读数）
await page.keyboard.press('Space');
await page.waitForTimeout(600);
const t0 = (await st()).t;
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(500);
const t1 = (await st()).t;
console.log(`→ 快进: ${t0} -> ${t1}（+${(t1 - t0).toFixed(1)}s）`, Math.abs(t1 - t0 - 5) < 0.6 ? '✓' : '✗');

await page.keyboard.press('ArrowLeft');
await page.waitForTimeout(500);
const t2 = (await st()).t;
console.log(`← 快退: ${t1} -> ${t2}（${(t2 - t1).toFixed(1)}s）`, Math.abs(t2 - t1 + 5) < 0.6 ? '✓' : '✗');

// 音量
const v0 = (await st()).vol;
await page.keyboard.press('ArrowDown');
await page.waitForTimeout(400);
const v1 = (await st()).vol;
console.log(`↓ 音量: ${v0} -> ${v1}`, v1 < v0 ? '✓' : '✗');

await page.keyboard.press('ArrowUp');
await page.waitForTimeout(400);
const v2 = (await st()).vol;
console.log(`↑ 音量: ${v1} -> ${v2}`, v2 > v1 ? '✓' : '✗');

// M 静音
await page.keyboard.press('KeyM');
await page.waitForTimeout(400);
console.log('M 静音:', JSON.stringify(await st()));

// 播放器仍开启（F 全屏在无头环境不稳定，仅验证不报错）
console.log('errors=', errs.length ? errs.slice(0, 3) : 'none');
await browser.close();
