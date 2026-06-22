// Meta WhatsApp Cloud API yardımcıları: gelen mesajı ayıklama + cevap gönderme.
import { CONFIG } from "./config.js";

const API_BASE = () =>
  `https://graph.facebook.com/${CONFIG.graphVersion}/${CONFIG.phoneNumberId}`;

// Webhook gövdesinden gelen metin mesajlarını sade bir listeye çevirir.
export function extractIncomingMessages(body) {
  const out = [];
  for (const entry of body?.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};
      // wa_id -> profil adı eşlemesi
      const names = {};
      for (const c of value.contacts ?? []) names[c.wa_id] = c.profile?.name;
      for (const m of value.messages ?? []) {
        out.push({
          id: m.id,
          from: m.from, // müşterinin WhatsApp numarası
          type: m.type, // text / image / audio ...
          text: m.text?.body ?? "",
          name: names[m.from],
        });
      }
    }
  }
  return out;
}

async function callApi(payload) {
  const res = await fetch(`${API_BASE()}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CONFIG.whatsappToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error("WhatsApp API hatası:", res.status, await res.text());
  }
  return res.ok;
}

// Metin mesajı gönder (WhatsApp tek mesajda en fazla 4096 karakter)
export function sendText(to, body) {
  return callApi({
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: (body ?? "").slice(0, 4096) },
  });
}

// Mesajı "okundu" işaretle (mavi tik) — opsiyonel ama hoş bir dokunuş
export function markAsRead(messageId) {
  return callApi({
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  });
}
