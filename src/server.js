// Giriş noktası: WhatsApp webhook sunucusu.
import express from "express";
import crypto from "node:crypto";
import { CONFIG } from "./config.js";
import { extractIncomingMessages, markAsRead, sendText } from "./whatsapp.js";
import { handleMessage } from "./router.js";
import { fetchRows, renderPanel, renderLogin } from "./panel.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // panel giriş formu için

// Panel oturum çerezi: şifreden türetilmiş sabit jeton (şifre değişirse jeton da değişir)
function panelToken() {
  return crypto
    .createHash("sha256")
    .update(`${CONFIG.panelUser}:${CONFIG.panelPass}:akropol-panel-v1`)
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
function isPanelLoggedIn(req) {
  return Boolean(CONFIG.panelUser) && getCookie(req, "panel_auth") === panelToken();
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
      const reply = await handleMessage(msg.from, msg.text, msg.name);
      await sendText(msg.from, reply);
    }
  } catch (err) {
    console.error("Webhook işleme hatası:", err);
  }
});

// Basit sağlık kontrolü
app.get("/", (_req, res) => res.send("Otel Rezervasyon Bot çalışıyor ✅"));

// Panel giriş formu gönderimi
app.post("/panel/login", (req, res) => {
  if (!CONFIG.panelUser || !CONFIG.panelPass) {
    return res.status(503).send("Panel henüz yapılandırılmadı.");
  }
  const { user, pass } = req.body || {};
  if (user === CONFIG.panelUser && pass === CONFIG.panelPass) {
    // 30 gün geçerli oturum çerezi
    res.set(
      "Set-Cookie",
      `panel_auth=${panelToken()}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`
    );
    return res.redirect("/panel");
  }
  return res.redirect("/panel?e=1");
});

// Panel çıkış
app.get("/panel/logout", (_req, res) => {
  res.set("Set-Cookie", "panel_auth=; Path=/; HttpOnly; Max-Age=0");
  res.redirect("/panel");
});

// Yönetim paneli (oturum çereziyle korumalı; çerez yoksa giriş sayfası)
app.get("/panel", async (req, res) => {
  if (!CONFIG.panelUser || !CONFIG.panelPass) {
    return res.status(503).send("Panel henüz yapılandırılmadı (kullanıcı adı/şifre tanımlı değil).");
  }
  if (!isPanelLoggedIn(req)) {
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
