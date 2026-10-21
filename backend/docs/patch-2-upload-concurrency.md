# PATCH 2 — Eşzamanlı upload güvenliği

Başlangıç: `d41eedd`; branch: `security/patch-2-upload-concurrency`.
Production deployment veya production migration yapılmadı. `.env`, frontend,
mevcut kota SQL'i, R2 erişimi ve video worker mimarisi değiştirilmedi.

## Akış ve sınırlar

Token/guest/etkinlik/upload izni doğrulaması (PATCH 1) → HTTP Content-Length
kontrolü → yerel slot → PostgreSQL lease → sınırlı multipart → içerik doğrulama
→ mevcut R2/DB handler → geçici dosya temizliği → lease/yerel slot bırakma.

Bir HTTP isteği, içindeki 15 dosyadan bağımsız olarak **bir slot** kullanır.
Fotoğraf 201, video 202, pending/approved durumları ve 50/200/201 MiB limitleri
korunur. 202 sonrasındaki FFmpeg kuyruğu upload slotu tutmaz; bu işin kaynak
kontrolü mevcut worker'a aittir ve bu patch'te değiştirilmedi.

- Süreç başına sınır: `UPLOAD_MAX_ACTIVE` zorunlu pozitif integer.
- Cluster geneli, etkinlik ve misafir sınırları: ortak DB policy satırında.
- Tüm instance'lar aynı DB/policy kullanmalıdır. Eski PATCH 1 instance'ları
  admission'a katılmaz; karışık sürümle cluster sınırı garanti edilemez.
- Policy veya migration yoksa, DB hatasında veya yerel ayar eksikse **503**;
  kapasite doluysa **429 + Retry-After**. DB hatasında açık geçiş yoktur.
- Retry-After yerel dolulukta 2, DB dolulukta en çok 5 saniyelik yeniden deneme
  önerisidir; o sürede slot açılacağına dair rezervasyon/garanti değildir.
  CORS exposedHeaders'a Retry-After eklendi.

## Atomiklik ve sahiplik

Policy satırındaki FOR UPDATE kilidi, acquire/renew/release için ortak kısa
transaction sınırıdır. Süresi dolmamış lease satırları sayılır; kabul ve insert
aynı transaction'dadır. Ayrı, negatif olabilecek sayaçlar yoktur. İzin kimliği
UUID ve 256-bit rastgele sahiplikten türetilmiş SHA-256 hash birlikte kontrol
edilir. Tekrar release no-op'tur. Yabancı sahip renew/release yapamaz.

DB policy varsayılan lease süresi 90 saniye, heartbeat TTL/3 (30 saniye), RPC
timeout 5 saniyedir. Yüklemenin toplam süresi 90 saniyeyle sınırlı değildir;
sağlıklı uzun işler heartbeat ile uzar. Monotonik yerel son tarih, RPC'nin
başlangıcından ve 5 saniyelik güvenlik payından hesaplanır. Geç heartbeat işi
yeniden canlandıramaz; ilk yenileme hatasında iş kayıp sayılır.

Lease kaybında soket kapatılır ve sonraki dosya/R2/DB adımlarındaki kontroller
işi durdurur. Bağlantının kapanması tek başına slot bırakmaz; devam eden iş ve
cleanup bitmelidir. Acquire beklenirken kopan istemci de işleme alınmaz.
Release hatası availability'yi azaltabilir fakat fazla kabul oluşturmaz;
lease expire olur. Expired satırlar bir sonraki acquire'da silinir. Restart'ta
başka instance'ın canlı lease'leri topluca sıfırlanmaz.

**Sınır:** Sharp veya başlamış bir R2/DB çağrısı anında kesilemez. Lease kaybı
sonrası devam eden çağrı bitince checkpoint/rollback çalışır. Ağ bölünmesi veya
event-loop durması sırasında expired distributed lease, eski çağrının fiziksel
olarak bitmesini kanıtlamaz. Yerel hard cap bu nedenle ayrıca tutulur. Bu model
DB kotası/fencing veya tam dağıtık işlem garantisi vermez; bunlar PATCH 3'ün
tasarımında ayrıca ele alınmalıdır. Takılmış FFmpeg/SDK çağrıları için kaynak ve
zaman aşımı sertleştirmesi hâlâ ayrı bir iştir.

## Limit önerisi ve Render belirsizliği

