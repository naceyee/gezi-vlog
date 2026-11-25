// "Biz Kimiz" sayfası: sayaçlar ve iletişim düğmeleri

document.getElementById("sayilar").innerHTML = sayilarHtml();

const kanallar = [
  ["eposta", "fa-solid fa-envelope", "E-posta"],
  ["instagram", "fa-brands fa-instagram", "Instagram"],
  ["youtube", "fa-brands fa-youtube", "YouTube"],
  ["facebook", "fa-brands fa-facebook", "Facebook"]
];

let html = "";
kanallar.forEach(function (k) {
  const deger = ayarlar[k[0]];
  if (!deger) return; // veri.js'de boş bırakılanları gösterme
  const link = k[0] === "eposta" ? "mailto:" + deger : deger;
  const yazi = k[0] === "eposta" ? deger : k[2];
  html +=
    '<a class="iletisim-kart" href="' + link + '" target="_blank" rel="noopener">' +
    '<i class="' + k[1] + '"></i><span>' + yazi + "</span></a>";
});

document.getElementById("iletisim-linkleri").innerHTML =
  html || '<p class="not">İletişim bilgilerini veri.js dosyasının en üstündeki <code>ayarlar</code> bölümüne yazınca burada görünecek.</p>';

// =========================================================
// İLETİŞİM FORMU: mesajı sunucuya gönder
// (yazi.js'teki yorum formunun neredeyse aynısı)
// =========================================================
const iletisimFormu = document.getElementById("iletisim-formu");
const iletisimMesaj = document.getElementById("iletisim-mesaj");

iletisimFormu.addEventListener("submit", async function (e) {
  e.preventDefault();
  const buton = iletisimFormu.querySelector("button");
  buton.disabled = true;
  iletisimMesaj.textContent = "Gönderiliyor…";

  try {
    const yanit = await fetch("/api/mesajlar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isim: iletisimFormu.isim.value,
        eposta: iletisimFormu.eposta.value,
        mesaj: iletisimFormu.mesaj.value
      })
    });
    const veri = await yanit.json();
    if (!yanit.ok) throw new Error(veri.hata);

    iletisimFormu.reset(); // formu temizle
    iletisimMesaj.textContent = "Mesajın bize ulaştı, teşekkürler! 💌";
  } catch (hata) {
    iletisimMesaj.textContent = hata.message || "Bir hata oldu, tekrar dene.";
  } finally {
    buton.disabled = false;
  }
});
