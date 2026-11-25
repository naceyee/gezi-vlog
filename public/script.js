const baslik = document.getElementById("bolge-baslik");
const altBaslik = document.getElementById("bolge-alt");
const yol = document.getElementById("yol");
const icerik = document.getElementById("icerik");

// Ana sayfadaki yazı filtresinin durumu
const filtre = { arama: "", etiket: "" };
let haritaNesnesi = null;
let haritaKatmani = null;
let anaSayfaCizili = false;

// Bir kıtadaki toplam yazı sayısı
function yaziSayisi(kita) {
  let sayi = 0;
  for (const anahtar in kita.ulkeler) {
    sayi += kita.ulkeler[anahtar].yazilar.length;
  }
  return sayi;
}

// =========================================================
// ANA SAYFA
// =========================================================
function anaSayfaGoster() {
  let html = '<div class="sayilar">' + sayilarHtml() + "</div>";

  // --- Kıtalar ---
  html += '<h2 class="bolum-baslik">Kıtalar</h2><div class="kita-grid">';
  for (const anahtar in veri) {
    const k = veri[anahtar];
    html +=
      '<a class="kita-kart" href="#' + anahtar + '">' +
      gorsel(k.kapak, k.emoji, k.baslik) +
      '<div class="kart-ust">' +
      "<h3>" + k.baslik + "</h3>" +
      "<p>" + k.aciklama + "</p>" +
      '<span class="sayac">' + Object.keys(k.ulkeler).length + " ülke · " + yaziSayisi(k) + " yazı</span>" +
      "</div></a>";
  }
  html += "</div>";

  // --- Harita ---
  html +=
    '<section id="harita-bolum">' +
    '<h2 class="bolum-baslik">Nerelere gittik?</h2>' +
    '<p class="bolum-alt">Bir işarete tıkla, o ülkenin yazılarına git. ' +
    '<span class="lejant"><i class="nokta dolu"></i> yazısı var <i class="nokta"></i> yakında</span></p>' +
    '<div id="harita" class="harita"></div>' +
    "</section>";

  // --- Son video ---
  html += '<section id="video">' + sonVideoHtml() + "</section>";

  // --- Yazılar (arama + etiketler) ---
  html +=
    '<section id="yazilar">' +
    '<h2 class="bolum-baslik">Yazılar</h2>' +
    '<div class="filtre-cubugu">' +
    '<label class="arama"><i class="fa-solid fa-magnifying-glass"></i>' +
    '<input type="search" id="arama" placeholder="Yazı, ülke ya da yer ara…" autocomplete="off"></label>' +
    '<div class="etiketler" id="etiketler"></div>' +
    "</div>" +
    '<div class="yazi-grid" id="yazi-listesi"></div>' +
    "</section>";

  icerik.innerHTML = html;

  document.getElementById("arama").value = filtre.arama;
  document.getElementById("arama").addEventListener("input", function (e) {
    filtre.arama = e.target.value;
    yazilariFiltrele();
  });

  etiketleriCiz();
  yazilariFiltrele();
  haritaKur();
}

// En yeni videolu yazıyı büyük bir panelde göster
function sonVideoHtml() {
  const videolu = tumYazilar().find(function (k) { return youtubeId(k.yazi.video); });

  if (!videolu) {
    return (
      '<div class="video-panel bos-panel">' +
      '<div class="video-metin">' +
      '<span class="ust-yazi">Son video</span>' +
      "<h2>Videolar çok yakında 🎬</h2>" +
      "<p>Gezi videolarımızı YouTube kanalımızda paylaşıyoruz. Yeni bölümleri kaçırmamak için abone ol!</p>" +
      '<a class="buton" href="' + (ayarlar.youtube || "#") + '" target="_blank" rel="noopener">' +
      '<i class="fa-brands fa-youtube"></i> Kanala git</a>' +
      "</div></div>"
    );
  }

  return (
    '<div class="video-panel">' +
    '<div class="video-oynatici">' + videoKutusu(videolu.yazi.video, videolu.yazi.baslik) + "</div>" +
    '<div class="video-metin">' +
    '<span class="ust-yazi">Son video · ' + videolu.ulke.isim + "</span>" +
    "<h2>" + videolu.yazi.baslik + "</h2>" +
    "<p>" + videolu.yazi.ozet + "</p>" +
    '<a class="buton" href="yazi.html?id=' + videolu.yazi.id + '">Yazıyı oku <i class="fa-solid fa-arrow-right"></i></a>' +
    (ayarlar.youtube
      ? '<a class="buton cam" href="' + ayarlar.youtube + '" target="_blank" rel="noopener"><i class="fa-brands fa-youtube"></i> Abone ol</a>'
      : "") +
    "</div></div>"
  );
}

