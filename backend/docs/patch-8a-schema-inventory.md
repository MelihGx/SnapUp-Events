# PATCH 8A — PostgreSQL schema-only hazırlık envanteri

Tarih: 30 Ekim 2026. Yalnız repo kaynakları incelendi; hiçbir hesaba bağlanılmadı,
export alınmadı veya mevcut/staging DB'ye SQL uygulanmadı. Aşağıdaki liste canlı
katalog envanteri değildir; repo dışındaki nesneler ve gerçek FK/ACL durumu bilinmiyor.

## Eksik temel kaynaklar

Tam CREATE TABLE tanımı bulunmayan uygulama tabloları: `users`, `event`,
`event_settings`, `event_guests`, `media`, `media_type`, `packet_level`,
`media_likes`, `event_invitations`, `email_verification_tokens`.
`events_media` view'ı galeri, slideshow, istatistik ve admin sorgularında kullanılıyor;
CREATE VIEW tanımı da bulunmuyor. Bunların kolon tipleri, default/PK/unique/check
kısıtları, indeksleri, FK eylemleri, deferrability ve RLS/policy/owner/grant'ları
onaylı gerçek schema-only kaynakta yer almalı. Test fixture'ları bunları tamamlamaz.

Repo CREATE TABLE sağlayan ekler: `password_reset_tokens`,
`cloudinary_cleanup_outbox`, `event_slideshow_settings`, `admin_audit_logs`,
`video_processing_jobs`, `upload_admission_policy`, `upload_admission_leases`,
`upload_quota_reservations`, `video_worker_attempts`. Ek tabloların tanımlarının
bulunması temel uygulamanın boş DB'ye kurulabileceği anlamına gelmez.

## FK ve transaction kabulü

| İlişki | Repo kanıtı / ayrıca istenen katalog kanıtı |
|---|---|
| password_reset_tokens.user_id → users.user_id | password-reset.sql, ON DELETE CASCADE |
| event_slideshow_settings.event_id → event.event_id | live-slideshow.sql, CASCADE |
| event_slideshow_settings.selected_media_id → media.media_id | live-slideshow.sql, SET NULL; gerçek kolon adı DDL'den karşılaştırılmalı |
| event_slideshow_settings.updated_by → users.user_id | live-slideshow.sql, SET NULL |
| admin_audit_logs.admin_user_id → users.user_id | admin-audit-logs.sql, SET NULL |
| video_processing_jobs.event_id/guest_id → event/event_guests | video-background-processing.sql, CASCADE |
| video_processing_jobs.media_id → media.media_id | video-background-processing.sql, SET NULL |
| event.user_id; event_guests.event_id/user_id; media.event_id/guest_id/media_type_id | Uygulama bağımlılığı; temel DDL yok. Gerçek FK, nullability ve silme eylemi tahmin edilmemeli |
| media_likes, event_settings, event_invitations, email_verification_tokens, packet_level ilişkileri | Temel DDL/unique/FK katalog kaynağı gerekli |
| admission/quota/worker attempt ledger | Repo DDL'lerinde event/guest/job için FK yok; özellikle attempt kaydı silinen job'dan sonra korunur. Fixture'a bakarak FK eklenmemeli |

Gerçek katalogdan pg_class/attribute/type/constraint/index, pg_trigger (enabled ve
fonksiyon bağlantısı), pg_proc (tam imza, owner, proconfig/search_path,
security-definer ve EXECUTE ACL), pg_policy/RLS ve schema USAGE/grant envanteri
istenmeli. `media_guest_quota_guard` BEFORE INSERT → `enforce_guest_media_quota()`
bağlantısı zorunlu; PATCH 3 yalnız fonksiyonu değiştirir, trigger oluşturmaz.
PATCH 6 FK KEY SHARE uyumlu event NO KEY UPDATE kilitlerini gerektirir.
Anon/authenticated erişim kapalı, service_role gereken tablo/RPC erişimine sahip
olmalı; gerçek Supabase BYPASSRLS ve PostgREST cache durumu ayrıca doğrulanmalı.

