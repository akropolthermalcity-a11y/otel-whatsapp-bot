// Menü + numara akışı + çok adımlı başvuru formları.
// Numara seçimleri Gemini kotası harcamaz (sabit metin). Serbest metin -> AI.
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
  "2": `🌿 *Akropol Termal Şehir*

Ankara'nın Beypazarı ilçesinde, aile odaklı termal tatil ve yaşam kompleksi. Termal sağlık, konforlu konaklama, eğlence ve sosyal yaşamı bir arada sunar.

Termal su mineral bakımından zengindir; dinlenme ve rahatlamaya yardımcı olur. (Sağlık sorununuz varsa termal kullanımdan önce doktorunuza danışmanızı öneririz.)`,

  "3": `🏠 *Oda ve Konaklama*

• *1+1 Daire:* 4 yetişkin + 1 çocuk
• *2+1 Daire:* 6 yetişkin + 1 çocuk
• *3+1 Daire:* 8 yetişkin + 2 çocuk

Dairelerde buzdolabı, elektrikli ocak ve temel mutfak ekipmanı bulunur.
• Giriş (check-in): 14:00 • Çıkış (check-out): 11:00
• Ücretsiz otopark • Wifi ortak alanlarda • Evcil hayvan kabul edilmez`,

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

Örnekler: "check-in saati", "evcil hayvan kabul ediliyor mu", "otopark ücretli mi", "yemek dahil mi", "devre tatil / RCI nedir", "spa ücretli mi"`,
};

// Hediye Tatil başvuru akışı (1)
const HEDIYE_FORM1 = `🎁 *Hediye Tatil Ön Değerlendirme*

Size yardımcı olabilmemiz için aşağıdaki bilgileri paylaşabilir misiniz?

• Ad Soyad
• Yaşınız
• Medeni Durumunuz (Evli / Bekar)
• Yaşadığınız İl
• Daha önce Akropol Termal'de konakladınız mı? (Evet / Hayır)

*Örnek:*
Ad Soyad: Ahmet Yılmaz
Yaş: 38
Medeni Durum: Evli
İl: İstanbul
Daha Önce Konaklama: Hayır`;

const HEDIYE_FORM2 = `Teşekkür ederiz. 🙂

Ön değerlendirmeye göre hediye tatil kampanyamız için uygun görünüyorsunuz. 🎉

Son değerlendirme için aşağıdaki bilgileri paylaşabilir misiniz?

• Ad Soyad
• Telefon Numarası
• Tatile katılacak kişi sayısı
• Tercih ettiğiniz tarih aralığı`;

const HEDIYE_DONE = `Bilgileriniz alınmıştır. ✅

Talebiniz ilgili birimimize iletilmiştir. Uygunluk ve rezervasyon değerlendirmesi sonrasında müşteri temsilcimiz sizinle iletişime geçecektir.

İlginiz için teşekkür ederiz.
*Beypazarı İncisi*`;

// Rezervasyon akışı (8)
const RESV_FORM = `📅 *Rezervasyon Talebi*

Lütfen aşağıdaki bilgileri tek mesajda yazınız:

• Ad Soyad
• Telefon Numarası
• Konaklamak istediğiniz tarih aralığı
• Kişi sayısı (yetişkin / çocuk)`;

const RESV_DONE = `Talebiniz alınmıştır. ✅

Talebiniz ilgili birimimize iletildi; müşteri temsilcimiz en kısa sürede sizinle iletişime geçecektir.

Teşekkür ederiz.
*Beypazarı İncisi*`;

const FOOTER = `\n\n_Menü için 0 yazın._`;

const states = new Map(); // from -> { flow, step, data }
const seen = new Set();

// Mesajın tek başına bir menü numarası (1-8) olup olmadığını anlar ("1️⃣", "1.", " 1 " hepsi olur)
function menuDigit(t) {
  const c = t.replace(/[️⃣.\s)]/g, "");
  return /^[1-8]$/.test(c) ? c : null;
}

function isGreeting(l) {
  return /^(merhaba|merhabalar|selam|selamlar|slm|menü|menu|başla|basla|iyi günler|iyi gunler|günaydın|gunaydin|iyi akşamlar|iyi aksamlar|hello|hi|0)$/.test(
    l.trim()
  );
}

function isCancel(l) {
  return /^(iptal|vazgeç|vazgec|çıkış|cikis|geri)$/.test(l.trim());
}

export async function handleMessage(from, text, name) {
  const t = (text || "").trim();
  const lower = t.toLowerCase();
  const st = states.get(from);
  const d = menuDigit(t);

  let reply;
  let lead = false; // e-posta + Sheet'te "talep" olarak işaretle
  let logMsg = t;

  // 1) Aktif bir akış varsa (ve kullanıcı tek başına menü numarası göndermediyse) akışı ilerlet
  if (st && !d) {
    if (isGreeting(lower) || isCancel(lower)) {
      states.delete(from);
      reply = MENU;
    } else if (st.flow === "hediye" && st.step === 1) {
      st.data.on = t;
      st.step = 2;
      states.set(from, st);
      reply = HEDIYE_FORM2;
    } else if (st.flow === "hediye" && st.step === 2) {
      states.delete(from);
      reply = HEDIYE_DONE;
      lead = true;
      logMsg = `🎁 HEDİYE TATİL BAŞVURU\n— Ön değerlendirme: ${st.data.on}\n— Son değerlendirme: ${t}`;
    } else if (st.flow === "rezervasyon" && st.step === 1) {
      states.delete(from);
      reply = RESV_DONE;
      lead = true;
      logMsg = `📅 REZERVASYON TALEBİ\n${t}`;
    } else {
      states.delete(from);
      reply = MENU;
    }
  }
  // 2) Menü numarası seçimi
  else if (d === "1") {
    states.set(from, { flow: "hediye", step: 1, data: {} });
    reply = HEDIYE_FORM1;
  } else if (d === "8") {
    states.set(from, { flow: "rezervasyon", step: 1, data: {} });
    reply = RESV_FORM;
  } else if (d && SECTIONS[d]) {
    states.delete(from);
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
