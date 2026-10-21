# PATCH 3 — Atomik depolama kotası

Başlangıç `6a3a12c`, branch `security/patch-3-atomic-quota`. Production'a
deployment/migration yapılmadı; `.env`, frontend ve mevcut müşteri verileri
değiştirilmedi. R2 testleri sahtedir; SQL yalnız ayrı geçici PostgreSQL 17
cluster'ında çalıştırılır.

## Eski ve yeni akış

| Aşama | Önce | PATCH 3 |
|---|---|---|
| Kabul | Ayrı HTTP sorgularıyla kullanım okuyup karşılaştırma | DB kilidi altında kullanım + aktif rezervasyon kontrolü |
| Aktarım | R2, ardından bağımsız DB insert'leri | Kısa rezervasyon transaction'ı, transaction dışında R2 |
| Kesinleşme | Media insert, queue insert, sayaç RPC ayrı ayrı | Media + queue + sayaç + committed durum tek RPC transaction'ı |
| Hata | DB ve R2 rollback girişimleri | DB sonucunu atomik sorgula/iptal et; committed varlıkları koru |
| Tekrar | Her istek yeni kabul olabilir | Aynı key/fingerprint ile committed sonucu yeniden döndür |
| Crash | DB/R2 arasında boşluk, sayaç kaybı olasılığı | Kalıcı rezervasyon/nesne manifest'i ve admission sahipliği |

`storage_consumed_bytes` kalıcı tüketim olmaya devam eder. Migration geçmiş
tüketimi hesaplamaz, mevcut medya/iş kayıtlarını yeniden ücretlendirmez.
Rezervasyonlar bu sayacı önceden artırmaz. Bir kabul ancak metadata/queue ve
sayaçla birlikte commit olduğunda kalıcı tüketim haline gelir.

### Durum politikası

| Durum | Etkinlik kotası | Misafir kullanım hesabı |
|---|---|---|
| Canlı lease'e bağlı reserved | Ayrı rezervasyon olarak sayılır | Byte/adet rezervasyonu sayılır |
| Pending/approved/rejected fotoğraf kabulü | Kalıcı tüketim | Mevcut media satırı sayılır |
| Video queued/processing | Kalıcı tüketim | Orijinal byte/adet sayılır |
| Worker media'yı yazmış, job henüz processing | Tek kalıcı tüketim | Job UUID'sine ait media varsa job tekrar sayılmaz |
| Video ready | Aynı kalıcı tüketim | Media satırı sayılır |
| Video failed | Kalıcı tüketim korunur | Eski davranış gibi failed job sayılmaz; media varsa o sayılır |
| İptal/hiç commit olmamış upload | Kalıcı tüketim yok | Rezervasyon bırakılır |
| Kabulden sonra silinen media | Kalıcı tüketim geri verilmez | Eski modeldeki gibi mevcut media kullanımı azalır |

Video hata politikası `videoProcessingQueueService.js` üzerinden doğrulandı:
worker sayaç iadesi yapmıyor. Bu patch yeni refund kuralı üretmez. Worker
mimarisi/kuyruk mekanizması değiştirilmedi; guest trigger'ı worker upsert'inin
kendi job/media'sını iki kez saymayacak şekilde düzeltildi.

## Transaction ve sahiplik

- Sıra: PATCH 2 policy satırı kilidi → event → guest → reservation.
- `reserve_upload_quota`: güncel paket/admin override, misafir byte/adet sınırı,
  media + pending jobs + aktif rezervasyonları kontrol edip kayıt açar.
- `finalize_upload_quota`: sahiplik/canlı lease, manifest, toplam byte/adet ve
  güncel limitleri yeniden doğrular. Kayıtları ve sayacı tek transaction'da yazar.
- `cancel_upload_quota`: reserved'ı cancelled yapar. Committed ise iptal etmek
  yerine kaydedilmiş sonucu verir. Tekrar iptal/finalize sayaç değiştirmez.
- `upload_quota_guest_usage` ve guest trigger'ı pending video geçişlerini ve
  başka aktif rezervasyonları hesaba katar. `NULL` adet limiti sınırsız kalır.
- Admin `storage_limit_override_bytes > 0` paket limitinden önce uygulanır;
  NULL/0 paket limitine döner. Limit azaltımı finalize'da yeniden kontrol edilir.
