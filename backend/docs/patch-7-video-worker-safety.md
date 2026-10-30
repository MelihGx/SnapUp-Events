# PATCH 7 — Video Worker Ownership, Lease ve Veri Güvenliği

Tarih: 30 Ekim 2026. Temel commit: `bb1910ee44635b289180a87cb0a53f861990380c`.
Branch: `security/patch-7-video-worker-safety`.
Geri dönüş etiketi: `rollback/patch-7-before-worker-safety` → PATCH 6 commit'i.

Canlı Supabase SQL, production deployment, müşteri verisi işlemi ve gerçek R2
silme yapılmadı. `.env` okunmadı. Migration yalnız boş, geçici localhost PostgreSQL
17 cluster'ında uygulandı. R2 ve FFmpeg testlerde sahtedir. PATCH 8'e geçilmedi.
Başlangıçtaki tek untracked dosya olan PATCH 4 analiz raporu korunur ve bu commit'e
alınmaz; tarihsel PATCH 4 raporu güncel PATCH 7 durumunun yerine geçmez.

## Kök nedenler

1. Eski worker başlangıçta bütün processing satırlarını queued yapıyordu. Başka
   instance'ın geçerli sahipliği bilinmiyor; process içi mutex başka process'i
   korumuyordu. Job UUID ile upsert çift media satırını önlese bile aynı R2 key'ine
   iki worker'ın PUT/DELETE yapmasını önlemiyordu.
2. Media upsert REST hatası rollback kanıtı kabul edilip derivative siliniyordu.
   DB commit olmuş fakat yanıt kaybolmuş olabilirdi. Worker ile R2 işlem
   servisinin hata cleanup'ı ortak derivative key'lerini silebiliyordu.

## Yeni mimari

`videoWorkerService.js` test edilebilir worker çekirdeğidir. Queue servisi mevcut
start/wake fonksiyonlarını korur; startup toplu status UPDATE yapmaz. Her claim
PostgreSQL RPC'sidir. Bağımsız process'ler aynı DB sahiplik durumunu kullanır.

| Bileşen | İşlev |
|---|---|
| `worker_owner` | Her yeni claim için Node crypto.randomUUID ile üretilen owner token |
| `worker_generation` | Job başına DB'de monoton artan fencing generation |
| `worker_lease_expires_at` | DB saatine göre geçerlilik; normal lease 90 saniye |
| `video_worker_attempts` | R2 başlamadan önce kalıcı original/display/poster manifest'i, generation, durum ve cleanup_required |
| `claim_video_job` | Kısa transaction, job FOR UPDATE SKIP LOCKED; yalnız queued veya expired/legacy NULL-lease processing işler |
| `renew_video_job` | Yalnız aynı job+token+generation ve hâlâ geçerli processing lease yenilenir |
| `publish_video_job` | Canlı sahiplik doğrulamasıyla media + ready job + committed attempt tek DB transaction'ında |
| `video_job_outcome` | REST hatasından sonra kalıcı attempt/job sonucunu okur |
| `fail_video_job` | Yalnız canlı sahibi ve media kaydı olmayan işi failed yapar; stale owner no-op |

Claim token'ının tekrar kullanımı aynı canlı claim'i döndürebilir; eski veya
committed token başka job kazandırmaz. Claim yanıtı kaybolursa durable lease ve
manifest kalır. Yeniden denemede generation artar, eski attempt abandoned olur.
Eski token'ın heartbeat/fail/finalize işlemleri yeni sahibi değiştiremez.

Her deneme `events/<event>/media/<job>/attempts/<generation>-<token>/...` altında
farklı display/poster key'leri kullanır. Original yalnız okunur. Stale işin R2
PUT'u geç tamamlansa bile yeni denemenin dosyalarını değiştirmez. Job'ın mevcut
planlanan derivative anahtarları yalnız başarılı publication'da gerçek attempt
anahtarlarına çevrilir. Media UUID'si job UUID'sidir; duplicate finalize cached
committed sonucu döndürür, yeni media veya event tüketimi üretmez.

