# PATCH 8B — Staging Infrastructure & Database Bootstrap Preparation

Tarih: 30 Ekim 2026. İncelenen temel HEAD:
`66081da0dd85c0a124b7a10b15a7efb7b235cbe7` (PATCH 8A).
Hazırlık branch'i: `docs/patch-8b-staging-bootstrap-preparation`.

**Hazırlık tamamlandı; gerçek staging kurulmadı. Production NO-GO devam ediyor.**
Uygulama/frontend/SQL/test kodu, production config ve PATCH 8A manifest'i değişmedi.
Yalnız bu rehber, database bootstrap hazırlık belgesi ve boş env örneği oluşturuldu.
Yeni kaynak/hesap bağlantısı/deployment/ücretli hizmet yok; canlı/staging migration,
production export veya R2 object isteği yok. `.env` açılmadı; gerçek müşteri verisi
kullanılmadı. Önceden var olan PATCH 4/8 untracked raporları korundu. PATCH 9'a geçilmedi.

## 1. PATCH 8A incelemesi ve yeni regresyon sonucu

| Kontrol | Kaynak ve bu oturumun sonucu |
|---|---|
| Ortak frontend API seçimi | config.js + runtime-target.js; auth/register/detail/gallery/upload ortak config kullanıyor |
| Staging hedefi eksik/yanlış | Build/config hata verir; unknown host'ta production fallback yok |
| Frontend production korunması | Bilinen production origin'leri aynı API'yi seçer; localhost/file geliştirme davranışı korunur |
| CSP/CORS | Production _headers değişmez; staging artifact connect/img/media hedeflerini değiştirir; backend yalnız staging origin kümesini alır |
| Supabase/R2 | Project ref/account/bucket/HTTPS endpoint ayrılığı ve credential pin'leri istemci yaratılmadan kontrol edilir |
| Backend/worker sırası | index.js dotenv sonrası guard; direct Supabase/R2 client ve worker getWorker guard'ları mevcut |
| Cookie/HTTPS | Staging APP_ENV=staging + NODE_ENV=production gerektirir; mevcut cookie/HSTS semantiği değişmez |
| Mevcut güvenilen manifest | staging:null ve gerçek production DB/R2 kimlikleri boş: staging hâlâ fail-closed |

Yeniden çalıştırılan komut:

```powershell
$env:PATCH2_PG_BIN='C:\Program Files\PostgreSQL\17\bin'
$env:PATCH3_QUOTA_TESTS='1'
$env:PATCH5_R2_TESTS='1'
node --test --test-concurrency=1 backend/tests/uploadAdmission.postgres.test.js backend/tests/uploadAdmission.test.js backend/tests/uploadSecurity.test.js backend/tests/r2Reconcile.test.js backend/tests/videoWorkerSafety.test.js backend/tests/stagingIsolation.test.js
```

**146 TAP kaydı, 146 pass, 0 fail/skipped/cancelled, 151,1 saniye, exit 0.**
128 PATCH 1–7 kaydı + 18 PATCH 8A testi; iki üst kayıt sayılır, 144 yaprak testtir.
Bu yeni koşudur; eski rapordaki 146 tekrar kullanılıp başarı sayılmadı. SQL yalnız
mevcut launcher'ın kendi boş disposable PG 17 cluster'ında fixture olarak çalıştı;
mevcut/staging/production DB'ye migration uygulanmadı. R2, render/transcode ve SDK
bağımlılıkları fake; HTTP preflight yalnız loopback. Gerçek hesap/bucket/REST/
Render/FFmpeg/browser/mobile entegrasyonları bu aşamada **çalıştırılmadı**.

Yeni belgelerin yerel linkleri ve env örneği ayrıca kontrol edildi: credential/hedef
alanları boş, örnek staging guard tarafından reddediliyor; istemci oluşturulmadı.
PATCH 8A'ya göre uygulama/config/frontend/SQL/test tracked farkı sıfır.

## 2. Öncelikli engel: temel PostgreSQL şeması

