# PATCH 5 — R2 Data Loss Prevention

Tarih: 30 Ekim 2026. Başlangıç: `d1d00e8`.
Branch: `security/patch-5-r2-data-loss-prevention`.

Bu patch reconcile aracını, R2 listeleme yardımcısını ve testlerini değiştirir. Upload, kota RPC'leri,
video worker, frontend ve migration dosyaları değiştirilmedi. Canlı R2 silme,
Supabase migration veya deployment yapılmadı. Testler `.env` okumadan boş geçici
PostgreSQL 17 cluster'ı ve bellek içi sahte R2 ile çalışır. PATCH 6 uygulanmadı.

## Koruma kuralları

- Media ve cover anahtarlarının bütün sütunları, provider filtresi olmadan okunur.
- `video_processing_jobs` içindeki queued, processing, failed ve ready işlerinin
  original/display/poster anahtarları korunur. Failed dosyalar retry/recovery için
  geçerli referans sayılır; bekleme süresi korumayı kaldırmaz.
- Bütün reserved/committed/cancelled rezervasyon manifest'leri korunur. Expired
  lease veya cancelled durum tek başına orphan kanıtı değildir; geç PUT mümkündür.
  Bu nesnelerin kontrollü temizliği ayrı `uploadQuotaCleanup` protokolüne aittir.
- DB hatası, null/veri biçimi belirsizliği, bilinmeyen job/reservation durumu,
  bozuk manifest ve geçersiz lease tarihi işlemi durdurur. Eksik şema sessizce
  atlanmaz. İstisnalar yutulmaz; delete hatası sonraki silmeleri durdurur.
- UUID primary key üzerinden sıralı keyset pagination kullanılır; offset yoktur.
- Missing veya geçersiz LastModified/size ve yeni nesneler korunur. Missing
  published media/cover raporlanır; apply bu durumda durur, CLI exit code 2
  dry-run integrity uyarısını korur.
- R2 provider belirtilip zorunlu anahtarları eksik olan media/cover kaydı
  belirsiz kabul edilir. R2 listeleme yardımcısı eksik boyutu sıfıra dönüştürmez;
  truncated yanıtın continuation token'ı yoksa veya tekrar ediyorsa hata verir.
- Modül import edildiğinde uygulama client'ları veya `.env` yüklenmez. CLI
  varsayılan olarak dry-run'dır; izinli argümanlar açıkça sınırlandırılmıştır.

## Güvenli orphan silme protokolü

DB ve R2 aynı transaction'a katılamaz. Sadece ikinci bir SELECT yapmak, son
SELECT ile DELETE arasındaki yarışı çözmez. Mevcut yazıcılara fencing eklemek
bu patch'in kapsamını aşar. Bu nedenle **online destructive reconcile desteklenmez**.

Apply için aşağıdakilerin hepsi zorunludur:

1. Bütün API upload/cover/admin yazıcıları, video worker'lar, cleanup araçları ve
   doğrudan DB/R2 yazıcıları durdurulup drain edilmelidir. Yalnız trafiği kesmek
   yetmez; worker process'leri de durmalıdır. Yeni deploy/instance başlamamalıdır.
2. Operatör bunu `--writers-stopped` ile açıkça teyit eder. Bu flag bir distributed
   lock değildir; işletim koşulunu dürüstçe beyan eder. Araç altyapıda durmuş
   process'leri kendisi doğrulayamaz. Koşul garanti edilemiyorsa dry-run kullanılmalıdır.
3. Aynı bucket çiftinden alınmış önceki dry-run JSON audit'i gerekir. Audit en az
   `R2_RECONCILE_MIN_AGE_HOURS` kadar eski olmalıdır (varsayılan 24 saat; 1–720).
   İlk gözlem sırasında nesnenin kendisi de en az bu kadar eski olmalıdır.
4. Nesne her iki gözlemde de aynı bucket/key/size/LastModified ile, tüm DB
   referanslarından bağımsız görünmelidir. Yeni veya değişen aday silinmez.
5. Canlı admission lease veya processing job varsa apply reddedilir. Expired
   rezervasyon manifest'leri yine korunur; araç lease/reservation iptal etmez.
6. Her DELETE öncesi R2 nesne kimliği yeniden okunur, ardından bütün referans
   tabloları tekrar okunur. Yeni referans varsa aday atlanır; DB/R2 belirsizliğinde
   durulur. DELETE'ler sıralıdır; bir hatadan sonra yeni DELETE başlatılmaz.

Audit bir yetki belgesi veya DB snapshot'ı değildir. Güvenilir yerel operatör
artefaktıdır; paylaşımda bucket/object anahtarları içerdiği hesaba katılmalıdır.
Dosya `wx` ile oluşturulur, var olan audit'in üstüne yazılmaz. Apply audit üretmez.
Bakım penceresi olmadan bu protokolün atomik online koruma sağladığı iddia edilmez.

Aşağıdaki komutlar yalnız ileride, ayrı test ortamında kullanım örneğidir;
canlı ayarlarla bu çalışma sırasında çalıştırılmadı:

```powershell
# Ayrı staging ayarlarıyla dry-run; mevcut dosyanın üzerine yazmaz.
node backend/scripts/r2Reconcile.js --audit-out staging-r2-audit.json
# Yaş/karantina süresi geçtikten ve TÜM yazıcılar durdurulduktan sonra staging:
node backend/scripts/r2Reconcile.js --apply --writers-stopped --audit-file staging-r2-audit.json
```

