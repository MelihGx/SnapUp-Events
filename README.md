📸 SnapUp Events

Every guest. Every moment. One shared album.

SnapUp Events, etkinliklerde çekilen fotoğraf, video ve mesajların tek bir ortak dijital albümde toplanmasını sağlayan web tabanlı bir etkinlik paylaşım platformudur.

Misafirler herhangi bir uygulama indirmeden, yalnızca QR kod, etkinlik kodu veya paylaşım bağlantısı üzerinden etkinliğe katılabilir ve içerik paylaşabilir.

🌐 Canlı Demo: https://snapupevents.com
👨‍💻 Geliştirici: Melih Gülhan

🎯 Projenin Amacı

Etkinliklerde çekilen fotoğraf ve videolar çoğu zaman:

WhatsApp gruplarında

Sosyal medya hesaplarında

AirDrop / Bluetooth aktarımlarında

Farklı kullanıcıların telefonlarında

dağınık şekilde kalmaktadır.

SnapUp Events, tüm bu içerikleri tek bir etkinlik albümünde bir araya getirerek organizatör ve misafirler için ortak bir dijital alan oluşturur.

🚀 Nasıl Çalışır?

1. Etkinlik oluşturulur

Organizatör sistem üzerinden yeni bir etkinlik oluşturur.

2. Katılım bağlantısı paylaşılır

Her etkinlik için özel:

QR kod

Etkinlik kodu

Paylaşım bağlantısı

oluşturulur.

3. Misafir etkinliğe katılır

Misafirin uygulama yüklemesine gerek yoktur.

4. İçerik paylaşılır

Misafirler etkinliğe:

📷 Fotoğraf

🎥 Video

💬 Mesaj

yükleyebilir.

5. Ortak galeri oluşur

Onaylanan içerikler etkinliğin ortak galerisinde görüntülenir.

✨ Temel Özellikler

📷 Ortak Etkinlik Galerisi

Etkinlik içerisinde paylaşılan içerikler tek bir galeride toplanır.

Galeri içerisinde:

Tüm içerikler

Fotoğraflar

Videolar

Mesajlar

ayrı ayrı filtrelenebilir.

İçerikler ayrıca:

Son yüklenen

İlk yüklenen

En çok beğenilen

şeklinde sıralanabilir.

✅ İçerik Moderasyonu

Organizatör, misafirlerin yüklediği içerikleri kontrol edebilir.

İçerik durumları:

Pending
Approved
Rejected

Bu sayede galeride yalnızca onaylanan içerikler gösterilebilir.

❤️ Beğeni ve Etkileşim

Etkinlik ayarlarına bağlı olarak:

İçerikler beğenilebilir

Yorum özelliği kullanılabilir

En çok beğenilen içerikler öne çıkarılabilir

📺 Live Slideshow

Etkinlik sırasında büyük ekran, TV veya projektör üzerinde fotoğrafların gösterilebilmesi için özel bir Live Slideshow sistemi bulunmaktadır.

Slideshow Modları

Latest Upload
Son yüklenen fotoğrafları gösterir.

Random
Etkinlik içerisindeki fotoğrafları rastgele gösterir.

Selected Photo
Organizatör tarafından seçilen fotoğraf ekranda sabit tutulabilir.

📖 PDF Memory Book

Etkinlik içerisindeki anılardan otomatik olarak PDF Memory Book oluşturulabilir.

Bu özellik sayesinde etkinlik sonrasında dijital bir anı kitabı hazırlanabilir.

💌 Invitation Studio

Etkinlik organizatörlerinin davetiye içerikleri oluşturabilmesi için özel bir davetiye hazırlama alanı bulunmaktadır.

📍 Lokasyon Sistemi

Etkinliklere:

Mekân adı

Açık adres

Harita konumu

eklenebilir.

Misafirler etkinlik lokasyonunu sistem üzerinden görüntüleyebilir.

🔗 Clean Gallery URLs

Etkinlik galerileri okunabilir URL yapısını destekler.

Eski yapı:

/event-gallery.html?code=ABC123

Yeni yapı:

/gallery/mezuniyet-2026

Bu yapı daha temiz, paylaşılabilir ve kullanıcı dostudur.

🌍 50 Dil Desteği

SnapUp Events arayüzü 50 farklı dili desteklemektedir.

Çoklu dil sistemi:

Ana sayfa

Giriş / kayıt ekranları

