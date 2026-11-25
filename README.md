# Gezi Günlüğüm

Gezilen ülkelerden yazıların, fotoğrafların ve videoların paylaşıldığı bir gezi vlog sitesi. Staj projesi olarak geliştirildi.

## Özellikler

- Kıta ve ülkelere göre gezi yazıları, etiket filtreleme
- Leaflet ile etkileşimli dünya haritası
- Site içi arama (`/` veya `Ctrl+K`)
- Koyu tema, mobil uyumlu tasarım
- Fotoğraf galerisi ve büyütme penceresi, YouTube videoları
- Her yazıya özel yorumlar
- İletişim formu
- Şifre korumalı yönetim paneli (mesajları ve yorumları görme/silme)

## Kullanılan teknolojiler

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **Veritabanı:** SQLite (Node.js'in içindeki `node:sqlite` modülü)

## Çalıştırma

Node.js 22.13 veya daha yeni bir sürüm gerekir.

```bash
npm install
npm start
```

Sonra tarayıcıda `http://localhost:3000` adresini aç.

### Yönetim paneli

Proje klasöründe `.env` adında bir dosya oluştur ve içine şifreyi yaz:

```
ADMIN_SIFRE=buraya-guclu-bir-sifre
```

Panel adresi: `http://localhost:3000/admin.html`

## Klasör yapısı

```
server.js       Sunucu: sayfaları gönderir, API adresleri, veritabanı
public/         Sitenin dosyaları (HTML, CSS, JS, fotoğraflar)
  veri.js       Bütün yazıların içeriği
  admin.html    Yönetim paneli
```
