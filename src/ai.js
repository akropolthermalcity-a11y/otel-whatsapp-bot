// Gemini (Google): serbest metin sorularını otel bilgi tabanına göre yanıtlar.
// Menü/numara akışı router.js'te; burada sadece "soru-cevap" var. Temsilciye aktarma YOK.
import { GoogleGenAI } from "@google/genai";
import { CONFIG } from "./config.js";
import { HOTEL_INFO } from "./hotelInfo.js";

const ai = new GoogleGenAI({ apiKey: CONFIG.geminiApiKey });

const SYSTEM_PROMPT = `Sen ${CONFIG.hotelName} tatil danışmanlığının WhatsApp asistanısın — Akropol Termal Şehir tatil köyü için müşterilere yardımcı oluyorsun.

Aşağıdaki bilgilere dayan:
---
${HOTEL_INFO}
---

Kurallar:
- Yalnızca Türkçe, kısa ve samimi yanıt ver (WhatsApp mesajı gibi, genelde 1-4 cümle).
- Sadece yukarıdaki bilgilere dayan. Bilmediğin kesin fiyat, müsaitlik veya özel durumu ASLA uydurma.
- Bilmediğin bir şey sorulursa ya da kesin fiyat/rezervasyon istenirse: "Detay ve rezervasyon için 0537 266 0634 numarasından bilgi alabilirsiniz" de.
- ASLA "sizi müşteri temsilcisine/temsilciye aktarıyorum" gibi ifadeler kullanma.
- Sağlık iddiası/tedavi vaadi yapma.
- Emojiyi ölçülü kullan.`;

// Basit konuşma hafızası (telefon -> geçmiş). Bellekte; restart'ta sıfırlanır.
const conversations = new Map();
const MAX_TURNS = 10;

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
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    reply = res.text ?? "";
  } catch (err) {
    console.error("Gemini hatası:", err?.message ?? err);
    history.pop();
    return "Şu an küçük bir teknik aksaklık var, birazdan tekrar yazabilir misiniz? 🙏";
  }

  history.push({ role: "model", parts: [{ text: reply }] });
  conversations.set(from, history.slice(-MAX_TURNS * 2));
  return reply || "Size nasıl yardımcı olabilirim? 🙂";
}