[Ayrıntılı bootstrap belgesi](patch-8b-database-bootstrap-preparation.md) tablo
matrisini, eksik kaynakları, arşiv/Git araştırmasını, trigger/FK/RLS/RPC gereksinimlerini,
snapshot seviyesine göre migration sırasını ve onaylı schema-only edinme prosedürünü
verir. [PATCH 8A envanterindeki](patch-8a-schema-inventory.md) 70 DDL kaynak kaydı korunur.

Çalışma ağacı, 34 erişilebilir tarihî SQL blob'u ve üç eski ZIP incelendi; temel
`users/event/event_settings/event_guests/media/media_likes/packet_level/media_type/
event_invitations/email_verification_tokens` CREATE tanımları ve `events_media`
view kaynağı bulunamadı. Tarihî feedback DDL'si bulundu; güncel bağımlılık değil.
Arşivler açılıp workspace'e geri yüklenmedi ve içlerindeki .env/veriler okunmadı.

Boş staging DB'ye migration klasörünü glob ile uygulamak veya fixture'ı temel şema
kabul etmek çözüm değildir. Kaynak bulunmadan yeni ücretli kaynak açılması önerilmez.
Mevcut onaylı schema-only artifact istenmeli; yoksa production metadata/export için
ayrı açık onay alınmalı. Veri taşınmaz, DDL tahmin edilmez. Tam güncel snapshot zaten
PATCH 2/3/7 nesnelerini içeriyorsa tekrar replay yapılmaz; pre-PATCH-2 baseline için
ön koşullar sonrası **PATCH 2 → PATCH 3 → PATCH 6 → PATCH 7** sırası korunur.

## 3. Güncel plan/fiyat karşılaştırması

30 Ekim 2026 tarihinde resmî sayfalar kontrol edildi. USD/ay; vergi, kur, domain,
mail/Turnstile ek planları ve kullanım aşımı dahil değil. Hesap uygunluğu/indirimler
bilinmiyor. Tahminler harcama yetkisi veya performans garantisi değildir.

| Hizmet | Doğrulanan liste bilgisi | Kapalı/boşken |
|---|---|---|
| Render | Hobby workspace $0 + compute; Pro workspace $25 + compute. Web service 512 MB yaklaşık $7; 1 CPU/2 GB 1c-2g $25; 2 CPU/4 GB $85. Free 512 MB seçeneği sınırlı | Uygulamaya trafik gelmemesi ücretli compute'u durdurmaz. Suspend/turn-off ile çalışan compute süresi durur; workspace/disk/önceki build/traffic ücretleri ayrı |
| Supabase | Free $0; 2 aktif proje ve inactivity sınırı. Pro org $25; $10 compute credit. Micro $0.01344/saat (~$10/ay), ek proje kredi tüketimine göre ücretlenir | Paid proje normal pause akışıyla durdurulamaz; idle DB compute ve org aboneliği sürer. Free pause için uygunluk gerekir |
| R2 Standard | $0.015/GB-ay; Class A $4.50/milyon, B $0.36/milyon; internet egress ücretsiz. Uygun free allowance: 10 GB-ay/1M A/10M B | Backend kapalı olsa da saklanan nesneler ücret üretir; istek yoksa yeni request maliyeti yok. Billing unit yuvarlaması uygulanır |
| Pages static | Free static asset istekleri ücretsiz; Functions kullanılmayacak | Frontend açık kalabilir; Free limitleri ve isteğe bağlı Access/domain planları ayrıca |