## Bağımlılık ve replay planı — uygulanmadı

1. Yetkili kaynaktan gözden geçirilmiş, verisiz temel public şema + view/extension/
   role/ACL manifest'i. Supabase yönetilen auth/storage/internal şemaları kopyalanmaz.
2. Auth için password-reset ve email-verification; security-hardening temel tablo ve
   token alanlarına bağımlıdır. RLS, quota trigger ve account-delete/reset RPC'leri
   bu zincirdedir. Gerçek mevcut sürümle karşılaştırılır; tarihî backfill'ler uygulanmaz.
3. Event codes/package/slug, slideshow, cumulative storage counter, admin role/audit/
   event operation, country/type/location ve guest-limit değişiklikleri mevcut
   uygulama şemasının ön koşullarıdır. Six-digit/six-character ve farklı guest-limit
   dosyaları tarihî alternatifler içerir; alfabetik/toplu replay güvenli değildir.
   `promote-first-admin.sql` kullanıcı yetkisini değiştiren veri işlemidir; schema-only
   başlangıcın parçası olarak çalıştırılmaz.
4. R2 image original/display → R2 covers → storage-provider contract → R2 video
   phase1 → background video queue. Media status/byte/provider/original/display/
   poster alanları, event cover alanları ve guest/admin storage override tamamlanır.
5. PATCH 2 `2026-10-21-upload-admission.sql` → PATCH 3
   `2026-10-21-atomic-upload-quota.sql` → PATCH 6
   `2026-10-30-quota-event-locks.sql` → PATCH 7
   `2026-10-30-video-worker-safety.sql`. PATCH 5/8A SQL eklemez.
6. Admission policy satırı migration tarafından eklenmez; ölçülmüş global/event/
   guest/TTL ayarları ayrıca gerekir. PATCH 2/3/7 replay atomik hata verebilir;
   PATCH 6 replacement güvenliği de katalog/ACL ile incelenmelidir. rollback dizini
   ileri kurulum zincirine dahil edilmez. Eski worker'lar drain edilmeden PATCH 7
   geçişi yapılmaz; sayaç/ledger reset veya tarihî tüketim backfill'i yapılmaz.

## Güvenli başlangıç yöntemi

Öncelik, sahip tarafından sağlanmış ve kullanımı onaylı schema-only artifact'tır.
Böyle bir artifact yoksa ileride ayrı izinle yetkili operatör yalnız schema-only
çıktı hazırlayabilir; bu patch kapsamında production export yapılmadı. İçerik,
kolon/view/function/default/check/trigger/index/FK, extension ve uygulama role/ACL
manifest'iyle birlikte incelenmeli; veriler, kullanıcılar, medyalar, auth hesapları,
secret literal'leri ve üretim endpoint'leri taşınmamalı. Owner ve hosted-role
bağımlılıkları staging'e uyarlanmalı; broad grant/policy'ler körlemesine kopyalanmamalı.

Gözden geçirilen artifact önce offline/disposable DB'de restore edilebilirliği ve
katalog beklentileriyle karşılaştırılmalı. Sonra ayrı PATCH 8B onayı ile doğrulanmış
izole staging projesine hedefli kurulum planı çıkarılabilir; yalnız sentetik seed.
Temel kaynak mevcut olmadığından bu patch staging DB kurulumu için eksiksiz,
çalıştırılabilir bir başlangıç şeması teslim etmiyor. Bu somut engel devam ediyor.

## Repo DDL nesneleri

Aşağıdaki otomatik kaynak listesi CREATE TABLE/FUNCTION/TRIGGER/INDEX ifadelerini
çıkarır. ALTER ile eklenen kısıt/kolonlar, anonim constraint indeksleri ve repo dışı
nesneler için yukarıdaki katalog incelemesinin yerine geçmez. SQL çalıştırılmaz.

