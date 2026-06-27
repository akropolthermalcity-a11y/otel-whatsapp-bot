// Gemini (Google): serbest metin sorularını otel bilgi tabanına göre yanıtlar.
// Menü/numara akışı router.js'te; burada sadece "soru-cevap" var. Temsilciye aktarma YOK.
import { GoogleGenAI } from "@google/genai";
import { CONFIG } from "./config.js";
import { HOTEL_INFO } from "./hotelInfo.js";

const ai = new GoogleGenAI({ apiKey: CONFIG.geminiApiKey });

const SYSTEM_PROMPT = `Sen **İnci**'sin — Beypazarı İncisi'nde çalışan, Akropol Termal Şehir için müşterilere yardımcı olan bir tatil danışmanısın. Gerçek bir kişi gibi, sıcak ve samimi konuş.

Aşağıdaki bilgilere dayan:
---
${HOTEL_INFO}
---

Kurallar:
- Kimliğin: Adın İnci. Müşteri adını sorarsa "Ben İnci, Beypazarı İncisi'nden 🙂" gibi cevap ver. ASLA "yapay zekayım", "botum", "asistanım", "yapay zeka asistanıyım" deme; gerçek bir danışman gibi davran.
- Gerektiğinde sıcak bir kapanış kullanabilirsin (ör. "Sevgiler, İnci 🌿") ama her mesaja imza atma; doğal ol.
- Yalnızca Türkçe, kısa ve samimi yanıt ver (WhatsApp mesajı gibi, genelde 1-4 cümle).
- Sadece yukarıdaki bilgilere dayan. Bilmediğin kesin fiyat, müsaitlik veya özel durumu ASLA uydurma.
- Bilmediğin bir şey sorulursa ya da kesin fiyat/rezervasyon istenirse: "Detay ve rezervasyon için 0537 266 0634 numarasından bilgi alabilirsiniz" de.
- ÇOK ÖNEMLİ: Bir olanağın/hizmetin (mescit, market, kuaför, çocuk kulübü, doktor vb.) olup olmadığından EMİN DEĞİLSEN ASLA "yok" deme. Yalnızca yukarıdaki bilgilerde açıkça "yok/kabul edilmiyor" yazanlara (ör. evcil hayvan, odada termal su, havlu) "yok" de. Emin olmadığında: "Bunu sizin için netleştirelim, 0537 266 0634'ten teyit alabilirsiniz" de — yokmuş gibi konuşma.
- ASLA "sizi müşteri temsilcisine/temsilciye aktarıyorum" gibi ifadeler kullanma.
- Sağlık iddiası/tedavi vaadi yapma.
- Emojiyi ölçülü kullan.`;

// Basit konuşma hafızası (telefon -> geçmiş). Bellekte; restart'ta sıfırlanır.
const conversations = new Map();
const MAX_TURNS = 10;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Birincil + yedek modeller (tekrarsız)
const MODELS = [...new Set([CONFIG.model, ...CONFIG.fallbackModels])];

// Geçici (tekrar denenebilir) hata mı? 503/yoğunluk/kota/ağ → evet, tekrar dene.
function isTransient(err) {
  const m = String(err?.message ?? err);
  return /503|UNAVAILABLE|overload|high demand|429|RESOURCE_EXHAUSTED|deadline|timeout|ETIMEDOUT|ECONN|fetch failed|network/i.test(
    m
  );
}

// Modelleri ve tekrar denemeleri sırayla deneyerek cevap üretir.
async function callGemini(history) {
  let lastErr;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: history,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            maxOutputTokens: 1024,
            thinkingConfig: { thinkingBudget: 0 },
          },
        });
        const text = res.text ?? "";
        if (text) return text;
        lastErr = new Error("boş yanıt");
      } catch (err) {
        lastErr = err;
        if (!isTransient(err)) break; // kalıcı hata (ör. model bulunamadı) → sıradaki modele geç
        await sleep(400 * Math.pow(2, attempt)); // 400ms, 800ms, 1600ms bekle ve tekrar dene
      }
    }
  }
  throw lastErr;
}

export async function generateReply(from, userText, name) {
  const history = conversations.get(from) ?? [];
  const userContent = name ? `[Müşteri: ${name}] ${userText}` : userText;
  history.push({ role: "user", parts: [{ text: userContent }] });

  let reply = "";
  try {
    reply = await callGemini(history);
  } catch (err) {
    console.error("Gemini hatası (tüm denemeler başarısız):", err?.message ?? err);
    history.pop();
    // Çıkmaz "teknik aksaklık" yerine işe yarar yönlendirme
    return (
      "Şu an yoğunluktan yanıtım biraz gecikebiliyor 🙏 Hemen yardım için *0537 266 0634* " +
      "numaramızdan bize ulaşabilir ya da menü için *0* yazabilirsiniz."
    );
  }

  history.push({ role: "model", parts: [{ text: reply }] });
  conversations.set(from, history.slice(-MAX_TURNS * 2));
  return reply || "Size nasıl yardımcı olabilirim? 🙂";
}
