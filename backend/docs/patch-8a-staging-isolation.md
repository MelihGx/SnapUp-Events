# PATCH 8A — Staging Isolation & Configuration Safety

Tarih: 30 Ekim 2026. Temel commit: `64ed92bbce0143406bbc58ed6763c2e581b3ef7d`.
Branch: `security/patch-8a-staging-isolation`.

**PATCH 8A uygulandı. Production NO-GO devam ediyor.** Gerçek staging kimlikleri
bilinmediğinden teslim edilen politikada `staging: null`; staging backend başlangıcı
ve staging frontend build'i bilinçli olarak reddedilir. İzolasyon altyapısının yerel
kabulü, gerçek hesapların veya staging entegrasyonunun doğrulandığı anlamına gelmez.

Yeni servis/proje/bucket, deployment, sağlayıcı bağlantısı veya schema export yok.
Canlı/staging migration ve gerçek R2 işlemi yapılmadı. `.env` okunmadı ve uygulama
mevcut `.env` ile başlatılmadı. Testler yalnız kendi boş disposable PostgreSQL 17
cluster'ında mevcut fixture SQL'lerini çalıştırdı; fake R2/renderer kullanıldı.
PATCH 1–7 uygulama/SQL mantığı ve mevcut iki untracked PATCH 4/8 raporu korundu.
PATCH 8B başlatılmadı.

## Değişen dosyalar

Frontend:

- `frontend/js/config.js`: ortak API seçimi, exact-origin credential davranışı,
  staging'den bilinen production fetch hedeflerine yerel ret.
- `frontend/js/deployment-policy.js`: yalnız public hedeflerin varsayılan production
  politikası; staging varsayılanı kapalı.
- `frontend/js/runtime-target.js`: açık artifact modu ve exact-origin allowlist.
- `frontend/js/script.js`: ortak config'i atlayan iki eski API seçicisi kaldırıldı.
- `scripts/build-frontend.cjs`: production/staging artifact ve staging CSP üretimi.
  `frontend/_headers` dosyasının kendisi değiştirilmedi.

Backend:

- `backend/config/deployment-targets.json`: güvenilen, sürümlenen hedef manifest'i;
  henüz bilinmeyen gerçek DB/R2 kimlikleri boş, staging kapalı.
- `backend/config/environmentSafety.js`: offline kimlik/endpoint/credential pin ve
  ortam doğrulaması; yalnız sabit hata kodları.
- `backend/config/originPolicy.js`: staging için yalnız staging CORS allowlist'i;
  production/development için önceki CORS kuralları.
- `backend/index.js`: dotenv sonrası, route/client import ve listen öncesi kontrol.
- `backend/config/supabaseClient.js`, `backend/config/r2.js`: SDK yükleme/client
  yaratma öncesi kontrol; R2 lazy erişiminde de kontrol.
- `backend/services/videoProcessingQueueService.js`: worker oluşturma öncesi kontrol.
  Claim/lease/fencing/heartbeat/publication/atomic quota mantığı değiştirilmedi.

Test/doküman/destek:

- `backend/tests/stagingIsolation.test.js`, `backend/tests/fixtures/stagingPolicy.js`.
- `backend/docs/patch-8a-staging-isolation.md` (bu belge).
- `backend/docs/patch-8a-schema-inventory.md` (70 repo DDL tanımı ve bağımlılıklar).
- `.gitignore`: üretilen `artifacts/` çıktıları Git kapsamı dışında.

## İzolasyon mimarisi

Frontend ortamını query string, localStorage veya değiştirilebilir global değişken
seçmez. Ortam artifact üretilirken belirlenir. Production artifact mevcut dört
bilinen frontend origin'inde aynı Render API'yi seçer; localhost/file geliştirme
hedefi de korunur. Bilinmeyen host/Pages preview artık sessizce production API'yi
seçmez: açık hedef politikası gerekir. Bu, önceki her-host fallback'ine kasıtlı bir
sıkılaştırmadır; kayıtlı production origin'leri/API sözleşmesi değişmez.

