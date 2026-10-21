# PATCH 1 — Upload giriş ve aktarım güvenliği

Kapsam: yalnız `POST /api/media/upload`; frontend, şema, kota yazımı,
JWT/cookie mimarisi ve R2 erişim politikası değiştirilmedi.

## Değişiklikler

- Misafir JWT'si, token hash'i, etkinlik aktifliği, upload izni ve `only_users`
  eşleşmesi Multer'dan önce kontrol edilir. Kimlikler imzalı token'dan alınır.
- Multipart sonrasında body kimlikleri token kimlikleriyle karşılaştırılır.
  Mevcut handler içindeki kontroller de korunur; aktarım sırasında değişen
  izinler yeniden kontrol edilir.
- Tek Transform akışı HTTP body byte'larını sayar ve Multer'a aktarır.
  İkinci bir `req.on("data")` okuyucusu yoktur; backpressure korunur.
- 50 MiB/dosya, 15 dosya ve 200 MiB toplam dosya limitleri korunur.
  HTTP body sınırı multipart üstverisi için mevcut 1 MiB payla 201 MiB'dir.
  Toplam dosya sınırı içerik incelemesinden önce de kontrol edilir.
- Limit/hata durumunda parser'a aktarım kesilir. Kontrollü hata yanıtının TCP
  reset ile kaybolmasını azaltmak için kalan giriş en fazla 250 ms boşaltılır;
  bu byte'lar Multer'a veya diske gönderilmez. Bağlantı kapatılır. Devamlı veya
  kopmuş bağlantılarda istemci yine ağ hatası görebilir.
- Disk yazımı hata verdiğinde req.files'a henüz eklenmemiş kısmi dosya da
  temizlenir. İşletim sistemi unlink hataları loglanır; ani süreç/host kaybında
  kalabilecek dosyalar için kalıcı temizlik mekanizması bu patch'in dışındadır.

## İzole doğrulama

Proje kökünde:

```powershell
node --test backend/tests/uploadSecurity.test.js
```

Testler gerçek HTTP, Multer, disk yazımı, JWT doğrulaması, file-type ve Sharp
kullanır. DB, R2, kullanıcı auth middleware'i ve video probe/worker dış sınırları
sahtelenir. `.env` okunmaz; canlı servislere bağlanılmaz. Dosyalar ayrı geçici
test dizininde tutulur ve temizlenir.

İlk doğrulamada 19 senaryo: fotoğraf 201, video 202, pending moderasyonu, geçersiz/süresi dolmuş/
eksik/iptal token, kapalı etkinlik ve upload izni, kayıtlı kullanıcı eşleşmesi,
body kimlik uyuşmazlığı, bozuk dosya imzası, 15/16 dosya, tam 50/200 MiB sınırı,
50/200 MiB aşımı, gerçek 201 MiB chunked HTTP aşımı, küçük sınırla stream testi,
bozuk multipart ve bağlantı kopması. Son regresyon sonuçları aşağıdadır.

Gerçek R2 hataları, gerçek FFmpeg dönüşümü, tarayıcı/QR uçtan uca akışı ve
50 dilin görsel kontrolü çalıştırılmadı. İlgili frontend dosyaları değişmedi.

## Uygulama ve geri alma

Migration veya yeni paket yoktur. Deployment yapılmadı. Branch:
`security/patch-1-upload-guard`; başlangıç commit'i:
`9d7d9710b03ab73076694528651b82cf1492fc52`.

Geri dönüşte önceki backend sürümü kullanılabilir; DB geri alma gerekmez.
Yerelde yalnız bu patch'i geri almak için, sonraki kullanıcı değişiklikleri
kontrol edildikten sonra mediaRoutes.js başlangıç sürümüne döndürülür ve bu
patch'in eklediği middleware/test/doküman kaldırılır. Yeni middleware dosyasını
silmeden önce route import'u geri alınmalıdır. `git reset --hard` kullanmayın.

## Ayrı patch için açık not

`r2Reconcile.js`, bekleyen video işlerinin referanslarını korumadığı için bu
sorun giderilmeden `--apply` çalıştırılmamalıdır. Script bu patch'te değiştirilmedi
ve çalıştırılmadı. Atomik kota, eşzamanlılık sınırı ve diğer güvenlik aşamaları
ayrıca onay gerektirir.

## Son entegrasyon/regresyon incelemesi — 21 Ekim 2026

