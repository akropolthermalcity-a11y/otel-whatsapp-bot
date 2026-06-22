// Basit yönetim paneli: görüşmeleri/talepleri Google Sheet'ten çekip web sayfasında gösterir.
import { CONFIG } from "./config.js";

// Apps Script doGet'ten satırları çeker
export async function fetchRows() {
  if (!CONFIG.logWebhookUrl || !CONFIG.panelKey) return [];
  const url = `${CONFIG.logWebhookUrl}?key=${encodeURIComponent(CONFIG.panelKey)}`;
  const res = await fetch(url, { redirect: "follow" });
  const data = await res.json();
  return Array.isArray(data.rows) ? data.rows : [];
}

export function renderPanel(rows) {
  const json = JSON.stringify(rows).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="60">
<title>Akropol Bot Paneli</title>
<style>
  :root{--bg:#0f1720;--card:#1b2733;--accent:#16a34a;--accent2:#0ea5e9;--text:#e7edf3;--muted:#93a4b3;--line:#27333f}
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;background:var(--bg);color:var(--text)}
  header{padding:18px 20px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
  header h1{font-size:18px;margin:0}
  header .sub{color:var(--muted);font-size:12px}
  .wrap{padding:16px 20px;max-width:1100px;margin:0 auto}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px}
  .card .n{font-size:28px;font-weight:700}
  .card .l{color:var(--muted);font-size:13px;margin-top:2px}
  .card.green .n{color:#22c55e}.card.blue .n{color:#38bdf8}
  .toolbar{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}
  .btn{background:var(--card);border:1px solid var(--line);color:var(--text);padding:8px 14px;border-radius:10px;cursor:pointer;font-size:13px}
  .btn.active{background:var(--accent);border-color:var(--accent);color:#06210f;font-weight:600}
  .tbl{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden}
  .tbl th,.tbl td{padding:10px 12px;text-align:left;font-size:13px;border-bottom:1px solid var(--line);vertical-align:top}
  .tbl th{color:var(--muted);font-weight:600;background:#15202b;position:sticky;top:0}
  .tbl tr.lead{background:rgba(34,197,94,.07)}
  .badge{background:var(--accent);color:#06210f;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700}
  .msg{white-space:pre-wrap;max-width:360px;color:#cbd5e1}
  a.wa{color:#22c55e;text-decoration:none;font-weight:600}
  .empty{color:var(--muted);text-align:center;padding:40px}
  .muted{color:var(--muted)}
</style>
</head>
<body>
<header>
  <div><h1>🌿 Akropol Bot Paneli</h1><div class="sub">Beypazarı İncisi · WhatsApp görüşmeleri & talepleri</div></div>
  <div class="sub" id="updated"></div>
</header>
<div class="wrap">
  <div class="cards">
    <div class="card"><div class="n" id="c-total">0</div><div class="l">Toplam görüşme</div></div>
    <div class="card blue"><div class="n" id="c-today">0</div><div class="l">Bugün</div></div>
    <div class="card green"><div class="n" id="c-lead">0</div><div class="l">Toplam talep</div></div>
    <div class="card green"><div class="n" id="c-leadtoday">0</div><div class="l">Bugün talep</div></div>
  </div>
  <div class="toolbar">
    <button class="btn active" id="f-all" onclick="setFilter(false)">Tümü</button>
    <button class="btn" id="f-lead" onclick="setFilter(true)">Sadece talepler 🔔</button>
  </div>
  <table class="tbl">
    <thead><tr><th>Tarih</th><th>İsim</th><th>Numara</th><th>Mesaj / Başvuru</th><th>Bot Cevabı</th><th>Talep</th></tr></thead>
    <tbody id="tbody"></tbody>
  </table>
  <div class="empty" id="empty" style="display:none">Henüz kayıt yok.</div>
</div>
<script>
const ROWS = ${json};
let leadOnly = false;
function fmtDate(s){ try{ const d=new Date(s); return isNaN(d)? (s||"") : d.toLocaleString("tr-TR"); }catch(e){ return s||""; } }
function isToday(s){ try{ const d=new Date(s); const n=new Date(); return d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate(); }catch(e){ return false; } }
function waLink(num){ const n=String(num||"").replace(/\\D/g,""); return n? '<a class="wa" href="https://wa.me/'+n+'" target="_blank">'+num+'</a>' : (num||""); }
function esc(t){ return String(t==null?"":t).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])); }
function render(){
  const total=ROWS.length;
  const leads=ROWS.filter(r=>String(r.talep).toUpperCase()==="EVET");
  document.getElementById("c-total").textContent=total;
  document.getElementById("c-today").textContent=ROWS.filter(r=>isToday(r.tarih)).length;
  document.getElementById("c-lead").textContent=leads.length;
  document.getElementById("c-leadtoday").textContent=leads.filter(r=>isToday(r.tarih)).length;
  document.getElementById("updated").textContent="Güncellendi: "+new Date().toLocaleTimeString("tr-TR")+" · 60 sn'de bir yenilenir";
  let list=ROWS.slice().reverse();
  if(leadOnly) list=list.filter(r=>String(r.talep).toUpperCase()==="EVET");
  const tb=document.getElementById("tbody"); tb.innerHTML="";
  document.getElementById("empty").style.display=list.length?"none":"block";
  for(const r of list){
    const lead=String(r.talep).toUpperCase()==="EVET";
    const tr=document.createElement("tr"); if(lead) tr.className="lead";
    tr.innerHTML='<td class="muted">'+esc(fmtDate(r.tarih))+'</td>'+
      '<td>'+esc(r.isim)+'</td>'+
      '<td>'+waLink(r.numara)+'</td>'+
      '<td class="msg">'+esc(r.mesaj)+'</td>'+
      '<td class="msg">'+esc(r.cevap)+'</td>'+
      '<td>'+(lead?'<span class="badge">TALEP</span>':'')+'</td>';
    tb.appendChild(tr);
  }
}
function setFilter(v){ leadOnly=v; document.getElementById("f-all").classList.toggle("active",!v); document.getElementById("f-lead").classList.toggle("active",v); render(); }
render();
</script>
</body>
</html>`;
}
