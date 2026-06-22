// Menü + numara akışı + adım adım (anket) başvuru formları.
// Numara/menü seçimleri Gemini kotası harcamaz (sabit metin). Serbest metin -> AI.
import { generateReply } from "./ai.js";
import { logConversation } from "./logger.js";

const MENU = `Merhaba 👋

Beypazarı İncisi'ne hoş geldiniz.

Akropol Termal hakkında bilgi almak istediğiniz konunun numarasını yazabilirsiniz.

1️⃣ Hediye Tatil Bilgileri
2️⃣ Akropol Termal Hakkında
3️⃣ Oda ve Konaklama Bilgileri
4️⃣ Havuzlar, Termal Alanlar ve Sosyal Aktiviteler
5️⃣ Ulaşım Bilgileri
6️⃣ Beypazarı Hakkında
7️⃣ Sık Sorulan Sorular
8️⃣ Rezervasyon Talebi

Lütfen ilgili numarayı gönderiniz.`;

// Bilgi bölümleri (2-7)
const SECTIONS = {
  "2": `🌿 *Akropol Termal Şehir Hakkında*

Ankara'nın Beypazarı ilçesinde yer alan, *aile odaklı* termal tatil ve yaşam kompleksi. Misafirlerine termal sağlık, konforlu konaklama, eğlence ve sosyal yaşamı bir arada sunar.

• *Termal:* Kadın ve erkek bölümlerinde kapalı havuz, termal havuz, sauna ve Türk hamamı; ortak alanlarda açık havuz, Aquapark ve termal havuzlar.
• *Sosyal:* Fitness, spa, çocuk oyun parkları, kafe, restoran, market.
• *Eğlence:* Gün boyu animasyon, akşam eğlenceleri, canlı müzik, çocuk ve aile aktiviteleri.
• *Konum:* Beypazarı merkeze ~5 km, Ankara'ya ~90 km. Ücretsiz otopark.

Termal su mineral bakımından zengindir; dinlenme ve rahatlamaya yardımcı olur. (Sağlık sorununuz varsa termal kullanımdan önce doktorunuza danışmanızı öneririz.)

Huzurlu atmosferi ve aile konseptiyle öne çıkar. 🌿`,

  "3": `🏠 *Oda ve Konaklama*

• *1+1 Daire:* 3 yetişkin + 1 çocuk
  (Kapasite talebe göre iletişimle artırılabilir — daha kalabalık aileler için bizimle iletişime geçebilirsiniz.)

Dairelerimiz aile konaklamasına uygun, ferah ve konforlu şekilde tasarlanmıştır:
• Buzdolabı, elektrikli ocak ve temel mutfak ekipmanları
• Giriş (check-in): 14:00 • Çıkış (check-out): 11:00
• Talep halinde ek ücretle ilave yatak
• Ücretsiz otopark
• Wifi/internet ortak kullanım alanlarında
• Termal kullanım ortak alanlarda sunulur
• Evcil hayvan kabul edilmez

Uygun daire ve detaylar için: 📞 0537 266 0634`,

  "4": `🏊 *Havuzlar, Termal & Sosyal*

• Kadın ve erkek bölümleri: kapalı yarı olimpik havuz, termal havuz, sauna, Türk hamamı
• Ortak: açık yarı olimpik havuz, Aquapark (Haziran-Eylül), termal havuzlar
• VIP aile havuzu (ücretli)

🎉 Fitness, çocuk parkları, spa (ücretli), kafe, restoran, market.
Gün boyu animasyon, akşam eğlenceleri, canlı müzik ve çocuk aktiviteleri.`,

  "5": `🚗 *Ulaşım*

📍 Ayvaşık Mah. Karapınar Mevkii Kümeevleri No:10/A, Beypazarı/Ankara
Navigasyon: "Akropol Termal Şehir Beypazarı"

• Ankara'ya ~90 km, Beypazarı merkeze ~5 km. Tesiste *ücretsiz otopark*.
• *Ankara'dan:* Varlık Mah. İlçe Terminali'nden Beypazarı araçları — 0312 224 11 06 / 0545 224 56 06
• *İstanbul'dan:* belirli günlerde direkt sefer — 0541 692 78 78
• Diğer şehirler: Ankara aktarmalı.`,

  "6": `🏛️ *Beypazarı*

Tarihi Osmanlı evleri, doğal güzellikleri ve yöresel lezzetleriyle ünlü bir ilçe.
• Gezilecek: Tarihi Evler, İnözü Vadisi, Yaşayan Müze, Tarihi Çarşı, Suluhan, Seyir Tepesi
• Lezzetler: Beypazarı güveci, 80 katlı baklava, Beypazarı kurusu, höşmerim, tarhana
• Telkari gümüş işçiliğiyle de meşhurdur.`,

  "7": `❓ *Sık Sorulan Sorular*

Merak ettiğiniz soruyu doğrudan yazabilirsiniz, hemen yanıtlayalım 🙂

Örnekler: "check-in saati", "evcil hayvan kabul ediliyor mu", "otopark ücretli mi", "yemek dahil mi", "spa ücretli mi", "aquapark ne zaman açık"`,
};