| Tür | Nesne | Tanım kaynağı |
|---|---|---|
| UNIQUE INDEX | `media_likes_media_key_unique` | [2026-08-07-security-hardening.sql:31](../database/2026-08-07-security-hardening.sql) |
| UNIQUE INDEX | `event_guests_event_normalized_name_unique` | [2026-08-07-security-hardening.sql:33](../database/2026-08-07-security-hardening.sql) |
| UNIQUE INDEX | `event_event_code_unique` | [2026-08-07-security-hardening.sql:35](../database/2026-08-07-security-hardening.sql) |
| TABLE | `public.cloudinary_cleanup_outbox` | [2026-08-07-security-hardening.sql:37](../database/2026-08-07-security-hardening.sql) |
| FUNCTION | `public.enforce_guest_media_quota` | [2026-08-07-security-hardening.sql:48](../database/2026-08-07-security-hardening.sql) |
| FUNCTION | `public.delete_user_account` | [2026-08-07-security-hardening.sql:82](../database/2026-08-07-security-hardening.sql) |
| TRIGGER | `media_guest_quota_guard` | [2026-08-07-security-hardening.sql:121](../database/2026-08-07-security-hardening.sql) |
| FUNCTION | `public.consume_password_reset` | [2026-08-07-security-hardening.sql:125](../database/2026-08-07-security-hardening.sql) |
| TABLE | `public.event_slideshow_settings` | [2026-08-09-live-slideshow.sql:3](../database/2026-08-09-live-slideshow.sql) |
| INDEX | `idx_event_slideshow_selected_media` | [2026-08-09-live-slideshow.sql:22](../database/2026-08-09-live-slideshow.sql) |
| FUNCTION | `public.increment_event_storage_consumed` | [2026-09-03-cumulative-storage-quota.sql:36](../database/2026-09-03-cumulative-storage-quota.sql) |
| UNIQUE INDEX | `event_event_slug_unique_idx` | [2026-09-04-event-slugs.sql:59](../database/2026-09-04-event-slugs.sql) |
| INDEX | `users_user_role_idx` | [2026-09-23-admin-access.sql:33](../database/2026-09-23-admin-access.sql) |
| TABLE | `public.admin_audit_logs` | [2026-09-24-admin-audit-logs.sql:6](../database/2026-09-24-admin-audit-logs.sql) |
| INDEX | `admin_audit_logs_created_at_idx` | [2026-09-24-admin-audit-logs.sql:28](../database/2026-09-24-admin-audit-logs.sql) |
| INDEX | `admin_audit_logs_admin_user_id_idx` | [2026-09-24-admin-audit-logs.sql:31](../database/2026-09-24-admin-audit-logs.sql) |
| INDEX | `admin_audit_logs_category_idx` | [2026-09-24-admin-audit-logs.sql:34](../database/2026-09-24-admin-audit-logs.sql) |
| FUNCTION | `public.admin_delete_user_account` | [2026-09-24-admin-delete-user.sql:16](../database/2026-09-24-admin-delete-user.sql) |
| FUNCTION | `public.prevent_admin_suspended_event_reactivation` | [2026-09-24-admin-event-operations.sql:40](../database/2026-09-24-admin-event-operations.sql) |
| TRIGGER | `trg_prevent_admin_suspended_event_reactivation` | [2026-09-24-admin-event-operations.sql:61](../database/2026-09-24-admin-event-operations.sql) |
| FUNCTION | `public.admin_set_event_suspension` | [2026-09-24-admin-event-operations.sql:66](../database/2026-09-24-admin-event-operations.sql) |
| FUNCTION | `public.admin_change_event_package` | [2026-09-24-admin-event-operations.sql:249](../database/2026-09-24-admin-event-operations.sql) |
| FUNCTION | `public.admin_set_event_storage_override` | [2026-09-24-admin-event-operations.sql:413](../database/2026-09-24-admin-event-operations.sql) |
| FUNCTION | `public.admin_set_user_active_status` | [2026-09-24-admin-user-status.sql:12](../database/2026-09-24-admin-user-status.sql) |
| INDEX | `idx_event_type_code` | [2026-09-26-event-type-analytics.sql:25](../database/2026-09-26-event-type-analytics.sql) |
| INDEX | `idx_users_country_code` | [2026-09-26-user-country.sql:28](../database/2026-09-26-user-country.sql) |
| UNIQUE INDEX | `media_r2_original_key_unique` | [2026-09-27-r2-original-display-images.sql:48](../database/2026-09-27-r2-original-display-images.sql) |
| UNIQUE INDEX | `media_r2_display_key_unique` | [2026-09-27-r2-original-display-images.sql:52](../database/2026-09-27-r2-original-display-images.sql) |
| UNIQUE INDEX | `event_cover_r2_original_key_unique` | [2026-09-28-r2-event-covers.sql:65](../database/2026-09-28-r2-event-covers.sql) |
| UNIQUE INDEX | `event_cover_r2_display_key_unique` | [2026-09-28-r2-event-covers.sql:69](../database/2026-09-28-r2-event-covers.sql) |
| UNIQUE INDEX | `media_r2_poster_key_unique` | [2026-10-03-r2-video-phase1.sql:15](../database/2026-10-03-r2-video-phase1.sql) |
| FUNCTION | `public.enforce_guest_media_quota` | [2026-10-05-unlimited-guest-upload-limit.sql:24](../database/2026-10-05-unlimited-guest-upload-limit.sql) |
| TABLE | `public.video_processing_jobs` | [2026-10-05-video-background-processing.sql:11](../database/2026-10-05-video-background-processing.sql) |
| INDEX | `video_processing_jobs_status_created_idx` | [2026-10-05-video-background-processing.sql:44](../database/2026-10-05-video-background-processing.sql) |
| INDEX | `video_processing_jobs_event_idx` | [2026-10-05-video-background-processing.sql:47](../database/2026-10-05-video-background-processing.sql) |
| INDEX | `video_processing_jobs_guest_active_idx` | [2026-10-05-video-background-processing.sql:50](../database/2026-10-05-video-background-processing.sql) |
| TABLE | `public.upload_quota_reservations` | [2026-10-21-atomic-upload-quota.sql:4](../database/2026-10-21-atomic-upload-quota.sql) |
| UNIQUE INDEX | `upload_quota_key_unique` | [2026-10-21-atomic-upload-quota.sql:20](../database/2026-10-21-atomic-upload-quota.sql) |
| INDEX | `upload_quota_event_state_idx` | [2026-10-21-atomic-upload-quota.sql:22](../database/2026-10-21-atomic-upload-quota.sql) |
| INDEX | `upload_quota_lease_idx` | [2026-10-21-atomic-upload-quota.sql:23](../database/2026-10-21-atomic-upload-quota.sql) |
| INDEX | `upload_quota_cleanup_idx` | [2026-10-21-atomic-upload-quota.sql:24](../database/2026-10-21-atomic-upload-quota.sql) |
| INDEX | `media_event_guest_quota_idx` | [2026-10-21-atomic-upload-quota.sql:25](../database/2026-10-21-atomic-upload-quota.sql) |
| FUNCTION | `public.upload_quota_guest_usage` | [2026-10-21-atomic-upload-quota.sql:27](../database/2026-10-21-atomic-upload-quota.sql) |
| FUNCTION | `public.reserve_upload_quota` | [2026-10-21-atomic-upload-quota.sql:40](../database/2026-10-21-atomic-upload-quota.sql) |
| FUNCTION | `public.finalize_upload_quota` | [2026-10-21-atomic-upload-quota.sql:99](../database/2026-10-21-atomic-upload-quota.sql) |
| FUNCTION | `public.cancel_upload_quota` | [2026-10-21-atomic-upload-quota.sql:189](../database/2026-10-21-atomic-upload-quota.sql) |
| FUNCTION | `public.list_upload_quota_cleanup` | [2026-10-21-atomic-upload-quota.sql:202](../database/2026-10-21-atomic-upload-quota.sql) |
| FUNCTION | `public.enforce_guest_media_quota` | [2026-10-21-atomic-upload-quota.sql:225](../database/2026-10-21-atomic-upload-quota.sql) |
| TABLE | `public.upload_admission_policy` | [2026-10-21-upload-admission.sql:4](../database/2026-10-21-upload-admission.sql) |
| TABLE | `public.upload_admission_leases` | [2026-10-21-upload-admission.sql:12](../database/2026-10-21-upload-admission.sql) |
| INDEX | `upload_admission_expiry_idx` | [2026-10-21-upload-admission.sql:19](../database/2026-10-21-upload-admission.sql) |
| INDEX | `upload_admission_event_idx` | [2026-10-21-upload-admission.sql:20](../database/2026-10-21-upload-admission.sql) |
| INDEX | `upload_admission_guest_idx` | [2026-10-21-upload-admission.sql:21](../database/2026-10-21-upload-admission.sql) |
| FUNCTION | `public.acquire_upload_admission` | [2026-10-21-upload-admission.sql:23](../database/2026-10-21-upload-admission.sql) |
| FUNCTION | `public.renew_upload_admission` | [2026-10-21-upload-admission.sql:63](../database/2026-10-21-upload-admission.sql) |
| FUNCTION | `public.release_upload_admission` | [2026-10-21-upload-admission.sql:77](../database/2026-10-21-upload-admission.sql) |
| FUNCTION | `public.reserve_upload_quota` | [2026-10-30-quota-event-locks.sql:17](../database/2026-10-30-quota-event-locks.sql) |
| FUNCTION | `public.finalize_upload_quota` | [2026-10-30-quota-event-locks.sql:76](../database/2026-10-30-quota-event-locks.sql) |
| INDEX | `video_worker_expiry_idx` | [2026-10-30-video-worker-safety.sql:20](../database/2026-10-30-video-worker-safety.sql) |
| TABLE | `public.video_worker_attempts` | [2026-10-30-video-worker-safety.sql:21](../database/2026-10-30-video-worker-safety.sql) |
| FUNCTION | `public.claim_video_job` | [2026-10-30-video-worker-safety.sql:42](../database/2026-10-30-video-worker-safety.sql) |
| FUNCTION | `public.renew_video_job` | [2026-10-30-video-worker-safety.sql:87](../database/2026-10-30-video-worker-safety.sql) |
| FUNCTION | `public.video_job_outcome` | [2026-10-30-video-worker-safety.sql:98](../database/2026-10-30-video-worker-safety.sql) |
| FUNCTION | `public.publish_video_job` | [2026-10-30-video-worker-safety.sql:108](../database/2026-10-30-video-worker-safety.sql) |
| FUNCTION | `public.fail_video_job` | [2026-10-30-video-worker-safety.sql:155](../database/2026-10-30-video-worker-safety.sql) |
| FUNCTION | `public.reset_email_verification_on_mail_change` | [email-verification-security.sql:17](../database/email-verification-security.sql) |
| TRIGGER | `users_reset_email_verification` | [email-verification-security.sql:36](../database/email-verification-security.sql) |
| TABLE | `public.password_reset_tokens` | [password-reset.sql:5](../database/password-reset.sql) |
| INDEX | `idx_password_reset_tokens_user_id` | [password-reset.sql:20](../database/password-reset.sql) |
| INDEX | `idx_password_reset_tokens_active` | [password-reset.sql:23](../database/password-reset.sql) |
