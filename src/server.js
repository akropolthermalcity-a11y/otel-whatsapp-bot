// Giriş noktası: WhatsApp webhook sunucusu.
import express from "express";
import { CONFIG } from "./config.js";
import { extractIncomingMessages, markAsRead, sendText } from "./whatsapp.js";
import { generateReply } from "./ai.js";

const app = express();
app.use(express.json());

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
      const reply = await generateReply(msg.from, msg.text, msg.name);
      await sendText(msg.from, reply);
    }
  } catch (err) {
    console.error("Webhook işleme hatası:", err);
  }
});

// Basit sağlık kontrolü
app.get("/", (_req, res) => res.send("Otel Rezervasyon Bot çalışıyor ✅"));

app.listen(CONFIG.port, () => {
  console.log(`🚀 Bot ${CONFIG.port} portunda dinliyor`);
  console.log(`   Model: ${CONFIG.model}`);
  console.log(`   Webhook yolu: /webhook`);
});