Claim, heartbeat ve fail yalnız job/attempt kilitleri kullanır. Publish kilit
sırası **policy → event FOR NO KEY UPDATE → guest → job → attempt** şeklindedir.
PATCH 6 quota fonksiyonları aynen korunur; guest trigger'ı değişmez. DB transaction'ı
FFmpeg/R2 sırasında açık tutulmaz. [PostgreSQL SELECT / SKIP LOCKED](https://www.postgresql.org/docs/17/sql-select.html)
kuyruk tüketicileri için bu kısa sahiplenme modelinin temelidir.

## Lease, heartbeat ve shutdown

- Varsayılan lease 90 s, heartbeat TTL/3 = 30 s, RPC deadline 5 s.
- Monotonik yerel son tarih RPC başlangıcından TTL eksi 5 s payla hesaplanır.
  Başarılı fakat eski yerel son tarihten sonra gelen heartbeat işi canlandıramaz.
- Renew hatası, timeout veya yerel deadline geçişi işlem sonucunu geçersiz kılar;
  AbortSignal tetiklenir. Yeni publication ayrıca DB'de token/generation/expiry ile
  denetlenir. Yerel kontrol tek yetkilendirme kaynağı değildir.
- SIGTERM/SIGINT yeni claim'leri kapatır, HTTP sunucusunu drain'e alır, worker
  sonucunu geçersizleştirir. Worker beklemesi en çok 10 s, toplam HTTP kapanışı
  en çok 25 s. Bekleyen claim geç dönerse render başlatılmaz; lease expiry ile
  başka instance devralabilir. Stop sonrası wake/start claim üretmez.
- Original stream pipeline AbortSignal alır. FFmpeg'in mevcut child-process
  altyapısı yeniden yazılmadı: başlamış transcode veya R2 PUT anında kesilmeyebilir.
  FFmpeg sonrası ve her PUT sonrası checkpoint vardır; geç sonuç yayımlanamaz.
  Eski CPU işlemi veya eski attempt PUT'u kısa süre yeni worker ile örtüşebilir.
  Garanti fiziksel olarak yalnız bir FFmpeg değil, **tek geçerli sahip ve fenced
  kalıcı publication** garantisidir. Platform shutdown'ı ayrıca staging'de sınanmalı.

## R2 güvenliği ve belirsiz sonuç

Yeni worker **hiçbir R2 DELETE yapmaz**. R2 işlem servisine preserveOnError=true
verilir; kısmi/yanıtı belirsiz PUT sonrasında da dosyalar korunur. Yerel geçici
FFmpeg dosyalarının finally temizliği devam eder; upload/cover servisleri değişmez.

Publish REST yanıtı hatalıysa önce outcome okunur. Committed attempt varsa başarı
korunur. Hâlâ owned ise gerçek işlem hatası atomik fail ile kaydedilebilir; DB
okunamıyorsa status tahmin edilmez, kalıcı processing/attempt manifest'i expiry
ve toparlama için bırakılır. Fail işleminin kendisi de sahipliği ve media varlığını
kontrol eder. Owner kaybetmiş worker başka attempt'e status veya dosya işlemi yapmaz.

Attempt durumları processing/committed/failed/abandoned; cleanup_required, error_code
ve kalıcı anahtarlar ayrı cleanup incelemesine kanıt sağlar. Failed/abandoned,
"kesinlikle referanssız ve şimdi silinebilir" anlamına gelmez. Otomatik fiziksel
GC eklenmedi. Silme gerekecekse bütün media/job/manifest referansları yeniden
incelenmeli ve bakım penceresi protokolü uygulanmalı; yalnız yaşa dayanılmamalı.

PATCH 5 reconcile artık **bütün worker attempt durumlarını** da korur. Bu tablo
okunamazsa fail-closed durur. Önceki job/reservation referansları, iki gözlemli
audit/karantina, her DELETE öncesi doğrulama ve --writers-stopped şartı aynen kalır.
Hiçbir startup veya worker reconcile --apply çağırmaz.

Ledger job'a FK ile bağlanmadı: event/job silinince geç R2 yazıcının manifest'i
kaybolmamalı ve mevcut kullanıcı/event silme cascade'leri bloke edilmemeli.
Ledger silinmez; retained manifest'ler bakım/retention politikası gerektirir.

## Migration ve güvenli geçiş

Yeni dosya: `backend/database/2026-10-30-video-worker-safety.sql`.

1. Mevcut event/media/guest/storage/video şemaları → PATCH 2 admission/policy →
   PATCH 3 quota → PATCH 6 `2026-10-30-quota-event-locks.sql` → PATCH 7 worker SQL.
   PATCH 5 uygulama korumaları da bulunmalıdır. SQL glob'uyla alfabetik toplu
   uygulama yapılmamalı; rollback dizini ileri migration'a dahil edilmemeli.
2. PATCH 7 preflight, iki quota function'ında PATCH 6 NKU düzeltmesini doğrular;
   eksikse hiçbir worker kolonu/tablosu eklemeden transaction hata verir.
3. Migration öncesi şema/function/ACL snapshot'ı, job/media/original manifest audit'i
   alınmalı. **Bütün eski worker process'leri ve restart/auto-deploy mekanizmaları
   durdurulup drain edilmelidir.** Eski worker yeni owner kontrolünü bilmez;
   mixed-version worker güvenli kabul edilmez.
4. Mevcut queued/processing/ready/failed kayıtları değiştirilmez. Eklenen generation
   başlangıçta 0, owner/expiry NULL'dır. Legacy processing NULL lease, ancak eski
   worker'ların durduğu doğrulandıktan sonra yeni worker tarafından devralınabilir.
   Media'sı zaten bulunan legacy publication gap ready olarak onarılır; medya
   tekrar işlenmez ve mevcut moderasyon durumu değiştirilmez.
   Event/guest/original key eşleşmiyorsa onarım reddedilir; ilgili kayıtlar korunur.
5. RPC'ler SECURITY DEFINER, search_path='' ve 3 s lock_timeout kullanır (outcome
   read-only helper). EXECUTE yalnız service_role; anon/authenticated/public kapalı.
   Ledger RLS açık, service_role SELECT/INSERT/UPDATE; DELETE grant'i eklenmedi.
   Mevcut quota RPC/trigger/RLS politikaları değişmez.
