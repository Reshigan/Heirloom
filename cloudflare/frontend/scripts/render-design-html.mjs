import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1200 } });
await p.goto('file:///Users/reshigan/Heirloom/Heirloom_Design.html', { waitUntil: 'networkidle', timeout: 60000 }).catch(e=>console.log('nav', e.message));
await p.waitForTimeout(3000);
await p.screenshot({ path: '/private/tmp/heirloom-shots/design-canvas.png', fullPage: false });
const txt = await p.evaluate(() => document.body.innerText.slice(0,400));
console.log('VISIBLE TEXT:', JSON.stringify(txt));
await b.close();
