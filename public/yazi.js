const id = new URLSearchParams(location.search).get("id");
const kapak = document.getElementById("yazi-kapak");
const alan = document.getElementById("yazi-alani");
const digerAlan = document.getElementById("diger-yazilar");

// veri.js içinde bu id'ye sahip yazıyı bul
function yaziBul(id) {
  return tumYazilar().find(function (k) {
    return k.yazi.id === id;
  });
}

// icerik listesindeki bir parçayı HTML'e çevir
function parcaCiz(p) {
  if (p.tip === "yazi") {
    return "<p>" + p.metin + "</p>";
  }
  if (p.tip === "baslik") {
    return "<h2>" + p.metin + "</h2>";
  }
  if (p.tip === "foto") {
    return (
      "<figure>" +
      '<img src="' + p.src + '" alt="' + (p.altyazi || "") + '" loading="lazy" onerror="this.parentNode.remove()">' +
      (p.altyazi ? "<figcaption>" + p.altyazi + "</figcaption>" : "") +
      "</figure>"
    );
  }
  if (p.tip === "galeri") {
    return (
      '<div class="galeri">' +
      p.fotolar.map(function (f) {
        return '<img src="' + f + '" alt="" loading="lazy" onerror="this.remove()">';
      }).join("") +
      "</div>"
    );
  }
  if (p.tip === "video") {
    return '<div class="yazi-video">' + videoKutusu(p.youtube) + "</div>";
  }
  return "";
}

// "Hızlı bilgiler" kutusu
const bilgiAlanlari = [
  ["zaman", "fa-regular fa-sun", "En iyi zaman"],
  ["butce", "fa-solid fa-wallet", "Bütçe"],
  ["sure", "fa-regular fa-calendar-days", "Kaç gün?"],
  ["ulasim", "fa-solid fa-route", "Ulaşım"],
  ["vize", "fa-solid fa-passport", "Vize"]
];

function bilgiKutusu(bilgiler) {
  if (!bilgiler) return "";
  const satirlar = bilgiAlanlari
    .filter(function (a) { return bilgiler[a[0]]; })
    .map(function (a) {
      return (
        '<div class="bilgi"><i class="' + a[1] + '"></i>' +
        "<div><span>" + a[2] + "</span><strong>" + bilgiler[a[0]] + "</strong></div></div>"
      );
    });
  if (!satirlar.length) return "";
  return (
    '<aside class="hizli-bilgi"><h3><i class="fa-solid fa-bolt"></i> Hızlı bilgiler</h3>' +
    '<div class="bilgi-grid">' + satirlar.join("") + "</div></aside>"
  );
}

// Yazıdaki kelime sayısına göre tahmini okuma süresi (dakikada ~200 kelime)
function okumaSuresi(yazi) {
  const metin = yazi.icerik
    .filter(function (p) { return p.metin; })
    .map(function (p) { return p.metin; })
    .join(" ");
  return Math.max(1, Math.round(metin.split(/\s+/).length / 200));
}

// Kapak için fotoğraf: yazının resmi, yoksa içindeki ilk fotoğraf
function kapakFotografi(yazi) {
  if (yazi.resim) return yazi.resim;
  const ilkFoto = yazi.icerik.find(function (p) { return p.tip === "foto"; });
  return ilkFoto ? ilkFoto.src : "";
}

const sonuc = yaziBul(id);