6. Migration tek transaction'dır. Yeniden çalıştırma duplicate-column hatasıyla
   tamamen rollback olur; idempotent migration runner değildir. Testte veri
   snapshot'ları ve replay davranışı doğrulanır.
7. Yeni worker ve attempt-aware reconcile birlikte deploy edilmeli. Gerçek
   Supabase REST ACL/schema cache, FFmpeg, R2 ve Render SIGTERM/overlap smoke
   testleri ayrı staging hesabı/bucket'ında yapılmalı; sonra kontrollü trafik açılmalı.

Yeni zorunlu environment değişkeni yoktur; mevcut VIDEO_QUEUE_POLL_MS (1–30 s,
varsayılan 3 s) korunur. Core constructor'da lease/heartbeat test için ayarlanabilir;
production wrapper 90/30/5 s ayarlarını kullanır. DB lease aralığı 30–600 s.

## Test sonuçları ve kapsam

```powershell
$env:PATCH2_PG_BIN='C:\Program Files\PostgreSQL\17\bin'
$env:PATCH3_QUOTA_TESTS='1'
$env:PATCH5_R2_TESTS='1'
node --test --test-concurrency=1 backend/tests/uploadAdmission.postgres.test.js backend/tests/uploadAdmission.test.js backend/tests/uploadSecurity.test.js backend/tests/r2Reconcile.test.js backend/tests/videoWorkerSafety.test.js
```

Nihai tam koşu: **128/128 TAP başarılı, 0 başarısız, 0 cancelled/skipped;
142,6 saniye**. Bunun 101'i mevcut PATCH 1–6 kapsamı, 22'si yeni gerçek PG worker
senaryosu, 5'i bağımsız worker/R2 adapter testidir. İki üst test sayıya dahildir;
bağımsız yaprak test sayısı 126'dır. Koşuların sayıları birbirine eklenmez.

Ara tam koşu 127/127 (152,3 s) geçti. Migration ön koşulu/negatif testi ayrıca
PG grubunda 72/72 (122,1 s) doğrulandı. Sonrasında legacy media/job kimlik
uyuşmazlığı kontrolü eklendi ve **bütün son değişiklikler yukarıdaki 128/128
tam koşuda birlikte doğrulandı**. Ara koşular toplama eklenmez. PATCH 6 bariyerli
yarışları ve PATCH 5 PG korumaları farklı disposable cluster'larda tekrar geçti.
Son beş bağımsız worker testi ayrıca 5/5 geçti. Syntax ve git diff --check
kontrolleri başarılı; frontend, upload endpoint'i ve PATCH 3/6 SQL'inde diff yok.