Etkinlik yönetimi

Galeri

Upload ekranları

Güvenlik mesajları

Depolama arayüzü

gibi temel kullanıcı akışlarında kullanılmaktadır.

🌙 Dark Mode

Sistem açık ve koyu tema desteğine sahiptir.

Tema yapısı:

Mobil

Tablet

Masaüstü

cihazlarla uyumlu olacak şekilde geliştirilmiştir.

💾 Depolama Sistemi

Her etkinlik için ayrı depolama kotası bulunmaktadır.

Paket

Depolama

Free

100 MB

Mini

5 GB

Plus

10 GB

Premium

20 GB

Depolama kontrolü yalnızca arayüz tarafında değil, backend tarafında uygulanmaktadır.

Cumulative Storage

Silinen medya dosyaları kullanılan kotayı geri kazandırmaz.

Örnek:

20 MB yükle  → 20 MB kullanıldı
Dosyayı sil  → 20 MB kullanılmaya devam eder
10 MB yükle  → 30 MB kullanıldı

Bu yapı, upload-delete döngüsüyle kota aşılmasını önler.

🛡️ Güvenlik

Projede farklı güvenlik katmanları kullanılmaktadır.

Kullanılan güvenlik mekanizmaları

Cloudflare Turnstile

Backend authentication

Authorization kontrolleri

MIME/type doğrulama

Dosya boyutu kontrolü

Upload validation

Supabase Row Level Security

Environment Variables

Backend storage quota enforcement

Güvenlik middleware'leri

Kritik API anahtarları ve bağlantı bilgileri GitHub üzerinde tutulmaz.

🧩 Kullanılan Teknolojiler

Frontend

HTML5

CSS3

Vanilla JavaScript

Responsive Web Design

Custom i18n yapısı

Hosting

Cloudflare Pages

Backend

Node.js

Express.js

REST API

Hosting

Render

Veritabanı

PostgreSQL

Supabase

Temel veri yapıları:

Users

Events

Event Settings

Guests

Media

Likes

Invitations

Verification kayıtları

Medya Yönetimi

Fotoğraf ve video içeriklerinin saklanması için:

Cloudinary

kullanılmaktadır.

Medya dosyaları Cloudinary üzerinde tutulurken, medya bağlantıları ve metadata bilgileri PostgreSQL veritabanında saklanmaktadır.

🏗️ Sistem Mimarisi

                USER / GUEST
                     │
                     ▼
             Cloudflare Pages
                 Frontend
                     │
                     │ REST API
                     ▼
              Node.js / Express
                   Render
                 /        \
                /          \
               ▼            ▼
          Supabase       Cloudinary
         PostgreSQL        Media

🎉 Kullanım Alanları

SnapUp Events yalnızca düğünler için tasarlanmamıştır.

Platform şu etkinliklerde kullanılabilir:

💍 Düğün

🎂 Doğum günü

🎓 Mezuniyet

🏫 Üniversite etkinlikleri

🏢 Kurumsal organizasyonlar

🎤 Konferanslar

✈️ Seyahat grupları

🎉 Partiler

👨‍👩‍👧‍👦 Aile etkinlikleri

💼 SaaS Yapısı

SnapUp Events, gelecekte ticari kullanıma açılabilecek bir SaaS platformu mantığıyla geliştirilmiştir.

Mevcut altyapıda:

Paket sistemi

Event bazlı storage quota

Ek depolama altyapısı

Bölgesel fiyatlandırma arayüzü

Paket bazlı özellik yapısı

bulunmaktadır.

Gerçek ödeme sistemi, şirketleşme ve ticari yayına geçiş sonrasında entegre edilmek üzere planlanmıştır.

🎓 Akademik Kapsam

SnapUp Events, Bilgisayar Mühendisliği kapsamında geliştirilmiş kapsamlı bir web uygulamasıdır.

Proje içerisinde:

Frontend Development

Backend Development

REST API Design

PostgreSQL

Database Design

Authentication

Authorization

Media Management

Cloud Services

Security

Responsive Design

Internationalization

SaaS Architecture

gibi farklı yazılım geliştirme alanları birlikte kullanılmıştır.


👨‍💻 Developer

Melih Gülhan
Bilgisayar Mühendisliği
Kütahya Dumlupınar Üniversitesi

GitHub:
https://github.com/MelihGx

📸 SnapUp Events

Her misafir. Her anı. Tek bir albüm.
