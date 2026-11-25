// HER SAYFANIN KULLANDIĞI ORTAK FONKSİYONLAR

// ---------------------------------------------------------
// 1. MENÜ VE ALT BİLGİ (tek yerden, her sayfaya aynı)
// ---------------------------------------------------------
function sosyalLinkler() {
  const linkler = [
    ["instagram", "fa-brands fa-instagram", "Instagram"],
    ["youtube", "fa-brands fa-youtube", "YouTube"],
    ["facebook", "fa-brands fa-facebook", "Facebook"]
  ];
  let html = "";
  linkler.forEach(function (l) {
    html +=
      '<a href="' + (ayarlar[l[0]] || "#") + '" target="_blank" rel="noopener" aria-label="' + l[2] + '">' +
      '<i class="' + l[1] + '"></i></a>';
  });
  html +=
    '<a href="' + (ayarlar.eposta ? "mailto:" + ayarlar.eposta : "hakkimizda.html#iletisim") +
    '" aria-label="E-posta"><i class="fa-solid fa-envelope"></i></a>';
  return html;
}

function menuCiz() {
  let kitalar = "";
  for (const anahtar in veri) {
    kitalar += '<a href="index.html#' + anahtar + '" data-bolge="' + anahtar + '">' + veri[anahtar].baslik + "</a>";
  }

  document.getElementById("menu").innerHTML =
    '<a href="index.html" class="logo">Gezi<span>Günlüğüm</span></a>' +
    '<nav id="sekmeler">' + kitalar +
    '<a href="hakkimizda.html" class="genis-ekran">Biz Kimiz</a></nav>' +
    '<div class="menu-sag">' +
    '<div class="sosyal genis-ekran">' + sosyalLinkler() + "</div>" +
    '<button class="tema-butonu" data-arama-ac aria-label="Sitede ara"><i class="fa-solid fa-magnifying-glass"></i></button>' +
    '<button id="tema-butonu" class="tema-butonu" aria-label="Karanlık / aydınlık mod"></button>' +
    "</div>";

  document.getElementById("alt-bilgi").innerHTML =
    "<div>" +
    '<a href="index.html" class="logo">Gezi<span>Günlüğüm</span></a>' +
    "<p>Yolda gördüklerimizi paylaşıyoruz.</p>" +
    "</div>" +
    '<div class="alt-linkler">' +
    '<a href="index.html#harita">Harita</a>' +
    '<a href="hakkimizda.html">Biz Kimiz</a>' +
    '<a href="hakkimizda.html#iletisim">İletişim</a>' +
    "</div>" +
    '<div class="sosyal">' + sosyalLinkler() + "</div>";
}

// Menüde hangi kıtanın seçili olduğunu işaretle
function aktifSekme(kita) {
  document.querySelectorAll("#sekmeler [data-bolge]").forEach(function (a) {
    a.classList.toggle("aktif", a.dataset.bolge === kita);
  });
}

