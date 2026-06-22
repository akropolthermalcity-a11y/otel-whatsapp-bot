// Görüşmeleri Google Sheet'e kaydeder + temsilciye aktarmada e-posta tetikler.
// Hedef: bir Google Apps Script Web App URL'i (LOG_WEBHOOK_URL).
// "Ateşle ve unut" — botun cevabını yavaşlatmaz, hata olursa sadece loglar.
import { CONFIG } from "./config.js";

export function logConversation(data) {
  if (!CONFIG.logWebhookUrl) return; // URL tanımlı değilse sessizce geç
  fetch(CONFIG.logWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).catch((err) => console.error("Log webhook hatası:", err?.message ?? err));
}
