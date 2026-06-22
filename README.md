# Otel WhatsApp AI Bot

Müşterilerin WhatsApp'tan yazdığı mesajlara, otel bilgilerine dayanarak
otomatik ve yapay zeka destekli (Gemini Flash) cevap veren bot. Gerekince
müşteri temsilcisine aktarır.

```
Müşteri WhatsApp → Meta Cloud API (webhook) → bu sunucu → Gemini → cevap
```

## Gereksinimler
- Node.js 22+ (kurulu: `node --version`)
- Meta WhatsApp Cloud API hesabı (App ID, Phone number ID, access token)
- Gemini API anahtarı — https://aistudio.google.com (ücretsiz kotası var)

## Kurulum
```bash
cd "whatsapp-bot"
npm install
cp .env.example .env      # sonra .env içini doldur
```

`.env` içinde doldurulacaklar:
- `WHATSAPP_TOKEN` — Meta > API Setup > "Generate access token" (geçici, 24 saat)
- `PHONE_NUMBER_ID` — API Setup ekranındaki değer (test numarası için hazır)
- `VERIFY_TOKEN` — kendin belirlediğin gizli kelime (webhook bağlarken aynısı)
- `GEMINI_API_KEY` — Gemini API anahtarı (Google AI Studio)
- `HOTEL_NAME` — otel adı
- `GEMINI_MODEL` — model seçimi (aşağıya bak)

Ardından **otel bilgilerini** `src/hotelInfo.js` içine doldur — botun bildiği
her şey orada.

## Çalıştırma
```bash
npm run dev      # geliştirme (dosya değişince yeniden başlar)
npm start        # normal
```

## Yerel test (ngrok ile)
WhatsApp'ın bilgisayarına ulaşması için public HTTPS adres gerekir:
```bash
ngrok http 3000
```
ngrok sana `https://xxxx.ngrok-free.app` gibi bir adres verir.
Meta panelinde **WhatsApp > Configuration > Webhook**:
- Callback URL: `https://xxxx.ngrok-free.app/webhook`
- Verify token: `.env` içindeki `VERIFY_TOKEN` ile aynı
- "messages" alanına abone ol (Subscribe)

Sonra test numaranı API Setup'ta "To" listesine ekleyip kendine WhatsApp'tan yaz.

## Model ve maliyet
Varsayılan `gemini-2.5-flash` — hızlı ve ucuz, müşteri hizmetine ideal.
Google AI Studio'da ücretsiz kotası var; gerçek fiyatlar AI Studio'da.
`.env` içinde `GEMINI_MODEL` ile değiştirilebilir:

| Model | Ne için |
|---|---|
| `gemini-2.5-flash` | Hızlı/ucuz, dengeli (varsayılan) |
| `gemini-2.5-flash-lite` | Daha da ucuz/hızlı, daha basit cevaplar |

Not: `src/ai.js` içinde "düşünme" (thinking) kapalı tutuldu (hız/maliyet için).
Daha zor sorularda kaliteyi artırmak istersen `thinkingConfig` satırını
kaldırabilir veya `thinkingBudget`'ı yükseltebilirsin.

## Dosya yapısı
- `src/server.js` — webhook sunucusu (giriş noktası)
- `src/whatsapp.js` — Meta API: mesaj ayıklama + gönderme
- `src/ai.js` — Gemini cevabı + sistem talimatı + konuşma hafızası + devir
- `src/hotelInfo.js` — **otel bilgi tabanı (doldur)**
- `src/config.js` — ortam değişkenleri

## Notlar / sıradaki adımlar
- Konuşma hafızası şu an bellekte; sunucu yeniden başlayınca sıfırlanır.
  Kalıcılık için veritabanı eklenebilir.
- "Temsilciye aktar" şu an konsola log düşüyor (`src/ai.js`). Gerçek bildirim
  (yetkiliye WhatsApp/e-posta/panel) eklenebilir.
- Yayına alırken geçici token yerine kalıcı System User token kullanılmalı.
- Instagram DM için aynı altyapıya kanal adaptörü eklenebilir.
