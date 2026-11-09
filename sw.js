const V='mohitu-v2';
const SHELL=['./','index.html','manifest.webmanifest','bg.jpg','face.jpg','icon-192.png','icon-512.png','exceljs.min.js','jspdf.umd.min.js','jspdf.plugin.autotable.min.js','bangers.woff2','fredoka-400.woff2','fredoka-500.woff2','fredoka-600.woff2','fredoka-700.woff2'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===location.origin&&(r.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('index.html'))){
    // network first for the page so updates arrive, cache fallback offline
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put('index.html',cp));return res}).catch(()=>caches.match('index.html')));return}
  e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res})));
});
function todayStr(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function idb(){return new Promise((res,rej)=>{const r=indexedDB.open('mohitu',1);r.onupgradeneeded=()=>{const d=r.result;const s=d.createObjectStore('entries',{keyPath:'id'});s.createIndex('date','date');d.createObjectStore('kv',{keyPath:'k'})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function check(){
  const d=await idb();
  const count=await new Promise(r=>{const q=d.transaction('entries').objectStore('entries').index('date').count(todayStr());q.onsuccess=()=>r(q.result);q.onerror=()=>r(1)});
  const set=await new Promise(r=>{const q=d.transaction('kv').objectStore('kv').get('settings');q.onsuccess=()=>r(q.result&&q.result.v||{});q.onerror=()=>r({})});
  const [h,m]=(set.remind||'22:00').split(':').map(Number);const n=new Date();
  if(count===0&&n.getHours()*60+n.getMinutes()>=h*60+m-60){
    await self.registration.showNotification('Oye Mohitu! 🚨',{body:'Aaj ka kharcha likha kya? Tap to add 💸',icon:'icon-192.png',badge:'icon-192.png',tag:'nag'});
  }
}
self.addEventListener('periodicsync',e=>{if(e.tag==='daily-reminder')e.waitUntil(check())});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window'}).then(cs=>{for(const c of cs){if('focus' in c)return c.focus()}return self.clients.openWindow('./')}))});