| Kullanıcı senaryosu | Kanıt/kapsam |
|---|---|
| Normal worker, queued → processing → ready | Gerçek claim/publish SQL + fake render/R2, media/job/attempt atomik sonuç |
| Aynı iş için iki claim | İki bağımsız PG bağlantısı, yalnız bir owner |
| Worker B startup / A canlı | B claim alamaz, A owner korunur; queue wrapper startup toplu UPDATE yapmaz |
| Crash | Gerçek Node test child'ı claim commit IPC bariyerinden sonra öldürülür; lease ve manifest DB'de kalır |
| Expiry takeover | DB saatiyle expiry geçmişe çekilir, B generation+1 ve farklı key alır |
| Gecikmiş heartbeat/finalize/fail | Eski token/generation yenisini değiştiremez; stale publish DB'de reddedilir |
| Fencing | A render sırasında B takeover/publish; A geç döndüğünde tek media B key'lerini korur |
| FFmpeg sırasında heartbeat | Fake FFmpeg gate'inde gerçek renew RPC sinyali beklenir; sleep'e dayalı başarı yok |
| R2 sonrası crash | Dosya map'i ve durable manifest korunur, yeni attempt farklı key'e yazar |
| Commit oldu/REST yanıtı kayıp | Gerçek publish commit sonrası fake REST hatası; outcome committed, iki dosya ve media korunur |
| DB/outcome outage | Silme yapılmaz; processing + cleanup_required manifest kalır |
| Tekrar işleme/publication | Aynı job UUID ve cached committed replay; tek media ve tek quota tüketimi |
| İki worker derivative çakışması | Generation/token prefix'leri farklı; stale attempt yeni key'leri değiştirmez |
| Belirsiz DELETE | Worker DELETE yolu kaldırıldı. Gerçek R2 adapter testinde PUT saklayıp hata verir; DELETE spy çağrılmamalı. Gerçek DELETE timeout entegrasyonu yapılmadı |
| Render overlap/shutdown | İki worker gate senaryosu, bounded stop, geç sonuç reddi; gerçek Render hesabı kullanılmadı |
| Failed/retry | Failed job/manifest; operatörün açık requeue'su sonrası yeni generation/key, counter değişmez |
| Post-migration kota | Gerçek reserve+finalize ile video kabulü → worker publish → finalize replay: tüketim yalnız bir kez |
| PATCH 6 / yeni lock sırası | Eski 11 bariyerli yarış korunur; ayrıca publish guest'te beklerken reserve policy'de bekletilir, gate açılınca ikisi tamamlanır |
| PATCH 5 | Bütün eski 31 test korunur; ek gerçek PG attempt referansı ve tablo hatasında fail-closed |
| ACL/RLS/migration | anon/authenticated ret, service_role EXECUTE, RLS açık, legacy satırlar korunur, replay rollback |

Geliştirme sırasındaki başarısız kontroller saklanır: ilk geniş koşu SQL dosyasının
UTF-8 BOM işaretinin Windows psql argv'sinde '?' olması nedeniyle migration'ı
uygulayamadı (121 TAP: 87 pass/34 fail; bağımlı testler de başarısız oldu). BOM
kaldırıldı ve eksik kurulumda senaryoların ilerlemesini durduran kontrol eklendi.
Geç heartbeat bağımsız testinin ilk hali yalnız unref timer kaldığı için cancelled
oldu; production server ref'ini modelleyen kontrollü test keep-alive ile düzeltildi.
Daha sonraki nihai tam koşu 128/128 geçti; önceki başarısız koşular başarı sayılmaz.

Gerçek FFmpeg/ffprobe çalıştırılmadı. Sahte renderer kontrollü gecikme/hata üretir;
R2 adapter testi gerçek pipeline/geçici dosya kodunu sahte S3 ve transcode ile
çalıştırır. Gerçek 5 dk/4K sınırları, codec'ler, uzun encode boyunca heartbeat,
R2 network partition, Supabase REST lost-reply ve Render process shutdown staging
smoke testleri zorunludur.

## Değişen dosyalar

- `backend/database/2026-10-30-video-worker-safety.sql`: lease/generation, attempt
  ledger, beş RPC, ACL/RLS ve migration ön koşulları.
