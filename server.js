// =========================================================
// GEZİ GÜNLÜĞÜM — SUNUCU (BACKEND)
// =========================================================
// Bu dosya bilgisayarda sürekli çalışan bir program başlatır.
// Tarayıcıdan gelen istekleri dinler ve cevap verir:
//   - Sayfa / resim / CSS istenirse  -> public klasöründen dosyayı gönderir
//   - /api/... ile başlayan bir adres istenirse -> veri (JSON) döndürür
//
// Çalıştırmak için terminale:  npm start
// Sonra tarayıcıda:            http://localhost:3000
// =========================================================

// 1) GEREKLİ PAKETLERİ YÜKLE
// require(...) başka bir dosyadaki ya da paketteki kodu bu dosyaya getirir.
const express = require("express"); // npm ile kurduğumuz sunucu kütüphanesi
const path = require("path");       // Node.js'in içinde gelir: klasör yollarını doğru birleştirir
const { DatabaseSync } = require("node:sqlite"); // Node.js'in içinde gelir: veritabanı (defter)

// VERİTABANINI AÇ (deneme-db.js'te yaptığımızın aynısı)
const db = new DatabaseSync(path.join(__dirname, "gezi.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS yorumlar (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    isim  TEXT NOT NULL,
    yorum TEXT NOT NULL,
    tarih TEXT NOT NULL
  )
`);

// Tabloya sonradan "yazi_id" sütununu ekledik: yorum hangi yazıya yazıldı?
// Eski defterde bu sütun yoksa ekle (varsa dokunma).
const sutunlar = db.prepare("PRAGMA table_info(yorumlar)").all();
if (!sutunlar.some(function (s) { return s.name === "yazi_id"; })) {
  db.exec("ALTER TABLE yorumlar ADD COLUMN yazi_id TEXT");
}

// İLETİŞİM MESAJLARI İÇİN İKİNCİ TABLO
db.exec(`
  CREATE TABLE IF NOT EXISTS mesajlar (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    isim   TEXT NOT NULL,
    eposta TEXT NOT NULL,
    mesaj  TEXT NOT NULL,
    tarih  TEXT NOT NULL
  )
`);

// 2) UYGULAMAYI OLUŞTUR
// "app" bizim sunucumuz. Bütün kuralları bunun üzerine ekleyeceğiz.
const app = express();

// Sunucunun dinleyeceği "kapı numarası" (port).
// Bir bilgisayarda birçok program aynı anda ağ kullanabilir;
// port, isteğin hangi programa gideceğini belirler.
const PORT = process.env.PORT || 3000;

// 3) SİTE DOSYALARINI SUN
// express.static: "bu klasördeki dosyaları olduğu gibi gönder" demek.
// Tarayıcı /style.css isterse -> public/style.css gönderilir.
// Tarayıcı sadece / isterse    -> public/index.html gönderilir.
// __dirname = bu dosyanın (server.js) bulunduğu klasör.
// Sadece "public" klasörünü açtığımız için server.js gibi dosyalar dışarıdan görülemez.
app.use(express.static(path.join(__dirname, "public")));

// 4) İLK API ADRESİMİZ
// app.get(adres, fonksiyon): "Biri bu adrese GET isteği gönderirse bu fonksiyonu çalıştır."
//   istek (req)  -> gelen istekle ilgili her şey (adres, parametreler, gönderilen veri)
//   cevap (res)  -> tarayıcıya geri göndereceğimiz cevap
app.get("/api/durum", function (istek, cevap) {
  // cevap.json(...) bir JavaScript nesnesini JSON metnine çevirip gönderir.
  // JSON, tarayıcı ile sunucunun veri alışverişinde kullandığı ortak dildir.
  cevap.json({
    durum: "çalışıyor",
    zaman: new Date().toISOString()
  });
});

// 5) YORUMLAR — "GETİR" KAPISI
// /api/yorumlar?yazi=kapadokya  -> sadece o yazının yorumlarını gönderir
// /api/yorumlar                 -> bütün yorumları gönderir
// ORDER BY id DESC = en yeni yorum en üstte olsun.
app.get("/api/yorumlar", function (istek, cevap) {
  const yaziId = istek.query.yazi;
  const yorumlar = yaziId
    ? db.prepare("SELECT * FROM yorumlar WHERE yazi_id = ? ORDER BY id DESC").all(String(yaziId))
    : db.prepare("SELECT * FROM yorumlar ORDER BY id DESC").all();
  cevap.json(yorumlar);
});

// 6) YORUMLAR — "KAYDET" KAPISI
// Siteden gönderilen yorumu deftere yazar.
// express.json(): gelen veriyi (JSON) okuyup istek.body içine koyar.
app.post("/api/yorumlar", express.json(), function (istek, cevap) {
  const isim = String(istek.body.isim || "").trim();
  const yorum = String(istek.body.yorum || "").trim();
  const yaziId = String(istek.body.yazi_id || "").trim();

  // Boş ya da çok uzun yorumları kabul etme
  if (!isim || !yorum || !yaziId) {
    return cevap.status(400).json({ hata: "İsim ve yorum boş olamaz." });
  }
  if (isim.length > 50 || yorum.length > 1000 || yaziId.length > 100) {
    return cevap.status(400).json({ hata: "İsim ya da yorum çok uzun." });
  }

  const tarih = new Date().toISOString();
  const sonuc = db
    .prepare("INSERT INTO yorumlar (isim, yorum, tarih, yazi_id) VALUES (?, ?, ?, ?)")
    .run(isim, yorum, tarih, yaziId);

  // 201 = "yeni bir şey oluşturuldu" demek
  cevap.status(201).json({ id: Number(sonuc.lastInsertRowid), isim, yorum, tarih, yazi_id: yaziId });
});

// 7) İLETİŞİM — "MESAJ GÖNDER" KAPISI
// Sadece kaydetme kapısı var, "getir" kapısı yok:
// mesajlar gizli, herkes okuyamasın. (Okumayı admin sayfasında yapacağız.)
app.post("/api/mesajlar", express.json(), function (istek, cevap) {
  const isim = String(istek.body.isim || "").trim();
  const eposta = String(istek.body.eposta || "").trim();
  const mesaj = String(istek.body.mesaj || "").trim();

  if (!isim || !eposta || !mesaj) {
    return cevap.status(400).json({ hata: "Lütfen bütün alanları doldur." });
  }
  // Basit e-posta kontrolü: içinde @ ve . olsun, boşluk olmasın
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta)) {
    return cevap.status(400).json({ hata: "E-posta adresi geçersiz görünüyor." });
  }
  if (isim.length > 50 || eposta.length > 100 || mesaj.length > 3000) {
    return cevap.status(400).json({ hata: "Mesaj çok uzun." });
  }

  db.prepare("INSERT INTO mesajlar (isim, eposta, mesaj, tarih) VALUES (?, ?, ?, ?)")
    .run(isim, eposta, mesaj, new Date().toISOString());

  cevap.status(201).json({ tamam: true });
});

// =========================================================
// 8) ADMIN (YÖNETİCİ) KAPILARI — ŞİFRE İSTER
// =========================================================
// Şifre .env dosyasında durur (kodun içine yazmıyoruz ki kod paylaşılınca şifre sızmasın).
// npm start, .env dosyasını okuyup process.env.ADMIN_SIFRE içine koyar.
const crypto = require("crypto");
const ADMIN_SIFRE = process.env.ADMIN_SIFRE || "";

// "Kapı görevlisi" (middleware): admin kapısından önce çalışır, şifreyi kontrol eder.
// Şifre doğruysa next() ile içeri alır, yanlışsa 401 (yetkisiz) döner.
function adminKontrol(istek, cevap, next) {
  if (!ADMIN_SIFRE) {
    return cevap.status(503).json({ hata: "Admin şifresi ayarlanmamış (.env dosyası)." });
  }
  const gelen = Buffer.from(String(istek.get("x-admin-sifre") || ""));
  const dogru = Buffer.from(ADMIN_SIFRE);
  // timingSafeEqual: şifreyi karakter karakter tahmin etmeyi zorlaştıran güvenli karşılaştırma
  const ayni = gelen.length === dogru.length && crypto.timingSafeEqual(gelen, dogru);
  if (!ayni) {
    // Yanlış şifrede 1 saniye bekle: deneme-yanılma ile şifre bulmayı yavaşlatır
    return setTimeout(function () {
      cevap.status(401).json({ hata: "Şifre yanlış." });
    }, 1000);
  }
  next();
}

// Bütün mesajları getir
app.get("/api/admin/mesajlar", adminKontrol, function (istek, cevap) {
  cevap.json(db.prepare("SELECT * FROM mesajlar ORDER BY id DESC").all());
});

// Bütün yorumları getir (hangi yazıya yazıldığıyla birlikte)
app.get("/api/admin/yorumlar", adminKontrol, function (istek, cevap) {
  cevap.json(db.prepare("SELECT * FROM yorumlar ORDER BY id DESC").all());
});

// Bir mesajı ya da yorumu sil. :tablo ve :id adresin içinden okunur.
// Örnek: DELETE /api/admin/yorumlar/5  -> 5 numaralı yorumu sil
app.delete("/api/admin/:tablo/:id", adminKontrol, function (istek, cevap) {
  const tablo = istek.params.tablo;
  // Tablo adını kullanıcıdan gelen yazıyla SQL'e koymak tehlikeli olur,
  // o yüzden sadece bu iki isme izin veriyoruz.
  if (tablo !== "yorumlar" && tablo !== "mesajlar") {
    return cevap.status(404).json({ hata: "Böyle bir tablo yok." });
  }
  const sonuc = db.prepare("DELETE FROM " + tablo + " WHERE id = ?").run(Number(istek.params.id));
  if (sonuc.changes === 0) {
    return cevap.status(404).json({ hata: "Kayıt bulunamadı." });
  }
  cevap.json({ tamam: true });
});

// 9) SUNUCUYU BAŞLAT
// listen: belirtilen portu dinlemeye başla. Program bu satırdan sonra kapanmaz,
// sen terminalde Ctrl+C'ye basana kadar istek beklemeye devam eder.
app.listen(PORT, function () {
  console.log("Sunucu çalışıyor: http://localhost:" + PORT);
  console.log("Durdurmak için Ctrl+C");
});