if (!sonuc) {
  kapak.classList.add("kucuk");
  alan.innerHTML =
    '<div class="bos"><span>😕</span><p>Bu yazı bulunamadı.</p>' +
    '<a class="buton" href="index.html">Ana sayfaya dön</a></div>';
} else {
  const { kitaAnahtar, kita, ulkeAnahtar, ulke, yazi } = sonuc;
  document.title = yazi.baslik + " | Gezi Günlüğüm";
  aktifSekme(kitaAnahtar);

  kapak.innerHTML =
    gorsel(kapakFotografi(yazi), ulke.emoji, ulke.isim) +
    '<div class="yazi-kapak-icerik">' +
    '<p class="yol">' +
    '<a href="index.html#' + kitaAnahtar + '">' + kita.baslik + "</a> <span>/</span> " +
    '<a href="index.html#' + kitaAnahtar + "/" + ulkeAnahtar + '">' + ulke.isim + "</a>" +
    "</p>" +
    "<h1>" + yazi.baslik + "</h1>" +
    '<div class="meta">' +
    '<span class="etiket">' + bayrak(ulke) + " " + ulke.isim + "</span>" +
    (yazi.tarih ? '<span><i class="fa-regular fa-calendar"></i> ' + tarihYaz(yazi.tarih) + "</span>" : "") +
    '<span><i class="fa-regular fa-clock"></i> ' + okumaSuresi(yazi) + " dk okuma</span>" +
    (youtubeId(yazi.video) ? '<span><i class="fa-solid fa-play"></i> Video</span>' : "") +
    "</div></div>";

  const etiketler = (yazi.etiketler || []).map(function (e) {
    return '<a class="cip" href="index.html#etiket=' + encodeURIComponent(e) + '">#' + e + "</a>";
  }).join("");

  alan.innerHTML =
    '<p class="giris">' + yazi.ozet + "</p>" +
    bilgiKutusu(yazi.bilgiler) +
    (youtubeId(yazi.video) ? '<div class="yazi-video">' + videoKutusu(yazi.video, yazi.baslik) + "</div>" : "") +
    yazi.icerik.map(parcaCiz).join("") +
    (etiketler ? '<div class="yazi-etiketleri">' + etiketler + "</div>" : "");

  // Aynı ülkeden (yoksa diğer) en fazla 3 yazı öner
  const digerleri = tumYazilar()
    .filter(function (k) { return k.yazi.id !== yazi.id; })
    .sort(function (a, b) {
      return (b.ulkeAnahtar === ulkeAnahtar) - (a.ulkeAnahtar === ulkeAnahtar);
    })
    .slice(0, 3);

  if (digerleri.length) {
    digerAlan.innerHTML =
      '<h2 class="bolum-baslik">Bunlar da ilgini çekebilir</h2>' +
      '<div class="yazi-grid">' + digerleri.map(yaziKarti).join("") + "</div>";
  }
}

// =========================================================
// YORUMLAR (sunucu ile konuşan kısım)
// =========================================================
const yorumBolumu = document.getElementById("yorumlar");
const yorumFormu = document.getElementById("yorum-formu");
const yorumListesi = document.getElementById("yorum-listesi");
const yorumSayisi = document.getElementById("yorum-sayisi");
const yorumMesaj = document.getElementById("yorum-mesaj");

// Tek bir yorumu listeye ekler.
// textContent kullanıyoruz (innerHTML değil): biri yorumuna <script> gibi
// kod yazsa bile kod olarak çalışmaz, düz yazı olarak görünür. (Güvenlik!)
function yorumCiz(y) {
  const li = document.createElement("li");
  li.className = "yorum";

  const ust = document.createElement("div");
  ust.className = "yorum-ust";
  const isim = document.createElement("strong");
  isim.textContent = y.isim;
  const tarih = document.createElement("span");
  tarih.textContent = tarihYaz(y.tarih);
  ust.append(isim, tarih);

  const metin = document.createElement("p");
  metin.textContent = y.yorum;

  li.append(ust, metin);
  return li;
}

function sayiyiGuncelle() {
  const adet = yorumListesi.children.length;
  yorumSayisi.textContent = adet ? "(" + adet + ")" : "";
}

// 1) SAYFA AÇILINCA: sunucudan bu yazının yorumlarını iste ("getir" kapısı)
async function yorumlariGetir() {
  try {
    const yanit = await fetch("/api/yorumlar?yazi=" + encodeURIComponent(id));
    const yorumlar = await yanit.json();
    yorumListesi.replaceChildren(...yorumlar.map(yorumCiz));
    if (!yorumlar.length) yorumMesaj.textContent = "İlk yorumu sen yaz!";
    sayiyiGuncelle();
  } catch (hata) {
    // Sayfa sunucusuz açıldıysa (dosyaya çift tıklayınca) buraya düşer
    yorumMesaj.textContent = "Yorumlar yüklenemedi.";
  }
}