Depoda Render instance RAM/CPU/disk boyutunu doğrulayan tanım yok. Bu nedenle
runtime'a rastgele bir kapasite varsayılanı konmadı; policy satırı otomatik
eklenmez. Aşağıdakiler **ölçüm öncesi başlangıç adaylarıdır**, kapasite garantisi
veya mevcut Render planının tespiti değildir:

| Kaynak varsayımı | Yerel | Cluster | Event | Guest |
|---|---:|---:|---:|---:|
| Tek 512 MiB instance | 1 | 1 | 1 | 1 |
| İki adet 2 GiB instance; instance başına 2 upload yük testi geçmiş | 2 | 4 | 3 | 1 |

Gerekçe: 40 MP görselin tek RGBA yüzeyi yaklaşık 153 MiB'dir; ek Sharp tamponları,
Node heap'i ve FFmpeg aynı RAM'i paylaşır. Multer disk kullanır; bir request
201 MiB'ye kadar geçici dosya/üstveri alabilir. Dosyalar request içinde sırayla
işlenir. Guest=1, tek istekteki çoklu seçimi engellemeden aynı misafirin paralel
isteklerini sınırlar. İkinci örnekte event=3, dört cluster slotundan birini başka
etkinlikler için ayırma politikasıdır; ölçülmüş performans sayısı değildir.

512 MiB'de tek upload + FFmpeg bile bellek taşmasına yol açabilir. Üretim öncesi
görsel/video karışımında peak RSS, CPU, temp disk ve p95 upload süresi ölçülmeli.
Yerel limit kabaca `min(bellek bütçesi/ölçülen peak ek RSS,
temp disk bütçesi/201 MiB, CPU/ağ yük testinin kaldırdığı sayı)` ile seçilmeli;
Node temel tüketimi, worker ve güvenlik payı bütçeden önce düşülmelidir.

## Migration ve uygulama sırası (bu çalışmada uygulanmadı)

1. Ayrı staging DB'de `database/2026-10-21-upload-admission.sql` uygulanır.
   Yeni iki tablo/üç RPC ekler; mevcut müşteri veya medya tablolarını değiştirmez.
   Migration bir kez çalıştırılmalıdır; ikinci çalıştırma için tasarlanmamıştır.
2. Operatör ölçülen kapasiteye göre tek policy satırını ekler. Örneğin yalnız
   küçük staging başlangıcı için:

```sql
insert into public.upload_admission_policy
  (singleton, global_limit, event_limit, guest_limit, lease_seconds)
values (true, 1, 1, 1, 90);
```

3. Her backend sürecinde staging için `UPLOAD_MAX_ACTIVE=1` ayarlanır.
   Başka bir kapasite seçilirse env ve DB değerleri birlikte değerlendirilir.
4. Upload trafiği kontrollü kesilerek/eski istekler bitirilerek bütün instance'lar
   PATCH 2'ye geçirilir. Eski ve yeni sürümleri karıştırmayın.
5. Gerçek test R2/DB üzerinde 201/202, heartbeat ve büyük dosya yük testi yapılır.
   Bu adımların hiçbirisi production'a otomatik uygulanmadı.

## Kullanıcı deneyimi

Frontend non-2xx yanıtını mevcut hata yoluyla gösterir; seçili dosyalar hata
sonrasında korunur ve gönderme düğmesi yeniden açılır. 429 logout oluşturmaz.
Otomatik retry veya kuyruk yoktur; Retry-After henüz UI'da sayılmaz. Yeni 429
mesajı mevcut rate-limit mesajıyla aynıdır; 503 için var olan "Upload failed."
çeviri anahtarı kullanılır. Yeni dil dosyası veya frontend değişikliği yoktur.

Çok misafirli etkinlikte düşük limitler manuel tekrar gerektirebilir. Bu patch
normal isteğin 15 dosyasını 15 slot saymaz fakat kapasite dışındaki isteği erken
reddeder. Sokette bekleyen sınırsız sunucu kuyruğu tercih edilmedi. Staging'de
429 oranı yüksekse, yalnız kesin admission reddi alan 429'lara istemci tarafında
bounded Retry-After + jitter kuyruğu eklenmesi değerlendirilmelidir. Belirsiz
ağ hatalarında otomatik retry, idempotency bulunmadığı için kopya üretebilir.

## Test komutları

```powershell
node --test backend/tests/uploadSecurity.test.js backend/tests/uploadAdmission.test.js
$env:PATCH2_PG_BIN='C:\Program Files\PostgreSQL\17\bin'
node --test backend/tests/uploadAdmission.postgres.test.js
```

