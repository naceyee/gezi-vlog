// =========================================================
// ADIM 2 — VERİTABANI DENEMESİ
// Çalıştırmak için terminale:  node deneme-db.js
// =========================================================

// Node.js'in içinde gelen SQLite (veritabanı) aracı. Ayrıca kurmaya gerek yok.
const { DatabaseSync } = require("node:sqlite");

// 1) DEFTERİ AÇ
// gezi.db dosyası yoksa oluşturur, varsa açar.
const db = new DatabaseSync("gezi.db");

// 2) TABLOYU OLUŞTUR (yoksa)
// Tablonun sütunları: id, isim, yorum, tarih
db.exec(`
  CREATE TABLE IF NOT EXISTS yorumlar (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    isim  TEXT NOT NULL,
    yorum TEXT NOT NULL,
    tarih TEXT NOT NULL
  )
`);

// 3) BİR YORUM EKLE
// ? işaretleri "buraya değer gelecek" demek. Değerleri run(...) içinde veriyoruz.
const ekle = db.prepare("INSERT INTO yorumlar (isim, yorum, tarih) VALUES (?, ?, ?)");
ekle.run("Ayşe", "Çok güzel fotoğraflar!", new Date().toISOString());

// 4) BÜTÜN YORUMLARI OKU VE GÖSTER
const yorumlar = db.prepare("SELECT * FROM yorumlar").all();
console.table(yorumlar);
