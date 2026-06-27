// Giriş noktası: WhatsApp webhook sunucusu.
import express from "express";
import crypto from "node:crypto";
import { CONFIG } from "./config.js";
import { extractIncomingMessages, markAsRead, sendText, sendImage } from "./whatsapp.js";
import { handleMessage } from "./router.js";
import { fetchRows, renderPanel, renderLogin, renderChangePass } from "./panel.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // panel giriş formu için
// Fotoğraflar: public/img -> https://.../img/oda1.jpg (WhatsApp link ile gönderir)
app.use("/img", express.static("public/img", { maxAge: "7d" }));

// --- Panel şifresi: kalıcı olarak Apps Script deposunda (ScriptProperties) tutulur.
//     Bot uykudan kalksa bile değişen şifre korunur. Depo boşsa env'deki PANEL_PASS kullanılır.
let cachedPass = null;
let passLoadedAt = 0;
async function effectivePass() {
  const now = Date.now();
  if (cachedPass !== null && now - passLoadedAt < 300000) return cachedPass; // 5 dk önbellek
  let stored = "";
  try {
    if (CONFIG.logWebhookUrl && CONFIG.panelKey) {
      const r = await fetch(
        `${CONFIG.logWebhookUrl}?action=panelpass&key=${encodeURIComponent(CONFIG.panelKey)}`,
        { redirect: "follow" }
      );
      const j = await r.json();
      if (j && typeof j.pass === "string") stored = j.pass;
    }
  } catch {
    /* depo okunamazsa env şifresine düş */
  }
  cachedPass = stored || CONFIG.panelPass;
  passLoadedAt = now;
  return cachedPass;
}
async function persistPass(newPass) {
  if (!CONFIG.logWebhookUrl || !CONFIG.panelKey) return false;
  try {
    const r = await fetch(CONFIG.logWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setpass", key: CONFIG.panelKey, newpass: newPass }),
    });
    const t = await r.text();
    return t.toLowerCase().includes("ok");
  } catch {
    return false;
  }
}

// Panel oturum çerezi: şifreden türetilmiş jeton (şifre değişirse eski çerez geçersiz olur)
function tokenFor(pass) {
  return crypto
    .createHash("sha256")
    .update(`${CONFIG.panelUser}:${pass}:akropol-panel-v1`)
    .digest("hex");
}
function getCookie(req, name) {
  const raw = req.headers.cookie || "";
  for (const part of raw.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return "";
}
async function isPanelLoggedIn(req) {
  if (!CONFIG.panelUser) return false;
  const pass = await effectivePass();
  return getCookie(req, "panel_auth") === tokenFor(pass);
}
function setAuthCookie(res, pass) {
  res.set(
    "Set-Cookie",
    `panel_auth=${tokenFor(pass)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`
  );
}

// 1) Webhook DOĞRULAMA — Meta panelinden webhook bağlarken bir kez çağrılır.
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === CONFIG.verifyToken) {
    console.log("✅ Webhook doğrulandı");
    return res.status(200).send(challenge);
  }
  console.warn("❌ Webhook doğrulama başarısız (verify token uyuşmadı)");
  return res.sendStatus(403);
});

// 2) GELEN MESAJLAR — müşteri yazınca Meta buraya POST eder.
app.post("/webhook", async (req, res) => {
  // Meta'ya HEMEN 200 dön; yoksa mesajı tekrar tekrar gönderir.
  res.sendStatus(200);

  try {
    const messages = extractIncomingMessages(req.body);
    for (const msg of messages) {
      if (msg.type !== "text") {
        await sendText(
          msg.from,
          "Şu an yalnızca yazılı mesajları yanıtlayabiliyorum. Sorunuzu yazabilir misiniz? 🙏"
        );
        continue;
      }
      markAsRead(msg.id).catch(() => {});
      const out = await handleMessage(msg.from, msg.text, msg.name);
      if (out && typeof out === "object") {
        // Önce fotoğraf(lar), sonra açıklama metni
        for (const img of out.images ?? []) await sendImage(msg.from, img.url, img.caption);
        if (out.text) await sendText(msg.from, out.text);
      } else {
        await sendText(msg.from, out);
      }
    }
  } catch (err) {
    console.error("Webhook işleme hatası:", err);
  }
});

// Basit sağlık kontrolü
app.get("/", (_req, res) => res.send("Otel Rezervasyon Bot çalışıyor ✅"));

// Panel giriş formu gönderimi
app.post("/panel/login", async (req, res) => {
  if (!CONFIG.panelUser || !CONFIG.panelPass) {
    return res.status(503).send("Panel henüz yapılandırılmadı.");
  }
  const { user, pass } = req.body || {};
  const real = await effectivePass();
  if (user === CONFIG.panelUser && pass === real) {
    setAuthCookie(res, real); // 30 gün geçerli oturum çerezi
    return res.redirect("/panel");
  }
  return res.redirect("/panel?e=1");
});

// Panel çıkış
app.get("/panel/logout", (_req, res) => {
  res.set("Set-Cookie", "panel_auth=; Path=/; HttpOnly; Max-Age=0");
  res.redirect("/panel");
});

// Şifre değiştir sayfası
app.get("/panel/sifre", async (req, res) => {
  if (!(await isPanelLoggedIn(req))) return res.redirect("/panel");
  res.send(renderChangePass(req.query.e));
});

// Şifre değiştir gönderimi
app.post("/panel/changepass", async (req, res) => {
  if (!(await isPanelLoggedIn(req))) return res.redirect("/panel");
  const { current, yeni, yeni2 } = req.body || {};
  const real = await effectivePass();
  if (current !== real) return res.redirect("/panel/sifre?e=mevcut");
  if (!yeni || yeni.length < 6) return res.redirect("/panel/sifre?e=kisa");
  if (yeni !== yeni2) return res.redirect("/panel/sifre?e=eslesme");
  const ok = await persistPass(yeni);
  if (!ok) return res.redirect("/panel/sifre?e=kayit");
  cachedPass = yeni;
  passLoadedAt = Date.now();
  setAuthCookie(res, yeni); // yeni şifreyle oturumu tazele
  return res.redirect("/panel?msg=sifre");
});

// Panel verisi (JSON — otomatik yenileme için)
app.get("/panel/data", async (req, res) => {
  if (!(await isPanelLoggedIn(req))) return res.status(401).json({ error: "giris gerekli" });
  try {
    const rows = await fetchRows();
    res.json({ rows });
  } catch (err) {
    res.status(500).json({ error: "veri alinamadi" });
  }
});

// Yönetim paneli (oturum çereziyle korumalı; çerez yoksa giriş sayfası)
app.get("/panel", async (req, res) => {
  if (!CONFIG.panelUser || !CONFIG.panelPass) {
    return res.status(503).send("Panel henüz yapılandırılmadı (kullanıcı adı/şifre tanımlı değil).");
  }
  if (!(await isPanelLoggedIn(req))) {
    return res.send(renderLogin(req.query.e === "1"));
  }
  try {
    const rows = await fetchRows();
    res.send(renderPanel(rows));
  } catch (err) {
    console.error("Panel hatası:", err?.message ?? err);
    res
      .status(500)
      .send("Panel verisi alınamadı. Birazdan tekrar deneyin. (" + (err?.message ?? "hata") + ")");
  }
});

app.listen(CONFIG.port, () => {
  console.log(`🚀 Bot ${CONFIG.port} portunda dinliyor`);
  console.log(`   Model: ${CONFIG.model}`);
  console.log(`   Webhook yolu: /webhook`);
});
