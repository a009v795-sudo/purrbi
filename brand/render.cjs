// Renders Purrbi brand PNGs from the owner's prototype logo (paw-in-magnifier mark, prototype L552-563).
const { chromium } = require('playwright');
const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <circle cx="21" cy="21" r="15" fill="#E0F2EF" stroke="#0E8A80" stroke-width="3.4"/>
  <rect x="32.2" y="30" width="13" height="6.4" rx="3.2" transform="rotate(45 32.2 30)" fill="#0E8A80"/>
  <ellipse cx="21" cy="24.6" rx="4.9" ry="4" fill="#0E8A80"/>
  <circle cx="15.2" cy="18.6" r="2.3" fill="#0E8A80"/><circle cx="20" cy="15.6" r="2.3" fill="#0E8A80"/>
  <circle cx="24.9" cy="16.6" r="2.3" fill="#0E8A80"/><circle cx="27.9" cy="21" r="2.1" fill="#0E8A80"/>
  <path d="M36 10.5c1.6-2.4 5-1.4 5 1.2 0 1.9-2.6 3.6-5 5-2.4-1.4-5-3.1-5-5 0-2.6 3.4-3.6 5-1.2z" fill="#EE7A5C"/>
</svg>`;
const mark = (size, extra = '') => MARK.replace('<svg ', `<svg width="${size}" height="${size}" ${extra} `);
const jobs = [
  { file: 'purrbi_logo.png', w: 512, h: 512, transparent: true, html: `<div style="display:flex;align-items:center;justify-content:center;width:512px;height:512px">${mark(480)}</div>` },
  { file: 'purrbi_app_icon.png', w: 1024, h: 1024, transparent: false, html: `<div style="display:flex;align-items:center;justify-content:center;width:1024px;height:1024px;background:#FCF7EE">${mark(720)}</div>` },
  { file: 'purrbi_adaptive_foreground.png', w: 1024, h: 1024, transparent: true, html: `<div style="display:flex;align-items:center;justify-content:center;width:1024px;height:1024px">${mark(560)}</div>` },
  { file: 'purrbi_error_image.png', w: 800, h: 600, transparent: false, html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;width:800px;height:600px;background:#EEF0F2;font-family:sans-serif;color:#8A93A0;font-size:28px;font-weight:700"><div style="opacity:.55">${mark(220)}</div><div>Image unavailable</div></div>` },
];
(async () => {
  const browser = await chromium.launch();
  for (const j of jobs) {
    const page = await browser.newPage({ viewport: { width: j.w, height: j.h } });
    await page.setContent(`<html><body style="margin:0;background:transparent">${j.html}</body></html>`);
    await page.screenshot({ path: j.file, omitBackground: j.transparent });
    await page.close();
    console.log('wrote', j.file);
  }
  await browser.close();
})();
