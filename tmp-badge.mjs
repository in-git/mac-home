import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));

await page.goto('http://localhost:14579', { waitUntil: 'networkidle' });
await page.waitForTimeout: undefined;
await page.waitForTimeout(3500);

console.log(JSON.stringify(await page.evaluate(() => {
  // 找出所有 NEW 角标
  const badges = [...document.querySelectorAll('span')].filter((s) => s.textContent.trim() === 'New');
  return badges.map((b) => {
    const r = b.getBoundingClientRect();
    const cs = getComputedStyle(b);
    const card = b.closest('div[class*="group"]');
    const cr = card?.getBoundingClientRect();
    const fav = card?.querySelector('button[aria-label*="收藏"]');
    const fr = fav?.getBoundingClientRect();
    return {
      卡片: card?.querySelector('p')?.textContent?.slice(0, 10),
      position: cs.position,
      在卡片右上: cr ? { 距右: Math.round(cr.right - r.right), 距顶: Math.round(r.top - cr.top) } : null,
      与收藏按钮重叠: fr ? !(r.right <= fr.left || r.left >= fr.right || r.bottom <= fr.top || r.top >= fr.bottom) : null,
      收藏按钮位置: fr ? { right: Math.round(cr.right - fr.right), top: Math.round(fr.top - cr.top) } : '无',
    };
  });
}), null, 1));
console.log('errors=', errs.length ? errs : 'none');
await page.screenshot({ path: 'tmp-badge.png' });
await browser.close();
