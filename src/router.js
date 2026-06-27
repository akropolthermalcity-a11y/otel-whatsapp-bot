// Menü + numara akışı + adım adım (anket) başvuru formları.
// Numara/menü seçimleri Gemini kotası harcamaz (sabit metin). Serbest metin -> AI.
import { generateReply } from "./ai.js";
import { logConversation } from "./logger.js";
import { photosFor } from "./photos.js";

const MENU = `Merhaba, ben İnci 👋

Beypazarı İncisi'nden size yardımcı olacağım.

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

// ---- HEDİYE TATİL: önce bilgi + onay, sonra TEK mesajda form, sonra kurumsal onay ----
const HEDIYE_INFO = `🎁 *Hediye Tatil Programımız*

Sizi Akropol Termal Şehir'de *2 gece 3 gün* ağırlamaktan mutluluk duyarız 🌿

• Tesis tanıtımımız kapsamında konaklama *ücretsizdir*.
• Program boyunca yaklaşık *2 saatlik* tanıtım sunumumuza katılım beklenir (satın alma zorunluluğu yoktur).
• Girişte oda/envanter için *500 TL depozito* alınır, çıkışta *eksiksiz iade* edilir.
• Yemek, ulaşım ve yakıt programa dahil değildir.
• *Katılım koşulları:* evli ve aile olarak gelmek, 30 yaş ve üzeri olmak, daha önce Akropol Termal'de konaklamamış olmak.`;

// Bilgi mesajının sonuna eklenen onay sorusu
const HEDIYE_CONSENT = `\n\nDilerseniz başvurunuzu hemen alabilirim 🙂 *Hediye tatil başvuru formunu* doldurmak ister misiniz? (Evet / Hayır)`;

// "Evet" denince tek mesajda gönderilen form
const HEDIYE_FORM = `🎁 *Hediye Tatil Başvuru Formu*

Aşağıdaki bilgileri *tek mesajda* yazıp gönderebilirsiniz:

1️⃣ Ad Soyad
2️⃣ Yaş
3️⃣ Medeni durum (Evli / Bekar)
4️⃣ Yaşadığınız il
5️⃣ Daha önce Akropol Termal'de konakladınız mı? (Evet / Hayır)
6️⃣ Telefon numaranız
7️⃣ Tatile kaç kişi katılacak? (kaç yetişkin / kaç çocuk)
8️⃣ Tercih ettiğiniz tarih aralığı

Bilgilerinizi gönderdiğinizde başvurunuzu hemen alacağım 🙂`;

// Form yanıtı gelince kurumsal onay
const HEDIYE_DONE = `Başvurunuz tarafımıza ulaşmıştır. ✅

Talebiniz değerlendirme birimimize iletilmiştir; uygunluk ve müsaitlik değerlendirmesinin ardından müşteri temsilcimiz en kısa sürede sizinle iletişime geçecektir.

İlginiz için teşekkür eder, iyi günler dileriz.
*İnci · Beypazarı İncisi* 🌿`;

// "Hayır" yanıtı
const HEDIYE_NO = `Tabii, anlıyorum 🙂 Dilediğiniz an hediye tatil başvurusu için bana yazabilir ya da 0537 266 0634 numaralı hattan bizi arayabilirsiniz.`;

// ---- REZERVASYON: hediye tatil mi, ücretli konaklama mı? ----
const REZ_TIP_Q = `Tabii, memnuniyetle yardımcı olayım 🙂

Rezervasyonunuz *hediye tatil programımız* için mi, yoksa *ücretli konaklama* için mi olacak?`;

// Tip belirsizse tekrar sor
const REZ_TIP_TEKRAR = `Tam anlayabilmem için: *hediye tatil* programımız için mi, yoksa *ücretli konaklama* için mi düşünüyorsunuz? 🙂`;

