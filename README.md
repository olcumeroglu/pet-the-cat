# Pet the Cat 🐾

Tarayıcıda çalışan, sevilebilen bir kedi. Kafasını sev, yanaklarını kaşı, elini uzat ve yanağını sürtmesini izle, göbeğini sev.göbek sevgisi bazen sevgi ısırmasıyla biter.

İki kedi var, kedilerim Azuş ve Hurma'dan esinlenerek hazırlandı:

- **Tekir** – Hurma. Sevilmeye başladığı an mırlar. Biraz sinirlidir ısırır.
- **Smokin** – Azuş. Dünyanın en sakin kedisi. Asla ısırmaz tırmalamaz. 

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
