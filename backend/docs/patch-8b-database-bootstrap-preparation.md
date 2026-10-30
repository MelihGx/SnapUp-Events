# PATCH 8B — Database bootstrap hazırlığı

Tarih: 30 Ekim 2026. Kaynak: PATCH 8A `66081da0dd85c0a124b7a10b15a7efb7b235cbe7`.
Bu belge çalıştırılmış kurulum değildir. Production bağlantısı/export, staging
migration veya veri kopyası yapılmadı. Eksik DDL tahmin edilerek oluşturulmadı.

## Araştırma sonucu ve engel

Çalışma ağacındaki SQL/schema/init/backup/Supabase adayları, README, erişilebilir
Git geçmişindeki 34 SQL blob'u ve üç yerel ZIP arşivinin dizin/SQL kayıtları incelendi.
`orijinal-backend.zip` 10.059 kayıt içinde 29 metadata/şema adayı içeriyor; bunlar
eski ek migration'lar ve supabaseClient dosyası. `orijinal-frontend.zip` (157 kayıt)
ve `frontend.zip` (168 kayıt) temel şema kaynağı sağlamıyor. Arşivler çıkarılmadı;
.env, credential dosyası veya müşteri veri kayıtları okunmadı. SQL'de yalnız DDL
kaynakları arandı. Çalışma ağacında init/seed/complete schema dump, Supabase
config.toml/migrations kurulumu veya tam CREATE VIEW/temel tablo kaynağı bulunamadı.
Repo dışındaki olası yedeklerin varlığı hakkında çıkarım yapılmıyor.

Git geçmişinde artık bulunmayan `2026-08-13-feedback.sql` bulundu (eklenme commit'i
`e62c812c1a8b87f7861305ae4d0c4b696b3e529d`). `feedback` tablosu ve indeksleri tarihî
özelliğe ait; mevcut backend bağımlılığı değil. Otomatik geri getirilmeyecek.

**ENGEL: Tam ve onaylı temel şema hâlâ yok.** Boş staging DB kurulumu bu kaynaklarla
bütün uygulama için tamamlanmış sayılamaz. Önce mevcut schema-only artifact bulunmalı
veya ayrı, açık production metadata/export izni alınmalıdır. Yeni kaynak satın almak
bu eksikliği çözmez. Test fixture'ı gerçek uygulama şeması yerine kullanılamaz.

## Tablo/view matrisi

| Nesne | Tam temel CREATE kaynağı | Ek/bağımlılık ve kabul |
|---|---|---|
| users | Eksik | Auth, token_version, active/verified/role/country, reset/verification ilişkileri; tip/default/PK/FK/ACL gerekli |
| event | Eksik | users ve packet_level ilişkisi; code/slug/type/package/location, cumulative storage/override/admin suspension, cover alanları |
| event_settings | Eksik | event bağımlılığı; moderation/gallery/upload/storage limit; nihai guest-limit sürümü |
| event_guests | Eksik | event/users bağımlılığı; guest token/name/owner bilgisi; event+normalized-name unique |
| media | Eksik | event/guest/media_type ilişkileri; status/bytes/message; Cloudinary ve R2 original/display/poster/provider/video kolonları |
| media_likes | Eksik | media ilişkisi, media+like-key unique; gerçek FK ve cascade bilinmiyor |
| packet_level | Eksik | Event paket/kota ilişki ve sentetik katalog seed sözleşmesi gerekli |
| media_type | Eksik | Image/video lookup ve gerçek ID tipleri; gözden geçirilmiş sentetik seed gerekli |
| event_invitations | Eksik | Account/event silme fonksiyonlarının bağımlılığı |
| email_verification_tokens | Eksik | users ilişkisi, token hash/expiry/revoke alanları; email-verification-security.sql yalnız ALTER/trigger sağlar |
| events_media (view) | Eksik | media/event/type/guest projection; galeri/slideshow/admin kullanımı; owner/security/grant tanımı gerekli |
| password_reset_tokens | password-reset.sql | users FK CASCADE; pgcrypto talebi, hash unique ve active/user indeksleri |
| cloudinary_cleanup_outbox | 2026-08-07-security-hardening.sql | Account silme RPC outbox bağımlılığı |
| event_slideshow_settings | 2026-08-09-live-slideshow.sql | event CASCADE, selected_media/user SET NULL; selected-media indeksi |
| admin_audit_logs | 2026-09-24-admin-audit-logs.sql | admin user SET NULL; created/admin/category indeksleri |
| video_processing_jobs | 2026-10-05-video-background-processing.sql | event/guest CASCADE, media SET NULL; status-created/event/guest-active ve key unique |
| upload_admission_policy | PATCH 2 SQL | Singleton/global/event/guest/TTL kısıtları; schema-only çıktı policy satırı taşımaz |
| upload_admission_leases | PATCH 2 SQL | Expiry/event/guest indeksleri; event/guest FK tanımlı değil |
| upload_quota_reservations | PATCH 3 SQL | State/key/fingerprint/assets/bytes; partial key unique, event-state/lease/cleanup indeksleri; FK varsayılmamalı |
| video_worker_attempts | PATCH 7 SQL | Job+generation ve derivative unique; silinen job sonrası manifest korumak için job FK yok |
| feedback (yalnız tarihî) | Git geçmişi | Mevcut bootstrap gereksinimi değil; gerçek metadata'da varsa ayrıca sınıflandırılır |