// Ücretli konaklama -> temsilciyi ARAMAYA yönlendir (WhatsApp deme)
const REZ_UCRETLI = `Ücretli konaklama ve kesin rezervasyon için müşteri temsilcimizi *0537 266 0634* numaralı hattan arayabilirsiniz 🙂 Size en uygun seçenekleri memnuniyetle sunacaktır.`;

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
// Olumsuz yanıt mı? (önce buna bakılır)
function isNegative(l) {
  return /(hay[ıi]r|istemiyorum|istemem|gerek yok|olmaz|vazge[çc]|ilgilenmiyorum|^yok$|[şs]imdilik (yok|hay[ıi]r|olmaz|de[ğg]il))/.test(l.trim());
}
// Olumlu yanıt mı? (onay)
function isPositive(l) {
  const s = l.trim();
  if (isNegative(s)) return false;
  return /(evet|evt|^e$|olur|olsun|tabi+|tamam|tmm|^ok$|okey|peki|isterim|istiyorum|kesinlikle|ba[şs]vur|kat[ıi]l|memnuniyetle|hayhay|👍|✅|👌)/.test(s);
}
// Serbest metinde "hediye tatile katılmak/kullanmak/başvurmak istiyorum" gibi NİYET var mı?
// Salt bilgi sorusu (nedir, şartları, hakkında) ankete sokulmaz.
function wantsHediyeBasvuru(l) {
  if (!/hediye|bedava tatil|ücretsiz tatil|ucretsiz tatil/.test(l)) return false;
  // Niyet ifadeleri: katıl / kullan / başvur / yararlan / faydalan / hak kazan / istiyorum ...
  const niyet =
    /(katıl|katil|kullan|başvur|basvur|yararlan|faydalan|kazan|hakk?ım|hakkim|hediyem|almak ist|kayıt|kayit|nas[ıi]l (katıl|katil|başvur|basvur|yararlan|olur)|kat[ıi]lmak|ba[şs]vurmak|istiyorum|isterim|talep)/.test(
      l
    );
  // Salt bilgi sorusu işaretleri (varsa ve niyet zayıfsa ankete sokma)
  const sadeceBilgi = /(nedir|ne demek|hakk[ıi]nda bilgi|[şs]artlar[ıi]? (ne|nedir|neler)|ko[şs]ullar|detay)/.test(l);
  return niyet && !sadeceBilgi;
}
// Serbest metinde rezervasyon/konaklama niyeti var mı? (hediye değilse)
function wantsRezervasyon(l) {
  return /(rezervasyon|rezerve|yer ayır|yer ayir|oda tut|oda ayır|oda ayir|konaklamak ist|kalmak ist|tatil yapmak ist|tatile gel|tatil planl)/.test(
    l
  );
}
// Rezervasyon tipi seçimi: hediye mi, ücretli mi?
function rezTipChoice(l) {
  if (/hediye|ücretsiz|ucretsiz|bedava/.test(l)) return "hediye";
  if (/ücretli|ucretli|paral[ıi]|ödeme|odeme|normal|para|kendi|ücret|ucret|konaklama|tatil/.test(l)) return "ucretli";
  return null;
}
function formatData(data) {
  return Object.entries(data).map(([k, v]) => `${k}: ${v}`).join("\n");
}
// Mesaj fotoğraf isteği mi? İstiyorsa hangi kategori? Değilse null.
function photoCategory(l) {
  if (!/(foto|fotoğraf|fotograf|resim|görsel|gorsel|görebilir|gorebilir|göster|goster|göndere?bil|gondere?bil)/.test(l))
    return null;
  if (/oyun alan|oyun park|playground|top havuz|[çc]ocuk (kul[üu]b|aktivite|oyun|alan|park)|[çc]ocuklar i[çc]in/.test(l))
    return "cocuk";
  if (/oda|daire|s[uü]it|konaklama/.test(l)) return "oda";
  if (/havuz|aquapark/.test(l)) return "havuz";
  if (/termal|sauna|hamam|kapl[ıi]ca|spa/.test(l)) return "termal";
  if (/d[ıi][şs]|[çc]evre|bah[çc]e|manzara|tesis|d[ıi][şs] mekan|d[ıi][şs]ar/.test(l)) return "dis";
  return "genel";
}

