// =========================================================
// SİTE AYARLARI — kendi linklerini buraya yaz
// =========================================================
const ayarlar = {
  youtube: "",    // kanal linkin, örn: "https://www.youtube.com/@kanaladi"
  instagram: "",  // örn: "https://www.instagram.com/kullaniciadi"
  facebook: "",
  eposta: ""      // örn: "merhaba@ornek.com"
};

// =========================================================
// SİTENİN TÜM İÇERİĞİ
// =========================================================
// Yeni yazı eklemek için ilgili ülkenin "yazilar" listesine bir nesne eklemen yeterli.
//
// Bir yazıda kullanılabilecek alanlar:
//   id, baslik, tarih ("YYYY-AA-GG"), resim, ozet   -> temel bilgiler
//   video     -> YouTube linki (yazının başında oynatılır, kartta ▶ rozeti çıkar)
//   etiketler -> ["Plaj", "Doğa"] gibi; ana sayfada filtrelemek için
//   bilgiler  -> "Hızlı bilgiler" kutusu: zaman, butce, sure, ulasim, vize
//   icerik    -> yazının gövdesi. Parça tipleri:
//                { tip: "yazi",   metin: "..." }
//                { tip: "baslik", metin: "..." }
//                { tip: "foto",   src: "img/...", altyazi: "..." }
//                { tip: "galeri", fotolar: ["img/...", "img/..."] }
//                { tip: "video",  youtube: "https://youtu.be/..." }
//
// kapak / resim boş bırakılırsa emojili renkli bir kutu gösterilir.
// konum: [enlem, boylam] -> haritadaki işaretin yeri.
// kod:   ülkenin iki harfli kodu (Kenya "ke", Japonya "jp"...) -> bayrağı gösterir.
//        Kodların listesi: https://flagcdn.com/tr/codes.json

const veri = {
  asya: {
    baslik: "Asya",
    emoji: "🌏",
    aciklama: "Tapınaklar, tropik adalar ve sokak lezzetleri.",
    kapak: "img/tayland/kapak.jpg",
    ulkeler: {
      endonezya: {
        isim: "Endonezya",
        kod: "id",
        emoji: "🌋",
        kapak: "img/endonezya/kapak.jpg",
        konum: [-8.4, 115.5],
        yazilar: [
          {
            id: "gili-adalari",
            baslik: "Gili Adaları Rehberi",
            tarih: "2026-08-12",
            resim: "img/endonezya/gili.jpg",
            video: "", // buraya bu gezinin YouTube linkini yaz
            ozet: "Motorsuz adalar, turkuaz deniz ve gün batımı. Gili'de neler yapılır?",
            etiketler: ["Plaj", "Ada", "Doğa"],
            bilgiler: {
              zaman: "Mayıs – Eylül (kuru mevsim)",
              butce: "Günlük ~40–60 €",
              sure: "3–4 gün",
              ulasim: "Bali'den hızlı tekne (~2 saat)",
              vize: "Varışta vize (e-VOA)"
            },
            icerik: [
              { tip: "yazi", metin: "Gili'ye vardığımızda ilk fark ettiğimiz şey sessizlikti. Adada motorlu araç yok." },
              { tip: "foto", src: "img/endonezya/gili.jpg", altyazi: "Gili'de gün batımı" },
              { tip: "baslik", metin: "Nerede kalınır?" },
              { tip: "yazi", metin: "Konaklama için plaja yakın küçük pansiyonlar en iyisi." },
              { tip: "galeri", fotolar: ["img/endonezya/gili2.jpg", "img/endonezya/gili3.jpg"] }
            ]
          },
          {
            id: "nusa-penida",
            baslik: "Nusa Penida Gezi Rehberi",
            tarih: "2026-08-20",
            resim: "",
            video: "",
            ozet: "Kelingking sahili, uçurumlar ve manta balıkları.",
            etiketler: ["Doğa", "Plaj", "Macera"],
            icerik: [
              { tip: "yazi", metin: "Nusa Penida yazısı buraya gelecek." }
            ]
          }
        ]
      },
      malezya: { isim: "Malezya", kod: "my", emoji: "🏙️", kapak: "img/malezya/kapak.jpg", konum: [3.14, 101.69], yazilar: [] },
      tayland: { isim: "Tayland", kod: "th", emoji: "🐘", kapak: "img/tayland/kapak.jpg", konum: [13.75, 100.5], yazilar: [] }
    }
  },

  avrupa: {
    baslik: "Avrupa",
    emoji: "🏰",
    aciklama: "Taş sokaklar, müzeler ve Balkan kasabaları.",
    kapak: "img/cekya/kapak.jpg",
    ulkeler: {
      avusturya: { isim: "Avusturya", kod: "at", emoji: "🎻", kapak: "img/avusturya/kapak.jpg", konum: [48.21, 16.37], yazilar: [] },
      "bosna-hersek": { isim: "Bosna-Hersek", kod: "ba", emoji: "🌉", kapak: "img/bosna-hersek/kapak.jpg", konum: [43.86, 18.41], yazilar: [] },
      cekya: { isim: "Çekya", kod: "cz", emoji: "🍺", kapak: "img/cekya/kapak.jpg", konum: [50.08, 14.44], yazilar: [] },
      ingiltere: { isim: "İngiltere", kod: "gb", emoji: "🎡", kapak: "img/ingiltere/kapak.jpg", konum: [51.51, -0.13], yazilar: [] },
      irlanda: { isim: "İrlanda", kod: "ie", emoji: "☘️", kapak: "img/irlanda/kapak.jpg", konum: [53.35, -6.26], yazilar: [] },
      italya: { isim: "İtalya", kod: "it", emoji: "🍕", kapak: "img/italya/kapak.jpg", konum: [43.77, 11.25], yazilar: [] },
      karadag: { isim: "Karadağ", kod: "me", emoji: "⛰️", kapak: "img/karadag/kapak.jpg", konum: [42.43, 18.77], yazilar: [] },
      kibris: { isim: "Kıbrıs", kod: "tr", emoji: "🏖️", kapak: "img/kibris/kapak.jpg", konum: [35.19, 33.38], yazilar: [] },
      makedonya: { isim: "Makedonya", kod: "mk", emoji: "🏞️", kapak: "img/makedonya/kapak.jpg", konum: [41.12, 20.8], yazilar: [] },
      sirbistan: { isim: "Sırbistan", kod: "rs", emoji: "🏛️", kapak: "img/sirbistan/kapak.jpg", konum: [44.79, 20.45], yazilar: [] },
      vatikan: { isim: "Vatikan", kod: "va", emoji: "⛪", kapak: "img/vatikan/kapak.jpg", konum: [41.9, 12.45], yazilar: [] }
    }
  },

  afrika: {
    baslik: "Afrika",
    emoji: "🦁",
    aciklama: "Çöller, safariler ve renkli çarşılar.",
    kapak: "img/kenya/kapak.jpg",
    ulkeler: {
      fas: { isim: "Fas", kod: "ma", emoji: "🕌", kapak: "img/fas/kapak.jpg", konum: [31.63, -7.99], yazilar: [] },
      misir: { isim: "Mısır", kod: "eg", emoji: "🐪", kapak: "img/misir/kapak.jpg", konum: [30.04, 31.24], yazilar: [] },
      kenya: { isim: "Kenya", kod: "ke", emoji: "🦓", kapak: "img/kenya/kapak.jpg", konum: [-1.29, 36.82], yazilar: [] }
    }
  }
};