- Lease expiry bir committed video/fotoğrafın tüketimini azaltmaz. Henüz commit
  olmamış rezervasyon artık finalize olamaz ve bir sonraki reserve/cleanup ile
  cancelled durumuna taşınır. Kota bu rezervasyona kalıcı bağlanmaz.

RPC'lerde `search_path=''`, RLS ve yalnız service_role EXECUTE yetkisi var.
Fonksiyon lock timeout'u 3 saniye; API quota RPC timeout'u 10 saniye. Uzun dış
kilitte kontrollü 503 mümkündür. R2 aktarımı boyunca transaction açık tutulmaz.
PATCH 2 local/cluster/event/guest admission limitleri aynı şekilde uygulanır;
quota rezervasyonu yeni bir admission slotu tüketmez.

## R2 ve belirsiz sonuç güvenliği

Orijinal/display/poster anahtarları R2 yazımından önce üretilip rezervasyonda
saklanır. R2 servisi opsiyonel server-generated assetId kabul eder; eski cover ve
diğer çağrılarda UUID üretimi aynen devam eder. Byte, MIME, boyut ve onay akışı
değişmez. POST endpoint'i, 201/202 yanıtları ve başarı yanıt alanları korunur.

Finalize HTTP yanıtı kaybolduğunda API bağımsız DB delete işlemleri yapmaz.
Cancel RPC'si committed sonucu bulursa başarı döner ve R2'ye dokunmaz. DB sonucu
çözülemiyorsa R2 varlıkları korunur; hata kaydı ve kalıcı manifest toparlanmaya
imkân verir. Böylece network timeout, kabul edilmiş dosyanın silinmesine dönüşmez.

`scripts/uploadQuotaCleanup.js` ayrı bir araçtır; `r2Reconcile.js` değiştirilmedi.
Varsayılan read-only audit'tir. `--apply` expired rezervasyonları cancelled yapar,
manifest'teki nesneler için media/video referanslarını kontrol edip temizler.
100 kayıtlık cursor sayfaları kullanır. İptal manifest'leri saklanır; cancelled
bir eski yazıcının geç tamamlanan PUT'u için araç periyodik tekrar çalıştırılmalıdır.
Committed manifest'ler listeye girmez. Failed video job referansı da korunur.

**Bu çalışma sırasında script CLI'si mevcut .env ile çalıştırılmadı.** Yalnız
dependency injection ile test DB ve fake R2 kullanıldı. Gerçek cleanup için önce
ayrı staging ayarlarıyla dry-run incelenmeli ve zamanlanmış çalışma hazırlanmalıdır.
Eski `r2Reconcile.js --apply` tehlikesi devam ediyor; onu çalıştırmayın.

## Idempotency ve frontend sınırı

Opsiyonel `Idempotency-Key`: 16–128 ASCII karakter, `[A-Za-z0-9._:-]`. CORS
allowedHeaders'a eklendi. Scope event + guest'tir. Sunucu fingerprint'i dosya
SHA-256'ları, byte/tür, sıra ve temizlenmiş mesaj üzerinden hesaplar.

- Aynı key + aynı içerik committed ise kayıt/sayaç/R2 tekrar oluşturulmaz.
- Aktif aynı key için 409 UPLOAD_IN_PROGRESS; farklı fingerprint için 409 conflict.
- Cancelled/expired girişten sonra aynı key ile yeni deneme açılabilir; eski
  manifest korunur ve yeni deneme farklı R2 anahtarları kullanır.
- Key gönderilmezse her HTTP isteği bağımsız kabul edilir. Aynı dosyayı tekrar
  paylaşmak meşru olabileceğinden içerik hash'i otomatik dedup anahtarı yapılmaz.

Frontend değiştirilmedi. Dolayısıyla mevcut tarayıcının belirsiz network hatası
sonrası yeni isteğini aynı mantıksal yüklemeye bağlama garantisi **henüz yok**.
Tam istemci retry garantisi için FormData denemesine kalıcı bir anahtar atayıp
aynı mantıksal retry boyunca koruyan küçük frontend değişikliği gerekir. Kullanıcı
talimatı gereği uygulanmadı; ayrı UX/onay konusu olarak bırakıldı. Otomatik retry
eklenmedi. Mevcut 50 dil sistemi ve genel hata çeviri anahtarları korundu.