export async function handleMessage(from, text, name) {
  const t = (text || "").trim();
  const lower = t.toLowerCase();
  const st = states.get(from);
  const d = menuDigit(t);

  let reply;
  let images = null; // dolu ise server fotoğrafları gönderir
  let lead = false; // e-posta + Sheet'te "talep" olarak işaretle
  let logMsg = t;

  // 1) Aktif bir akış varsa
  if (st) {
    if (isGreeting(lower) || isCancel(lower)) {
      states.delete(from);
      reply = MENU;
    }
    // 1a) Hediye: bilgi sonrası onay bekleniyor
    else if (st.flow === "hediye_consent") {
      if (isNegative(lower)) {
        states.delete(from);
        reply = HEDIYE_NO + FOOTER;
      } else if (isPositive(lower)) {
        states.set(from, { flow: "hediye_form" });
        reply = HEDIYE_FORM;
      } else {
        // Soru sormuş -> AI ile yanıtla, sonra onayı tekrar sor (akış devam)
        reply = (await generateReply(from, t, name)) + HEDIYE_CONSENT;
      }
    }
    // 1b) Hediye: form yanıtı bekleniyor
    else if (st.flow === "hediye_form") {
      const formDoldu = t.length > 25 || /\d/.test(t) || t.includes("\n");
      if (formDoldu) {
        states.delete(from);
        reply = HEDIYE_DONE;
        lead = true;
        logMsg = `🎁 HEDİYE TATİL BAŞVURU\n${t}`;
      } else {
        // Kısa/soru -> yanıtla, formu doldurmasını hatırlat (akış devam)
        reply =
          (await generateReply(from, t, name)) +
          `\n\nHazır olduğunuzda yukarıdaki *form bilgilerini tek mesajda* gönderebilirsiniz 🙂`;
      }
    }
    // 1c) Rezervasyon tipi bekleniyor: hediye mi, ücretli mi?
    else if (st.flow === "rez_tip") {
      const tip = rezTipChoice(lower);
      if (tip === "hediye") {
        // Hediye tatil: detaylı bilgi + anketi TEK mesajda sor
        states.set(from, { flow: "hediye_form" });
        reply = HEDIYE_INFO + "\n\n" + HEDIYE_FORM;
      } else if (tip === "ucretli") {
        states.delete(from);
        reply = REZ_UCRETLI;
      } else {
        reply = REZ_TIP_TEKRAR; // belirsiz -> tekrar sor (akış devam)
      }
    }
  }
  // 2) Menü: 1 = Hediye Tatil -> önce bilgi + onay (ANKETE DİREKT GİRME)
  else if (d === "1") {
    states.set(from, { flow: "hediye_consent" });
    reply = HEDIYE_INFO + HEDIYE_CONSENT;
  } else if (d === "8") {
    // Rezervasyon -> önce tip sor (hediye mi, ücretli mi?)
    states.set(from, { flow: "rez_tip" });
    reply = REZ_TIP_Q;
  } else if (d && SECTIONS[d]) {
    reply = SECTIONS[d] + FOOTER;
  }
  // 2b) Serbest metinde hediye katılım niyeti -> bilgi + onay (anket değil)
  else if (wantsHediyeBasvuru(lower)) {
    states.set(from, { flow: "hediye_consent" });
    reply = HEDIYE_INFO + HEDIYE_CONSENT;
  }
  // 2b2) Rezervasyon/konaklama niyeti -> tip sor (hediye mi, ücretli mi?)
  else if (wantsRezervasyon(lower)) {
    states.set(from, { flow: "rez_tip" });
    reply = REZ_TIP_Q;
  }
  // 2c) Fotoğraf isteği -> ilgili kategorideki fotoğrafları gönder
  else if (photoCategory(lower)) {
    const imgs = photosFor(photoCategory(lower));
    if (imgs.length) {
      images = imgs;
      reply = "İşte birkaç görselimiz 🙂 Başka merak ettiğiniz olursa menü için 0 yazabilirsiniz.";
    } else {
      reply =
        "Görselleri sizinle hemen paylaşmak isterim 🙏 Şu an fotoğraflarımı hazırlıyorum; dilerseniz 0537 266 0634'ten gönderebilirim." +
        FOOTER;
    }
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
  return images ? { text: reply, images } : reply;
}