Production kodu ilk patch'ten sonra değiştirilmedi; yalnız testler genişletildi.
`git diff` ve iki frontend upload çağrısı yeniden incelendi. Etkinlik sahibi de
eskisi gibi guest oturumu oluşturup X-Guest-Token ve kullanıcı Bearer token'ını
gönderiyor. Yeni kontrol sahip rolü istemiyor ve sahipleri dışlamıyor. Geçerli
token üretimi `type: guest` içeriyor. Kayıtlı kullanıcılara özel etkinliklerde
kullanıcı/guest/token eşleşmesi korunuyor. Eski handler'ın aktarım sonundaki
yeniden doğrulaması da duruyor.

Son komut: `node --test backend/tests/uploadSecurity.test.js`.
Sonuç: 25 HTTP senaryosu ve 1 sentetik gecikme testi; Node üst HTTP testiyle
birlikte **27 passed, 0 failed, 0 skipped** raporladı.

Ek doğrulamalar:

- Anonim QR akışının upload isteği: 201. Gerçek QR taraması/tarayıcı testi değil.
- Oturumlu etkinlik sahibi ve only_users kullanıcı eşleşmesi: 201.
- Moderasyon açık: fotoğraf pending, video queued/target pending ve worker uyarısı.
- Moderasyon kapalı: fotoğraf approved, video target approved. Worker tamamlanması
  ve galeride görüntüleme gerçek DB/R2 ile sınanmadı; ilgili kod değiştirilmedi.
- Tam 200 MiB / 15 dosya / uzun UTF-8 isimler: 201; multipart payı **6.119 byte**.
  Normal frontend yalnız kimlikleri ve isteğe bağlı mesajı gönderiyor; 1 MiB pay
  bu normal akış için yeterli. Keyfi büyük ekstra alanlara sınırsız izin verilmez.
- Gerçek 50/200 MiB sınırları ve 201 MiB HTTP aşımı yeniden geçti.
- 1 KiB / 20 ms hızında geçerli aktarım: yaklaşık 1,03 saniyede 201.
- 50 MiB / 512 KiB parçalar / 5 ms bekleme: yaklaşık 1,57 saniyede 201.
- Küçültülmüş HTTP sınırında 256 byte / 80 ms yavaş aşım: yaklaşık 630 ms'de 413;
  bu süre sınıra ulaşmayı da içerir. 250 ms yalnız hata sonrası uygulanır.
- Kopan bağlantıda geçici dosya kalmadı. Gerçek mobil operatör/proxy/TLS koşulları
  taklit edilmedi; tüm ağ hatalarında JSON yanıtı garanti edilemez.

### Başlangıç gecikmesi

Yeni kontrol üç ardışık DB sorgusu ekliyor: guest, event, event_settings.
Mevcut optionalAuth ve aktarım sonu sorguları kaldırılmadı. Testte her gecikme
grubu 10 kez çalıştırıldı. Mock fonksiyonlara verilen gecikmelerin ölçümü:

| Sorgu başına eklenen süre | Medyan kontrol süresi | p95 |
|---|---|---|
| 0 ms | 0,01 ms | 0,15 ms |
| 10 ms | 47,17 ms | 56,10 ms |
| 30 ms | 93,69 ms | 94,25 ms |

Bunlar yerel sentetik timer ölçümleridir; işletim sistemi zamanlamasını içerir.
JWT gerçek maliyetini veya canlı Supabase gecikmesini ölçmez. Üretimdeki ek
bekleme yaklaşık üç sorgu round-trip süresine ve JWT doğrulama maliyetine bağlıdır.

### Eksikler ve karar

Depoda ayrı staging/test env dosyası bulunmadı ve kullanıcı tarafından test DB/
bucket kimliği verilmedi. Mevcut `.env` test ortamı sayılmadı ve servis çağrılarında
kullanılmadı. Gerçek Supabase/R2 fotoğraf-video entegrasyonu, FFmpeg işinin sona
ermesi, gerçek galeri/moderasyon UI'si, QR taraması ve mobil cihaz testleri atlandı.

Yerel regresyonda normal kullanıcıları engelleyen durum bulunmadı. PATCH 1
review/staging için hazır; eksik gerçek servis testleri nedeniyle production'a
hazır olduğuna kesin onay verilmedi. PATCH 2 için kod tabanı teknik olarak
hazırlanabilir ama başlanmadı ve yeni kullanıcı onayı bekleniyor.

Güvenli Git geri dönüş referansı: `patch-1-before-upload-security`, başlangıç
commit'ini işaret eder. Patch kendi branch'inde ayrı commit olarak saklanır.
Deploy edilirse geri dönüş önceki backend artifact'ı ile yapılır; DB migration
yoktur. Merge sonrasında geri alma gerekiyorsa patch commit'i `git revert` ile
geri alınabilir; takip eden commit'lerle uyumu ayrıca kontrol edilmelidir.