70 repo CREATE TABLE/FUNCTION/TRIGGER/INDEX tanımı ve kaynak konumu için
[PATCH 8A ayrıntılı envanteri](patch-8a-schema-inventory.md) geçerlidir. Bu matris
ona arşiv/geçmiş aramasını ve bootstrap kararını ekler; canlı katalog iddiası değildir.

## Function, trigger, FK ve izin ön koşulları

- `media_guest_quota_guard`: BEFORE INSERT media → `enforce_guest_media_quota()`.
  İlk trigger security-hardening kaynağında; PATCH 3 fonksiyonu değiştirir, trigger
  yaratmaz. Trigger enabled/scope/timing gerçek katalogdan doğrulanmalı.
- `users_reset_email_verification` → `reset_email_verification_on_mail_change()`;
  admin event guard → `prevent_admin_suspended_event_reactivation()`.
- Account/reset: `delete_user_account`, `admin_delete_user_account`,
  `consume_password_reset`; event storage/admin suspend/package/override/user status
  RPC'leri ve dayandıkları tablo/kolonlar tam olmalı. Tarihî tanım güncel kabul edilmez.
- Admission: acquire/renew/release; quota: guest_usage/reserve/finalize/cancel/
  list_cleanup; worker: claim/renew/outcome/publish/fail. Tam imza, overload, owner,
  SECURITY DEFINER, sabit search_path, lock_timeout ve EXECUTE yetkileri karşılaştırılır.
- FK hedefleri önce oluşturulmalı; core FK eylemleri/deferrability fixture'dan
  kopyalanmaz. PATCH 6 NO KEY UPDATE ile immediate FK KEY SHARE uyumu korunur.
- pgcrypto isteği password-reset.sql'de var; UUID/default fonksiyon çözümlemesi,
  gerçek enum/domain/type ve extension namespace/version bağımlılıkları snapshot'tan
  çıkarılır. Sadece PG 17 fixture çalışması gerçek Supabase sürümü kanıtı değildir.
- Uygulama tablo/ledger'larında RLS ve gerekli schema USAGE; anon/authenticated
  doğrudan tablo/RPC erişimi kapalı; Express service_role gereken erişime sahip.
  PUBLIC varsayılan function EXECUTE ve gelecekteki app function default grants de
  onaylı owner kapsamında sınırlandırılmalı. Supabase yönetilen şemalara toplu
  privilege değişikliği yapılmaz. Function owner/definer ve service_role BYPASSRLS
  gerçek hedefte ayrıca kontrol edilir. View yetkisi base table yetkisinden ayrı incelenir.

## İki bootstrap yolu; ikisinde de önce şema kaynağı

1. **pre-PATCH-2 snapshot:** Onaylı temel şema ve gerçek eksik precondition'lar
   tamamlanır: auth/security, event/package/storage/admin, R2 images/covers/provider/
   video ve queue. Ardından yalnız eksik olan PATCH 2 → PATCH 3 → PATCH 6 → PATCH 7.
2. **post-PATCH-7 schema-only snapshot:** Bu nesneler zaten tanımlıysa PATCH 2/3/7
   tekrar uygulanmaz; duplicate DDL üretir. Katalog ve function gövdeleri beklenen
   sürümle karşılaştırılır; yalnız gerçekten eksik delta için ayrı plan hazırlanır.

Temel sıra: public type/table/PK → FK target/index/check → view/function/trigger
bağımlılıkları → uygulama RLS/ACL/owner doğrulaması → sürüme göre eksik patch delta →
capacity policy ve salt sentetik seed → katalog/RPC/route smoke. Fonksiyonların
referans verdiği tablolar önce mevcut olmalı; döngüsel FK varsa onaylı artifact'ın
pre-data/post-data düzeni korunur. Tek bir alfabetik glob kullanılmaz.

Her yol için schema-only çıktı satır taşımaz: packet_level/media_type iş kuralları
ve yeni synthetic users/event/guests/limit policy ayrıca tasarlanmalı. Gerçek paket
satırları bile production'dan kopyalanmaz. Kolon tipleri bilinmeden seed SQL yazılmaz.
`promote-first-admin.sql`, tarihî backfill'ler, counter yeniden sayımı ve mevcut
ledger/state sıfırlama bootstrap zincirine dahil edilmez. Rollback dizini ileri
kuruluma dahil değildir. PATCH 7 geçişi eski worker'ların durmasını gerektirir.

