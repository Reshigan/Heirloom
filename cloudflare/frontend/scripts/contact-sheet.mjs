import { chromium } from 'playwright';
const D='/private/tmp/heirloom-shots';
const pairs=[
  ['HOME  /', `${D}/live/home.png`, `${D}/m-home.png`],
  ['THRESHOLD  /loom', `${D}/live/threshold.png`, `${D}/m-threshold.png`],
  ['PRICING  /pricing', `${D}/live/pricing.png`, `${D}/m-pricing.png`],
];
const f=p=>'file://'+p;
const rows=pairs.map(([t,l,m])=>`
<div class="row">
  <div class="lbl">${t}</div>
  <div class="pair">
    <figure><img src="${f(l)}"><figcaption>LIVE heirloom.blue</figcaption></figure>
    <figure><img src="${f(m)}"><figcaption>MOCKUP cosmic</figcaption></figure>
  </div>
</div>`).join('');
const html=`<!doctype html><meta charset=utf8><style>
body{background:#0e0e0c;color:#f4ecd8;font-family:-apple-system,sans-serif;margin:0;padding:30px}
.row{margin-bottom:38px}.lbl{font:600 14px monospace;letter-spacing:2px;color:#cf935a;margin-bottom:10px}
.pair{display:flex;gap:24px}figure{margin:0}figcaption{font:11px monospace;color:#b07a4a;text-align:center;margin-top:6px;letter-spacing:1px}
img{height:560px;display:block;border:1px solid rgba(244,236,216,.12)}
</style>${rows}`;
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1000,height:1900},deviceScaleFactor:1.5});
await p.setContent(html,{waitUntil:'networkidle'});
await p.waitForTimeout(800);
await p.screenshot({path:`${D}/CONTACT-public.png`,fullPage:true});
await b.close(); console.log('→',`${D}/CONTACT-public.png`);