Staging artifact yalnız kayıtlı HTTPS frontend origin'inde açılır. Staging API/media
URL'si yoksa veya production origin'iyle çakışıyorsa config reddedilir. Login,
register, detail, gallery ve upload aynı config'i import eder. Fetch string, URL ve
Request URL'sini exact-origin ile değerlendirir; benzer domain prefix'lerine cookie
credential eklemez. Mevcut XHR akışları aynı API_URL'yi kullanır; staging CSP ayrıca
production bağlantılarını engeller. Native fetch sarmalayıcısı bütün ağ API'lerinin
sandbox'ı değildir; allowlist/config ve CSP birlikte koruma sağlar.

Build kullanımı (bu patch herhangi bir artifact'ı deploy etmedi):

```powershell
node scripts/build-frontend.cjs production
# Gerçek kimlikler/politika onaylanıp tamamlanmadan aşağıdaki komut hata verir:
node scripts/build-frontend.cjs staging
```

Çıktı yalnız yeni `artifacts/production-frontend` veya `artifacts/staging-frontend`
dizinidir. Mevcut çıktı üzerine yazılmaz; her build temiz/yeni workspace'te yapılır.
Yalnız başarıyla biten build çıktısı sonraki onaylı deploy için değerlendirilmeli.
Public artifact'a Supabase/R2 kimliği, secret veya credential hash'i konulmaz.
Production `_headers` byte olarak aynı kalır. Staging CSP'de yalnız connect/img/media
hedefleri dönüştürülür: production API/media ve shared Cloudinary origin'i kaldırılır,
staging API/media eklenir. QR/map/font/Turnstile gibi mevcut üçüncü taraflar korunur;
script/style/frame/worker güvenlik kuralları gevşetilmez. Staging'de production
Cloudinary medyası gösterilmez; ayrı legacy medya ihtiyacı 8B'de ele alınmalıdır.
50 dil dosyaları, HTML/CSS, tasarım, preview ve upload UI değiştirilmedi.

Backend için `APP_ENV=staging` açık seçimdir; `NODE_ENV=production` zorunludur.
Böylece mevcut Secure / HttpOnly / SameSite=None / __Host cookie ve HTTPS/HSTS
semantiği korunur. CORS ve cookie-auth CSRF kontrolü aynı staging origin allowlist'ini
kullanır. Production'ın sabit origin'leri staging allowlist'ine eklenmez. Origin
olmayan server istemcilerinin önceki CORS davranışı korunur; bu, auth yerine geçmez.

Doğrulama, Supabase project ref'inden türetilmiş HTTPS URL'yi; farklı R2 account,
ikili bucket adlarını, canonical S3 endpoint/jurisdiction'ı, media origin'ini,
Render service ID'yi ve frontend/CORS hedeflerini manifest'le karşılaştırır.
Bu sürüm R2 staging için **ayrı account** ister; aynı account/farklı bucket düzeni
kabul edilmez. Production ve staging gerçek proje/account/bucket kimlikleri birlikte
kaydedilmeden staging etkinleşmez. `RENDER_SERVICE_ID` kayıtlı staging servisine ait
olup APP_ENV eksik/yanlışsa production varsayılanına geçilmez; startup reddedilir.

Credential SHA-256 pin'leri yalnız bağımsız olarak staging'e ait olduğu doğrulanmış,
yüksek entropili yeni secret'ların değişmez kimlikleri içindir. Değerler loglanmaz.
Pin listesi backend manifest'inde kalır; frontend'e taşınmaz. Hatalı hedef için
production'a negatif test isteği gönderilmez. Supabase ve R2 SDK constructor'ları,
route yükleme, HTTP listen ve worker başlangıcı guard'dan sonra gelir.

## Yapılandırma sözleşmesi ve sınırları

`backend/config/deployment-targets.json` güvenilen deploy artifact'ının parçasıdır;
backend-only paket hazırlanırsa bu dosya dahil edilmelidir. ENV ile başka bir manifest
path'i seçilmez. Manifest'in production kimlikleri ve staging alanları ileride
salt okunur/provider metadata envanteriyle doğrulanıp ayrı review ile doldurulmalı.

| Manifest alanı | Gerekli bilgi |
|---|---|
| production.supabaseProjectRef / r2AccountId / r2Buckets | Gerçek prod kimlikleri; staging ile ayrılığı offline karşılaştırmak için |
| production.renderServiceIds | Gerçek production servis kimlikleri |
| staging.supabaseProjectRef / r2AccountId / r2Buckets | Ayrı proje/account ve sıralı original/display bucket çifti |
| staging.renderServiceIds | Platformun sağlayacağı gerçek staging servis ID'leri |
| staging.frontendOrigins / apiOrigin / mediaOrigin | Birbirinden ve production'dan ayrı HTTPS origin'leri; path yok |
| staging.credentialSha256 | Gerekli staging credential'larının SHA-256 pin'leri; gerçek değerler yok |

| Ortam değişkeni | Staging kabulü |
|---|---|
| APP_ENV, NODE_ENV, RENDER_SERVICE_ID | Açık staging seçimi, production güvenlik davranışı, kayıtlı platform kimliği |
| SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | Manifest'teki proje URL'si ve doğrulanmış staging credential pin'i |
| R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY | Ayrı account ve yalnız test bucket'larına yetkili credential pin'leri |
| R2_S3_ENDPOINT, R2_JURISDICTION | Endpoint opsiyonel; verilirse account/jurisdiction ile exact eşleşme; canonical endpoint dışında ret |
| R2_ORIGINAL_BUCKET, R2_DISPLAY_BUCKET, R2_DISPLAY_PUBLIC_BASE_URL | Manifest'teki iki bucket ve ayrı media origin'i |
| CORS_ORIGINS, FRONTEND_URL | Exact staging origin kümesi ve birinci frontend origin'i |
| JWT_SECRET, GUEST_JWT_SECRET | Yeni staging secret pin'leri; mevcut guest fallback semantiği korunur, efektif secret da pin'lenir |
| CLOUDINARY_API_KEY / API_SECRET / AUTH_TOKEN_KEY, RESEND_API_KEY, TURNSTILE_SECRET_KEY | Tanımlıysa ayrıca onaylı staging pin'i zorunlu |
| CLOUDINARY_CLOUD_NAME, EMAIL_FROM, EMAIL_LOGO_URL, TURNSTILE_SITE_KEY / ALLOWED_HOSTNAMES / ENABLED | Ayrı sağlayıcı/test mailbox/hostname ayarları 8B inventory'sinde incelenmeli; bu patch bunlara gerçek bağlantı kurmaz |
| UPLOAD_MAX_ACTIVE, PORT, VIDEO_QUEUE_POLL_MS, FFMPEG_PATH, FFPROBE_PATH | Mevcut işlevsel ayarlar; kapasite/native ikililer gerçek staging ölçümü gerektirir |

Önemli sınır: offline pin kontrolü credential'ın provider ACL/scoping'ini kendi
başına kanıtlamaz. Önce gerçek kaynak/credential metadata'sı doğrulanmalıdır.
Yanlış bir secret'ı güvenilen manifest'e staging diye yazmak güvenli kurulum değildir.
Legacy production/development varsayılanını korurken, henüz kayıtlı olmayan bir
servisin operator tarafından yanlış etiketlendiği kendiliğinden anlaşılamaz.
Staging kurulumunun ön şartı service registry + explicit mode + doğru artifact'tır.
Manifest şu an tamamlanmadığı için gerçek staging izolasyonu onaylanmış sayılmaz.
Mail, Cloudinary, Turnstile, DNS/CDN, auth/RLS ve scoped R2 yetkileri ayrıca 8B
kabulü gerektirir. Bunlara yönelik koşulsuz garanti verilmez.

## Test sonuçları

```powershell
$env:PATCH2_PG_BIN='C:\Program Files\PostgreSQL\17\bin'
$env:PATCH3_QUOTA_TESTS='1'
$env:PATCH5_R2_TESTS='1'
node --test --test-concurrency=1 backend/tests/uploadAdmission.postgres.test.js backend/tests/uploadAdmission.test.js backend/tests/uploadSecurity.test.js backend/tests/r2Reconcile.test.js backend/tests/videoWorkerSafety.test.js backend/tests/stagingIsolation.test.js
```

**146 TAP kaydı, 146 başarılı, 0 fail/skipped/cancelled; 163,4 saniye, exit 0.**
128 mevcut PATCH 1–7 + 18 yeni 8A testi; iki üst kayıt sayıldığından 144 yaprak test.
Son frontend URL-object koruması ve gerçek varsayılan public politika eşleşmesi
kontrolünden sonra 8A grubu ayrıca **18/18**, 0,9 saniye ile yeniden geçti; bu tekrar
146'ya eklenmez. `git diff --check` temiz (yalnız Windows LF/CRLF bilgilendirmesi).

Yeni testler production/local frontend hedefi; staging hedefi ve eksik hedefte ret;
unknown preview ve production URL fetch ret; ortak config kullanan auth/gallery/
upload modülleri; production Supabase/account/bucket/media/CORS ret; spoofed URL,
credential ve insecure NODE_ENV ret; secretsiz hata; registered service yanlış mod
ret; valid SDK wiring (fake constructors, sıfır dış ağ); startup/client/worker guard
sırası; staging CORS HTTP preflight (yalnız loopback); secure cookie; production
byte-identical CSP ve staging artifact hedefleri/secret dışlama kontrollerini kapsar.

PATCH 1 HTTP/token/limit; PATCH 2 admission/heartbeat/restart; PATCH 3 quota/replay;
PATCH 5 reconcile/fail-closed; PATCH 6 deterministik kilit yarışları; PATCH 7
ownership/lease/fencing/ambiguous publication grupları yeniden geçti. Gerçek
Supabase REST, R2, Render, FFmpeg ve browser/mobile kabulü yapılmadı. Bunlar sentetik
ve izole test sonuçlarıdır; production kapasite veya gerçek staging kabulü değildir.

## PostgreSQL hazırlığı

[Ayrıntılı şema envanteri](patch-8a-schema-inventory.md) temel tablo/view eksiklerini,
FK/trigger/ACL kontrollerini, 70 repo DDL tanımını ve migration bağımlılıklarını içerir.
`events_media` view dahil tam başlangıç kaynağı halen eksik. Onaylı schema-only
artifact olmadan repo migration'larını boş Supabase'e topluca uygulamak güvenli değil.
Test fixture'ı production şeması kabul edilmedi. Yeni SQL/migration eklenmedi.

## Sonraki kaynak planı ve tahmini maliyet — uygulanmadı

Fiyat kontrol tarihi 30 Ekim 2026; USD/ay, vergi/kur/ek trafik/ek hizmetler hariç.
Hesapların mevcut planı/kredi/free hakkı bilinmiyor. Sayılar teklif veya kapasite
onayı değildir; kurulumdan hemen önce dashboard fiyatı ve bölge teyit edilmeli.

| Kaynak | Plan / tahmin | Ayrı onay ve doğrulama |
|---|---|---|
| Render ayrı staging API | Services/Workers 512 MB tier yaklaşık $7; 1 CPU/2 GB `1c-2g` yaklaşık $25. Kontrollü video smoke için $25 aday, yeterlilik ölçülmedi. Hobby workspace $0 + compute; Pro workspace seçilirse ayrıca $25 | Servis ID, region, plan, bütçe, FFmpeg build/runtime ve secret grupları; üretim env group mirası yok. [Render fiyatları](https://render.com/pricing) |
| Supabase ayrı proje | Free $0 (uygunluk/2 aktif proje/inactivity sınırlarıyla); Pro organizasyon $25'ten, ilk proje dahil, ek proje $10'dan | Ayrı ref/region, şema kaynağı, role/RLS; org/kredi durumuna göre gerçek tutar. [Supabase fiyatları](https://supabase.com/pricing) |
| Ayrı R2 account + iki test bucket | Standard $0.015/GB-ay; Class A $4.50/milyon, B $0.36/milyon; internet egress ücretsiz. 20 GB-ay için free allowance olmadan storage yaklaşık $0.30; uygun 10 GB allowance kalmışsa yaklaşık $0.15 | Yalnız iki test bucket scoped token, ayrı media domain; ops/yuvarlama/diğer hesap kullanımı ayrıca. [R2 fiyatları](https://developers.cloudflare.com/r2/pricing/) |
| Ayrı Pages statik proje | Free static asset hosting için $0 adayı; Functions eklenmez | Build/domain/preview erişim ve hesap limitleri, doğru staging artifact. [Pages fiyatlandırması](https://developers.cloudflare.com/pages/functions/pricing/) |

Örnek bütçe: Render $25 + yeni Supabase Pro org $25 ≈ **$50/ay + R2/ek kullanım**;
Render Pro workspace gerekirse buna $25 eklenir. Mevcut ücretli Supabase org'da ek
proje uygunluğu varsa Render $25 + Supabase $10 ≈ **$35/ay + ek kullanım** olabilir.
Free proje hakkı varsayılmadı. İki worker overlap için ikinci geçici compute ayrıca
bütçelenmeli. Render Postgres gerekmiyor; DB Supabase'de planlanıyor. Bu patch harcama
veya kaynak oluşturmadı, bu rakamlar kaynak açma yetkisi değildir.

8B öncesi önerilen kapılar:

1. Mevcut kaynak varsa gizli olmayan ID/URL/plan/bölge inventory'si ve izolasyon
   kanıtını alın; yoksa yukarıdaki kesin plan ve harcama sınırını onaya sunun.
2. Onaylı schema-only temel kaynak ve katalog/ACL manifest'i sağlansın; fixture
   kullanılmasın. Production export gerekiyorsa ayrıca açık izin alınsın.
3. Ayrı kaynak oluşturma izni sonrası gerçek ref/account/bucket/service ID'leri,
   bağımsız yeni scoped credential metadata'sı ve pin'leriyle manifest gözden geçirilsin.
   Render servisi ilk oluşturulduğunda APP_ENV zaten staging olmalı ve otomatik
   deploy kapalı tutulmalı; registry tamamlanmadan herhangi bir writer açılmamalı.
4. Backend APP_ENV/staging guard ve frontend staging artifact/CSP offline doğrulansın.
   Native FFmpeg paketleme ve test mailbox/Turnstile/Cloudinary kapsamı belirlensin.
5. Staging migration/deployment ayrı somut onayla yapılsın; yalnız sentetik kullanıcı/
   event/medya. Gerçek REST/R2/browser/worker restart ve kapasite testleri sonraki
   aşama olsun. Production'a negatif istek veya destructive reconcile gönderilmesin.

## Rollback

Önce staging build/deploy kullanımını durdurun. Bu patch'i taşıyan tek commit
`git revert <PATCH_8A_COMMIT>` ile geri alınabilir; HEAD `git log -1 --format=%H` ile
bulunur. Temel referans yukarıdaki PATCH 7 commit'idir. Commit revert'i migration,
DB/R2 veya deployment rollback'i değildir; bu patch bunlara işlem yapmadı.

Frontend rollback'te production eski kaynak/CSP'sine dönebilir; eski sürüm staging'de
kullanılmamalı, çünkü unknown host production fallback'ini geri getirir. Staging
backend de guard'sız eski sürümle başlatılmamalı. Aktif deployment gelecekte varsa
önce bütün yazıcı/worker'ları drain edin. Policy/secret değişikliklerini ayrıca
güvenli mekanizmada yönetin; secret'ları Git'e veya chat'e taşımayın. PATCH 1–7
ledger, generation ve cumulative quota korunur; SQL rollback, sayaç reset/drop veya
R2 cleanup bu geri dönüşün parçası değildir. Önceden var olan untracked raporlar
commit'e alınmadı ve silinmedi.

**PATCH 8B için ayrı kullanıcı onayı beklenir.**