Fingerprint için orijinal dosyalar stream ile bir kez daha okunur; 200 MiB dosya
RAM'e topluca alınmaz ama ek disk I/O ve hash CPU maliyeti vardır. Gerçek Render
yükünde p95 başlangıç süresi/RSS ölçülmelidir.

## Migration ve üretime geçiş ön koşulları

Yeni dosya: `database/2026-10-21-atomic-upload-quota.sql`.

1. Production şeması/ACL ve guest trigger fonksiyon tanımı yedeklenir. Ayrı staging
   DB'de gerçek şemayla migration ve testler çalıştırılır. Test fixture'ı temsili
   media/event şeması kullanır; gerçek Supabase şeması doğrulanmış değildir.
   Eski kodun insert/sayaç arasındaki crash boşluğu nedeniyle mevcut tüketim
   sayacının eksik olabileceği de read-only audit ile kontrol edilmelidir. Bu
   migration tarihsel tutarsızlıkları tahmin ederek otomatik düzeltmez.
2. PATCH 2 policy/lease migration'ı ve yapılandırması hazır olmalıdır. Mevcut
   storage/provider/video/admin override migration'ları da uygulanmış olmalıdır.
3. Upload ve message yazıcıları bakım penceresinde durdurulur, aktif istekler
   tamamlanır, yarım rezervasyon/lease durumları incelenir. Eski backend byte
   rezervasyonunu atlayabilir; mixed-version rolling deployment güvenli değildir.
4. Migration bir kez, transaction içinde uygulanır. Tekrar çalışma tablo mevcut
   hatasıyla tamamen rollback olur; test edildi. Kısmi IF NOT EXISTS şema geçişi
   yapılmaz. Mevcut tüketim backfill'i veya veri silme yoktur.
5. Bütün upload yazıcıları PATCH 3'e geçirilir. Yeni guest trigger'ı için eski
   fonksiyon tanımı saklanır. Media event/guest indeksi eklenmesi büyük tabloda
   kilit/kurulum süresi yaratabilir; bakım penceresi planlanmalıdır.
6. Gerçek test bucket/Supabase REST ile 201/202, onay, worker, replay ve cleanup
   doğrulanır; cleanup zamanlaması hazırlanır. Sonra trafik kontrollü açılır.

Paket byte limitleri SQL'de sunucunun mevcut free/mini/plus/premium değerleriyle
eşleşir; ileride paket kapasitesi değişirse pricingService ve SQL birlikte
güncellenmelidir. İstemciden kota limiti kabul edilmez.

## Test kapsamı ve komut

```powershell
$env:PATCH2_PG_BIN='C:\Program Files\PostgreSQL\17\bin'
$env:PATCH3_QUOTA_TESTS='1'
node --test --test-concurrency=1 backend/tests/uploadAdmission.postgres.test.js backend/tests/uploadAdmission.test.js backend/tests/uploadSecurity.test.js
```

Test cluster'ı boş, loopback portu rastgele ve `.env` okunmadan oluşturulur;
test sonunda durdurulup kendi geçici dizini silinir. `--no-sync` yalnız disposable
initdb hazırlığını hızlandırır. PG değişkenleri verilmezse ilgili test skip olur;
bu rapordaki gerçek koşuda PG yolu ve PATCH3 flag'i açık olmalıdır.

Testler: normal fotoğraf/video, 20 paralel kabul, 100 MiB'ye iki 80 MiB yarış,
tam event/guest/adet sınırı, aktif guest rezervasyonları, NULL sınırsız adet,
R2/DB/queue hataları, çift cancel/finalize, expired/restart, worker upsert ve
publication gap, video failure, admin override/reduction, silinmiş medya,
legacy tüketim, key conflict/replay/retry ve yetkisiz SQL erişimi.

Gerçek HTTP upload route'u + gerçek quota/admission RPC'leri + fake R2 ile de
201/202, committed replay, yarım R2 hatası, DB hatası, bağlantı kopması, kayıp
finalize yanıtı ve cleanup dry-run/apply doğrulanır. Worker guest kilidiyle
reserve yarışı ve uzun dış event kilidinde timeout ayrıca sınanır.

