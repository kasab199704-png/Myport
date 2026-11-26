// ภาพจำลองหน้าแอป Myport ด้วยข้อมูลสมมติ (ไม่ใช้ข้อมูลจริงของผู้ใช้)
// ใช้:  node preview.js <โฟลเดอร์ที่มี index.html + market.json> <out.png> [today|port|plan|salary] [light|dark] [selector ที่จะแตะก่อนถ่าย]
const {chromium, devices} = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const [dir, out = 'preview.png', tab = 'today', theme = 'light', click = ''] = process.argv.slice(2);
if (!dir) { console.log('usage: node preview.js <dir> <out.png> [tab]'); process.exit(1); }
const DEMO = {btc:{qty:0.01,cost:0},gold:{qty:4,cost:0,offset:0},
  stocks:[{sym:"BDMS",shares:1000,cost:25,group:"hospital"},{sym:"WHART",shares:3000,cost:10,group:"reit"}],
  gpf:{balance:300000,updated:"",alloc:{}},hi:{balance:50000,rate:1.5},normal:{balance:20000},
  jars:[{name:"เที่ยว",balance:5000,goal:20000}],tab,seenToday:1,
  hist:Object.fromEntries(Array.from({length:45},(_,i)=>{const d=new Date(Date.now()-(45-i)*864e5);return [d.toISOString().slice(0,10),Math.round(300000*(1+Math.sin(i/7)*0.03+i*0.001))];})),
  
  plan:{gold:35,cash:10,btc:10,hospital:14,food:12,bank:10,reit:9,goldCap:50,band:5},dca:[{id:'a',date:new Date().toISOString().slice(0,7)+'-01',amount:10000,alloc:{cash:10000}},{id:'b',date:'2026-10-01',amount:8000,alloc:{gold:8000}}]};
const srv = http.createServer((q, r) => {
  const f = path.join(dir, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200); r.end(d); } });
}).listen(0, async () => {
  const b = await chromium.launch();
  const c = await b.newContext({...devices['iPhone 13'], colorScheme: theme});
  const p = await c.newPage();
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.route('https://open.er-api.com/**', r => r.fulfill({json:{rates:{THB:34},time_last_update_unix:1764100000}}));
  await p.addInitScript(d => {
    localStorage.setItem('myPortfolio.v1', JSON.stringify(d));
    window.WebSocket = class { constructor(){ setTimeout(()=>{ const m=(s,c,o)=>this.onmessage({data:JSON.stringify({data:{s,c,o}})});
      m('BTCUSDT','60000','59000'); m('PAXGUSDT','3600','3550'); }, 100); } close(){} };
  }, DEMO);
  await p.goto(`http://localhost:${srv.address().port}/index.html`);
  await p.waitForTimeout(1500);
  if (click) { await p.click(click); await p.waitForTimeout(400); }
  await p.screenshot({path: out, fullPage: true});
  console.log('saved', out);
  await b.close(); srv.close();
});