// ---------------------------------------------------------
// 2. KARANLIK MOD
// ---------------------------------------------------------
// Ziyaretçi seçim yapmadıysa bilgisayarının ayarına uyar.
function koyuMu() {
  const secim = document.documentElement.dataset.tema;
  if (secim) return secim === "koyu";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function temaButonuGuncelle() {
  document.getElementById("tema-butonu").innerHTML = koyuMu()
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}

function temaDegistir() {
  const yeni = koyuMu() ? "acik" : "koyu";
  document.documentElement.dataset.tema = yeni;
  try { localStorage.setItem("tema", yeni); } catch (e) {}
  temaButonuGuncelle();
  // Harita gibi temaya göre değişen parçalar bu sinyali dinler
  window.dispatchEvent(new Event("temadegisti"));
}

// ---------------------------------------------------------
// 3. KÜÇÜK YARDIMCILAR
// ---------------------------------------------------------

// Bir isimden 0-360 arası sabit bir renk tonu üretir.
function tonHesapla(metin) {
  let toplam = 0;
  for (let i = 0; i < metin.length; i++) {
    toplam = (toplam * 31 + metin.charCodeAt(i)) % 360;
  }
  return toplam;
}

// Fotoğraf kutusu: fotoğraf varsa gösterir, yoksa (ya da yüklenemezse)
// arkadaki renkli emojili kutu görünür.
function gorsel(src, emoji, isim) {
  let html =
    '<div class="gorsel" data-emoji="' + emoji + '" style="--ton:' + tonHesapla(isim || emoji) + '">';
  if (src) {
    html += '<img src="' + src + '" alt="' + (isim || "") + '" loading="lazy" onerror="this.remove()">';
  }
  return html + "</div>";
}

// Ülkenin bayrağı (veri.js'teki iki harfli "kod" ile flagcdn.com'dan gelir).
// Kodu olmayan ülkelerde emojisi gösterilir.
function bayrak(ulke, sinif) {
  if (!ulke.kod) return ulke.emoji;
  return (
    '<img class="bayrak ' + (sinif || "") + '" src="https://flagcdn.com/' + ulke.kod +
    '.svg" alt="' + ulke.isim + ' bayrağı" onerror="this.replaceWith(\'' + ulke.emoji + '\')">'
  );
}

// "2026-08-12" -> "12 Ağustos 2026"
function tarihYaz(tarih) {
  if (!tarih) return "";
  return new Date(tarih).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

// Bütün yazıları kıta ve ülke bilgisiyle birlikte tek listede toplar (yeniden eskiye)
function tumYazilar() {
  const sonuc = [];
  for (const kitaAnahtar in veri) {
    const kita = veri[kitaAnahtar];
    for (const ulkeAnahtar in kita.ulkeler) {
      const ulke = kita.ulkeler[ulkeAnahtar];
      ulke.yazilar.forEach(function (yazi) {
        sonuc.push({ kitaAnahtar, kita, ulkeAnahtar, ulke, yazi });
      });
    }
  }
  return sonuc.sort(function (a, b) {
    return (b.yazi.tarih || "").localeCompare(a.yazi.tarih || "");
  });
}

// "17 ülke · 3 kıta · 2 yazı · 0 video" sayaç şeridi
function sayilarHtml() {
  let ulke = 0;
  for (const k in veri) ulke += Object.keys(veri[k].ulkeler).length;
  const yazilar = tumYazilar();
  const video = yazilar.filter(function (k) { return youtubeId(k.yazi.video); }).length;

  return [
    [ulke, "ülke"],
    [Object.keys(veri).length, "kıta"],
    [yazilar.length, "yazı"],
    [video, "video"]
  ].map(function (s) {
    return '<div class="sayi"><strong>' + s[0] + "</strong><span>" + s[1] + "</span></div>";
  }).join("");
}

// ---------------------------------------------------------
// 4. YOUTUBE VİDEOLARI
// ---------------------------------------------------------

// Her türlü YouTube linkinden video kimliğini (11 karakter) çıkarır:
// youtu.be/ABC, youtube.com/watch?v=ABC, /shorts/ABC, /embed/ABC ya da sadece ABC
function youtubeId(link) {
  if (!link) return "";
  const eslesme = link.match(/(?:youtu\.be\/|v=|shorts\/|embed\/|live\/)([\w-]{11})/);
  if (eslesme) return eslesme[1];
  return /^[\w-]{11}$/.test(link) ? link : "";
}

// Video önce sadece kapak resmi olarak görünür (sayfa hızlı açılsın diye).
// Tıklanınca gerçek YouTube oynatıcısı yüklenir.
function videoKutusu(link, baslik) {
  const id = youtubeId(link);
  if (!id) return "";
  return (
    '<div class="video" data-id="' + id + '">' +
    '<img src="https://i.ytimg.com/vi/' + id + '/hqdefault.jpg" alt="' + (baslik || "Video") + '" loading="lazy">' +
    '<button class="oynat" aria-label="Videoyu oynat"><i class="fa-solid fa-play"></i></button>' +
    "</div>" +
    '<a class="youtube-link" href="https://www.youtube.com/watch?v=' + id + '" target="_blank" rel="noopener">' +
    '<i class="fa-brands fa-youtube"></i> YouTube\'da izle</a>'
  );
}

document.addEventListener("click", function (e) {
  const kutu = e.target.closest(".video");
  if (!kutu || kutu.querySelector("iframe")) return;
  kutu.innerHTML =
    '<iframe src="https://www.youtube-nocookie.com/embed/' + kutu.dataset.id +
    '?autoplay=1&rel=0" title="YouTube video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
});

// ---------------------------------------------------------
// 5. YAZI KARTI
// ---------------------------------------------------------
function yaziKarti(k) {
  const videoVar = youtubeId(k.yazi.video);
  return (
    '<a class="yazi-kart" href="yazi.html?id=' + k.yazi.id + '">' +
    '<div class="kart-gorsel">' +
    gorsel(k.yazi.resim, k.ulke.emoji, k.ulke.isim) +
    (videoVar ? '<span class="video-rozet"><i class="fa-solid fa-play"></i> Video</span>' : "") +
    "</div>" +
    '<div class="yazi-bilgi">' +
    '<div class="meta"><span class="etiket">' + k.ulke.isim + "</span>" +
    (k.yazi.tarih ? "<time>" + tarihYaz(k.yazi.tarih) + "</time>" : "") +
    "</div>" +
    "<h3>" + k.yazi.baslik + "</h3>" +
    "<p>" + k.yazi.ozet + "</p>" +
    '<span class="devam">Devamını oku <i class="fa-solid fa-arrow-right"></i></span>' +
    "</div></a>"
  );
}

// ---------------------------------------------------------
// 6. SAYFA AÇILINCA
// ---------------------------------------------------------
menuCiz();
temaButonuGuncelle();
document.getElementById("tema-butonu").addEventListener("click", temaDegistir);

// Sayfa aşağı kayınca üst menüye arka plan ver
const menu = document.getElementById("menu");
function menuKontrol() {
  menu.classList.toggle("dolu", window.scrollY > 40);
}
window.addEventListener("scroll", menuKontrol);
menuKontrol();

// ---------------------------------------------------------
// 7. SİTE İÇİ ARAMA
// ---------------------------------------------------------

// Aramayı kolaylaştırmak için metni sadeleştirir:
// küçük harf + Türkçe karakterler düz harfe ("Mısır" -> "misir")
function sadelestir(metin) {
  const harfler = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };
  return (metin || "")
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşüâîû]/g, function (h) { return harfler[h]; });
}