// Adım adım anket akışları (her mesaj sıradaki sorunun cevabı olur)
const SURVEYS = {
  hediye: {
    title: "🎁 HEDİYE TATİL BAŞVURU",
    questions: [
      { key: "Ad Soyad", soru: `🎁 *Hediye Tatil Ön Değerlendirme*\n\nBirkaç kısa soruyla başlayalım.\n\nAdınız ve soyadınız?` },
      { key: "Yaş", soru: `Yaşınız kaç?` },
      { key: "Medeni Durum", soru: `Medeni durumunuz nedir? (Evli / Bekar)` },
      { key: "İl", soru: `Hangi ilde yaşıyorsunuz?` },
      { key: "Daha Önce Konaklama", soru: `Daha önce Akropol Termal'de konakladınız mı? (Evet / Hayır)` },
      { key: "Telefon", soru: `Teşekkürler 🙂\n\nÖn değerlendirmeye göre hediye tatil kampanyamız için *uygun görünüyorsunuz.* 🎉\n\nSon değerlendirme için birkaç bilgi daha alalım.\n\nTelefon numaranız?` },
      { key: "Kişi Sayısı", soru: `Tatile kaç kişi katılacak? (kaç yetişkin / kaç çocuk)` },
      { key: "Tarih Aralığı", soru: `Son olarak, tercih ettiğiniz tarih aralığı nedir?` },
    ],
    done: `Bilgileriniz alınmıştır. ✅

Talebiniz ilgili birimimize iletilmiştir. Uygunluk ve rezervasyon değerlendirmesi sonrasında müşteri temsilcimiz sizinle iletişime geçecektir.

İlginiz için teşekkür ederiz.
*Beypazarı İncisi*`,
  },
  rezervasyon: {
    title: "📅 REZERVASYON TALEBİ",
    questions: [
      { key: "Ad Soyad", soru: `📅 *Rezervasyon Talebi*\n\nBirkaç bilgi alalım.\n\nAdınız ve soyadınız?` },
      { key: "Telefon", soru: `Telefon numaranız?` },
      { key: "Tarih Aralığı", soru: `Konaklamak istediğiniz tarih aralığı?` },
      { key: "Kişi Sayısı", soru: `Kaç kişi olacaksınız? (yetişkin / çocuk)` },
    ],
    done: `Talebiniz alınmıştır. ✅

Talebiniz ilgili birimimize iletildi; müşteri temsilcimiz en kısa sürede sizinle iletişime geçecektir.

Teşekkür ederiz.
*Beypazarı İncisi*`,
  },
};

const FOOTER = `\n\n_Menü için 0 yazın._`;

const states = new Map(); // from -> { flow, step, data }
const seen = new Set();

// Mesaj tek başına bir menü numarası mı (1-8)? "1️⃣", "1.", " 1 " hepsi olur.
function menuDigit(t) {
  const c = t.replace(/[️⃣.\s)]/g, "");
  return /^[1-8]$/.test(c) ? c : null;
}
function isGreeting(l) {
  return /^(merhaba|merhabalar|selam|selamlar|slm|menü|menu|başla|basla|iyi günler|iyi gunler|günaydın|gunaydin|iyi akşamlar|iyi aksamlar|hello|hi|0)$/.test(l.trim());
}
function isCancel(l) {
  return /^(iptal|vazgeç|vazgec|çıkış|cikis|geri)$/.test(l.trim());
}
function formatData(data) {
  return Object.entries(data).map(([k, v]) => `${k}: ${v}`).join("\n");
}

export async function handleMessage(from, text, name) {
  const t = (text || "").trim();
  const lower = t.toLowerCase();
  const st = states.get(from);
  const d = menuDigit(t);

  let reply;
  let lead = false; // e-posta + Sheet'te "talep" olarak işaretle
  let logMsg = t;

  // 1) Aktif bir anket varsa: her mesaj sıradaki sorunun cevabıdır (tek haneli sayı dahil)
  if (st) {
    if (isGreeting(lower) || isCancel(lower)) {
      states.delete(from);
      reply = MENU;
    } else {
      const sv = SURVEYS[st.flow];
      sv.questions[st.step] && (st.data[sv.questions[st.step].key] = t);
      st.step++;
      if (st.step < sv.questions.length) {
        states.set(from, st);
        reply = sv.questions[st.step].soru;
      } else {
        states.delete(from);
        reply = sv.done;
        lead = true;
        logMsg = `${sv.title}\n${formatData(st.data)}`;
      }
    }
  }
  // 2) Menü numarası seçimi
  else if (d === "1") {
    states.set(from, { flow: "hediye", step: 0, data: {} });
    reply = SURVEYS.hediye.questions[0].soru;
  } else if (d === "8") {
    states.set(from, { flow: "rezervasyon", step: 0, data: {} });
    reply = SURVEYS.rezervasyon.questions[0].soru;
  } else if (d && SECTIONS[d]) {
    reply = SECTIONS[d] + FOOTER;
  }
  // 3) İlk temas / karşılama -> menü
  else if (!seen.has(from) || isGreeting(lower)) {
    reply = MENU;
  }
  // 4) Serbest metin -> AI (otel bilgi tabanından yanıt)
  else {
    reply = (await generateReply(from, t, name)) + FOOTER;
  }

  seen.add(from);
  logConversation({ numara: from, isim: name ?? "", mesaj: logMsg, cevap: reply, aktarma: lead });
  return reply;
}
