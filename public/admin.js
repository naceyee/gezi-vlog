// =========================================================
// YÖNETİM PANELİ
// Şifreyle giriş yapılır, mesajlar ve yorumlar listelenir, silinebilir.
// =========================================================
const girisFormu = document.getElementById("giris-formu");
const girisMesaj = document.getElementById("giris-mesaj");
const panel = document.getElementById("panel");

// Şifreyi sekme açık kaldığı sürece hatırla (sekme kapanınca unutulur)
let sifre = sessionStorage.getItem("adminSifre") || "";

// Sunucunun admin kapılarına şifreyle istek gönderen yardımcı fonksiyon
async function adminIstek(adres, secenekler) {
  const yanit = await fetch(adres, {
    ...secenekler,
    headers: { "x-admin-sifre": sifre }
  });
  const veri = await yanit.json();
  if (!yanit.ok) {
    const hata = new Error(veri.hata || "Bir hata oldu.");
    hata.durum = yanit.status;
    throw hata;
  }
  return veri;
}

// yazi_id -> yazının başlığı (veri.js'teki yazılardan bulur)
function yaziBasligi(yaziId) {
  const bulunan = tumYazilar().find(function (k) { return k.yazi.id === yaziId; });
  return bulunan ? bulunan.yazi.baslik : "(yazı yok)";
}

// Bir kaydı (mesaj ya da yorum) kart olarak çizer. textContent = güvenli.
function kayitCiz(kayit, tablo) {
  const li = document.createElement("li");
  li.className = "yorum";

  const ust = document.createElement("div");
  ust.className = "yorum-ust";

  const kim = document.createElement("strong");
  kim.textContent = kayit.isim;

  const bilgi = document.createElement("span");
  bilgi.textContent = tarihYaz(kayit.tarih);

  const sil = document.createElement("button");
  sil.className = "admin-sil";
  sil.title = "Sil";
  sil.innerHTML = '<i class="fa-regular fa-trash-can"></i>';
  sil.addEventListener("click", async function () {
    if (!confirm("Bu kaydı silmek istediğine emin misin?")) return;
    try {
      await adminIstek("/api/admin/" + tablo + "/" + kayit.id, { method: "DELETE" });
      li.remove();
      sayilariGuncelle();
    } catch (hata) {
      alert(hata.message);
    }
  });

  ust.append(kim, bilgi, sil);

  // Mesajda e-posta, yorumda hangi yazıya yazıldığı gösterilir
  const alt = document.createElement("p");
  alt.className = "admin-alt-bilgi";
  if (tablo === "mesajlar") {
    const link = document.createElement("a");
    link.href = "mailto:" + kayit.eposta;
    link.textContent = kayit.eposta;
    alt.append(link);
  } else if (kayit.yazi_id) {
    const link = document.createElement("a");
    link.href = "yazi.html?id=" + encodeURIComponent(kayit.yazi_id);
    link.textContent = yaziBasligi(kayit.yazi_id);
    alt.append(link);
  } else {
    alt.textContent = "(yazı yok)";
  }

  const metin = document.createElement("p");
  metin.textContent = tablo === "mesajlar" ? kayit.mesaj : kayit.yorum;

  li.append(ust, alt, metin);
  return li;
}

function sayilariGuncelle() {
  document.getElementById("mesaj-sayisi").textContent =
    "(" + document.getElementById("mesaj-listesi").children.length + ")";
  document.getElementById("yorum-sayisi").textContent =
    "(" + document.getElementById("yorum-listesi").children.length + ")";
}

// Şifre doğruysa paneli açar ve listeleri doldurur
async function paneliYukle() {
  girisMesaj.textContent = "Kontrol ediliyor…";
  try {
    const [mesajlar, yorumlar] = await Promise.all([
      adminIstek("/api/admin/mesajlar"),
      adminIstek("/api/admin/yorumlar")
    ]);
    document.getElementById("mesaj-listesi").replaceChildren(
      ...mesajlar.map(function (m) { return kayitCiz(m, "mesajlar"); })
    );
    document.getElementById("yorum-listesi").replaceChildren(
      ...yorumlar.map(function (y) { return kayitCiz(y, "yorumlar"); })
    );
    sayilariGuncelle();
    sessionStorage.setItem("adminSifre", sifre);
    girisFormu.hidden = true;
    panel.hidden = false;
  } catch (hata) {
    sessionStorage.removeItem("adminSifre");
    girisMesaj.textContent = hata.message;
  }
}

girisFormu.addEventListener("submit", function (e) {
  e.preventDefault();
  sifre = girisFormu.sifre.value;
  paneliYukle();
});

document.getElementById("cikis").addEventListener("click", function () {
  sessionStorage.removeItem("adminSifre");
  location.reload();
});

// Daha önce giriş yapıldıysa (sayfa yenilendiyse) direkt aç
if (sifre) paneliYukle();
