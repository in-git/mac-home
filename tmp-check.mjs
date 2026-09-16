import { readFileSync } from 'fs';

const html = readFileSync('index.html', 'utf8');
const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!m) {
  console.log('未找到 JSON-LD');
  process.exit(1);
}
const data = JSON.parse(m[1]);
console.log('JSON-LD 解析成功');
console.log(JSON.stringify(data, null, 2));
