// Gemini beynini WhatsApp olmadan hızlıca test eder.
// Çalıştır:  node test-brain.js
import { generateReply } from "./src/ai.js";

const sorular = [
  "Merhaba, bu hafta sonu müsait odanız var mı?",
  "Fiyatlar ne kadar?",
  "Devre mülk / hediye tatil hakkında bilgi alabilir miyim?",
  "Rezervasyon yaptırmak istiyorum.",
];

const TEST_NUMARA = "905551112233"; // hayali müşteri (hafıza testi için sabit)

for (const soru of sorular) {
  console.log(`\n👤 ${soru}`);
  const cevap = await generateReply(TEST_NUMARA, soru, "Ahmet");
  console.log(`🤖 ${cevap}`);
}