// Sitedeki her şeyi (kıta, ülke, yazı) aranabilir bir listeye çevirir
function aramaListesi() {
  const liste = [];

  for (const kitaAnahtar in veri) {
    const k = veri[kitaAnahtar];
    liste.push({
      tur: "kita",
      baslik: k.baslik,
      alt: k.aciklama,
      link: "index.html#" + kitaAnahtar,
      emoji: k.emoji,
      resim: k.kapak,
      metin: sadelestir(k.baslik + " " + k.aciklama)
    });

    for (const ulkeAnahtar in k.ulkeler) {
      const u = k.ulkeler[ulkeAnahtar];
      const adet = u.yazilar.length;
      liste.push({
        tur: "ulke",
        baslik: u.isim,
        alt: k.baslik + " · " + (adet ? adet + " yazı" : "Yakında"),
        link: "index.html#" + kitaAnahtar + "/" + ulkeAnahtar,
        emoji: u.emoji,
        resim: u.kapak,
        metin: sadelestir(u.isim + " " + ulkeAnahtar + " " + k.baslik)
      });
    }
  }

  tumYazilar().forEach(function (s) {
    const y = s.yazi;
    const parcalar = [y.baslik, y.ozet, s.ulke.isim, s.kita.baslik]
      .concat(y.etiketler || [])
      .concat(y.icerik.map(function (p) { return p.metin || p.altyazi || ""; }));
    for (const alan in y.bilgiler || {}) parcalar.push(y.bilgiler[alan]);

    liste.push({
      tur: "yazi",
      baslik: y.baslik,
      alt: s.ulke.isim + " · " + y.ozet,
      link: "yazi.html?id=" + y.id,
      emoji: s.ulke.emoji,
      resim: y.resim || s.ulke.kapak,
      metin: sadelestir(parcalar.join(" "))
    });
  });

  return liste;
}

const aramaGruplari = [
  ["kita", "Kıtalar"],
  ["ulke", "Ülkeler"],
  ["yazi", "Yazılar"]
];

// Arama penceresini sayfaya ekle
document.body.insertAdjacentHTML(
  "beforeend",
  '<div class="ara-perde" id="ara-perde" hidden>' +
  '<div class="ara-kutu" role="dialog" aria-label="Sitede ara">' +
  '<div class="ara-ust"><i class="fa-solid fa-magnifying-glass"></i>' +
  '<input id="ara-girdi" type="search" placeholder="Ülke, yer, konu ya da anahtar kelime ara…" autocomplete="off">' +
  '<button class="ara-kapat" aria-label="Kapat">Esc</button></div>' +
  '<div class="ara-sonuclar" id="ara-sonuclar"></div>' +
  "</div></div>"
);

const araPerde = document.getElementById("ara-perde");
const araGirdi = document.getElementById("ara-girdi");
const araSonuclar = document.getElementById("ara-sonuclar");
let araListe = null;
let araSecili = -1;

function aramaAc() {
  if (!araListe) araListe = aramaListesi(); // ilk açılışta bir kere hazırla
  araPerde.hidden = false;
  document.body.style.overflow = "hidden";
  araGirdi.value = "";
  aramaYap();
  araGirdi.focus();
}