PG testi kendi initdb dizinini, boş cluster'ını ve loopback ephemeral portunu
oluşturur; ortamın PG bağlantı değişkenlerini atar. Migration yalnız bu geçici
cluster'a uygulanır. Test sonunda cluster durdurulur ve test dizini kaldırılır.
Windows sandbox restricted-token hatası nedeniyle bu testin sandbox dışında
çalışması gerekebilir. PostgreSQL yolu verilmezse test açıkça skipped raporlar.

PATCH 1 testleri değişmeden kalan davranışı sınar; yalnız yeni admission dış
sınırı fake ile sağlanır. Ayrı PG/HTTP testleri gerçek admission servisini,
SQL fonksiyonlarını ve multipart disk cleanup yaşam döngüsünü sınar. Fotoğraf/
video R2 ve FFmpeg testleri PATCH 1'deki gibi sahtedir; gerçek R2 kullanılmaz.

PG testleri: guest/event/global/local doluluğu; farklı etkinlik ve misafirler;
iki servis nesnesi ve iki ayrı Node süreciyle atomik yarış; ownership/idempotent
release; expiry; heartbeat; öldürülen Node sürecinden sonra yeni instance;
release hatası; anon/authenticated yetkileri; HTTP 201/202/429/401/500/abort ve
temizlik. Expiry DB zamanı koşulu test cluster'ında geçmişe çekilerek hızlandırılır.
Heartbeat testinde istemciye dönen TTL kısaltılır; gerçek DB renew RPC'si çalışır.

Birim testleri: eksik yerel config, asılı acquire timeout, geç heartbeat,
acquire/iş sırasında disconnect ve cleanup bitmeden slot bırakılmaması.

### Sonuç — 21 Ekim 2026

Üç test dosyası `--test-concurrency=1` ile birlikte çalıştırıldı:
**43 passed, 0 failed, 0 skipped**, yaklaşık 60,8 saniye. Bunun 27'si PATCH 1
regresyonu, 5'i admission birim testi, 11'i PG üst testi ve alt senaryolarıdır.
SQL gerçekten geçici PostgreSQL 17 cluster'ında yürütüldü; iki ayrı Node süreci
gerçek ayrı bağlantılarla aynı global sınıra uydu. Node süreci gerçekten
öldürüldü; DB expiry koşulu yalnız test verisinde hızlandırıldı.

İlk sandbox denemesi initdb restricted-token hatasıyla çalışmadı; izole test
sandbox dışında başarıyla çalıştırıldı. İlk kısa heartbeat testi psql süreç
açılışı için 150 ms timeout seçildiğinden başarısız oldu; test TTL/timeout
oranları düzeltilerek tekrar çalıştırıldı. Production TTL/timeout bu nedenle
değiştirilmedi. Son koşuda başarısız/atlanmış test yoktur.

Eksik doğrulamalar: gerçek Render kaynaklarıyla capacity/RSS/CPU ölçümü,
Supabase REST üzerinden RPC ve gerçek test R2/FFmpeg/tarayıcı entegrasyonu.
Bu nedenle bu patch otomatik production onayı değildir. Deploy öncesinde
migration, policy ve UPLOAD_MAX_ACTIVE birlikte hazırlanmalıdır; hazırlıksız
deploy bütün medya upload'larında kontrollü 503 üretir.

## Rollback ve sonraki aşama

PATCH 2 ayrı commit olarak saklanır. Backend'i `d41eedd` artifact'ına döndürmek
yeterlidir; ek tablolar/RPC'ler yerinde bırakılabilir. Önce upload kabulünü durdurup
aktif işleri bitirin. Yeni tabloları canlı işler varken silmeyin; rollback için
silmek zorunlu değildir. Sonraki commit'ler yoksa PATCH 2 commit'i git revert ile
geri alınabilir. Önceki PATCH 1 commit'i değiştirilmedi.

PATCH 3 henüz başlamadı. Admission lease ile byte rezervasyonu farklı kavramlar
olarak korunmalı; lease expiry kabul edilmiş videonun kümülatif kotasını geri
vermemeli. Kota kontrolü hâlâ eski akıştadır; PATCH 2 atomik kota çözümü değildir.
`r2Reconcile.js --apply` riski devam ediyor; script değiştirilmedi/çalıştırılmadı.
