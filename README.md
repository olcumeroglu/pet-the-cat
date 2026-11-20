# Kedi Sev 🐾

Tarayıcıda çalışan, sevilebilen bir kedi. Kafasını sev, yanaklarını kaşı, elini uzat ve yanağını sürtmesini izle, göbeğini aç… ama dikkat: göbek sevgisi bazen **sevgi ısırmasıyla** biter.

İki kedi var, gerçek kedilerden esinlenerek hazırlandı:

- **Tekir** – yeşil gözlü, alnında "M" deseni olan kahverengi-gri tekir
- **Smokin** – siyah-beyaz, pembe burunlu, kırmızı puantiyeli tasmalı

Hiçbir resim ya da ses dosyası kullanılmaz: kürk binlerce tek tek çizilen tüy teliyle, mırlama sesi de Web Audio ile anlık olarak üretilir.

## Nasıl oynanır

**Fare / dokunmatik ekran**

- Fareyi (ya da parmağını) **basılı tutup** kedinin üzerinde gezdir: kafası, yanakları, çenesinin altı, sırtı ya da göbeği farklı tepkiler verir.
- Elini kedinin yüzünün yanında **hareketsiz beklet**: önce koklar, sonra yanağını eline sürter.

**Klavye**

| Tuş | Hareket |
| --- | --- |
| `1` / `Q` | Kafasını sev |
| `2` / `W` | Yanaklarını kaşı |
| `3` / `E` | Elini uzat (yanağını eline sürter) |
| `4` / `R` | Göbeğini açar, göbeğini seversin |
| `5` / `T` | Ekmek pozu (patilerini saklayarak yatar) |
| `6` / `Y` | Sevgi ısırması |
| `7` / `P` | Mırlar ve yavaşça göz kırpar |
| `8` / `K` | Yoğurma (battaniyeye masaj) |
| `Boşluk` | Oturma pozuna dön |
| Ok tuşları + `Enter` / `Z` | Eli yönlendir, basılı tutarak sev |
| `C` | Kedi değiştir |
| `M` | Sesi aç / kapat |

Kedi bir süre kendi hâline kalırsa battaniyeyi kendiliğinden yoğurmaya başlar.

## Bilgisayarında çalıştırma

Kurulum gerekmez. `index.html` dosyasına çift tıklaman yeterli. İstersen yerel bir sunucuyla da açabilirsin:

```bash
python3 -m http.server 8000
```

Sonra tarayıcıda `http://localhost:8000` adresine git.

## GitHub Pages ile yayınlama

1. Bu klasörü GitHub'da yeni bir depoya yükle.
2. Depoda **Settings → Pages** bölümüne git.
3. **Source** olarak `Deploy from a branch`, dal olarak `main` ve klasör olarak `/ (root)` seç.
4. Bir dakika sonra oyun `https://KULLANICI-ADIN.github.io/kedi-sev/` adresinde yayında olur.

## Proje yapısı

```
index.html        Sayfa ve arayüz
css/style.css     Arayüz stilleri
js/util.js        Matematik, renk ve gürültü yardımcıları
js/fur.js         Tüy dokusu üretici ve kedi görünümleri (desenler, göz/burun renkleri)
js/cat.js         Pozlar, davranışlar, sevme tepkileri, kedinin çizimi
js/hand.js        İnsan eli çizimi
js/audio.js       Prosedürel mırlama sesi
js/scene.js       Duvar ve polar battaniye
js/main.js        Oyun döngüsü, fare/dokunma/klavye girişi
```

Yeni bir kedi eklemek için `js/fur.js` içindeki `KS.Looks` nesnesine yeni bir görünüm ekle (renk deseni fonksiyonu, göz, burun ve tasma renkleri) ve `index.html` içine bir buton koy.
