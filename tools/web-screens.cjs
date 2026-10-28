const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = '/home/user/purrbi/app/build/web';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm', '.png': 'image/png', '.otf': 'font/otf', '.ttf': 'font/ttf', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/' || !path.extname(p)) p = '/index.html';
  const f = path.join(root, p);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(8085, '127.0.0.1');
(async () => {
  const out = process.argv[2] || '/home/user/purrbi/docs/screens';
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
  // Screenshot harness only: answer the template's connectivity pings (blocked in this sandbox).
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|fonts\.(gstatic|googleapis)\.com)/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') console.log('console error:', m.text().slice(0, 200)); });
  await page.goto('http://127.0.0.1:8085/', { waitUntil: 'load' });
  await page.waitForTimeout(9000);
  await page.screenshot({ path: `${out}/01-welcome.png` });
  // Simulated signed-in state (template flags) to look at the shell; real auth comes with Firebase.
  await page.evaluate(() => { localStorage.setItem('flutter.ff_isLogin', 'true'); localStorage.setItem('flutter.ff_isIntro', 'true'); });
  await page.goto('http://127.0.0.1:8085/', { waitUntil: 'load' });
  await page.waitForTimeout(9000);
  await page.screenshot({ path: `${out}/02-home.png` });
  await page.mouse.click(196, 812); // centre scan button
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${out}/03-scan.png` });
  await page.goto('http://127.0.0.1:8085/', { waitUntil: 'load' });
  await page.waitForTimeout(8000);
  await page.mouse.click(353, 812); // profile tab
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${out}/04-profile.png` });
  await browser.close();
  server.close();
})();