`--apply` tek başına servis client'ı yüklenmeden reddedilir. `--verbose` JSON'da
adayları ve missing nesneleri gösterir; normal çıktı sayıları gösterir. Önceki
serbest `--apply` davranışı kasıtlı olarak kapatılmıştır. CLI ayarları kendi
çalışma dizinindeki dotenv davranışını korur; ortam seçimini operatör yapmalıdır.

## Testler

```powershell
$env:PATCH2_PG_BIN='C:\Program Files\PostgreSQL\17\bin'
$env:PATCH3_QUOTA_TESTS='1'
$env:PATCH5_R2_TESTS='1'
node --test --test-concurrency=1 backend/tests/uploadAdmission.postgres.test.js backend/tests/uploadAdmission.test.js backend/tests/uploadSecurity.test.js backend/tests/r2Reconcile.test.js
```

PATCH 5 PG fixture'ı mevcut disposable PG launcher'ına opt-in bağlanır; production
şemasıyla bağlantı kurmaz. Test içindeki cover sütunları yalnız fixture DB'sine
ALTER ile eklenir; migration dosyası veya canlı migration yoktur.

Kapsam: queued/processing/failed/ready original ve derivatives; reserved,
committed ve cancelled manifest; expired owner; aktif lease; aged gerçek orphan;
son kontrolde yeni referans/lease; missing tablo ve DB outage; eksik metadata;
nesnenin değişmesi; eksik published nesne; 500 satırı aşan pagination; dry-run,
karantina ve bakım kapıları; delete hatasında durma.

Ara koşular: ilk toplu koşu 89/89, genişletilmiş ikinci koşu 93/93 başarılıdır.
Nihai metadata/reference korumalarıyla bağımsız PATCH 5 testleri 18/18 geçti.
Bu ara koşular birbirine eklenmez.

**Nihai toplu koşu: 95 TAP kaydı, 95 başarılı, 0 başarısız, 0 skipped/cancelled;
110,5 saniye, exit code 0.** Dağılım: mevcut PATCH 1–3 regresyonları 64/64,
PATCH 5 bağımsız testleri 18/18, PATCH 5 gerçek izole PG + fake R2 senaryoları
13/13. TAP toplamında iki üst test de vardır; bağımsız yaprak test sayısı 93'tür.
`git diff --check` ve yeni script/fixture syntax kontrolleri de geçti.

Mevcut worker/reserve yarış testi bu koşuda geçti. PATCH 4'te iki kez gözlenen
deadlock'un zamanlamaya bağlı olması ve ilgili SQL/worker kodunun burada
değiştirilmemesi nedeniyle **deadlock çözülmüş sayılmaz**. PATCH 6 kapsamında
ayrıca ele alınmalıdır. Bütün testler yereldir; gerçek R2/Supabase/Render
entegrasyonu çalıştırılamadı ve başarılı gösterilmedi.

## Değişen dosyalar

- `backend/scripts/r2Reconcile.js`: referans koruması, fail-closed kararlar,
  karantina/audit, bakım kapısı, yeniden doğrulama, izole dependency injection.
- `backend/services/r2MediaService.js`: yalnız listBucketObjects içinde eksik
  size'ın korunması ve continuation token tutarlılık kontrolü; upload/delete
  işlevleri değiştirilmedi.
- `backend/tests/r2Reconcile.test.js`: bağımsız fake-service testleri.
- `backend/tests/fixtures/r2ReconcileScenarios.js`: gerçek izole PG + fake R2 testleri.
- `backend/tests/uploadAdmission.postgres.test.js`: PATCH5_R2_TESTS opt-in hook'u;
  yalnız bu genişletilmiş PG grubu için 180 saniye test timeout'u (diğerinde 120).
- `backend/docs/patch-5-r2-data-loss-prevention.md`: kullanım, sonuç ve rollback.

Önceden oluşturulmuş untracked PATCH 4 raporu PATCH 5 commit'ine alınmaz.

## Kalan riskler ve sınırlar

- PATCH 4'teki worker/reserve deadlock, worker restart sahipliği ve belirsiz media
  upsert sonrası derivative silme sorunları bu patch ile çözülmez. PATCH 6 onayı beklenir.
- Gerçek Supabase REST/RLS ve R2 hesabı denenmedi; sentetik şema/servis testleri
  production onayı değildir. Reconcile service-role client'ıyla çalışmalıdır.
- Her aday için bütün DB referanslarının tekrar okunması pahalıdır. Güvenlik
  maliyete tercih edildi; büyük bucket için bakım penceresi ve hacim ölçülmelidir.
- Cancelled/expired/committed manifest koruması genel reconcile'ın silme alanını
  daraltır. Retention ve quota cleanup ayrı konudur; yalnız yaşla bu koruma kaldırılmaz.
- Bakım koşulu ihlal edilirse son SELECT/DELETE arasında yarış ve aynı anahtarın
  değiştirilmesi hâlâ mümkündür. Araç bir DB/R2 distributed lock uygulamaz.
- Bir DELETE sonrası sonraki sorgu hata verirse önceki başarılı silmeler geri
  alınmaz; işlem durur. Fiziksel silmeyi Git revert geri getirmez.

## Rollback

Scheduler/destructive çağrılar durdurulur. PATCH 5 commit'i `git revert <PATCH5_COMMIT>`
ile geri alınabilir; canlı migration veya uygulama veri dönüşümü yoktur. Eski
reconcile'ın `--apply` açığı geri geleceği için rollback sonrası yalnız dry-run
kullanılmalı, destructive reconcile kapalı kalmalıdır. Upload/worker/frontend
rollback'i gerekmez. Audit dosyaları inceleme için saklanır. Silinmiş nesneler
ancak bağımsız yedekten geri getirilebilir; bu çalışma canlı nesne silmedi.