function aramaKapat() {
  araPerde.hidden = true;
  document.body.style.overflow = "";
}

function aramaYap() {
  const sorgu = sadelestir(araGirdi.value.trim());
  araSecili = -1;

  // Kutu boşken öneri olarak etiketleri ve kıtaları göster
  if (!sorgu) {
    const oneriler = [];
    tumYazilar().forEach(function (s) {
      (s.yazi.etiketler || []).forEach(function (e) {
        if (oneriler.indexOf(e) === -1) oneriler.push(e);
      });
    });
    for (const k in veri) oneriler.push(veri[k].baslik);
    araSonuclar.innerHTML =
      '<p class="ara-baslik">Öneriler</p><div class="ara-oneriler">' +
      oneriler.map(function (o) {
        return '<button class="cip" data-oneri="' + o + '">' + o + "</button>";
      }).join("") +
      "</div>";
    return;
  }

  // Yazılan her kelime sonucun içinde geçmeli
  const kelimeler = sorgu.split(/\s+/);
  const bulunanlar = araListe
    .filter(function (s) {
      return kelimeler.every(function (k) { return s.metin.indexOf(k) !== -1; });
    })
    .map(function (s) {
      // Başlığında geçenler üstte çıksın
      const baslik = sadelestir(s.baslik);
      s.puan = baslik.indexOf(sorgu) === 0 ? 3 : baslik.indexOf(sorgu) !== -1 ? 2 : 1;
      return s;
    })
    .sort(function (a, b) { return b.puan - a.puan; });

  if (!bulunanlar.length) {
    araSonuclar.innerHTML =
      '<div class="ara-bos">🔍<p>“' + araGirdi.value.trim() + "” için sonuç bulunamadı.</p></div>";
    return;
  }

  let html = "";
  aramaGruplari.forEach(function (g) {
    const grup = bulunanlar.filter(function (s) { return s.tur === g[0]; }).slice(0, 6);
    if (!grup.length) return;
    html += '<p class="ara-baslik">' + g[1] + "</p>";
    grup.forEach(function (s) {
      html +=
        '<a class="ara-sonuc" href="' + s.link + '">' +
        gorsel(s.resim, s.emoji, s.baslik) +
        '<div><strong>' + s.baslik + "</strong><span>" + s.alt + "</span></div>" +
        '<i class="fa-solid fa-arrow-right"></i></a>';
    });
  });
  araSonuclar.innerHTML = html;
}

// Oklarla sonuçlar arasında gezinme
function araSec(yeni) {
  const sonuclar = araSonuclar.querySelectorAll(".ara-sonuc");
  if (!sonuclar.length) return;
  araSecili = (yeni + sonuclar.length) % sonuclar.length;
  sonuclar.forEach(function (s, i) { s.classList.toggle("secili", i === araSecili); });
  sonuclar[araSecili].scrollIntoView({ block: "nearest" });
}

araGirdi.addEventListener("input", aramaYap);

araGirdi.addEventListener("keydown", function (e) {
  if (e.key === "ArrowDown") { e.preventDefault(); araSec(araSecili + 1); }
  if (e.key === "ArrowUp") { e.preventDefault(); araSec(araSecili - 1); }
  if (e.key === "Enter") {
    const sonuclar = araSonuclar.querySelectorAll(".ara-sonuc");
    const hedef = sonuclar[Math.max(araSecili, 0)];
    if (hedef) { aramaKapat(); location.href = hedef.href; }
  }
});

araPerde.addEventListener("click", function (e) {
  const oneri = e.target.closest("[data-oneri]");
  if (oneri) {
    araGirdi.value = oneri.dataset.oneri;
    aramaYap();
    araGirdi.focus();
    return;
  }
  // Boş alana, kapat düğmesine ya da bir sonuca tıklanınca kapan
  if (e.target === araPerde || e.target.closest(".ara-kapat") || e.target.closest(".ara-sonuc")) {
    aramaKapat();
  }
});

// Arama düğmeleri (menüdeki büyüteç, ana sayfadaki kutu)
document.addEventListener("click", function (e) {
  if (e.target.closest("[data-arama-ac]")) aramaAc();
});

// Klavye kısayolları: "/" veya Ctrl+K aramayı açar, Esc kapatır
document.addEventListener("keydown", function (e) {
  if (!araPerde.hidden && e.key === "Escape") { aramaKapat(); return; }
  const yaziyor = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
  if ((e.key === "/" && !yaziyor) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) {
    e.preventDefault();
    aramaAc();
  }
});