## İleride onaylanabilecek schema-only edinme prosedürü — çalıştırılmadı

Öncelik sahip tarafından sağlanmış mevcut, onaylı schema-only dosyadır. Yoksa önce
production bağlantısı + salt okunur katalog inceleme + schema-only export kapsamı
ayrı onaylanır; bu hazırlık onayı yeterli değildir. Dosyalar önce güvenli yerel,
Git dışı bir dizinde tutulur; public repo'ya otomatik eklenmez.

Onay sonrası yetkili operatör:

1. Gizli olmayan project ref/DB host'u izin verilen hedefle karşılaştırır. Account
   service-role API anahtarını DB parolası gibi kullanmaz. Metadata okuyabilecek,
   yazma/DDL yetkisi olmayan uygun DB rolü ve güvenli credential store/PG service
   kaydı hazırlar; password/URI CLI argümanına veya chat'e yazılmaz.
2. Hedef PG major ile uyumlu pg_dump sürümünü doğrular; short lock_timeout ve
   read-only bağlantı kullanır. Canlı yoğunlukta metadata kilidi bile etki
   yaratabileceği için uygun zaman ve iptal ölçütleri onaylanır.
3. Aşağıdaki **yalnız öneri** komutu, onaylanmış PG service adı ve güvenli dosya yolu
   ile gözden geçirir. Burada bağlanılmadı/çalıştırılmadı:

```text
pg_dump --dbname=service=snapup_schema_audit --schema-only --schema=public --no-owner --no-privileges --lock-wait-timeout=3s --file=<GIT_DISI_GUVENLI_DDL_DOSYASI>
```

4. Satır sayımı/customer SELECT/COPY/INSERT dump, pg_dumpall veya data-only export
   yapmaz. Public şemadan auth/extensions türlerine dış bağımlılık çıkarsa yalnız
   ilgili metadata kapsamını ayrıca onaylatır; yönetilen şema/hesap verisini kopyalamaz.
5. `--no-owner/--no-privileges` nedeniyle ayrı READ ONLY katalog manifest'inde object
   owner/ACL/default ACL, schema grants, RLS/policies, function imza/security/
   search_path, trigger state, FK/index/type/extension/view bağımlılıklarını kaydeder.
   Manifest uygulama tablosu satırı içermez. Bütün DB rol listesi/secret ayarları dump edilmez.
6. Function/view/check/default/comment metinlerinde production URL, literal token,
   kullanıcı bilgisi veya hassas ifade bulunup bulunmadığını güvenli review ile
   inceler. Schema-only etiketi tek başına gizlilik garantisi değildir.
7. Onaylı, temizlenmiş artifact'a SHA-256 ve kaynak tarih/sürüm manifest'i ekler;
   SQL'i bu aşamada hiçbir yerde uygulamaz. Sonraki restore için ayrıca izin gerekir.

Supabase resmi [ortam yönetimi](https://supabase.com/docs/guides/deployment/managing-environments)
ve PostgreSQL [pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
belgeleri yöntem kaynağıdır. Bu prosedür canlı snapshot'ın başarıyla alındığını
veya otomatik restore edilebilir olduğunu iddia etmez.

## Kurulum öncesi kabul listesi

- [ ] Tam temel şema/view ve provenance/hash mevcut; veri/secret içermediği incelendi.
- [ ] Snapshot patch seviyesi ve PG major/type/extension bağımlılıkları belirlendi.
- [ ] Gerekli core/queue/ledger kolon, PK/unique/check/FK/index tanımları karşılaştırıldı.
- [ ] Üç trigger'ın function bağlantısı, enabled/timing ve owner'ı doğrulandı.
- [ ] Admission/quota/worker RPC tam imzaları ve PATCH 6 NKU gövdeleri doğrulandı.
- [ ] Uygulama RLS, view security, PUBLIC/anon/authenticated ret ve service_role/schema
  yetkileri katalogdan kabul edildi; PostgREST schema cache yöntemi belirlendi.
- [ ] Snapshot'ta bulunan migration'lar replay listesinden çıkarıldı.
- [ ] Synthetic katalog/owner/guest/event seed ve test mailbox planı onaylandı.
- [ ] Capacity policy satırı için ölçüme kadar muhafazakâr test ayarı belirlendi.
- [ ] Staging ref/credentials ayrı, kaynak ve migration/restore işlemi ayrıca onaylı.
- [ ] Backend/worker başlatılmadan önce şema/policy hazır; health 200 tek başına kabul değil.

Bu kutular henüz işaretli değildir. İlk somut kullanıcı adımı: mevcut güvenilir,
verisiz temel şema kaynağının yerini belirlemek; yoksa yukarıdaki sınırlı edinme
prosedürü için ayrı açık onay vermek. Bu dosyanın teslimiyle bağlantı izni oluşmaz.