// Tüm yazılardaki etiketleri topla ve düğme olarak göster
function etiketleriCiz() {
  const hepsi = [];
  tumYazilar().forEach(function (k) {
    (k.yazi.etiketler || []).forEach(function (e) {
      if (hepsi.indexOf(e) === -1) hepsi.push(e);
    });
  });

  const kutu = document.getElementById("etiketler");
  kutu.innerHTML = ["Tümü"].concat(hepsi).map(function (e) {
    const secili = (e === "Tümü" && !filtre.etiket) || e === filtre.etiket;
    return '<button class="cip' + (secili ? " secili" : "") + '" data-etiket="' + e + '">' + e + "</button>";
  }).join("");

  kutu.querySelectorAll("button").forEach(function (b) {
    b.addEventListener("click", function () {
      filtre.etiket = b.dataset.etiket === "Tümü" ? "" : b.dataset.etiket;
      etiketleriCiz();
      yazilariFiltrele();
    });
  });
}

// Türkçe harflere uygun küçük harfe çevir (İ -> i, I -> ı)
function kucult(metin) {
  return (metin || "").toLocaleLowerCase("tr");
}

function yazilariFiltrele() {
  const aranan = kucult(filtre.arama.trim());

  const sonuc = tumYazilar().filter(function (k) {
    const etiketler = k.yazi.etiketler || [];
    if (filtre.etiket && etiketler.indexOf(filtre.etiket) === -1) return false;
    if (!aranan) return true;
    const metin = kucult(
      [k.yazi.baslik, k.yazi.ozet, k.ulke.isim, k.kita.baslik].concat(etiketler).join(" ")
    );
    return metin.indexOf(aranan) !== -1;
  });

  document.getElementById("yazi-listesi").innerHTML = sonuc.length
    ? sonuc.map(yaziKarti).join("")
    : '<div class="bos"><span>🔍</span><p>Aramana uygun yazı bulunamadı.</p></div>';
}

// =========================================================
// HARİTA (Leaflet kütüphanesi ile)
// =========================================================
function haritaKatmaniEkle() {
  if (haritaKatmani) haritaKatmani.remove();
  // Esri'nin sade gri haritaları: anahtar gerektirmez, açık ve koyu versiyonu var
  const stil = koyuMu() ? "World_Dark_Gray_Base" : "World_Light_Gray_Base";
  haritaKatmani = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/" + stil + "/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "Harita &copy; Esri",
      maxZoom: 16
    }
  ).addTo(haritaNesnesi);
}

function haritaKur() {
  const kutu = document.getElementById("harita");
  if (typeof L === "undefined") {
    kutu.innerHTML = '<p class="not">Harita yüklenemedi. İnternet bağlantını kontrol et.</p>';
    return;
  }
  if (haritaNesnesi) haritaNesnesi.remove();

  haritaNesnesi = L.map(kutu, { scrollWheelZoom: false, worldCopyJump: true });
  haritaKatmaniEkle();

  const noktalar = [];
  for (const kitaAnahtar in veri) {
    const ulkeler = veri[kitaAnahtar].ulkeler;
    for (const ulkeAnahtar in ulkeler) {
      const u = ulkeler[ulkeAnahtar];
      if (!u.konum) continue;
      const adet = u.yazilar.length;

      L.circleMarker(u.konum, {
        radius: adet ? 9 : 6,
        color: "#fff",
        weight: 2,
        fillColor: adet ? "#e2583e" : "#0f6e6a",
        fillOpacity: adet ? 1 : 0.75
      })
        .addTo(haritaNesnesi)
        .bindTooltip(u.emoji + " <b>" + u.isim + "</b><br>" + (adet ? adet + " yazı" : "Yakında"), { direction: "top", offset: [0, -6] })
        .on("click", function () {
          location.hash = kitaAnahtar + "/" + ulkeAnahtar;
        });

      noktalar.push(u.konum);
    }
  }

  if (noktalar.length) {
    haritaNesnesi.fitBounds(noktalar, { padding: [40, 40] });
  } else {
    haritaNesnesi.setView([30, 20], 2);
  }
}

