// Yönetim paneli: görüşmeleri Google Sheet'ten çekip müşteri-bazlı, senaryo-etiketli panelde gösterir.
import { CONFIG } from "./config.js";

// Apps Script doGet'ten satırları çeker
export async function fetchRows() {
  if (!CONFIG.logWebhookUrl || !CONFIG.panelKey) return [];
  const url = `${CONFIG.logWebhookUrl}?key=${encodeURIComponent(CONFIG.panelKey)}`;
  const res = await fetch(url, { redirect: "follow" });
  const data = await res.json();
  return Array.isArray(data.rows) ? data.rows : [];
}

// ---- Ortak stil parçası ----
const BASE_CSS = `
  :root{--bg:#0f1720;--card:#1b2733;--card2:#15202b;--accent:#16a34a;--text:#e7edf3;--muted:#93a4b3;--line:#27333f;--err:#ef4444}
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;background:var(--bg);color:var(--text)}
  a{color:inherit}
`;

// ---- Giriş sayfası ----
export function renderLogin(error) {
  return `<!doctype html>
<html lang="tr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Beypazarı İncisi — Giriş</title>
<style>${BASE_CSS}
  body{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
  .box{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:28px 24px;width:100%;max-width:360px}
  h1{font-size:20px;margin:0 0 4px}.sub{color:var(--muted);font-size:13px;margin:0 0 20px}
  label{display:block;font-size:13px;color:var(--muted);margin:14px 0 6px}
  input{width:100%;padding:11px 12px;border-radius:10px;border:1px solid var(--line);background:#0f1720;color:var(--text);font-size:15px;outline:none}
  input:focus{border-color:var(--accent)}
  button{width:100%;margin-top:20px;padding:12px;border:0;border-radius:10px;background:var(--accent);color:#06210f;font-weight:700;font-size:15px;cursor:pointer}
  .err{background:rgba(239,68,68,.12);border:1px solid var(--err);color:#fca5a5;padding:10px 12px;border-radius:10px;font-size:13px;margin-bottom:8px}
</style></head><body>
  <div class="box">
    <h1>🌿 Beypazarı İncisi</h1>
    <p class="sub">Panele devam etmek için giriş yapın</p>
    ${error ? '<div class="err">Kullanıcı adı veya şifre hatalı</div>' : ""}
    <form method="POST" action="/panel/login">
      <label for="user">Kullanıcı adı</label>
      <input id="user" name="user" autocomplete="username" autofocus required>
      <label for="pass">Şifre</label>
      <input id="pass" name="pass" type="password" autocomplete="current-password" required>
      <button type="submit">Giriş yap</button>
    </form>
  </div>
</body></html>`;
}

// ---- Şifre değiştir sayfası ----
export function renderChangePass(errCode) {
  const errs = {
    mevcut: "Mevcut şifre yanlış.",
    kisa: "Yeni şifre en az 6 karakter olmalı.",
    eslesme: "Yeni şifreler birbiriyle eşleşmiyor.",
    kayit: "Şifre kaydedilemedi. Birazdan tekrar deneyin.",
  };
  const msg = errs[errCode] || "";
  return `<!doctype html>
<html lang="tr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Şifre Değiştir — Beypazarı İncisi</title>
<style>${BASE_CSS}
  body{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
  .box{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:28px 24px;width:100%;max-width:380px}
  h1{font-size:19px;margin:0 0 4px}.sub{color:var(--muted);font-size:13px;margin:0 0 18px}
  label{display:block;font-size:13px;color:var(--muted);margin:14px 0 6px}
  input{width:100%;padding:11px 12px;border-radius:10px;border:1px solid var(--line);background:#0f1720;color:var(--text);font-size:15px;outline:none}
  input:focus{border-color:var(--accent)}
  button{width:100%;margin-top:20px;padding:12px;border:0;border-radius:10px;background:var(--accent);color:#06210f;font-weight:700;font-size:15px;cursor:pointer}
  .err{background:rgba(239,68,68,.12);border:1px solid var(--err);color:#fca5a5;padding:10px 12px;border-radius:10px;font-size:13px;margin-bottom:8px}
  .back{display:inline-block;margin-top:16px;color:var(--muted);font-size:13px;text-decoration:none}
</style></head><body>
  <div class="box">
    <h1>🔑 Şifre Değiştir</h1>
    <p class="sub">Yeni şifre kalıcı olarak kaydedilir; değişince tekrar giriş istenir.</p>
    ${msg ? '<div class="err">' + msg + "</div>" : ""}
    <form method="POST" action="/panel/changepass">
      <label for="current">Mevcut şifre</label>
      <input id="current" name="current" type="password" autocomplete="current-password" required>
      <label for="yeni">Yeni şifre</label>
      <input id="yeni" name="yeni" type="password" autocomplete="new-password" minlength="6" required>
      <label for="yeni2">Yeni şifre (tekrar)</label>
      <input id="yeni2" name="yeni2" type="password" autocomplete="new-password" minlength="6" required>
      <button type="submit">Şifreyi güncelle</button>
    </form>
    <a class="back" href="/panel">← Panele dön</a>
  </div>
</body></html>`;
}

