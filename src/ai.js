// Gemini (Google) entegrasyonu: gelen mesaja otel asistanı olarak cevap üretir.
import { GoogleGenAI } from "@google/genai";
import { CONFIG } from "./config.js";
import { HOTEL_INFO } from "./hotelInfo.js";

const ai = new GoogleGenAI({ apiKey: CONFIG.geminiApiKey });

// Bot bir konuyu çözemeyince yanıtının sonuna bu etiketi koyar; kullanıcı görmez.
const HANDOFF_TAG = "[[TEMSILCIYE_AKTAR]]";

const SYSTEM_PROMPT = `Sen ${CONFIG.hotelName} tatil danışmanlığının WhatsApp asistanısın — Akropol Termal Şehir tatil köyü için müşterilere yardımcı oluyorsun. Müşteriler sana rezervasyon, hediye tatil, devre tatil, fiyat ve genel bilgi konularında yazıyor.

Aşağıdaki otel bilgilerine dayan:
---
${HOTEL_INFO}
---

Davranış kuralları:
- Yalnızca Türkçe, kısa ve samimi yanıt ver — WhatsApp mesajı gibi (genelde 1-4 cümle).
- Sadece yukarıdaki bilgilere ve genel nezakete dayan. Bilmediğin fiyat, müsaitlik veya özel durumları ASLA uydurma.
- Müşterinin adını biliyorsan ara sıra kullanabilirsin; samimi ama profesyonel ol.
- Emojiyi ölçülü kullan.
- Şu durumlarda yanıtının EN SONUNA, ayrı bir satırda ${HANDOFF_TAG} etiketini ekle (bu etiketi müşteri görmez, sistem onu kullanıp seni bir müşteri temsilcisine aktarır): kesin rezervasyon/ödeme talebi, şikayet, burada cevabı olmayan bir soru, ya da müşteri ısrarla bir yetkiliyle görüşmek isterse. Bu durumda müşteriye de kibarca "sizi bir yetkiliye aktarıyorum" gibi bir cümle söyle.`;

// Basit konuşma hafızası: telefon numarası -> mesaj geçmişi (Gemini "contents" formatı).
// NOT: Bellekte tutulur, sunucu yeniden başlayınca sıfırlanır.
// İleride kalıcılık için veritabanına (Postgres/SQLite) taşınabilir.
const conversations = new Map();
const MAX_TURNS = 12; // son ~12 tur (kullanıcı+asistan) saklanır

export async function generateReply(from, userText, name) {
  const history = conversations.get(from) ?? [];
  const userContent = name ? `[Müşteri: ${name}] ${userText}` : userText;
  history.push({ role: "user", parts: [{ text: userContent }] });

  let reply = "";
  try {
    const res = await ai.models.generateContent({
      model: CONFIG.model,
      contents: history,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 1024,
        // WhatsApp cevapları için hız/maliyet: "düşünme" kapalı.
        // Daha zor sorularda kaliteyi artırmak istersen budget'ı yükselt veya bu satırı sil.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    reply = res.text ?? "";
  } catch (err) {
    console.error("Gemini hatası:", err?.message ?? err);
    // Hafızayı bozmamak için bu turu geri al
    history.pop();
    return "Şu an küçük bir teknik aksaklık var, birazdan tekrar yazabilir misiniz? 🙏";
  }

  history.push({ role: "model", parts: [{ text: reply }] });
  // Geçmişi sınırla (en son MAX_TURNS*2 mesaj)
  conversations.set(from, history.slice(-MAX_TURNS * 2));

  // Temsilciye aktarma kontrolü
  if (reply.includes(HANDOFF_TAG)) {
    reply = reply.split(HANDOFF_TAG).join("").trim();
    console.log(`🔔 TEMSİLCİYE AKTARMA — ${name ?? "müşteri"} (${from})`);
    // TODO: Buraya gerçek bildirim eklenebilir:
    //   - yetkiliye WhatsApp/e-posta atma
    //   - bir panele/CRM'e kayıt
  }

  return reply || "Mesajınızı aldım, size yardımcı olmaktan memnuniyet duyarım. 🙂";
}