- `backend/services/videoWorkerService.js`: sahiplik, heartbeat, fenced publish,
  belirsiz outcome toparlama ve bounded stop.
- `backend/services/videoProcessingQueueService.js`: mevcut start/wake facade,
  yeni core, koşulsuz startup reset'in kaldırılması, stop sonrası claim yasağı.
- `backend/services/r2MediaService.js`: worker için preserveOnError, AbortSignal
  pipeline ve işlem checkpoint'leri; diğer upload/cover çağrıları korunur.
- `backend/index.js`: SIGTERM/SIGINT kontrollü HTTP/worker kapanışı.
- `backend/scripts/r2Reconcile.js`: attempt ledger referanslarını da koruma.
- `backend/tests/fixtures/videoWorkerScenarios.js`: 22 gerçek PG/fake R2 senaryosu.
- `backend/tests/fixtures/videoWorkerClaimChild.js`: commit sonrası öldürülen test worker'ı.
- `backend/tests/videoWorkerSafety.test.js`: adapter, RPC deadline, shutdown/startup,
  bozuk lease ve geç heartbeat kontrolleri.
- `backend/tests/uploadAdmission.postgres.test.js`: test bağlamını yeni gruba aktarma.
- `backend/tests/fixtures/r2ReconcileScenarios.js` ve `backend/tests/r2Reconcile.test.js`:
  eski testlere yeni reference tablosunun eklenmesi; eski senaryolar kaldırılmadı.
- `backend/docs/patch-7-video-worker-safety.md`: bu rapor.

Frontend, API endpoint'leri, 50 dil dosyaları, PATCH 3 kota ve PATCH 6 migration
fonksiyonları değiştirilmedi. Kümülatif tüketim worker RPC'lerinde artırılmaz.

## Kalan riskler ve rollback

- Stale FFmpeg/başlamış PUT anında kesilmeyebilir; CPU ve terk edilmiş dosya alanı
  kullanabilir. Fencing ve ayrı key'ler yayın/overwrite riskini sınırlar; fiziksel
  exactly-once render iddiası yoktur. FFmpeg deadline/kill altyapısı ayrıca geliştirilebilir.
- Ledger ve orphan'lar kendiliğinden silinmez. Retention/GC için ayrı, referansları
  tekrar doğrulayan ve eski yazıcıların tamamen durduğunu garanti eden tasarım
  gerekir. Bu patch veri güvenliğini alan geri kazanımına tercih eder.
- Geçerli job sürekli tekrar üretim hatası alırsa failed kalır; otomatik sınırsız
  retry eklenmedi. Failed → queued operatör işlemi lease/worker audit'iyle yapılmalı.
- Service-role DB erişimi güvenilir backend yetkisidir. Eski veya doğrudan DB/R2
  yazıcılarının fencing'i atlamadığı staging'de ve işletim envanterinde doğrulanmalı.
- Gerçek servis performansı, kapasitesi ve shutdown davranışı doğrulanmadı.

Rollback önce tüm worker/yazıcıları durdurmayı gerektirir. Kod geri dönüş referansı
`rollback/patch-7-before-worker-safety` (PATCH 6)'dır; Git revert tek başına DB
uzlaştırması yapmaz. **Ledger/lease/generation kolonları ve committed kayıtlar
silinmemeli; generation sıfırlanmamalı, tüketim geri verilmemeli.** Veri korumak
için otomatik destructive down migration sunulmadı.

Job/media/attempt durumları audit edilip committed media'lar korunur; sadece
sahibi kalmayan ve media'sı bulunmayan işler kontrollü requeue edilir. Eski worker
bütün processing işleri resetlediği için canlı yeni worker/lease varken eski
koda dönülmemeli. İleri geçiş tercih edilmelidir. Eski worker'a zorunlu dönüşte
hiçbir yeni worker'ın yaşamadığı ve bütün in-flight/ambiguous sonuçların uzlaşıldığı
kanıtlanmalı. PATCH 7'yi bilmeyen eski reconcile attempt tablosunu korumaz:
**rollback sonrasında destructive reconcile kapalı kalmalı**, tercihen attempt-aware
reconcile kodu korunmalıdır. Audit dosyaları/manifest'ler saklanır. Canlı rollback
uygulanmadı; çalışma tamamlanınca durulur ve PATCH 8 için ayrıca onay beklenir.
