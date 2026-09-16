import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
await page.addInitScript(() => {
  const orig = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    return orig.call(this).catch(() => {});
  };
});
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));

await page.goto('http://localhost:14579', { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await page.locator('a').filter({ hasText: /^视频$/ }).last().click();
await page.waitForTimeout(4000);

// 列出所有卡片（含标题 + 封面尺寸），找一个小卡片
const cards = await page.evaluate(() => {
  return [...document.querySelectorAll('div[class*="group"]')]
    .filter((c) => c.querySelector('p'))
    .map((c, i) => {
      const cover = c.querySelector('[class*="aspect-video"]');
      const r = cover?.getBoundingClientRect();
      return {
        i,
        title: c.querySelector('p')?.textContent.slice(0, 20),
        cover: r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null,
      };
    })
    .filter((c) => c.cover);
});
console.log('卡片列表（前6）:', JSON.stringify(cards.slice(0, 6), null, 1));

// 选一个「小卡片」（宽 < 400）
const small = cards.find((c) => c.cover.w < 400);
console.log('选中小卡片:', JSON.stringify(small));
if (!small) { await browser.close(); process.exit(1); }

const cx = small.cover.x + small.cover.w / 2;
const cy = small.cover.y + small.cover.h / 2;
await page.mouse.move(cx, cy);
await page.waitForTimeout(4000);

console.log('\n悬停后 video:', JSON.stringify(await page.evaluate(() => {
  return [...document.querySelectorAll('video')].map((v) => ({
    源: (v.currentSrc || v.src || '').slice(-22),
    muted: v.muted,
    t: +(v.currentTime || 0).toFixed(1),
    dur: Math.round(v.duration || 0),
    paused: v.paused,
    w: Math.round(v.getBoundingClientRect().width),
  }));
}), null, 1));
console.log('进度=', await page.evaluate(() => sessionStorage.getItem('video-progress')));

await page.mouse.move(5, 5);
await page.waitForTimeout(1500);
console.log('移出后 video 数=', await page.evaluate(() => document.querySelectorAll('video').length));
console.log('移出后进度=', await page.evaluate(() => sessionStorage.getItem('video-progress')));

// 点击该卡片进模态框
await page.mouse.click(cx, cy);
await page.waitForTimeout(4500);
console.log('\n模态框:', JSON.stringify(await page.evaluate(() => {
  const v = document.querySelector('.art-video-player video');
  return { t: +(v?.currentTime ?? 0).toFixed(1), dur: Math.round(v?.duration ?? 0), paused: v?.paused };
})));
console.log('errors=', errs.length ? errs.slice(0, 3) : 'none');
await browser.close();
