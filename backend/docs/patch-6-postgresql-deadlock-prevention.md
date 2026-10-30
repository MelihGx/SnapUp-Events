# PATCH 6 — PostgreSQL Deadlock Prevention

Tarih: 30 Ekim 2026. Temel: PATCH 5 `e86eacc21dcf23689b1cc23a185eb6f6dbfc008a`.
Branch: `security/patch-6-postgresql-deadlock-fix`.
Geri dönüş etiketi: `rollback/patch-6-before-deadlock-fix` (PATCH 5 commit'i).

Canlı Supabase SQL/migration, production deployment, müşteri verisi işlemi ve
R2 silme yapılmadı. `.env` okunmadı. SQL yalnız mevcut launcher'ın oluşturduğu
boş, geçici localhost PostgreSQL 17 cluster'larına uygulandı. R2 sahte kaldı.
PATCH 7 geliştirmesine geçilmedi. PATCH 4 untracked raporu commit dışında korunur.

## 1. Doğrulanan kök neden

İki transaction'ın kilit grafiği:

| Transaction | Tuttuğu kilit | Beklediği kilit |
|---|---|---|
| Quota reserve/finalize | policy `FOR UPDATE`, event `FOR UPDATE` | worker'ın tuttuğu guest satırında `FOR UPDATE` |
| Worker media INSERT/UPSERT | guest `FOR UPDATE` (BEFORE INSERT quota trigger'ı) | media.event_id FK kontrolünde event `FOR KEY SHARE` |

Event `FOR UPDATE`, FK'nin `KEY SHARE` isteğiyle çatışır. Worker guest'i bırakmak
için INSERT transaction'ını bitirmelidir; quota event'i bırakmak için guest'i
beklemektedir. PostgreSQL bu döngüyü SQLSTATE **40P01** ile kırar.

Bu açıklama artık yalnız kaynak çıkarımı değildir. Yeni test, PATCH 3'ün orijinal
fonksiyonları üzerinde worker guest kilidini alır; quota RPC başlatılır ve
`pg_blocking_pids(quota_pid)` içinde worker PID'si görünene kadar beklenir.
Ardından worker gerçek media INSERT/UPSERT SQL'ini çalıştırır. Worker 40P01 alır;
hata bağlamında PostgreSQL'in event FK kontrolündeki `FOR KEY SHARE` sorgusu
bulunur. Worker INSERT'i rollback olur; queued video ve kalıcı 10 byte tüketim
korunur, quota rezervasyonu ilerleyebilir.

Fixture, media → event ve media → event_guests immediate foreign key'lerini ve
aktif `media_guest_quota_guard` trigger'ını katalogdan doğrular. Worker SQL'i
queue servisindeki aynı job UUID ile media upsert modelini kullanır; FFmpeg/R2
çalıştırılmaz. Test gerçek PostgreSQL transaction/trigger/FK davranışını sınar,
DB mock'u kullanmaz. Şema temsili fixture şemasıdır; canlı şema okunmadı.

Kaynaklar: PATCH 3 SQL `reserve_upload_quota`, `finalize_upload_quota`,
`enforce_guest_media_quota`; `videoProcessingQueueService.js` içindeki media
upsert; `uploadQuotaService.js` reserve/finalize RPC çağrıları; `mediaRoutes.js`
içindeki reserve → R2 → finalize sırası. event_guests.event_id, media.event_id /
guest_id ve video_processing_jobs event/guest/media FK'leri incelendi.

## 2. Uygulanan çözüm ve alternatifler

**Yalnız reserve/finalize fonksiyonlarının event satırı kilidi `FOR NO KEY UPDATE`
yapıldı.** Bu fonksiyonlar event anahtarını değiştirmez; yalnız kullanım/limit
bilgisine göre karar verir, finalize kümülatif tüketimi artırır.

- Policy → event → guest → reservation sırası korunur.
- Policy, guest ve reservation `FOR UPDATE` kilitleri korunur.
- `NO KEY UPDATE`, diğer quota event yazıcıları ve normal event UPDATE'leriyle
  çatışmaya devam eder; FK `KEY SHARE` ile uyumludur. Böylece worker guest'i
  tutarken FK kontrolünü tamamlayıp kilidi bırakabilir; quota devam eder.
- Worker'ın event → guest kilit sırasına alınması da değerlendirildi. REST upsert
  öncesinde bağımsız bir SELECT kilidi aynı transaction'ı kapsamaz. Ayrı worker
  RPC'si veya trigger değişikliği daha geniş mimari/ACL değişikliği gerektirir.
  Bu nedenle anahtar değişmeyen event'teki gereksiz kilit gücünü azaltan dar
  çözüm seçildi; worker/trigger kodu değiştirilmedi.
- Kilit kaldırılmadı; sayaç/kota kontrolü kilit dışına taşınmadı. DB transaction'ı
  R2 aktarımı veya FFmpeg süresine yayılmadı.
- Üretim RPC `lock_timeout='3s'`, API quota deadline 10 saniye, admission deadline
  5 saniye değişmedi. Test launcher'ın toplam suite timeout'u tekrarlı testler
  için 300 saniye oldu; bu production lock timeout'u değildir.

PostgreSQL'in kilit uyumluluk açıklaması: [Explicit locking, PostgreSQL 17](https://www.postgresql.org/docs/17/explicit-locking.html).

## 3. SQL migration ve veri güvenliği

Yeni ileri migration: `backend/database/2026-10-30-quota-event-locks.sql`.
Yalnız iki mevcut RPC `CREATE OR REPLACE FUNCTION` ile değiştirilir. Ön koşul
fonksiyonları yoksa transaction hata verir. Mevcut tablo, trigger, manifest,
rezervasyon, sayaç veya veri satırı güncellenmez. İki event lock değişikliği
çıkarıldığında fonksiyon gövdelerinin PATCH 3 ile birebir aynı olduğu kontrol edildi.

`search_path=''`, SECURITY DEFINER, imzalar/return tipleri ve 3 saniye lock_timeout
korunur. GRANT/REVOKE veya RLS değişikliği yoktur. Migration/tekrar uygulama/rollback
sırasında event, guest, media, jobs, reservations ve leases snapshot'ları ile
function OID/owner/ACL/security/config, trigger gövdesi ve ledger/admission RLS/ACL
karşılaştırılır. Restore edilen gövdeler orijinal PATCH 3 gövdeleriyle eşleşir.

`CREATE OR REPLACE` mevcut function ownership/permissions'ı korur:
[PostgreSQL CREATE FUNCTION](https://www.postgresql.org/docs/17/sql-createfunction.html).

Tam bağımlılık sırası:

1. Mevcut event/media/guest/storage/provider/video/admin override şemaları ve guest
   trigger'ı; özellikle `2026-10-05-video-background-processing.sql` bağımlılığı.
2. `2026-10-21-upload-admission.sql` ve yapılandırılmış policy satırı (PATCH 2).
3. `2026-10-21-atomic-upload-quota.sql` (PATCH 3).
4. PATCH 5 kodu (yeni SQL migration'ı yok).
5. `2026-10-30-quota-event-locks.sql` (PATCH 6), elle ve gözden geçirilmiş bakım
   penceresinde. Uygulama startup'ına veya otomatik migration çalıştırıcısına eklenmedi.

PATCH 3 migration'ı düzenlenmedi. `database/rollback/` dosyası ileri migration
listesine veya toplu SQL glob'una dahil edilmemelidir.

## 4. Test düzeneği ve sonuçlar

```powershell
$env:PATCH2_PG_BIN='C:\Program Files\PostgreSQL\17\bin'
$env:PATCH3_QUOTA_TESTS='1'
$env:PATCH5_R2_TESTS='1'
node --test --test-concurrency=1 backend/tests/uploadAdmission.postgres.test.js backend/tests/uploadAdmission.test.js backend/tests/uploadSecurity.test.js backend/tests/r2Reconcile.test.js
```

Yeni persistent psql oturumları launcher'ın rastgele loopback portunu ve izole
kullanıcısını alır; ambient PG değişkenleri temizlenir. Session/query deadline'ları
ve finally cleanup vardır. Sabit 100 ms sleep ile yarışı tahmin etmek yerine
backend PID + gerçek `pg_blocking_pids` bariyeri kullanılır. Testteki 50 ms
`deadlock_timeout`, eski döngüde worker'ın dedektör olmasını sağlar; cycle çözümü
yerine kullanılmaz ve production ayarı değildir. Bariyer koşulu sağlanmazsa test
başarısız olur; yarış sessizce atlanmaz.

Önceden hata veren **PATCH 3 worker holding guest lock and quota reservation do
not deadlock** testi adıyla korunur. Aynı senaryo yeni deterministik harness'i
çağırır; medya adedi, usage, kümülatif tüketim ve retry doğrulamaları korunup
artırılmıştır. Test kaldırılmadı, skip edilmedi, timeout yakalanıp başarı sayılmadı.

| Senaryo | Kontrol |
|---|---|
| Eski sürüm deadlock'u | Orijinal fonksiyonlarda beklenen 40P01 ve FK KEY SHARE hata bağlamı; worker rollback'i |
| Aynı eski senaryo, yeni SQL | Orijinal PATCH 3 testi deterministik bariyerle başarılı olmalı |
| Tekrarlı eşzamanlı worker/quota | Koşu başına 5 reserve + 5 finalize yarışı; bunların 5'inde mevcut media ile worker retry; hepsinde PID bariyeri |
| Worker idempotency | Her başarılı yarıştan sonra aynı job UUID ile tekrar upsert; iki medya/tüketim değişmemeli |
| Aynı guest, 20 paralel reserve | İki ayrı tur: count=5 ile 5 kabul; 1 MiB guest byte limiti ve sınırsız adet ile 10 × 100 KiB kabul; diğerleri ilgili quota hatası |
| Farklı guest'ler, aynı event | Mevcut 20 parallel reserve/10 finalize testi; event limiti aşılmamalı |
| Kilit gücü | Event NKU tutulurken KEY SHARE NOWAIT başarılı; ikinci NKU NOWAIT 55P03 ile reddedilmeli |
| Rollback | Worker INSERT rollback sonrası media yok, queued kullanım/kalıcı tüketim korunur; retry aynı UUID ile tek kayıt |
| Lock timeout | Mevcut dış event FOR UPDATE testinde 3s timeout, state/counter değişmez; kilit kalkınca finalize başarılı |
| Migration/rollback ve ACL | Gerçek veri snapshot'ları, OID/owner/ACL/config ve RLS korunur; anon/authenticated EXECUTE yok, service_role EXECUTE var |
| 201/202, token, limit/admission | PATCH 1–3 mevcut HTTP/PG regresyonları |
| R2 koruması | PATCH 5'in değişmeyen 31 testi: 18 bağımsız + 13 PG/fake R2 |

İlk toplu koşu: **101 TAP kaydı, 101 başarılı, 0 başarısız, 0 skipped/cancelled;
120,6 saniye**. İlk koşu sonrasında veri snapshot'ı ve aynı-guest count/byte
turları genişletilmiştir.

**Nihai ikinci toplu koşu: 101 TAP kaydı, 101 başarılı, 0 başarısız,
0 skipped/cancelled; 128,9 saniye, exit code 0.** Toplam iki üst test içerir;
99 bağımsız yaprak test başarılıdır. Önceki 95 regresyon kaydı (PATCH 1–3: 64,
PATCH 5: 31) korunur; altı PATCH 6 senaryosu eklenmiştir. PATCH 4 bir analiz
aşamasıdır, ayrı bir uygulama test paketi yoktur.

İki ayrı disposable cluster'da eski SQL aynı 40P01'i üretti. Her koşuda 10 yeni
yarış ve güçlendirilmiş eski deadlock testi olmak üzere **11**, iki koşuda
toplam **22** post-fix bariyerli yarış başarılıdır. Beşer worker retry yarışı da
bu kapsamdadır. Nihai koşudaki aynı-guest testinde 20+20 paralel reserve turu
sırasıyla 5 ve 10 kabul verdi; rejected işlemler doğru count/byte quota hatasını
aldı. Kümülatif tüketim 1234 byte geçmiş kullanım + yalnız kabul edilen byte'lar
oldu; çift finalize veya worker retry ile artmadı.

`git diff --check`, yeni JS fixture syntax kontrolleri ve iki quota gövdesinin
yalnız event lock gücü bakımından değiştiği karşılaştırması geçti. PATCH 5
uygulama/test dosyalarında diff yoktur.

Test toplamları koşular arasında birbirine eklenmez. Eski SQL'de beklenen 40P01'i
kanıtlayan testin başarılı olması, eski SQL'in deadlock'suz olduğu anlamına gelmez.

## 5. Değişen dosyalar

| Dosya | Amaç |
|---|---|
| `backend/database/2026-10-30-quota-event-locks.sql` | İki quota RPC'sinde event NKU kilidi |
| `backend/database/rollback/2026-10-30-quota-event-locks.sql` | Veri/ACL silmeden iki eski function gövdesini geri yükleme |
| `backend/tests/fixtures/postgresSession.js` | Disposable cluster'a persistent test bağlantıları |
| `backend/tests/fixtures/quotaDeadlockScenarios.js` | Önce/sonra bariyerli yarış, FK, migration/ACL, parallel quota ve rollback testleri |
| `backend/tests/fixtures/uploadQuotaScenarios.js` | Yeni migration/test kapsamını bağlama, eski deadlock testini güçlendirme |
| `backend/tests/uploadAdmission.postgres.test.js` | Güvenli test bağlantılarını aktarma ve genişleyen suite için süre bütçesi |
| `backend/docs/patch-6-postgresql-deadlock-prevention.md` | Kök neden, test, geçiş ve rollback raporu |

Uygulama JavaScript'i, frontend/API sözleşmesi, quota/admission servisleri, video
worker, PATCH 5 reconcile ve R2 servis/testleri değiştirilmedi. Sayaç tüketimi
hâlâ yalnız ilk atomik finalize'da artar; worker retry yeni tüketim oluşturmaz.

## 6. Production ön koşulları ve kalan riskler

- Önce ayrı staging DB'de gerçek şema/FK/trigger/function owner ve ACL tanımlarıyla
  migration ve testler tekrarlanmalı. Gerçek Supabase REST/R2/Render/FFmpeg testi
  bu çalışmada yapılmadı; yerel başarının production doğrulaması olduğu söylenmez.
- Mevcut iki function tanımı ve ACL/RLS yedeklenmeli; production'da özel bir
  function değişikliği varsa migration öncesi karşılaştırılmalı. Event quota
  fonksiyonları FK anahtarlarını değiştirmemelidir; ilave key-update trigger'ları
  ve benzersiz indeksler staging'de ayrıca incelenmelidir.
- Uygulama trafiği ve ilgili tüm yazıcılar/worker'lar durdurulup aktif işler drain
  edilerek migration uygulanmalı; eski function'ı kullanan açık transaction ile
  yeni sürümün karışması önlenmeli. Sonra bütün yazıcılar aynı sürümle açılmalı.
- 201/202, kota, pending/approved, worker publication/retry ve PATCH 5 dry-run
  smoke testleri tamamlanmadan production geçişine onay verilmemeli.
- Bu çözüm doğrulanan worker/quota FK döngüsünü kaldırır; tüm olası PostgreSQL
  deadlock'larının ortadan kalktığı iddia edilmez. Başka admin/delete/key-update
  transaction'ları kendi kilit sırası açısından ayrıca değerlendirilmelidir.
- Policy satırının global seri hale getirmesi korunur; kapasite dar boğazı veya
  kontrollü 3s lock timeout hâlâ mümkündür. Sayaç güvenliği için gerekli mevcut
  mekanizma gevşetilmedi.
- Worker restart sahipliği/fencing ve belirsiz REST upsert commit'inden sonra
  derivative cleanup sorunları bu patch'in dışındadır. Frontend idempotency/retry
  eksikleri devam eder. PATCH 7 için ayrı onay beklenir.
- PATCH 5'in offline apply şartı, job/manifest koruması, yeniden doğrulama,
  fail-closed, karantina ve dry-run davranışı aynen korunur.

## 7. Rollback

Kod geri dönüş referansı: `rollback/patch-6-before-deadlock-fix` → PATCH 5 commit'i.
Commit geri alma yalnız Git değişikliğini geri alır; uygulanmış DB function'larını
kendiliğinden geri döndürmez.

DB rollback gerekirse trafiği/yazıcıları ve worker'ları durdurup transaction'ları
drain edin. Önceden alınmış function tanımlarını veya bu branch'teki gözden
geçirilmiş `backend/database/rollback/2026-10-30-quota-event-locks.sql` dosyasını
hedefli uygulayın. İleri migration testinde bu rollback ve tekrar ileri geçiş
veri/ACL snapshot'larıyla doğrulanmıştır. Tabloları, rezervasyonları veya R2
nesnelerini silmeyin; storage_consumed_bytes sayacını azaltmayın, PATCH 3 SQL'inin
tamamını yeniden çalıştırmayın.

Rollback eski FOR UPDATE kilitlerini ve **bilinen deadlock riskini** geri getirir;
kalıcı çözüm olarak değerlendirilmemelidir. PATCH 5 güvenliği korunmalıdır. Canlı
rollback burada uygulanmadı. PATCH 6 tamamlanınca çalışma durur ve onay beklenir.
