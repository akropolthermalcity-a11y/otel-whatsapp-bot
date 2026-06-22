// Ortam değişkenlerini .env dosyasından yükle (Node 22+ yerleşik özelliği — ek paket gerekmez)
try {
  process.loadEnvFile();
} catch {
  // .env yoksa sorun değil; değişkenler sistemden gelebilir
}

function read(name, fallback = "") {
  const value = process.env[name];
  if (!value && fallback === "") {
    console.warn(`⚠️  ${name} tanımlı değil — .env dosyasını doldurun`);
  }
  return value ?? fallback;
}

export const CONFIG = {
  // Sunucu
  port: Number(process.env.PORT) || 3000,
  graphVersion: process.env.GRAPH_VERSION || "v22.0",

  // Meta WhatsApp Cloud API
  whatsappToken: read("WHATSAPP_TOKEN"),
  phoneNumberId: read("PHONE_NUMBER_ID"),
  verifyToken: process.env.VERIFY_TOKEN || "otel-bot-dogrulama",

  // Gemini (Google)
  geminiApiKey: read("GEMINI_API_KEY"),
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",

  // Otel
  hotelName: process.env.HOTEL_NAME || "Otelimiz",

  // Görüşme kaydı + e-posta bildirimi (Google Apps Script Web App URL'i)
  logWebhookUrl: process.env.LOG_WEBHOOK_URL || "",
};