Eksikler: gerçek R2/FFmpeg/Supabase REST/tarayıcı ve mobil ağ, production şema
uyumluluğu ve Render kapasite/p95 ölçümü. Bunlar başarılı gösterilmez.

### Son doğrulama — 21 Ekim 2026

Son toplu koşu: **64 başarılı, 0 başarısız, 0 atlanan**, yaklaşık 90 saniye.
27 PATCH 1 regresyonu, 5 admission birim testi, 11 PATCH 2 PG/lifecycle testi
ve 21 yeni PATCH 3 senaryosu raporlandı (Node üst testleri sayıya dahildir).
20 paralel reserve ve 10 finalize yaklaşık 1.039 ms sürdü; ölçüm psql süreç
başlangıçlarını içerir, Supabase REST/Render p95 ölçümü değildir. Bu normal yarışta
lock timeout/deadlock veya kota aşımı olmadı. Bilerek uzun tutulan dış kilit
kontrollü timeout verdi; sayaç değişmedi, kilit kalkınca finalize başarılı oldu.

Geliştirme sırasında başarısız koşular oldu: Windows psql argv yorum kodlaması
ve SQL dollar-quote yazım hatası düzeltildi. Bir genişletilmiş koşu başarısız
olduktan sonra tanı koşusu geçti; kilit testindeki sabit bekleme gerçek kilidin
alındığını kontrol eden senkronizasyona çevrildi. Son toplu koşuda tüm senaryolar
geçti. Hata enjeksiyonlarındaki media_upload_failed logları beklenen test çıktısıdır.

### Dosyalar

| Dosya | Değişiklik |
|---|---|
| `backend/database/2026-10-21-atomic-upload-quota.sql` | Yeni ledger/RPC/index; guest trigger fonksiyonu |
| `backend/services/uploadQuotaService.js` | Yeni fingerprint/reserve/finalize/cancel servisi |
| `backend/scripts/uploadQuotaCleanup.js` | Yeni dry-run / kontrollü cleanup aracı |
| `backend/routes/mediaRoutes.js` | Ayrı DB yazımlarını atomik finalize ile değiştirme; güvenli hata toparlama |
| `backend/services/r2MediaService.js` | Önceden planlanan asset UUID'sini kullanabilme |
| `backend/services/uploadAdmissionService.js` | Sunucu içi sahiplik bilgisini quota'ya aktarma |
| `backend/middlewares/uploadAdmission.js` | Aynı sahiplik bilgisini request üzerinde tutma |
| `backend/index.js` | Opsiyonel Idempotency-Key CORS başlığı |
| `backend/tests/uploadAdmission.postgres.test.js` | PATCH 3 opt-in testleri ve disposable initdb |
| `backend/tests/uploadSecurity.test.js` | PATCH 1 regresyonu için quota dış sınır mock'u |
| `backend/tests/fixtures/uploadQuotaScenarios.js` | Gerçek PG kota/race/worker/rollback senaryoları |
| `backend/tests/fixtures/uploadQuotaRouteScenarios.js` | Gerçek HTTP route + PG + fake R2 senaryoları |
| `backend/docs/patch-3-atomic-quota.md` | Teslimat, sınırlar ve uygulama/geri dönüş planı |

## Rollback

Trafik/yazıcılar durdurulup devam eden işler ve belirsiz commit'ler uzlaştırılır.
Geri dönüş artifact'ı `6a3a12c` (PATCH 2)'dir. Ek tablo ve committed kayıtlar
silinmez; storage_consumed_bytes azaltılmaz veya eski yedeğe körlemesine dönülmez.
Yeni guest trigger/helper'ları yerinde bırakmak mümkündür; tam SQL rollback
gerekirse yalnız yedeklenmiş eski fonksiyon tanımı geri yüklenir. Eski migration
dosyalarının tamamı yeniden çalıştırılmamalıdır; veri güncellemesi içerebilir.

Backend geri dönüşü atomik kota korumasını kaldırır. PATCH 3'e tekrar dönmeden
önce eski yazıcılar durdurulmalı ve yeni tüketim/rezervasyonlar incelenmelidir.
PATCH 1 ve PATCH 2 commit'leri değiştirilmez; PATCH 3 ayrı commit olarak saklanır.

PATCH 3 sonrasında yeni güvenlik aşamasına veya production'a otomatik geçilmez.