// Karanlık mod açılınca haritanın rengini de değiştir
window.addEventListener("temadegisti", function () {
  if (haritaNesnesi && document.body.contains(haritaNesnesi.getContainer())) {
    haritaKatmaniEkle();
  }
});

// =========================================================
// KITA SAYFASI: ülke kartları
// =========================================================
function ulkeleriGoster(kitaAnahtar) {
  const k = veri[kitaAnahtar];
  baslik.textContent = k.baslik;
  altBaslik.textContent = k.aciklama;
  yol.innerHTML = '<a href="index.html">Ana sayfa</a> <span>/</span> ' + k.baslik;

  let html = '<div class="ulke-grid">';
  for (const anahtar in k.ulkeler) {
    const u = k.ulkeler[anahtar];
    const adet = u.yazilar.length;
    html +=
      '<a class="ulke-kart' + (adet ? "" : " yakinda") + '" href="#' + kitaAnahtar + "/" + anahtar + '">' +
      gorsel(u.kapak, u.emoji, u.isim) +
      '<div class="kart-ust">' +
      "<h3>" + u.isim + "</h3>" +
      '<span class="sayac">' + (adet ? adet + " yazı" : "Yakında") + "</span>" +
      "</div></a>";
  }
  icerik.innerHTML = html + "</div>";
}

// =========================================================
// ÜLKE SAYFASI: yazı kartları
// =========================================================
function yazilariGoster(kitaAnahtar, ulkeAnahtar) {
  const k = veri[kitaAnahtar];
  const u = k.ulkeler[ulkeAnahtar];

  baslik.innerHTML = u.isim + " " + bayrak(u, "buyuk");
  altBaslik.textContent = u.yazilar.length ? u.yazilar.length + " yazı" : "";
  yol.innerHTML =
    '<a href="index.html">Ana sayfa</a> <span>/</span> ' +
    '<a href="#' + kitaAnahtar + '">' + k.baslik + "</a> <span>/</span> " + u.isim;

  if (u.yazilar.length === 0) {
    icerik.innerHTML =
      '<div class="bos"><span>🎬</span><p>Bu ülkenin yazıları çok yakında burada!</p>' +
      '<a class="buton" href="#' + kitaAnahtar + '">' + k.baslik + "'ya dön</a></div>";
    return;
  }

  icerik.innerHTML =
    '<div class="yazi-grid">' +
    u.yazilar.map(function (y) {
      return yaziKarti({ kita: k, ulke: u, yazi: y });
    }).join("") +
    "</div>";
}

// =========================================================
// YÖNLENDİRME: adres çubuğundaki #... kısmına göre sayfayı çiz
//   #asya            -> kıta sayfası
//   #asya/endonezya  -> ülke sayfası
//   #etiket=Plaj     -> ana sayfa, yazılar "Plaj" etiketine göre süzülmüş
//   #harita, #video  -> ana sayfanın o bölümüne kaydır
// =========================================================
function goster() {
  const hash = decodeURIComponent(location.hash.replace("#", ""));
  const parcalar = hash.split("/");
  const kita = parcalar[0];
  const ulke = parcalar[1];

  aktifSekme(kita);

  const anaSayfa = !veri[kita];
  document.body.classList.toggle("ana-sayfa", anaSayfa);
  document.body.classList.toggle("kapakli", anaSayfa);

  if (anaSayfa) {
    let hedef = hash;
    if (hash.indexOf("etiket=") === 0) {
      filtre.etiket = hash.slice(7);
      hedef = "yazilar";
      anaSayfaCizili = false; // etiket düğmeleri yeniden çizilsin
    }
    if (!anaSayfaCizili) {
      anaSayfaGoster();
      anaSayfaCizili = true;
    }
    const bolum = hedef && document.getElementById(hedef === "harita" ? "harita-bolum" : hedef);
    if (bolum) {
      bolum.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
    return;
  }

  anaSayfaCizili = false;
  if (ulke && veri[kita].ulkeler[ulke]) {
    yazilariGoster(kita, ulke);
  } else {
    ulkeleriGoster(kita);
  }
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", goster);
goster();