// 2) "GÖNDER"E BASINCA: yorumu sunucuya gönder ("kaydet" kapısı)
yorumFormu.addEventListener("submit", async function (e) {
  e.preventDefault(); // formun sayfayı yenilemesini engelle
  const buton = yorumFormu.querySelector("button");
  buton.disabled = true;
  yorumMesaj.textContent = "Gönderiliyor…";

  try {
    const yanit = await fetch("/api/yorumlar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isim: yorumFormu.isim.value,
        yorum: yorumFormu.yorum.value,
        yazi_id: id
      })
    });
    const veri = await yanit.json();
    if (!yanit.ok) throw new Error(veri.hata);

    yorumListesi.prepend(yorumCiz(veri)); // yeni yorumu en üste ekle
    sayiyiGuncelle();
    yorumFormu.yorum.value = "";
    yorumMesaj.textContent = "Teşekkürler, yorumun eklendi! 🎉";
  } catch (hata) {
    yorumMesaj.textContent = hata.message || "Bir hata oldu, tekrar dene.";
  } finally {
    buton.disabled = false;
  }
});

// Yorumlar sadece gerçek bir yazı açıksa görünsün
if (sonuc) {
  yorumBolumu.hidden = false;
  yorumlariGetir();
}

// =========================================================
// FOTOĞRAF BÜYÜTME (LIGHTBOX)
// =========================================================
const lb = document.getElementById("lightbox");
const lbResim = lb.querySelector("img");
const lbYazi = lb.querySelector("figcaption");
let lbFotolar = [];
let lbSira = 0;

function lbGoster(sira) {
  lbSira = (sira + lbFotolar.length) % lbFotolar.length; // sondan başa döner
  const foto = lbFotolar[lbSira];
  lbResim.src = foto.src;
  lbResim.alt = foto.alt;
  const altyazi = foto.closest("figure") && foto.closest("figure").querySelector("figcaption");
  lbYazi.textContent = altyazi ? altyazi.textContent : "";
  lb.classList.toggle("tek", lbFotolar.length < 2);
}

function lbAc(foto) {
  // Yüklenemeyip silinen fotoğraflar listeye girmesin diye her açılışta yeniden topla
  lbFotolar = Array.from(alan.querySelectorAll("figure img, .galeri img"));
  lb.hidden = false;
  document.body.style.overflow = "hidden";
  lbGoster(lbFotolar.indexOf(foto));
}

function lbKapat() {
  lb.hidden = true;
  document.body.style.overflow = "";
}

alan.addEventListener("click", function (e) {
  if (e.target.matches("figure img, .galeri img")) lbAc(e.target);
});

lb.addEventListener("click", function (e) {
  if (e.target.closest(".lb-onceki")) lbGoster(lbSira - 1);
  else if (e.target.closest(".lb-sonraki")) lbGoster(lbSira + 1);
  else if (e.target.closest(".lb-kapat") || e.target === lb) lbKapat();
});

document.addEventListener("keydown", function (e) {
  if (lb.hidden) return;
  if (e.key === "Escape") lbKapat();
  if (e.key === "ArrowLeft") lbGoster(lbSira - 1);
  if (e.key === "ArrowRight") lbGoster(lbSira + 1);
});

// Telefonda parmakla sağa / sola kaydırma
let dokunmaX = null;
lb.addEventListener("touchstart", function (e) { dokunmaX = e.touches[0].clientX; });
lb.addEventListener("touchend", function (e) {
  if (dokunmaX === null) return;
  const fark = e.changedTouches[0].clientX - dokunmaX;
  if (Math.abs(fark) > 50) lbGoster(lbSira + (fark < 0 ? 1 : -1));
  dokunmaX = null;
});

// =========================================================
// OKUMA İLERLEME ÇUBUĞU
// =========================================================
const ilerleme = document.getElementById("ilerleme");
window.addEventListener("scroll", function () {
  const toplam = document.documentElement.scrollHeight - window.innerHeight;
  ilerleme.style.width = (toplam > 0 ? (window.scrollY / toplam) * 100 : 0) + "%";
});
