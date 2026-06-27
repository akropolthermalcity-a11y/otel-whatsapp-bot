// Fotoğraf galerisi: public/img klasöründeki dosyaları isim önekine göre kategoriye ayırır.
// Yeni fotoğraf eklemek için public/img içine şu öneklerle dosya bırakmanız yeterli:
//   oda1.jpg, oda2.jpg ... | havuz1.jpg ... | termal1.jpg ... | cevre1.jpg ... | genel1.jpg ...
// (jpg/jpeg/png; WhatsApp için ~5 MB altı önerilir)
import fs from "node:fs";
import path from "node:path";

const IMG_DIR = path.join(process.cwd(), "public", "img");
// WhatsApp'a link olarak gönderilecek genel adres (botun kendi alan adı)
const PUBLIC_BASE = (process.env.PUBLIC_BASE_URL || "https://otel-whatsapp-bot.onrender.com").replace(/\/+$/, "");

const CATS = [
  { key: "oda", prefix: /^oda/i, caption: "🏠 Odalarımızdan kareler" },
  { key: "havuz", prefix: /^havuz/i, caption: "🏊 Havuz & Aquapark" },
  { key: "termal", prefix: /^termal/i, caption: "♨️ Termal alanlarımız" },
  { key: "dis", prefix: /^(cevre|dis)/i, caption: "🌿 Tesis & çevre" },
  { key: "genel", prefix: /^genel/i, caption: "📷 Akropol Termal Şehir" },
];

function listFiles() {
  try {
    return fs.readdirSync(IMG_DIR).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
  } catch {
    return [];
  }
}

export function hasPhotos() {
  return listFiles().length > 0;
}

// İstenen kategoriye göre en fazla 5 fotoğrafın tam URL + caption listesini döndürür.
// Kategori boşsa: genel'e, o da yoksa eldeki tüm fotoğraflara düşer.
export function photosFor(category) {
  const files = listFiles();
  if (!files.length) return [];
  const cat = CATS.find((c) => c.key === category);
  let chosen = cat ? files.filter((f) => cat.prefix.test(f)) : [];
  if (!chosen.length) chosen = files.filter((f) => /^genel/i.test(f));
  if (!chosen.length) chosen = files;
  chosen = chosen.slice(0, 5);
  const caption = cat?.caption || "📷 Akropol Termal Şehir";
  return chosen.map((f, i) => ({
    url: `${PUBLIC_BASE}/img/${encodeURIComponent(f)}`,
    caption: i === 0 ? caption : "",
  }));
}