// ---- Ana panel (müşteri-bazlı + senaryo etiketli SPA) ----
export function renderPanel(rows, humanNumbers) {
  const json = JSON.stringify(rows).replace(/</g, "\\u003c");
  const humanJson = JSON.stringify(humanNumbers || []).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="tr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Beypazarı İncisi Panel</title>
<style>${BASE_CSS}
  .app{display:flex;min-height:100vh}
  .side{width:230px;flex-shrink:0;background:var(--card2);border-right:1px solid var(--line);display:flex;flex-direction:column;padding:16px 12px}
  .brand{font-size:18px;font-weight:800;line-height:1.1;padding:6px 8px 16px}
  .brand span{font-size:12px;color:var(--muted);font-weight:600}
  .side nav{display:flex;flex-direction:column;gap:4px}
  .side nav a{display:block;padding:10px 12px;border-radius:10px;font-size:14px;color:var(--muted);cursor:pointer;text-decoration:none}
  .side nav a:hover{background:var(--card);color:var(--text)}
  .side nav a.active{background:var(--accent);color:#06210f;font-weight:700}
  .side-foot{margin-top:auto;display:flex;flex-direction:column;gap:4px;padding-top:14px;border-top:1px solid var(--line)}
  .side-foot a{padding:9px 12px;border-radius:10px;font-size:13px;color:var(--muted);text-decoration:none}
  .side-foot a:hover{background:var(--card);color:var(--text)}
  .main{flex:1;min-width:0;padding:18px 22px}
  .top{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:16px}
  .top h1{font-size:20px;margin:0}.upd{color:var(--muted);font-size:12px}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:18px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px}
  .card .n{font-size:28px;font-weight:800}.card .l{color:var(--muted);font-size:13px;margin-top:2px}
  .card.green .n{color:#22c55e}.card.blue .n{color:#38bdf8}.card.amber .n{color:#fbbf24}
  .sec-title{font-size:14px;color:var(--muted);margin:18px 0 10px;font-weight:600}
  .bars{display:flex;flex-direction:column;gap:8px}
  .bar{display:grid;grid-template-columns:160px 1fr 40px;align-items:center;gap:10px;font-size:13px}
  .bar .track{height:10px;background:var(--card);border-radius:999px;overflow:hidden;border:1px solid var(--line)}
  .bar .fill{height:100%;border-radius:999px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
  .cust{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;cursor:pointer;transition:border-color .15s}
  .cust:hover{border-color:var(--accent)}
  .cust .row1{display:flex;align-items:center;justify-content:space-between;gap:8px}
  .cust .nm{font-weight:700;font-size:15px}
  .cust .ph{color:#22c55e;font-size:13px;text-decoration:none}
  .cust .meta{color:var(--muted);font-size:12px;margin:6px 0 8px}
  .chips{display:flex;flex-wrap:wrap;gap:5px}
  .chip{font-size:11px;padding:2px 8px;border-radius:999px;font-weight:600;border:1px solid transparent}
  .chip.lead{background:var(--accent);color:#06210f}
  .filterbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center}
  .fchip{font-size:12px;padding:6px 11px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--text);cursor:pointer}
  .fchip.active{background:var(--accent);border-color:var(--accent);color:#06210f;font-weight:700}
  input.search{padding:9px 12px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--text);font-size:14px;outline:none;min-width:220px}
  input.search:focus{border-color:var(--accent)}
  .scn-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
  .scn-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;cursor:pointer}
  .scn-card:hover{border-color:var(--accent)}
  .scn-card .big{font-size:30px;font-weight:800}.scn-card .nm{font-size:14px;margin-top:4px}
  .tbl{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden}
  .tbl th,.tbl td{padding:10px 12px;text-align:left;font-size:13px;border-bottom:1px solid var(--line);vertical-align:top}
  .tbl th{color:var(--muted);font-weight:600;background:var(--card2)}
  .tbl tr.lead{background:rgba(34,197,94,.07)}
  .badge{background:var(--accent);color:#06210f;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700}
  .msg{white-space:pre-wrap;max-width:340px;color:#cbd5e1}
  .empty{color:var(--muted);text-align:center;padding:40px}
  .toast{background:rgba(34,197,94,.14);border:1px solid var(--accent);color:#86efac;padding:10px 14px;border-radius:10px;font-size:13px;margin-bottom:14px}
  .modal{position:fixed;inset:0;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;padding:20px;z-index:50}
  .modal.open{display:flex}
  .sheet{background:var(--card);border:1px solid var(--line);border-radius:16px;max-width:640px;width:100%;max-height:86vh;
    display:flex;flex-direction:column;padding:0;overflow:hidden}
  .sheet-head{padding:20px 20px 12px;border-bottom:1px solid var(--line)}
  .sheet-head .x{float:right;cursor:pointer;color:var(--muted);font-size:22px;line-height:1;padding:4px}
  .sheet-body{flex:1;overflow-y:auto;padding:14px 20px}
  .sheet-foot{border-top:1px solid var(--line);padding:10px 14px;background:var(--card2)}
  .thread{display:flex;flex-direction:column;gap:12px}
  .turn .q{background:#0f1720;border:1px solid var(--line);border-radius:10px;padding:9px 11px;font-size:13px;white-space:pre-wrap}
  .turn .a{background:var(--card2);border:1px solid var(--line);border-radius:10px;padding:9px 11px;font-size:13px;white-space:pre-wrap;margin-top:6px;color:#cbd5e1}
  .turn .h{background:rgba(245,158,11,.14);border:1px solid #f59e0b55;color:#fcd34d}
  .turn .tm{color:var(--muted);font-size:11px;margin-bottom:4px}
  .pausebar{display:flex;align-items:center;justify-content:space-between;gap:8px;background:rgba(245,158,11,.12);
    border:1px solid #f59e0b55;color:#fcd34d;border-radius:10px;padding:8px 12px;font-size:13px;margin-bottom:10px}
  .btn-resume{background:transparent;border:1px solid #f59e0b88;color:#fcd34d;border-radius:8px;padding:5px 10px;font-size:12px;cursor:pointer;flex-shrink:0}
  .sendrow{display:flex;gap:8px;align-items:flex-end}
  .sendrow textarea{flex:1;resize:none;border-radius:10px;border:1px solid var(--line);background:#0f1720;color:var(--text);
    padding:9px 11px;font-size:14px;font-family:inherit;outline:none;max-height:100px}
  .sendrow textarea:focus{border-color:var(--accent)}
  .btn-send{background:var(--accent);color:#06210f;border:0;border-radius:10px;padding:10px 16px;font-weight:700;font-size:13px;cursor:pointer;flex-shrink:0}
  .btn-send:disabled{opacity:.6;cursor:default}
  .chip.human{background:rgba(245,158,11,.16);color:#fbbf24;border-color:#f59e0b44}
  .tblwrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
  .hint{color:var(--muted);font-size:13px;margin:-8px 0 14px;line-height:1.5}
  .filter-banner{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;
    background:rgba(34,197,94,.1);border:1px solid var(--accent);color:#86efac;border-radius:10px;
    padding:9px 13px;font-size:13px;margin-bottom:12px}
  .filter-banner button{background:transparent;border:1px solid #86efac66;color:#86efac;border-radius:8px;
    padding:5px 10px;font-size:12px;cursor:pointer}
  .scn-hint{color:var(--muted);font-size:12px;margin-top:8px;text-align:center}
  .jump-banner{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;
    background:rgba(56,189,248,.1);border:1px solid #38bdf855;color:#7dd3fc;border-radius:10px;
    padding:8px 12px;font-size:12px;margin-top:10px}
  .jump-banner button{background:transparent;border:1px solid #7dd3fc66;color:#7dd3fc;border-radius:8px;
    padding:4px 9px;font-size:12px;cursor:pointer;flex-shrink:0}
  .turn.hl{background:rgba(34,197,94,.09);border:1px solid var(--accent);border-radius:12px;padding:8px;margin:-8px}
  .hltag{color:#22c55e;font-size:11px;font-weight:700;margin-bottom:4px}
  @media(max-width:760px){
    .app{flex-direction:column}
    .side{width:auto;flex-direction:row;flex-wrap:wrap;border-right:0;border-bottom:1px solid var(--line);padding:10px}
    .side nav{flex-direction:row;flex-wrap:wrap}
    .brand{width:100%}.side-foot{margin:0;border:0;flex-direction:row;flex-wrap:wrap}
    .bar{grid-template-columns:110px 1fr 34px;font-size:12px}
    .main{padding:14px}
    .modal{padding:0}
    .sheet{max-width:100%;width:100%;height:100%;max-height:100%;border-radius:0}
    input.search{min-width:0;width:100%}
    .cards{grid-template-columns:repeat(2,1fr)}
  }
</style></head><body>
<div class="app">
  <aside class="side">
    <div class="brand">🌿 Beypazarı <span>İncisi</span></div>
    <nav>
      <a data-v="overview" class="active">📊 Genel Bakış</a>
      <a data-v="customers">👥 Müşteriler</a>
      <a data-v="leads">🔔 Talepler</a>
      <a data-v="scenarios">🏷️ Senaryolar</a>
      <a data-v="log">💬 Tüm Görüşmeler</a>
    </nav>
    <div class="side-foot">
      <a href="/panel/sifre">🔑 Şifre değiştir</a>
      <a href="/panel/logout">🚪 Çıkış</a>
    </div>
  </aside>
  <main class="main">
    <div class="top"><h1 id="vtitle">Genel Bakış</h1><div class="upd" id="upd"></div></div>
    <div id="content"></div>
  </main>
</div>
<div class="modal" id="modal"><div class="sheet" id="sheet"></div></div>
<script>
var ROWS = ${json};
var HUMAN = ${humanJson};
var view = "overview", scnFilter = null, q = "", openKey = null;
var SCN = {
  hediye:{t:"🎁 Hediye Tatil",c:"#22c55e"},
  rezervasyon:{t:"📅 Rezervasyon",c:"#38bdf8"},
  oda:{t:"🏠 Oda & Konaklama",c:"#a78bfa"},
  havuz:{t:"🏊 Havuz & Termal",c:"#2dd4bf"},
  ulasim:{t:"🚌 Ulaşım & Konum",c:"#fbbf24"},
  fiyat:{t:"💰 Fiyat",c:"#f472b6"},
  devre:{t:"🔄 Devre Tatil",c:"#fb923c"},
  grup:{t:"👨‍👩‍👧 Grup / Toplu",c:"#60a5fa"},
  sikayet:{t:"⚠️ Şikayet",c:"#ef4444"},
  iptal:{t:"🚫 İptal / Vazgeçme",c:"#f87171"},
  sss:{t:"❓ Sık Sorulan",c:"#94a3b8"},
  genel:{t:"💬 Genel / Diğer",c:"#9ca3af"}
};
function esc(t){ return String(t==null?"":t).replace(/[&<>]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c];}); }
function digits(num){ return String(num||"").replace(/\\D/g,""); }
function fmtDate(s){ try{ var d=new Date(s); return isNaN(d)?(s||""):d.toLocaleString("tr-TR"); }catch(e){ return s||""; } }
function isToday(s){ try{ var d=new Date(s),n=new Date(); return d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate(); }catch(e){ return false; } }
function fmtRel(s){ try{ var d=new Date(s),now=new Date(),ms=now-d,mi=Math.floor(ms/60000); if(mi<1)return "az önce"; if(mi<60)return mi+" dk önce"; var h=Math.floor(mi/60); if(h<24)return h+" saat önce"; var g=Math.floor(h/24); if(g<30)return g+" gün önce"; return d.toLocaleDateString("tr-TR"); }catch(e){ return ""; } }
function waLink(num){ var n=digits(num); return n?'<a class="ph" href="https://wa.me/'+n+'" target="_blank" onclick="event.stopPropagation()">'+esc(num)+'</a>':esc(num); }
function isPaused(numRaw){
  var target=digits(numRaw);
  for(var i=0;i<HUMAN.length;i++){ if(digits(HUMAN[i])===target) return true; }
  return false;
}
function classify(mesaj){
  var tags={}, m=String(mesaj||"").toLowerCase();
  function add(k){ tags[k]=true; }
  if(m.indexOf("hediye tatil")===0 || m.indexOf("hediye")===0) add("hediye");
  if(m.indexOf("rezervasyon")===0) add("rezervasyon");
  var d=m.trim();
  if(/^[1-8]$/.test(d)){ var map={"1":"hediye","2":"genel","3":"oda","4":"havuz","5":"ulasim","6":"genel","7":"sss","8":"rezervasyon"}; add(map[d]); }
  function has(re){ return re.test(m); }
  if(has(/hediye|bedava|ücretsiz tatil|ucretsiz tatil/)) add("hediye");
  if(has(/rezerv|müsait|musait|kalmak ist|gelmek ist|konaklamak ist|oda ayır|oda ayir/)) add("rezervasyon");
  if(has(/oda|daire|kapasite|kaç kişi|kac kisi|kişi say|kisi say|yatak|1\\+1|s[uü]it/)) add("oda");
  if(has(/havuz|termal|sauna|hamam|aquapark|spa|kaplıca|kaplica/)) add("havuz");
  if(has(/ulaşım|ulasim|otobüs|otobus|nasıl gel|nasil gel|\\byol\\b|transfer|adres|konum|nerede|kaç km|kac km|servis/)) add("ulasim");
  if(has(/fiyat|ücret|ucret|ne kadar|kaç para|kac para|kaç tl|kac tl|kaça|kaca|indirim|kampanya/)) add("fiyat");
  if(has(/devre|üyelik|uyelik|\\brci\\b|tapu|devremülk|devremulk/)) add("devre");
  if(has(/grup|toplu|kalabalık|kalabalik|kafile|\\btur\\b|şirket|sirket|arkadaş grub|arkadas grub/)) add("grup");
  if(has(/şikayet|sikayet|memnun değil|memnun degil|rezalet|berbat|mağdur|magdur|kızgın|kizgin|kötü|kotu|\\biade\\b/)) add("sikayet");
  if(has(/iptal|vazgeç|vazgec|cayma/)) add("iptal");
  var keys=Object.keys(tags); if(keys.length===0) keys=["genel"]; return keys;
}
function customers(){
  var map={}, order=[];
  for(var i=0;i<ROWS.length;i++){
    var r=ROWS[i], key=digits(r.numara)||String(r.numara||"?");
    if(!map[key]){ map[key]={key:key,numara:r.numara,isim:"",rows:[],scn:{},lead:false,first:r.tarih,last:r.tarih}; order.push(key); }
    var c=map[key];
    c.rows.push(r);
    if(r.isim && String(r.isim).trim()) c.isim=r.isim;
    var lead=String(r.talep).toUpperCase()==="EVET"; if(lead) c.lead=true;
    var tags=classify(r.mesaj); for(var j=0;j<tags.length;j++) c.scn[tags[j]]=true;
    if(new Date(r.tarih)<new Date(c.first)) c.first=r.tarih;
    if(new Date(r.tarih)>new Date(c.last)) c.last=r.tarih;
  }
  var arr=order.map(function(k){ return map[k]; });
  arr.sort(function(a,b){ return new Date(b.last)-new Date(a.last); });
  return arr;
}
function scnChips(scnObj){
  var keys=Object.keys(scnObj), out="";
  for(var i=0;i<keys.length;i++){ var s=SCN[keys[i]]; if(!s)continue;
    out+='<span class="chip" style="color:'+s.c+';border-color:'+s.c+'33;background:'+s.c+'1a">'+s.t+'</span>'; }
  return out;
}
function custCard(c){
  var name=esc(c.isim||"İsimsiz");
  var lead=c.lead?'<span class="chip lead">🔔 Talep</span>':"";
  var human=isPaused(c.numara)?'<span class="chip human">🧑‍💼 Temsilci</span>':"";
  return '<div class="cust" onclick="openCust(\\''+c.key+'\\')">'+
    '<div class="row1"><div class="nm">'+name+'</div><div class="chips">'+lead+human+'</div></div>'+
    '<div>'+waLink(c.numara)+'</div>'+
    '<div class="meta">'+c.rows.length+' mesaj · son '+fmtRel(c.last)+'</div>'+
    '<div class="chips">'+scnChips(c.scn)+'</div></div>';
}
function setView(v){ view=v; if(v!=="customers"&&v!=="scenarios") scnFilter=null;
  var as=document.querySelectorAll(".side nav a"); for(var i=0;i<as.length;i++) as[i].classList.toggle("active",as[i].getAttribute("data-v")===v);
  render();
}
function render(){
  var titles={overview:"Genel Bakış",customers:"Müşteriler",leads:"Talepler",scenarios:"Senaryolar",log:"Tüm Görüşmeler"};
  document.getElementById("vtitle").textContent=titles[view]||"Panel";
  document.getElementById("upd").textContent="Güncellendi: "+new Date().toLocaleTimeString("tr-TR")+" · otomatik yenilenir";
  var el=document.getElementById("content"), toast="";
  if(location.search.indexOf("msg=sifre")>=0){ toast='<div class="toast">✅ Şifre güncellendi.</div>'; }
  if(view==="overview") el.innerHTML=toast+overview();
  else if(view==="customers") el.innerHTML=toast+customersView();
  else if(view==="leads") el.innerHTML=toast+leadsView();
  else if(view==="scenarios") el.innerHTML=toast+scenariosView();
  else el.innerHTML=toast+logView();
}
function overview(){
  var cs=customers(), leads=cs.filter(function(c){return c.lead;});
  var tToday=ROWS.filter(function(r){return isToday(r.tarih);}).length;
  var cToday=cs.filter(function(c){return isToday(c.last);}).length;
  var h='<div class="cards">'+
    card(cs.length,"Toplam müşteri","")+
    card(ROWS.length,"Toplam mesaj","blue")+
    card(cToday,"Bugün aktif müşteri","amber")+
    card(leads.length,"Toplam talep","green")+
    card(HUMAN.length,"Temsilci modunda","amber")+'</div>';
  // senaryo dagilimi
  var counts={}; for(var i=0;i<cs.length;i++){ var ks=Object.keys(cs[i].scn); for(var j=0;j<ks.length;j++) counts[ks[j]]=(counts[ks[j]]||0)+1; }
  var max=1; var keys=Object.keys(counts); for(var k=0;k<keys.length;k++) if(counts[keys[k]]>max) max=counts[keys[k]];
  keys.sort(function(a,b){return counts[b]-counts[a];});
  var bars='';
  for(var b=0;b<keys.length;b++){ var s=SCN[keys[b]]; if(!s)continue; var pct=Math.round(counts[keys[b]]/max*100);
    bars+='<div class="bar"><div style="color:'+s.c+'">'+s.t+'</div><div class="track"><div class="fill" style="width:'+pct+'%;background:'+s.c+'"></div></div><div>'+counts[keys[b]]+'</div></div>'; }
  h+='<div class="sec-title">Senaryo dağılımı (müşteri sayısı)</div><div class="hint">Detaylı incelemek için sol menüden <b>🏷️ Senaryolar</b>\\'a gidin.</div><div class="bars">'+(bars||'<div class="empty">Veri yok</div>')+'</div>';
  h+='<div class="sec-title">Son müşteriler</div><div class="grid">';
  for(var c=0;c<Math.min(cs.length,6);c++) h+=custCard(cs[c]);
  h+='</div>'; if(cs.length===0) h+='<div class="empty">Henüz görüşme yok.</div>';
  return h;
}
function card(n,l,cls){ return '<div class="card '+(cls||"")+'"><div class="n">'+n+'</div><div class="l">'+l+'</div></div>'; }
function customersView(){
  var cs=customers();
  var banner='';
  if(scnFilter && SCN[scnFilter]){
    banner='<div class="filter-banner"><div>🏷️ <b>'+SCN[scnFilter].t+'</b> ile ilgili müşteriler gösteriliyor — birine tıklayınca doğrudan o konudaki mesaja gidersiniz.</div>'+
      '<button onclick="scnFilter=null;render()">Filtreyi temizle ✕</button></div>';
  }
  var chips='<button class="fchip'+(scnFilter?"":" active")+'" onclick="scnFilter=null;render()">Tüm senaryolar</button>';
  var sk=Object.keys(SCN);
  for(var i=0;i<sk.length;i++){ var s=SCN[sk[i]]; chips+='<button class="fchip'+(scnFilter===sk[i]?" active":"")+'" onclick="scnFilter=\\''+sk[i]+'\\';render()">'+s.t+'</button>'; }
  var h=banner+'<div class="filterbar"><input class="search" placeholder="İsim veya numara ara..." value="'+esc(q)+'" oninput="q=this.value;render()"></div>'+
    '<div class="filterbar">'+chips+'</div>';
  var list=cs.filter(function(c){
    if(scnFilter && !c.scn[scnFilter]) return false;
    if(q){ var qq=q.toLowerCase(); if(String(c.isim||"").toLowerCase().indexOf(qq)<0 && digits(c.numara).indexOf(digits(q))<0) return false; }
    return true;
  });
  h+='<div class="grid">'; for(var c=0;c<list.length;c++) h+=custCard(list[c]); h+='</div>';
  if(list.length===0) h+='<div class="empty">Eşleşen müşteri yok.</div>';
  return h;
}
function leadsView(){
  var cs=customers().filter(function(c){return c.lead;});
  var hint='<div class="hint">🔔 Yalnızca <b>başvuru formunu tamamlayan</b> müşteriler burada listelenir — soru sormak veya sohbet etmek bir müşteriyi buraya düşürmez.</div>';
  if(cs.length===0) return hint+'<div class="empty">Henüz talep (başvuru) yok.</div>';
  var h='<div class="grid">'; for(var c=0;c<cs.length;c++) h+=custCard(cs[c]); h+='</div>'; return hint+h;
}
function scenariosView(){
  var cs=customers(), counts={};
  for(var i=0;i<cs.length;i++){ var ks=Object.keys(cs[i].scn); for(var j=0;j<ks.length;j++) counts[ks[j]]=(counts[ks[j]]||0)+1; }
  var sk=Object.keys(SCN), h='<div class="hint">Bir senaryoya tıklayın, sonra listeden bir müşteri seçin — o müşterinin bu konudaki mesajına <b>doğrudan gidersiniz.</b></div>'+'<div class="scn-grid">';
  for(var k=0;k<sk.length;k++){ var s=SCN[sk[k]], n=counts[sk[k]]||0;
    h+='<div class="scn-card" onclick="scnFilter=\\''+sk[k]+'\\';setView(\\'customers\\')" style="border-color:'+s.c+'33">'+
      '<div class="big" style="color:'+s.c+'">'+n+'</div><div class="nm">'+s.t+'</div></div>'; }
  h+='</div>'; return h;
}
function logView(){
  var list=ROWS.slice().reverse();
  var h='<div class="tblwrap"><table class="tbl"><thead><tr><th>Tarih</th><th>İsim</th><th>Numara</th><th>Mesaj / Başvuru</th><th>Bot Cevabı</th><th>Talep</th></tr></thead><tbody>';
  for(var i=0;i<list.length;i++){ var r=list[i], lead=String(r.talep).toUpperCase()==="EVET";
    h+='<tr'+(lead?' class="lead"':'')+'><td style="color:var(--muted)">'+esc(fmtDate(r.tarih))+'</td><td>'+esc(r.isim)+'</td><td>'+waLink(r.numara)+'</td><td class="msg">'+esc(r.mesaj)+'</td><td class="msg">'+esc(r.cevap)+'</td><td>'+(lead?'<span class="badge">TALEP</span>':'')+'</td></tr>'; }
  h+='</tbody></table></div>'; if(list.length===0) h+='<div class="empty">Kayıt yok.</div>'; return h;
}
function openCust(key, forceBottom){
  var cs=customers(), c=null; for(var i=0;i<cs.length;i++) if(cs[i].key===key){ c=cs[i]; break; }
  if(!c) return;
  openKey=key;
  var rs=c.rows.slice().sort(function(a,b){return new Date(a.tarih)-new Date(b.tarih);});
  // Senaryo listesinden geldiyse (scnFilter aktif), o senaryoyla ilgili İLK mesaja atla ve vurgula.
  var jumpScn = forceBottom ? null : scnFilter;
  var matchIdx=-1;
  var thread=''; for(var j=0;j<rs.length;j++){ var r=rs[j];
    var isHuman=/^👤/.test(String(r.cevap||""));
    var isMatch = jumpScn && classify(r.mesaj).indexOf(jumpScn)>=0;
    if(isMatch && matchIdx===-1) matchIdx=j;
    thread+='<div class="turn'+(isMatch?' hl':'')+'" id="turn-'+j+'">'+
      (isMatch?'<div class="hltag">🏷️ '+SCN[jumpScn].t+' ile ilgili</div>':'')+
      '<div class="tm">'+esc(fmtDate(r.tarih))+(String(r.talep).toUpperCase()==="EVET"?' · <span style="color:#22c55e">🔔 Talep</span>':'')+'</div>'+
      (r.mesaj?'<div class="q">'+esc(r.mesaj)+'</div>':'')+
      (r.cevap?'<div class="a'+(isHuman?' h':'')+'">'+esc(r.cevap)+'</div>':'')+'</div>'; }
  var paused=isPaused(c.numara);
  var jumpBanner = (jumpScn && matchIdx>=0)
    ? '<div class="jump-banner"><div>🏷️ '+SCN[jumpScn].t+' konusundaki mesaja gidildi.</div><button onclick="openCust(\\''+key+'\\',true)">Tüm sohbeti gör ↓</button></div>'
    : '';
  var head='<span class="x" onclick="closeModal()">✕</span>'+
    '<div class="nm" style="font-size:17px;font-weight:700">'+esc(c.isim||"İsimsiz")+'</div>'+
    '<div style="margin:4px 0 6px">'+waLink(c.numara)+'</div>'+
    '<div class="chips">'+scnChips(c.scn)+'</div>'+
    '<div class="meta" style="color:var(--muted);font-size:12px;margin-top:8px">'+c.rows.length+' mesaj · ilk: '+fmtDate(c.first)+' · son: '+fmtDate(c.last)+'</div>'+
    jumpBanner;
  var foot=(paused?'<div class="pausebar">🧑‍💼 Temsilci modu açık — bot bu müşteride sessiz<button class="btn-resume" onclick="resumeBot(\\''+key+'\\')">Bot\\'a geri ver</button></div>':'')+
    '<div class="sendrow">'+
      '<textarea id="msgbox" rows="1" placeholder="Müşteriye yazın... (gönderince bot bu sohbette duraklar)" onkeydown="if(event.key===\\'Enter\\'&&!event.shiftKey){event.preventDefault();sendMsg(\\''+key+'\\');}"></textarea>'+
      '<button class="btn-send" id="sendbtn" onclick="sendMsg(\\''+key+'\\')">Gönder</button>'+
    '</div>';
  document.getElementById("sheet").innerHTML=
    '<div class="sheet-head">'+head+'</div>'+
    '<div class="sheet-body" id="threadWrap"><div class="thread">'+thread+'</div></div>'+
    '<div class="sheet-foot">'+foot+'</div>';
  document.getElementById("modal").classList.add("open");
  var tw=document.getElementById("threadWrap");
  if(matchIdx>=0){
    var target=document.getElementById("turn-"+matchIdx);
    if(target && target.scrollIntoView) target.scrollIntoView({block:"center"});
    else tw.scrollTop=tw.scrollHeight;
  } else {
    tw.scrollTop=tw.scrollHeight;
  }
}
async function sendMsg(key){
  var box=document.getElementById("msgbox"), btn=document.getElementById("sendbtn");
  var text=(box.value||"").trim(); if(!text) return;
  var cs=customers(), c=null; for(var i=0;i<cs.length;i++) if(cs[i].key===key){ c=cs[i]; break; }
  if(!c) return;
  box.disabled=true; btn.disabled=true;
  try{
    var r=await fetch("/panel/send",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({numara:c.numara,mesaj:text})});
    if(!r.ok){ alert("Mesaj gönderilemedi. Lütfen tekrar deneyin."); box.disabled=false; btn.disabled=false; return; }
    ROWS.push({tarih:new Date().toISOString(),numara:c.numara,isim:c.isim,mesaj:"",cevap:"👤 Temsilci: "+text,talep:""});
    if(!isPaused(c.numara)) HUMAN.push(c.numara);
    box.value="";
    render(); openCust(key, true);
  }catch(e){ alert("Bağlantı hatası. Lütfen tekrar deneyin."); box.disabled=false; btn.disabled=false; }
}
async function resumeBot(key){
  var cs=customers(), c=null; for(var i=0;i<cs.length;i++) if(cs[i].key===key){ c=cs[i]; break; }
  if(!c) return;
  try{
    await fetch("/panel/resume",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({numara:c.numara})});
  }catch(e){}
  for(var i=HUMAN.length-1;i>=0;i--){ if(digits(HUMAN[i])===digits(c.numara)) HUMAN.splice(i,1); }
  render(); openCust(key, true);
}
function closeModal(){ document.getElementById("modal").classList.remove("open"); openKey=null; }
document.getElementById("modal").addEventListener("click",function(e){ if(e.target.id==="modal") closeModal(); });
var navs=document.querySelectorAll(".side nav a");
for(var i=0;i<navs.length;i++) navs[i].addEventListener("click",function(){ setView(this.getAttribute("data-v")); });
async function refresh(){
  try{
    var r=await fetch("/panel/data",{headers:{Accept:"application/json"}});
    if(r.ok){ var j=await r.json(); if(j&&j.rows){ ROWS=j.rows; HUMAN=j.humanNumbers||HUMAN; render(); if(openKey) openCust(openKey, true); } }
  }catch(e){}
}
// Bir görüşme açıkken daha sık (canlı sohbet hissi), kapalıyken seyrek yenile.
(function scheduleRefresh(){ setTimeout(function(){ refresh().then(scheduleRefresh); }, openKey?6000:45000); })();
render();
</script>
</body></html>`;
}
