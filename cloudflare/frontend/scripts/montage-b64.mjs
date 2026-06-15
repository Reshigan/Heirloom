import { chromium } from 'playwright';
import fs from 'node:fs';
const A='/private/tmp/heirloom-shots/authed';
const M='/Users/reshigan/Heirloom/.higgsfield/golive/today';
const pairs=[
  ['HOME  /loom/pwa', `${A}/pwa.png`, `${M}/cosmic-home.png`],
  ['THREAD  /loom/weft', `${A}/weft.png`, `${M}/cosmic-thread.png`],
  ['VOICE  /loom/voice', `${A}/voice.png`, `${M}/cosmic-voice.png`],
  ['FAMILY  /loom/kin', `${A}/kin.png`, `${M}/cosmic-tree.png`],
  ['SETTINGS  /settings', `${A}/settings.png`, `${M}/cosmic-settings.png`],
  ['COMPOSER  /compose', `${A}/compose.png`, `${M}/cosmic-composer.png`],
  ['SEARCH  /search', `${A}/search.png`, `${M}/cosmic-search.png`],
];
const uri=p=>{try{return 'data:image/png;base64,'+fs.readFileSync(p).toString('base64');}catch{return '';}};
const rows=pairs.map(([t,l,m])=>`<div class=row><div class=lbl>${t}</div><div class=pair>
<figure><img src="${uri(l)}"><figcaption>LIVE (deployed code)</figcaption></figure>
<figure><img src="${uri(m)}"><figcaption>MOCKUP target</figcaption></figure></div></div>`).join('');
const html=`<!doctype html><meta charset=utf8><style>
body{background:#0e0e0c;color:#f4ecd8;font-family:-apple-system,sans-serif;margin:0;padding:26px}
.row{margin-bottom:30px}.lbl{font:600 13px monospace;letter-spacing:2px;color:#cf935a;margin-bottom:8px}
.pair{display:flex;gap:18px}figure{margin:0}figcaption{font:10px monospace;color:#b07a4a;text-align:center;margin-top:5px;letter-spacing:1px}
img{height:430px;display:block;border:1px solid rgba(244,236,216,.14)}</style>${rows}`;
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:560,height:3300},deviceScaleFactor:1.4});
await p.setContent(html,{waitUntil:'load'}); await p.waitForTimeout(500);
await p.screenshot({path:'/private/tmp/heirloom-shots/CONTACT-authed.png',fullPage:true});
await b.close(); console.log('done');