Kaynaklar: [Render pricing](https://render.com/pricing),
[Render billing FAQ](https://render.com/docs/faq),
[Supabase pricing](https://supabase.com/pricing),
[Supabase compute](https://supabase.com/docs/guides/platform/manage-your-usage/compute),
[R2 pricing](https://developers.cloudflare.com/r2/pricing/),
[Pages pricing](https://developers.cloudflare.com/pages/functions/pricing/).

Önemli ayrım: Supabase billing belgelerinde paused compute'un ücretlenmediği yazsa
da [güncel pausing rehberi](https://supabase.com/docs/guides/platform/free-project-pausing)
paid projelerin pause edilemediğini söyler. Bu yüzden ücretli staging DB'yi her test
sonunda pause ederek maliyeti sıfırlama planı yapılmadı. Free org'a transfer veya
proje silme ayrı risk/onay ve yeniden kurulum işidir; otomasyon önerilmiyor.

| Senaryo | Yaklaşık aylık toplam | Test kapsamına etkisi |
|---|---|---|
| A — minimum | Render Free + uygun Supabase Free + Pages Free: $0 sabit + R2/kullanım. İsteğe bağlı paid 512 MB Render ile yaklaşık $7 + kullanım | Küçük auth/fotoğraf/browser smoke; free RAM/CPU, cold-start ve DB inactivity nedeniyle kapasite/uzun video/worker sürekliliği kabulü için uygun kanıt sağlamaz |
| B — gerçekçi performans adayı | Tek Render 1c-2g $25 + ayrı Supabase Pro org $25 = $50 + kullanım. Render 2c-4g gerekirse $110 + kullanım. Mevcut paid org'da ek Micro uygunsa incremental yaklaşık $35 veya $95 + kullanım | Ölçümlü video+upload/RSS/temp/latency testleri; RAM yeterliliği henüz bilinmiyor. İkinci overlap process'i ayrıca compute gerektirir |
| C — aç/kapat test | Render 1c-2g için 100 aktif saat/730 saat varsayımıyla ~$3.42; ayrı Pro DB org açık tutulursa toplam ~$28.42 + kullanım. Uygun Free DB ile ~$3.42 + kullanım adayı | Yeniden başlatma/bootstrap ve warm-up maliyeti; test dışı worker/queue işlemeye devam edemez. Paid DB bedeli test saatiyle sınırlı değildir |

C hesabı planlama yaklaşımıdır; Render saniyelik gerçek aktif süre/fatura dönemiyle
hesaplar. Pro workspace istenirse bu toplamlara ayrıca $25 eklenebilir. Proje/servis
mevcutken sadece kullanılmaması aboneliğin kalktığı anlamına gelmez. Render diski
veya yeni DB eklentisi planlanmadı. R2 20 GB-ay storage örneği allowance yoksa ~$0.30,
10 GB allowance kullanılabiliyorsa ~$0.15; operations ayrıca ve yuvarlamalıdır.
Saklanan sentetik veriyi silmek bile ayrı işlem onayı gerektirir; bu patch cleanup
kurmadı. Domain, email provider, Access seat ve ek build/traffic bütçesi seçilen
hesaplara göre kurulum öncesi netleştirilmeli.

Free Render 15 dakika inbound trafik olmayınca uyuyabilir; background queue/poll
bunu güvenilir bir sürekli-worker platformuna çevirmez. [Render free limits](https://render.com/docs/free).
Pages Free için 500 build/ay ve tek asset 25 MiB sınırı dikkate alınır; frontend'de
bu boyutu aşan dosya bulunmadı. Medya R2'de tutulur. [Pages limits](https://developers.cloudflare.com/pages/platform/limits/).

## 4. Sıralı kurulum rehberi — tamamı sonraki ayrı onaya bağlı

### Aşama 0 — yerel karar ve şema kapısı

Platform: önce IDE/güvenli belge alanı. Kaynak oluşturulmaz. İlk somut işlem,
mevcut onaylı schema-only temel kaynak ve owner/ACL manifest'inin yerini belirlemek.
Yoksa database belgesindeki sınırlı salt okunur edinme prosedürü için ayrıca izin
verilmeli. Secret veya gerçek müşteri yedeği chat'e yapıştırılmaz. Başarı kanıtı:
verisiz artifact/hash, patch seviyesi, tam nesne listesi ve eksiklerin kapatılması.
İzolasyon: hiç production endpoint'e bağlanmadan artifact review. Bu noktada şema
review/bağımlılık planı için yeniden yardım istenmeli; kaynak satın alma henüz gerekmez.

### Aşama 1 — kaynak/region/bütçe kararı

Platformlar: sağlayıcı dashboard'larının salt okunur inventory/billing bölümleri,
yalnız ayrıca onaylı hesap erişimiyle. Mevcut izole kaynak varsa kimlikleri doğrulanır;
yoksa kesin plan, region, aylık ve test süresi bütçesi seçilir. DB/backend yakın bölge,
R2 jurisdiction ve veri yerleşimi bilinçli seçilmeli; mevcut region varsayılmaz.
Başarı kanıtı production/staging project/account/bucket/service/origin eşleşme
matrisidir. İsimde staging yazması kanıt sayılmaz. Sonraki kaynak oluşturma, DB restore/
migration ve deployment işlemleri için ayrı somut izin gereklidir; bu rapor izin değildir.

### Aşama 2 — Supabase ayrı proje ve schema bootstrap

Platform: Supabase Dashboard → yeni ve production'dan farklı proje; tercihen ayrı
org/erişim sınırı, seçilmiş plan/region. Production clone/restore/data copy veya
otomatik production branch entegrasyonu kullanılmaz. Yeni DB parolası ve yeni
service-role credential yalnız sağlayıcı secret alanında saklanır. APP backend'i
henüz başlatılmaz. `SUPABASE_URL` ve project ref eşleşmesi, stage/prod ref ayrılığı,
credential metadata/pin kaynağı doğrulanır; credential'ın env adı kanıt değildir.

Database belgesinin checklist'i ve snapshot-level delta planı onaylandıktan sonra
ayrı restore/migration izniyle uygulama şeması hazırlanabilir. Bu aşamada yapılmadı.
RLS/RPC grants, function owner/security/search_path, FK/trigger/index ve PostgREST
cache kontrol edilir. Yalnız gözden geçirilmiş sentetik user/event/guest ve image/
video/package katalogları hazırlanır. Admission policy için ilk smoke adayı global/
event/guest 1, TTL 90 ve process local 1'dir; ölçülmüş production capacity değildir.
Başarı: beklenen katalog ve anon/authenticated ret/service_role erişim kanıtı;
health 200 veya tabloların görünmesi tek başına yetmez. Şema uygulanmadan önce ve
ilk synthetic seed testinden önce tekrar yardım/onay istenmeli.

### Aşama 3 — R2 izole account, iki test bucket ve media URL

Platform: Cloudflare → PATCH 8A'nın istediği **farklı account**. Onay sonrası iki
Standard test bucket oluşturulur: originals ve display rolleri; adları burada
uydurulmadı. Production bucket eklenmez/taşınmaz. İki bucket aynı seçilmiş
jurisdiction'ı kullanmalı; backend tek canonical S3 endpoint kullanır.

Account API token oluştururken Object Read & Write yalnız bu iki bucket'a scoped
olmalı; Admin/all-buckets yetkisi verilmez. Bu izin nesne silme yetkisini de kapsayabilir;
DELETE yapılacağı anlamına gelmez. Credential metadata'sının scope'u dashboard'dan
kanıtlanır, sonra Access Key ID/Secret Access Key güvenli secret alanına taşınır.
Yanlış credential'ı production bucket'a istek göndererek denemek yasaktır.
[R2 token scope](https://developers.cloudflare.com/r2/api/tokens/).

Originals private kalır. Display için ayrı HTTPS media origin'i seçilir. Test
account'ında kontrol edilen custom domain/zone ilişkisi doğrulanır; production DNS'i
izinsiz değiştirilmez. `r2.dev` küçük development smoke için mümkün ama rate-limited,
performance kabulü için custom domain gerekir. Domain kayıt bedeli bu tahminlerde
yok. [R2 public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/).

`R2_ACCOUNT_ID`, optional canonical `R2_S3_ENDPOINT`/`R2_JURISDICTION`,
`R2_ORIGINAL_BUCKET`, `R2_DISPLAY_BUCKET`, `R2_DISPLAY_PUBLIC_BASE_URL` ve iki
credential ayarlanır. Tarayıcı upload'ı Render'a gider; originals için wildcard
browser PUT CORS açılmaz. Display CORS gerekiyorsa yalnız onaylı staging frontend'e
GET/HEAD ve gerekli Range/response header erişimiyle sınırlanır. Testte yalnız run
UUID prefix'li sentetik nesneler kullanılır. PATCH 5/7 job/reservation/attempt
koruması korunur; destructive reconcile, lifecycle delete veya cleanup cron yok.
Kimlik/scope/media origin'i hazır olduğunda manifest review için yardım istenmeli;
gerçek PUT/GET smoke ayrıca test izni gerektirir ve bu aşamada çalıştırılmadı.

### Aşama 4 — Render staging backend

Platform: Render Dashboard → ayrı Web Service. Root directory `backend`, bağlı
branch/commit açıkça seçilir; production branch/deploy hook/env group bağlanmaz.
Auto-deploy kapatılır. Servis yaratma ilk build'i tetikleyebilir; APP_ENV başlangıçtan
staging olmalı. Manifest/kimlik/şema tamamlanmadan guard'ın reddetmesi beklenir;
ilk yeşil deploy uğruna guard kaldırılmaz veya production secret kopyalanmaz.
Oluşan platform `RENDER_SERVICE_ID` manifest'e review ile alınır; bu env elle taklit
edilmez. `PORT` da Render tarafından sağlanır.

| Ayar | Hazırlanan seçim |
|---|---|
| Runtime | Öncelikli aday native Node; reproducible codec/OS gerekirse ayrı Docker hazırlığı/onayı |
| Node | Yerel test v22.15.0. Resmî Node 22 arşivinde görülen 22.23.4 staging adayı; NODE_VERSION ile pin'lenmeli ve bu sürümde/Linux'ta regresyon tekrar edilmeli; burada kurulu/test edilmiş değil |
| Build command | `npm ci --omit=dev && ffmpeg -version && ffprobe -version` |
| Start command | `npm start` (mevcut `node index.js`) |
| Pre-deploy migration | Boş; startup/build içine migration konulmaz |
| Health path | `/api/health`; HTTP liveness, DB/R2/FFmpeg readiness kanıtı değil |
| İlk concurrency | Tek instance/process, UPLOAD_MAX_ACTIVE=1 smoke adayı; global/event/guest limit DB policy'de |
| Worker | HTTP listen sonrası otomatik başlar; mevcut VIDEO_QUEUE_POLL_MS default 3000. Worker disable env'si veya ayrı global-worker-cap varmış gibi davranılmaz |
| Storage | Ephemeral temp; deploy/restart dosyaları kaybettirebilir; quota/admission disk garantisi değildir |

[Render Node seçimi](https://render.com/docs/node-version),
[Node 22 arşivi](https://nodejs.org/en/download/archive/v22),
[Render native runtime](https://render.com/docs/native-runtimes) güncel kaynaklardır.
Runtime belgesi FFmpeg'i build ve runtime'da mevcut listeliyor; eski rapordaki
platform belirsizliği bu belgeyle kısmen giderildi. Gerçek servis sürüm/path,
ffprobe varlığı ve libx264/AAC encode yetenekleri hâlâ smoke ile doğrulanmalı.
Eksikse native build'de sudo/apt-get'in kullanılabileceği varsayılmaz; ayrı Docker
seçeneğinde Node Debian image + ffmpeg paketi + lockfile npm ci ile runtime'a
kurulum planlanır, image digest/codec sürümü pin'lenir. Bu patch Dockerfile/image,
paket kurulum veya build çalıştırmadı. Build kontrolü runtime kontrolünün yerine geçmez.

Secret/env group bağlantısı olmamalı; yalnız staging değerleri service-scoped secret
alanına konulmalı. ENV listesi aşağıdadır. Şema/registry hazır olduktan sonra ayrıca
onaylı deploy açılır. Guard geçse bile `/api/health` 200 + worker log + DB RPC + test
object + synthetic video hazır-media kabulü ayrı kanıtlardır. Worker-start/loop hatası
varken health başarılı olabilir. Başarı ölçütü sadece yeşil Render etiketi değildir.

İlk smoke tek process; sonra onaylı ikinci staging process/instance ile overlap,
heartbeat, takeover ve stale publication testi. İkinci service ID de manifest'e
önceden alınır. Bütün process'ler aynı PATCH 8A/PATCH 7 sürümünde olmalı; eski worker
örtüşmesi yok. CPU/RSS (FFmpeg child dahil), temp peak, p95 upload/ready süreleri,
RPC/lock, heartbeat ve backlog ölçülür. [Render deploys](https://render.com/docs/deploys).
Kaynak yaratmadan önce plan review, secrets/manifest'ten sonra offline review,
manuel deploy'dan önce tekrar yardım/onay istenmeli.

### Aşama 5 — Pages ayrı staging frontend

Platform: Cloudflare Workers & Pages → ayrı proje. Root build context repo root,
komut `node scripts/build-frontend.cjs staging`, output `artifacts/staging-frontend`.
Her build yeni/temiz output ister; eski artifact üstüne yazılmaz. Sabit onaylı
staging origin'i tercih edilir; hash preview wildcard'ı otomatik kabul edilmez.
Henüz bilinmeyen project URL'si elde edilmeden gerçek deploy yapılmaz. Manifest'te
frontend/api/media HTTPS origin'leri ve production ayrılığı review edilir.

Bu builder shell env STAGING_API_URL'yi okuyup otomatik hedef seçmez; versioned
backend/config/deployment-targets.json public subset'ini üretir. Plain frontend
klasörü staging'e doğrudan yüklenmez. Pages'a backend service-role/R2/JWT secret'ı
konulmaz. Build config/CSP hata veriyorsa deploy edilmez; production artifact ile
yedekleme yapılmaz. Production `_headers` aynı kalır; generated staging headers'ta
production API/media yoktur. Login/register/gallery/detail/upload common config
kullanımı Network tab'da sentetik akışla doğrulanır. Bu browser testi henüz yapılmadı.

Preview deploy'lar varsayılan public olabilir. Access preview toggle'ı root pages.dev
ve custom domain'i kendiliğinden korumaz; gereken her hostname için politika
ayrıca doğrulanmalı. [Pages preview Access](https://developers.cloudflare.com/pages/configuration/preview-deployments/).
Backend allowlist CORS_ORIGINS/FRONTEND_URL, Turnstile hostname'i ve public media
CORS aynı frontend origin'iyle eşleşmeli. TURNSTILE_SITE_KEY public, SECRET_KEY
yalnız backend secret alanında ve pin'li olmalı; gerçek widget kullanımı ayrı izinle
hazırlanmalı. İlk smoke'da explicit false seçimi challenge testini kapsam dışı bırakır.

HTTPS ve mevcut Secure/HttpOnly/SameSite=None cookie korunur. pages.dev ↔ onrender.com
farklı siteler olduğundan tarayıcı third-party-cookie politikası ayrıca test edilmeli;
CORS doğru diye cookie her cihazda çalışacak denemez. Kontrol edilen ortak bir test
domain'i altındaki frontend/API host'ları bir alternatif; DNS değişimi ayrıca
onaylanır, auth mimarisi değiştirilmez. Preflight Idempotency-Key/X-Guest-Token/
Authorization ve exposed Retry-After, cookie/CSRF ve mobil browser kabulü yapılmalı.
Pages proje/origin review ve ilk synthetic login/upload öncesi tekrar yardım istenmeli.

## 5. Env ve güvenilen manifest kontrolü

[Boş örnek](examples/staging.env.example) yalnız isim ve güvenli smoke adaylarını
gösterir; çalışır env değildir. Tracked örnek doldurulmaz/backend .env'ye yüklenmez;
gerçek secret'lar sağlayıcı secret alanında kalır.

| Grup | Değişkenler / ayrıca gerekenler |
|---|---|
| Ortam | APP_ENV, NODE_ENV, NODE_VERSION; platformdan RENDER_SERVICE_ID/PORT |
| Supabase | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY; ayrı project ref, owner/ACL/counter/schema inventory |
| R2 | R2_ACCOUNT_ID, R2_S3_ENDPOINT, R2_JURISDICTION, R2_ORIGINAL_BUCKET, R2_DISPLAY_BUCKET, R2_DISPLAY_PUBLIC_BASE_URL, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY |
| Auth | JWT_SECRET, GUEST_JWT_SECRET, JWT_EXPIRES_IN; yeni yüksek entropili staging secret'ları |
| Frontend/CORS | FRONTEND_URL, CORS_ORIGINS; manifest staging frontend/api/media origin'leri |
| Kapasite/video | UPLOAD_MAX_ACTIVE, VIDEO_QUEUE_POLL_MS, FFMPEG_PATH, FFPROBE_PATH; DB singleton policy env değildir |
| E-posta | RESEND_API_KEY, EMAIL_FROM, EMAIL_LOGO_URL; test mailbox ve staging link/logo, gerçek alıcı yok |
| Challenge | TURNSTILE_ENABLED, TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY, TURNSTILE_ALLOWED_HOSTNAMES |
| Legacy media | Gerekliyse CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_AUTH_TOKEN_KEY; ayrı test hesabı |
| Cleanup metadata | R2_RECONCILE_MIN_AGE_HOURS; gerçek --apply veya cleanup scheduler yetkisi vermez |

Manifest'in production kimlikleri ve staging alanları şu an boş. Gerçek ve farklı
Supabase refs, R2 account/bucket'ları, Render service registry ve HTTPS origin'leri
bağımsız metadata ile doğrulanmalı. Staging credentialSha256 pin'leri yalnız
staging'e ait olduğu kanıtlı credential'lardan güvenli süreçte hesaplanmalı; değerler
chat/log/CLI argümanına yazılmamalı. Pin, provider scope kanıtının yerine geçmez.

İzolasyon kabul sırası: source identity/scope proof → trusted manifest review →
local wrong-config tests → guarded build/start → onaylı staging-only real smoke.
Production hedefini deneyerek negatif test yok. APP_ENV eksik ama kayıtlı staging
Render ID biliniyorsa guard reddeder. Henüz registry'ye alınmamış bir servisin yanlış
etiketlendiğini yazılım kendiliğinden bilemez; başlangıçtan açık mod ve review şart.
Production env group inherit, prod token/secret paylaşımı, prod origin wildcard'ı ve
prod DB/R2'ye istek yasağı geçerlidir. Email/Cloudinary/challenge hesap scope'ları da
ayrıca kanıtlanmalı; örnek boş bırakılmış olmaları çalışan test kapsamı sağlamaz.

## 6. Eksik erişimler, onaylar ve ilk işlem

Bu oturum sağlayıcı hesaplarına bağlanmadı. Mevcut staging kaynaklarının var/yok
olduğu teyit edilmedi. Şunlar doğrulanmış olarak elimizde yok: schema-only temel
artifact/patch state, Supabase ref ve credential metadata'sı, ayrı R2 account/bucket/
scope/domain, Render service ID/plan/region/env-group envanteri, Pages origin ve
Access/Turnstile/mail test erişimleri. Secret değerlerinin chat'te paylaşılması
istenmiyor; yalnız gizli olmayan ID/URL ve güvenli sağlayıcı bağlantısı kullanılmalı.

İlk somut işlem **mevcut güvenilir schema-only temel kaynağın yerini belirlemek**.
Kaynak yoksa database belgesindeki sınırlandırılmış metadata/export prosedürü için
ayrı açık onay gerekir. Bundan önce kaynak yaratmak veya staging'e SQL uygulamak
önerilmez. Sonra kesin A/B/C bütçesi/region ve resource-create onayı; şema restore/
migration onayı; deploy onayı; gerçek sentetik servis testi izni ayrı verilmelidir.
Bu hazırlık raporu bu onayları kapsamaz.

## 7. Teslimat ve geri dönüş

Yalnız üç yeni dosya: bu rapor, database-bootstrap-preparation.md ve
examples/staging.env.example. Ayrı commit bu branch'te kaydedilir; kendi hash'i
son teslim mesajında verilir. PATCH 8A ve production dosyaları değişmedi.
Rollback gerekirse bu dokümantasyon commit'i `git revert <PATCH_8B_COMMIT>` ile
geri alınabilir; DB/R2/Render/Pages işlemi veya env rollback'i gerektirmez.
Başlangıç referansı PATCH 8A commit'idir. PATCH 4/8 untracked raporları commit'e
katılmaz. Gerçek kaynak kurulumuna veya PATCH 9'a devam edilmez; kullanıcı onayı beklenir.
