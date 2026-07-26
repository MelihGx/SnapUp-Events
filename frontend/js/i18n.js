(() => {
  "use strict";

  const STORAGE_KEY = "snapup_language";
  const SUPPORTED = ["en", "tr", "ar"];
  const saved = localStorage.getItem(STORAGE_KEY);
  const language = SUPPORTED.includes(saved) ? saved : "en";

  document.documentElement.lang = language;
  // Keep the interface layout identical in every language. Arabic text is
  // handled locally by i18n.css instead of mirroring the entire document.
  document.documentElement.dir = "ltr";

  const p = (tr, ar) => ({ tr, ar });
  const phrases = {
    "SnapUp Events — Capture Every Memory": p("SnapUp Events — Her Anıyı Yakala", "SnapUp Events — التقط كل ذكرى"),
    "Account — SnapUp Events": p("Hesap — SnapUp Events", "الحساب — SnapUp Events"),
    "Create Event — SnapUp Events": p("Etkinlik Oluştur — SnapUp Events", "إنشاء فعالية — SnapUp Events"),
    "Event Detail — SnapUp Events": p("Etkinlik Detayı — SnapUp Events", "تفاصيل الفعالية — SnapUp Events"),
    "Event Gallery — SnapUp Events": p("Etkinlik Galerisi — SnapUp Events", "معرض الفعالية — SnapUp Events"),
    "Login — SnapUp Events": p("Giriş — SnapUp Events", "تسجيل الدخول — SnapUp Events"),
    "Register — SnapUp Events": p("Kayıt — SnapUp Events", "إنشاء حساب — SnapUp Events"),
    "Privacy Policy — SnapUp Events": p("Gizlilik Politikası — SnapUp Events", "سياسة الخصوصية — SnapUp Events"),
    "Home": p("Ana Sayfa", "الرئيسية"),
    "Home Page": p("Ana Sayfa", "الصفحة الرئيسية"),
    "Back Home": p("Ana Sayfaya Dön", "العودة للرئيسية"),
    "Back to home": p("Ana sayfaya dön", "العودة إلى الرئيسية"),
    "How It Works": p("Nasıl Çalışır", "كيف يعمل"),
    "How it works": p("Nasıl çalışır", "كيف يعمل"),
    "Features": p("Özellikler", "الميزات"),
    "Pricing": p("Fiyatlandırma", "الأسعار"),
    "Login": p("Giriş Yap", "تسجيل الدخول"),
    "Logout": p("Çıkış Yap", "تسجيل الخروج"),
    "Register": p("Kayıt Ol", "إنشاء حساب"),
    "Create account": p("Hesap oluştur", "إنشاء حساب"),
    "Create Account": p("Hesap Oluştur", "إنشاء حساب"),
    "Create Event": p("Etkinlik Oluştur", "إنشاء فعالية"),
    "Create New Event": p("Yeni Etkinlik Oluştur", "إنشاء فعالية جديدة"),
    "Create Your Event": p("Etkinliğini Oluştur", "أنشئ فعاليتك"),
    "Join Event": p("Etkinliğe Katıl", "الانضمام إلى فعالية"),
    "Join with Code": p("Kodla Katıl", "الانضمام بالرمز"),
    "Join with code": p("Kodla katıl", "الانضمام بالرمز"),
    "My Account": p("Hesabım", "حسابي"),
    "My Events": p("Etkinliklerim", "فعالياتي"),
    "Account Details": p("Hesap Bilgileri", "تفاصيل الحساب"),
    "Dashboard": p("Kontrol Paneli", "لوحة التحكم"),
    "Profile": p("Profil", "الملف الشخصي"),
    "Account details": p("Hesap bilgileri", "تفاصيل الحساب"),
    "Account summary": p("Hesap özeti", "ملخص الحساب"),
    "Account status": p("Hesap durumu", "حالة الحساب"),
    "Active": p("Aktif", "نشط"),
    "Created at": p("Oluşturulma tarihi", "تاريخ الإنشاء"),
    "Created events": p("Oluşturulan etkinlikler", "الفعاليات المنشأة"),
    "View the events you created and manage their private event codes.": p("Oluşturduğun etkinlikleri görüntüle ve özel etkinlik kodlarını yönet.", "اعرض الفعاليات التي أنشأتها وأدر رموزها الخاصة."),
    "Total events": p("Toplam etkinlik", "إجمالي الفعاليات"),
    "Loading events...": p("Etkinlikler yükleniyor...", "جارٍ تحميل الفعاليات..."),
    "Update your name, email address, and phone number.": p("Adını, e-posta adresini ve telefon numaranı güncelle.", "حدّث اسمك وبريدك الإلكتروني ورقم هاتفك."),
    "Full name": p("Ad soyad", "الاسم الكامل"),
    "Email address": p("E-posta adresi", "البريد الإلكتروني"),
    "Phone number": p("Telefon numarası", "رقم الهاتف"),
    "optional": p("isteğe bağlı", "اختياري"),
    "Save changes": p("Değişiklikleri kaydet", "حفظ التغييرات"),
    "Password": p("Şifre", "كلمة المرور"),
    "Show": p("Göster", "إظهار"),
    "Hide": p("Gizle", "إخفاء"),
    "Change password": p("Şifreyi değiştir", "تغيير كلمة المرور"),
    "Update your password using your current password.": p("Mevcut şifreni kullanarak şifreni güncelle.", "حدّث كلمة مرورك باستخدام كلمة المرور الحالية."),
    "Current password": p("Mevcut şifre", "كلمة المرور الحالية"),
    "New password": p("Yeni şifre", "كلمة المرور الجديدة"),
    "Confirm new password": p("Yeni şifreyi doğrula", "تأكيد كلمة المرور الجديدة"),
    "Confirm password": p("Şifreyi doğrula", "تأكيد كلمة المرور"),
    "User": p("Kullanıcı", "المستخدم"),
    "Create a private SnapUp event.": p("Özel bir SnapUp etkinliği oluştur.", "أنشئ فعالية SnapUp خاصة."),
    "Set your event details, choose a package, configure guest permissions, and generate your private event code.": p("Etkinlik ayrıntılarını belirle, paket seç, misafir izinlerini ayarla ve özel etkinlik kodunu oluştur.", "حدّد تفاصيل فعاليتك واختر باقة واضبط صلاحيات الضيوف وأنشئ رمز الفعالية الخاص."),
    "Step 1": p("Adım 1", "الخطوة 1"),
    "Step 2": p("Adım 2", "الخطوة 2"),
    "Step 3": p("Adım 3", "الخطوة 3"),
    "Event details": p("Etkinlik ayrıntıları", "تفاصيل الفعالية"),
    "Event settings": p("Etkinlik ayarları", "إعدادات الفعالية"),
    "Event Settings": p("Etkinlik Ayarları", "إعدادات الفعالية"),
    "Event name": p("Etkinlik adı", "اسم الفعالية"),
    "Event title": p("Etkinlik başlığı", "عنوان الفعالية"),
    "Event description": p("Etkinlik açıklaması", "وصف الفعالية"),
    "Location": p("Konum", "الموقع"),
    "Event date": p("Etkinlik tarihi", "تاريخ الفعالية"),
    "Date": p("Tarih", "التاريخ"),
    "Start time": p("Başlangıç saati", "وقت البدء"),
    "Finish time": p("Bitiş saati", "وقت الانتهاء"),
    "Time": p("Saat", "الوقت"),
    "Description": p("Açıklama", "الوصف"),
    "Choose package": p("Paket seç", "اختر الباقة"),
    "Allow Upload": p("Yüklemeye İzin Ver", "السماح بالرفع"),
    "Guests can upload photos and videos.": p("Misafirler fotoğraf ve video yükleyebilir.", "يمكن للضيوف رفع الصور ومقاطع الفيديو."),
    "Allow Comments": p("Yorumlara İzin Ver", "السماح بالتعليقات"),
    "Guests can leave comments and memories.": p("Misafirler yorum ve anı bırakabilir.", "يمكن للضيوف ترك تعليقات وذكريات."),
    "Allow Likes": p("Beğenilere İzin Ver", "السماح بالإعجابات"),
    "Guests can like uploaded memories.": p("Misafirler yüklenen anıları beğenebilir.", "يمكن للضيوف الإعجاب بالذكريات المرفوعة."),
    "Require Approval": p("Onay Gerektir", "طلب الموافقة"),
    "Uploads wait for your approval.": p("Yüklemeler onayını bekler.", "تنتظر الملفات المرفوعة موافقتك."),
    "Only Users": p("Yalnızca Kullanıcılar", "المستخدمون فقط"),
    "Only Registered Users": p("Yalnızca Kayıtlı Kullanıcılar", "المستخدمون المسجلون فقط"),
    "Only registered users can upload.": p("Yalnızca kayıtlı kullanıcılar yükleme yapabilir.", "يمكن للمستخدمين المسجلين فقط الرفع."),
    "Allow Public Gallery": p("Herkese Açık Galeriye İzin Ver", "السماح بالمعرض العام"),
    "Max storage per guest / MB": p("Misafir başına azami depolama / MB", "الحد الأقصى للتخزين لكل ضيف / ميغابايت"),
    "Max storage / guest MB": p("Misafir başına azami depolama / MB", "الحد الأقصى للتخزين لكل ضيف / ميغابايت"),
    "Max upload per guest": p("Misafir başına azami yükleme", "الحد الأقصى للرفع لكل ضيف"),
    "Max upload / guest": p("Misafir başına azami yükleme", "الحد الأقصى للرفع لكل ضيف"),
    "Starter": p("Başlangıç", "المبتدئة"),
    "Standard": p("Standart", "القياسية"),
    "Premium": p("Premium", "المميزة"),
    "Recommended": p("Önerilen", "موصى بها"),
    "Small events": p("Küçük etkinlikler", "الفعاليات الصغيرة"),
    "Most events": p("Çoğu etkinlik", "معظم الفعاليات"),
    "Large events": p("Büyük etkinlikler", "الفعاليات الكبيرة"),
    "Best for small events, test usage, birthdays, and private gatherings.": p("Küçük etkinlikler, deneme kullanımı, doğum günleri ve özel buluşmalar için ideal.", "مثالية للفعاليات الصغيرة والتجربة وأعياد الميلاد والتجمعات الخاصة."),
    "Ideal for graduations, engagements, birthdays, and medium-size events.": p("Mezuniyetler, nişanlar, doğum günleri ve orta ölçekli etkinlikler için ideal.", "مثالية للتخرج والخطوبة وأعياد الميلاد والفعاليات المتوسطة."),
    "Designed for weddings, corporate events, crowded celebrations, and live galleries.": p("Düğünler, kurumsal etkinlikler, kalabalık kutlamalar ve canlı galeriler için tasarlandı.", "مصممة للأعراس وفعاليات الشركات والاحتفالات الكبيرة والمعارض الحية."),
    "50 guests": p("50 misafir", "50 ضيفًا"),
    "150 guests": p("150 misafir", "150 ضيفًا"),
    "Unlimited guests": p("Sınırsız misafir", "ضيوف بلا حدود"),
    "500 MB storage": p("500 MB depolama", "تخزين 500 ميغابايت"),
    "2 GB storage": p("2 GB depolama", "تخزين 2 غيغابايت"),
    "10 GB storage": p("10 GB depolama", "تخزين 10 غيغابايت"),
    "Photo uploads": p("Fotoğraf yüklemeleri", "رفع الصور"),
    "Message uploads": p("Mesaj yüklemeleri", "رفع الرسائل"),
    "Photo and video uploads": p("Fotoğraf ve video yüklemeleri", "رفع الصور والفيديو"),
    "Approval mode": p("Onay modu", "وضع الموافقة"),
    "Likes and comments": p("Beğeniler ve yorumlar", "الإعجابات والتعليقات"),
    "High-volume uploads": p("Yüksek hacimli yüklemeler", "رفع بأحجام كبيرة"),
    "Advanced moderation": p("Gelişmiş moderasyon", "إشراف متقدم"),
    "Live gallery ready": p("Canlı galeriye hazır", "جاهزة للمعرض الحي"),
    "Package price": p("Paket fiyatı", "سعر الباقة"),
    "Free": p("Ücretsiz", "مجانية"),
    "Generate Event Code": p("Etkinlik Kodu Oluştur", "إنشاء رمز الفعالية"),
    "Your event code will appear here.": p("Etkinlik kodun burada görünecek.", "سيظهر رمز فعاليتك هنا."),
    "After creating your event, share the generated code or QR with your guests.": p("Etkinliğini oluşturduktan sonra üretilen kodu veya QR’ı misafirlerinle paylaş.", "بعد إنشاء فعاليتك شارك الرمز أو رمز QR مع ضيوفك."),
    "QR code will appear here.": p("QR kodu burada görünecek.", "سيظهر رمز QR هنا."),
    "Download QR": p("QR’ı İndir", "تنزيل رمز QR"),
    "Share QR": p("QR’ı Paylaş", "مشاركة رمز QR"),
    "View My Events": p("Etkinliklerimi Görüntüle", "عرض فعالياتي"),
    "DEMO PAYMENT": p("DEMO ÖDEME", "دفع تجريبي"),
    "Complete demo payment": p("Demo ödemeyi tamamla", "إكمال الدفع التجريبي"),
    "This is a demo payment screen. No real payment will be processed.": p("Bu bir demo ödeme ekranıdır. Gerçek ödeme alınmayacaktır.", "هذه شاشة دفع تجريبية ولن تتم معالجة أي دفعة حقيقية."),
    "Selected package": p("Seçilen paket", "الباقة المختارة"),
    "Card holder": p("Kart sahibi", "حامل البطاقة"),
    "Expires": p("Son kullanım", "تاريخ الانتهاء"),
    "Payment details": p("Ödeme bilgileri", "تفاصيل الدفع"),
    "Card number": p("Kart numarası", "رقم البطاقة"),
    "Expiry": p("Son kullanım", "تاريخ الانتهاء"),
    "Pay Demo": p("Demo Ödemeyi Yap", "ادفع تجريبيًا"),
    "Demo mode only — this step is for UI testing.": p("Yalnızca demo modu — bu adım arayüz testi içindir.", "وضع تجريبي فقط — هذه الخطوة لاختبار الواجهة."),
    "Payment successful!": p("Ödeme başarılı!", "تم الدفع بنجاح!"),
    "Your demo payment has been completed. Enjoy your event!": p("Demo ödemen tamamlandı. Etkinliğinin keyfini çıkar!", "اكتملت دفعتك التجريبية. استمتع بفعاليتك!"),
    "Continue": p("Devam Et", "متابعة"),
    "Loading event detail...": p("Etkinlik ayrıntıları yükleniyor...", "جارٍ تحميل تفاصيل الفعالية..."),
    "Event could not be loaded.": p("Etkinlik yüklenemedi.", "تعذر تحميل الفعالية."),
    "Please try again later.": p("Lütfen daha sonra tekrar dene.", "يرجى المحاولة لاحقًا."),
    "Back to My Events": p("Etkinliklerime Dön", "العودة إلى فعالياتي"),
    "EVENT DETAIL": p("ETKİNLİK DETAYI", "تفاصيل الفعالية"),
    "Event Code": p("Etkinlik Kodu", "رمز الفعالية"),
    "Copy Code": p("Kodu Kopyala", "نسخ الرمز"),
    "Copy Join Link": p("Katılım Bağlantısını Kopyala", "نسخ رابط الانضمام"),
    "Download Slideshow": p("Slayt Gösterisini İndir", "تنزيل عرض الشرائح"),
    "Created": p("Oluşturuldu", "تاريخ الإنشاء"),
    "Status": p("Durum", "الحالة"),
    "Privacy": p("Gizlilik", "الخصوصية"),
    "Quick Upload": p("Hızlı Yükleme", "رفع سريع"),
    "Share your moment": p("Anını paylaş", "شارك لحظتك"),
    "Upload a photo to this event album from the dashboard.": p("Kontrol panelinden bu etkinlik albümüne bir fotoğraf yükle.", "ارفع صورة إلى ألبوم هذه الفعالية من لوحة التحكم."),
    "Your name": p("Adın", "اسمك"),
    "Your Name": p("Adın", "اسمك"),
    "Choose photo": p("Fotoğraf seç", "اختر صورة"),
    "Upload Photo": p("Fotoğraf Yükle", "رفع الصورة"),
    "Event permissions": p("Etkinlik izinleri", "صلاحيات الفعالية"),
    "Guests": p("Misafirler", "الضيوف"),
    "Event guests": p("Etkinlik misafirleri", "ضيوف الفعالية"),
    "See who joined this event and how many memories they uploaded.": p("Etkinliğe kimlerin katıldığını ve kaç anı yüklediklerini gör.", "اعرف من انضم إلى الفعالية وعدد الذكريات التي رفعها."),
    "Search guest": p("Misafir ara", "البحث عن ضيف"),
    "Guests will appear here.": p("Misafirler burada görünecek.", "سيظهر الضيوف هنا."),
    "Gallery": p("Galeri", "المعرض"),
    "Uploaded memories": p("Yüklenen anılar", "الذكريات المرفوعة"),
    "Filter, approve, reject or delete uploaded memories.": p("Yüklenen anıları filtrele, onayla, reddet veya sil.", "صفِّ الذكريات المرفوعة أو وافق عليها أو ارفضها أو احذفها."),
    "Approve All Photos": p("Tüm Fotoğrafları Onayla", "الموافقة على كل الصور"),
    "Uploaded by Guest": p("Misafir tarafından yüklendi", "رفعه ضيف"),
    "Manage this event": p("Bu etkinliği yönet", "إدارة هذه الفعالية"),
    "Update guest permissions or delete this event permanently.": p("Misafir izinlerini güncelle veya bu etkinliği kalıcı olarak sil.", "حدّث صلاحيات الضيوف أو احذف هذه الفعالية نهائيًا."),
    "Save Settings": p("Ayarları Kaydet", "حفظ الإعدادات"),
    "Delete Event": p("Etkinliği Sil", "حذف الفعالية"),
    "Loading approved gallery...": p("Onaylı galeri yükleniyor...", "جارٍ تحميل المعرض المعتمد..."),
    "Gallery could not be loaded.": p("Galeri yüklenemedi.", "تعذر تحميل المعرض."),
    "Please check the event code.": p("Lütfen etkinlik kodunu kontrol et.", "يرجى التحقق من رمز الفعالية."),
    "Approved Event Gallery": p("Onaylı Etkinlik Galerisi", "معرض الفعالية المعتمد"),
    "Participants": p("Katılımcılar", "المشاركون"),
    "Photos": p("Fotoğraflar", "الصور"),
    "Approved memories": p("Onaylı anılar", "الذكريات المعتمدة"),
    "Only photos approved by the event admin are shown here.": p("Burada yalnızca etkinlik yöneticisinin onayladığı fotoğraflar gösterilir.", "تُعرض هنا فقط الصور التي وافق عليها مدير الفعالية."),
    "One QR · Every guest · Every memory": p("Tek QR · Her misafir · Her anı", "رمز QR واحد · كل ضيف · كل ذكرى"),
    "Every guest.": p("Her misafir.", "كل ضيف."),
    "Every moment.": p("Her anı.", "كل لحظة."),
    "One shared album.": p("Tek albüm.", "ألبوم واحد."),
    "Create your event, share one QR code, and let guests upload photos, videos, and messages in real time. No app. No login. Just memories that come together.": p("Etkinliğini oluştur, tek bir QR kod paylaş ve misafirlerin fotoğraf, video ve mesajları anında yüklesin. Uygulama yok. Giriş yok. Yalnızca bir araya gelen anılar.", "أنشئ فعاليتك وشارك رمز QR واحدًا ودع الضيوف يرفعون الصور والفيديوهات والرسائل فورًا. بلا تطبيق وبلا تسجيل دخول، فقط ذكريات تجتمع معًا."),
    "No App Needed": p("Uygulama Gerekmez", "لا حاجة إلى تطبيق"),
    "Live Uploads": p("Canlı Yüklemeler", "رفع مباشر"),
    "All Memories in One Place": p("Tüm Anılar Tek Yerde", "كل الذكريات في مكان واحد"),
    "Upload your memory": p("Anını yükle", "ارفع ذكرياتك"),
    "Photo": p("Fotoğraf", "صورة"),
    "Video": p("Video", "فيديو"),
    "Message": p("Mesaj", "رسالة"),
    "new memories": p("yeni anı", "ذكريات جديدة"),
    "just now": p("az önce", "الآن"),
    "From one event code to a": p("Tek etkinlik kodundan", "من رمز فعالية واحد إلى"),
    "gallery full of memories.": p("anılarla dolu bir galeriye.", "معرض مليء بالذكريات."),
    "See the complete SnapUp experience in four simple steps. Select a step to explore what organizers and guests see.": p("SnapUp deneyiminin tamamını dört basit adımda gör. Organizatörlerin ve misafirlerin gördüklerini incelemek için bir adım seç.", "شاهد تجربة SnapUp كاملة في أربع خطوات بسيطة. اختر خطوة لاستكشاف ما يراه المنظمون والضيوف."),
    "Create the event": p("Etkinliği oluştur", "أنشئ الفعالية"),
    "Set the name, date, access, and upload rules.": p("Adı, tarihi, erişimi ve yükleme kurallarını belirle.", "حدّد الاسم والتاريخ وقواعد الوصول والرفع."),
    "Share the QR code": p("QR kodunu paylaş", "شارك رمز QR"),
    "Display it, print it, or send the event link.": p("Ekranda göster, yazdır veya etkinlik bağlantısını gönder.", "اعرضه أو اطبعه أو أرسل رابط الفعالية."),
    "Guests add memories": p("Misafirler anı ekler", "يضيف الضيوف الذكريات"),
    "Upload photos, videos, and messages—no app needed.": p("Fotoğraf, video ve mesaj yükle—uygulama gerekmez.", "ارفع الصور والفيديوهات والرسائل — بلا تطبيق."),
    "Enjoy the gallery": p("Galerinin keyfini çıkar", "استمتع بالمعرض"),
    "Approve, display, download, and relive everything.": p("Her şeyi onayla, göster, indir ve yeniden yaşa.", "وافق واعرض ونزّل وعش كل شيء من جديد."),
    "Organizer dashboard": p("Organizatör paneli", "لوحة المنظم"),
    "Create your event": p("Etkinliğini oluştur", "أنشئ فعاليتك"),
    "Your private event space is ready in under a minute.": p("Özel etkinlik alanın bir dakikadan kısa sürede hazır.", "مساحة فعاليتك الخاصة جاهزة في أقل من دقيقة."),
    "Visibility": p("Görünürlük", "الظهور"),
    "Private event": p("Özel etkinlik", "فعالية خاصة"),
    "Allow guest uploads": p("Misafir yüklemelerine izin ver", "السماح برفع الضيوف"),
    "Approve before publishing": p("Yayınlamadan önce onayla", "الموافقة قبل النشر"),
    "Create event": p("Etkinlik oluştur", "إنشاء الفعالية"),
    "Event ready": p("Etkinlik hazır", "الفعالية جاهزة"),
    "One code connects everyone.": p("Tek kod herkesi buluşturur.", "رمز واحد يجمع الجميع."),
    "Guests can scan the QR code or enter the event code.": p("Misafirler QR kodunu tarayabilir veya etkinlik kodunu girebilir.", "يمكن للضيوف مسح رمز QR أو إدخال رمز الفعالية."),
    "Copy code": p("Kodu kopyala", "نسخ الرمز"),
    "Add a memory": p("Bir anı ekle", "أضف ذكرى"),
    "No account or app download required.": p("Hesap veya uygulama indirmek gerekmez.", "لا يلزم حساب أو تنزيل تطبيق."),
    "Drop photo or video here": p("Fotoğrafı veya videoyu buraya bırak", "أفلت الصورة أو الفيديو هنا"),
    "or choose a memory type below": p("veya aşağıdan bir anı türü seç", "أو اختر نوع الذكرى أدناه"),
    "Send": p("Gönder", "إرسال"),
    "Uploading...": p("Yükleniyor...", "جارٍ الرفع..."),
    "Live gallery": p("Canlı galeri", "المعرض الحي"),
    "Every angle, together.": p("Her açı, hep birlikte.", "كل الزوايا معًا."),
    "128 memories collected from 42 guests.": p("42 misafirden 128 anı toplandı.", "جُمعت 128 ذكرى من 42 ضيفًا."),
    "Updating live": p("Canlı güncelleniyor", "يُحدّث مباشرة"),
    "No app download": p("Uygulama indirmeden", "بلا تنزيل تطبيق"),
    "Works on every phone": p("Her telefonda çalışır", "يعمل على كل هاتف"),
    "Private event access": p("Özel etkinlik erişimi", "وصول خاص للفعالية"),
    "Built for every moment": p("Her an için tasarlandı", "مصمم لكل لحظة"),
    "Everything your guests need to capture the night.": p("Misafirlerinin geceyi yakalaması için gereken her şey.", "كل ما يحتاجه ضيوفك لالتقاط ذكريات الليلة."),
    "SnapUp turns every phone into a shared event camera. Guests scan, upload, and the live gallery updates like a real-time memory wall.": p("SnapUp her telefonu ortak bir etkinlik kamerasına dönüştürür. Misafirler tarar, yükler ve canlı galeri gerçek zamanlı bir anı duvarı gibi güncellenir.", "يحوّل SnapUp كل هاتف إلى كاميرا مشتركة للفعالية. يمسح الضيوف الرمز ويرفعون المحتوى ويتحدث المعرض الحي كجدار ذكريات فوري."),
    "LIVE CAPTURE MODE": p("CANLI YAKALAMA MODU", "وضع الالتقاط المباشر"),
    "One QR code. A whole event through everyone’s lens.": p("Tek QR kodu. Herkesin gözünden bütün bir etkinlik.", "رمز QR واحد. فعالية كاملة بعدسات الجميع."),
    "Photos, videos, and messages arrive instantly in one organized gallery — ready for screens, downloads, and sharing.": p("Fotoğraflar, videolar ve mesajlar anında düzenli tek galeride buluşur — ekranda gösterilmeye, indirilmeye ve paylaşılmaya hazır.", "تصل الصور والفيديوهات والرسائل فورًا إلى معرض منظم واحد — جاهزة للعرض والتنزيل والمشاركة."),
    "guests live": p("canlı misafir", "ضيف مباشر"),
    "quality ready": p("kaliteye hazır", "جودة جاهزة"),
    "upload flow": p("yükleme akışı", "عملية الرفع"),
    "Live Gallery Wall": p("Canlı Galeri Duvarı", "جدار المعرض الحي"),
    "Show uploaded memories instantly on a venue screen or shared gallery.": p("Yüklenen anıları mekân ekranında veya ortak galeride anında göster.", "اعرض الذكريات المرفوعة فورًا على شاشة المكان أو المعرض المشترك."),
    "Guests join from any phone browser with only a QR code or event code.": p("Misafirler yalnızca QR veya etkinlik koduyla herhangi bir telefon tarayıcısından katılır.", "ينضم الضيوف من أي متصفح هاتف باستخدام رمز QR أو رمز الفعالية فقط."),
    "Photo, Video & Message Uploads": p("Fotoğraf, Video ve Mesaj Yüklemeleri", "رفع الصور والفيديو والرسائل"),
    "Collect every kind of memory in the same event timeline.": p("Her tür anıyı aynı etkinlik akışında topla.", "اجمع كل أنواع الذكريات في خط زمني واحد للفعالية."),
    "Private Event Access": p("Özel Etkinlik Erişimi", "وصول خاص للفعالية"),
    "Only invited guests with the code can upload and view memories.": p("Yalnızca koda sahip davetli misafirler anıları yükleyip görüntüleyebilir.", "يمكن فقط للضيوف المدعوين الذين يملكون الرمز رفع الذكريات وعرضها."),
    "Download & Share": p("İndir ve Paylaş", "تنزيل ومشاركة"),
    "Export your event memories or keep the gallery link alive.": p("Etkinlik anılarını dışa aktar veya galeri bağlantısını açık tut.", "صدّر ذكريات فعاليتك أو أبقِ رابط المعرض فعالًا."),
    "Pricing & packages": p("Fiyatlandırma ve paketler", "الأسعار والباقات"),
    "Choose the right package for your event.": p("Etkinliğin için doğru paketi seç.", "اختر الباقة المناسبة لفعاليتك."),
    "Start small, scale when your guest count grows. Each package keeps the same simple SnapUp flow: create event, share code, collect memories.": p("Küçük başla, misafir sayın arttığında büyüt. Her paket aynı basit SnapUp akışını korur: etkinlik oluştur, kodu paylaş, anıları topla.", "ابدأ ببساطة وتوسّع عندما يزيد عدد الضيوف. تحافظ كل باقة على مسار SnapUp نفسه: أنشئ فعالية وشارك الرمز واجمع الذكريات."),
    "/ event": p("/ etkinlik", "/ فعالية"),
    "Up to 50 guests": p("50 misafire kadar", "حتى 50 ضيفًا"),
    "Up to 150 guests": p("150 misafire kadar", "حتى 150 ضيفًا"),
    "500 MB event storage": p("500 MB etkinlik depolaması", "تخزين فعالية 500 ميغابايت"),
    "2 GB event storage": p("2 GB etkinlik depolaması", "تخزين فعالية 2 غيغابايت"),
    "10 GB event storage": p("10 GB etkinlik depolaması", "تخزين فعالية 10 غيغابايت"),
    "Photo and message uploads": p("Fotoğraf ve mesaj yüklemeleri", "رفع الصور والرسائل"),
    "Basic QR and event code": p("Temel QR ve etkinlik kodu", "رمز QR ورمز فعالية أساسيان"),
    "Guest upload limits": p("Misafir yükleme sınırları", "حدود رفع الضيوف"),
    "Choose Starter": p("Başlangıç Paketini Seç", "اختر الباقة المبتدئة"),
    "Photo, video, and message uploads": p("Fotoğraf, video ve mesaj yüklemeleri", "رفع الصور والفيديو والرسائل"),
    "Approval mode for uploads": p("Yüklemeler için onay modu", "وضع الموافقة على الملفات"),
    "Gallery view and likes": p("Galeri görünümü ve beğeniler", "عرض المعرض والإعجابات"),
    "Choose Standard": p("Standart Paketi Seç", "اختر الباقة القياسية"),
    "High-volume video uploads": p("Yüksek hacimli video yüklemeleri", "رفع فيديو بكميات كبيرة"),
    "Advanced moderation settings": p("Gelişmiş moderasyon ayarları", "إعدادات إشراف متقدمة"),
    "Best for live gallery screens": p("Canlı galeri ekranları için ideal", "مثالية لشاشات المعرض الحي"),
    "Choose Premium": p("Premium Paketi Seç", "اختر الباقة المميزة"),
    "Bring every photo, video, and message from your event together in one shared gallery.": p("Etkinliğindeki tüm fotoğraf, video ve mesajları tek ortak galeride buluştur.", "اجمع كل صور وفيديوهات ورسائل فعاليتك في معرض مشترك واحد."),
    "Explore": p("Keşfet", "استكشف"),
    "Account": p("Hesap", "الحساب"),
    "Contact": p("İletişim", "التواصل"),
    "Questions or feedback? We would love to hear from you.": p("Sorun veya geri bildirimin mi var? Seni dinlemek isteriz.", "لديك سؤال أو ملاحظة؟ يسعدنا سماعك."),
    "© 2026 SnapUp Events. All rights reserved.": p("© 2026 SnapUp Events. Tüm hakları saklıdır.", "© 2026 SnapUp Events. جميع الحقوق محفوظة."),
    "Privacy Policy": p("Gizlilik Politikası", "سياسة الخصوصية"),
    "Terms of Use": p("Kullanım Koşulları", "شروط الاستخدام"),
    "JOIN EVENT": p("ETKİNLİĞE KATIL", "الانضمام إلى فعالية"),
    "Enter the event code, choose media type, and send your memory.": p("Etkinlik kodunu gir, medya türünü seç ve anını gönder.", "أدخل رمز الفعالية واختر نوع الوسائط وأرسل ذكرياتك."),
    "Choose Media": p("Medya Seç", "اختر الوسائط"),
    "Text": p("Metin", "نص"),
    "Image": p("Görsel", "صورة"),
    "Select File(s)": p("Dosya(ları) Seç", "اختر ملفًا أو ملفات"),
    "Send to Event": p("Etkinliğe Gönder", "إرسال إلى الفعالية"),
    "WELCOME BACK": p("TEKRAR HOŞ GELDİN", "مرحبًا بعودتك"),
    "Continue managing your event memories.": p("Etkinlik anılarını yönetmeye devam et.", "واصل إدارة ذكريات فعاليتك."),
    "Login to access your account, event galleries, guest settings, and private uploads.": p("Hesabına, etkinlik galerilerine, misafir ayarlarına ve özel yüklemelere erişmek için giriş yap.", "سجّل الدخول للوصول إلى حسابك ومعارض فعالياتك وإعدادات الضيوف والملفات الخاصة."),
    "Welcome back.": p("Tekrar hoş geldin.", "مرحبًا بعودتك."),
    "Login to manage your SnapUp account and event galleries.": p("SnapUp hesabını ve etkinlik galerilerini yönetmek için giriş yap.", "سجّل الدخول لإدارة حساب SnapUp ومعارض فعالياتك."),
    "Don't have an account?": p("Hesabın yok mu?", "ليس لديك حساب؟"),
    "PRIVATE EVENT GALLERY": p("ÖZEL ETKİNLİK GALERİSİ", "معرض فعالية خاص"),
    "Create once. Share with every guest.": p("Bir kez oluştur. Her misafirle paylaş.", "أنشئ مرة وشارك مع كل ضيف."),
    "Register to manage your events, package settings, upload rules, and guest access from one clean dashboard.": p("Etkinliklerini, paket ayarlarını, yükleme kurallarını ve misafir erişimini tek bir sade panelden yönetmek için kayıt ol.", "أنشئ حسابًا لإدارة فعالياتك وإعدادات الباقات وقواعد الرفع ووصول الضيوف من لوحة واحدة."),
    "Start your SnapUp journey.": p("SnapUp yolculuğuna başla.", "ابدأ رحلتك مع SnapUp."),
    "Create your account and manage your private event memories in one place.": p("Hesabını oluştur ve özel etkinlik anılarını tek yerde yönet.", "أنشئ حسابك وأدر ذكريات فعالياتك الخاصة في مكان واحد."),
    "Already have an account?": p("Zaten hesabın var mı?", "لديك حساب بالفعل؟"),
    "Skip to policy": p("Politikaya geç", "الانتقال إلى السياسة"),
    "Summary": p("Özet", "الملخص"),
    "Your rights": p("Hakların", "حقوقك"),
    "Legal & privacy": p("Hukuk ve gizlilik", "القانون والخصوصية"),
    "Effective date": p("Yürürlük tarihi", "تاريخ السريان"),
    "Last updated": p("Son güncelleme", "آخر تحديث"),
    "Version": p("Sürüm", "الإصدار"),
    "On this page": p("Bu sayfada", "في هذه الصفحة"),
    "Plain-language summary": p("Sade dilde özet", "ملخص بلغة مبسطة"),
    "Scope and roles": p("Kapsam ve roller", "النطاق والأدوار"),
    "Data we collect": p("Topladığımız veriler", "البيانات التي نجمعها"),
    "How we collect data": p("Verileri nasıl toplarız", "كيف نجمع البيانات"),
    "Purposes and legal bases": p("Amaçlar ve hukuki sebepler", "الأغراض والأسس القانونية"),
    "Event content and privacy": p("Etkinlik içeriği ve gizlilik", "محتوى الفعالية والخصوصية"),
    "Sharing and service providers": p("Paylaşım ve hizmet sağlayıcıları", "المشاركة ومقدمو الخدمات"),
    "International transfers": p("Uluslararası aktarımlar", "النقل الدولي"),
    "Data retention": p("Veri saklama", "الاحتفاظ بالبيانات"),
    "Security": p("Güvenlik", "الأمان"),
    "Cookies and local storage": p("Çerezler ve yerel depolama", "ملفات الارتباط والتخزين المحلي"),
    "Children": p("Çocuklar", "الأطفال"),
    "Changes to this policy": p("Bu politikadaki değişiklikler", "التغييرات على هذه السياسة"),
    "Contact and requests": p("İletişim ve talepler", "التواصل والطلبات"),
    "Pre-launch legal checklist": p("Yayın öncesi hukuki kontrol listesi", "قائمة التحقق القانونية قبل الإطلاق"),
    "You control what you upload": p("Ne yüklediğini sen kontrol edersin", "أنت تتحكم فيما ترفعه"),
    "Organizers manage event access": p("Organizatörler etkinlik erişimini yönetir", "يدير المنظمون وصول الفعالية"),
    "We use infrastructure providers": p("Altyapı sağlayıcıları kullanırız", "نستخدم مزودي البنية التحتية"),
    "You can make a privacy request": p("Gizlilik talebi oluşturabilirsin", "يمكنك تقديم طلب خصوصية"),
    "Scope and privacy roles": p("Kapsam ve gizlilik rolleri", "النطاق وأدوار الخصوصية"),
    "Personal data we collect": p("Topladığımız kişisel veriler", "البيانات الشخصية التي نجمعها"),
    "Category": p("Kategori", "الفئة"),
    "Examples": p("Örnekler", "أمثلة"),
    "Usually relates to": p("Genellikle ilgili kişiler", "يتعلق عادةً بـ"),
    "Account data": p("Hesap verileri", "بيانات الحساب"),
    "Event data": p("Etkinlik verileri", "بيانات الفعالية"),
    "Guest data": p("Misafir verileri", "بيانات الضيف"),
    "Uploaded content": p("Yüklenen içerik", "المحتوى المرفوع"),
    "Engagement data": p("Etkileşim verileri", "بيانات التفاعل"),
    "Technical data": p("Teknik veriler", "البيانات التقنية"),
    "Support data": p("Destek verileri", "بيانات الدعم"),
    "How we collect personal data": p("Kişisel verileri nasıl toplarız", "كيف نجمع البيانات الشخصية"),
    "Directly from you": p("Doğrudan senden", "مباشرة منك"),
    "From organizers or other guests": p("Organizatörlerden veya diğer misafirlerden", "من المنظمين أو الضيوف الآخرين"),
    "Automatically": p("Otomatik olarak", "تلقائيًا"),
    "From service providers": p("Hizmet sağlayıcılarından", "من مقدمي الخدمات"),
    "Why we use data and our legal bases": p("Verileri neden kullandığımız ve hukuki sebeplerimiz", "لماذا نستخدم البيانات وأسُسنا القانونية"),
    "Provide the Service": p("Hizmeti sunmak", "تقديم الخدمة"),
    "Secure and protect SnapUp": p("SnapUp’ı güvenli tutmak", "تأمين وحماية SnapUp"),
    "Operate and improve reliability": p("Hizmeti işletmek ve güvenilirliği artırmak", "تشغيل الخدمة وتحسين موثوقيتها"),
    "Communicate with you": p("Seninle iletişim kurmak", "التواصل معك"),
    "Comply with law and legal claims": p("Hukuka ve hukuki taleplere uymak", "الامتثال للقانون والمطالبات القانونية"),
    "Optional processing": p("İsteğe bağlı işleme", "المعالجة الاختيارية"),
    "Consent": p("Açık rıza", "الموافقة"),
    "Event content, visibility, and organizer responsibilities": p("Etkinlik içeriği, görünürlük ve organizatör sorumlulukları", "محتوى الفعالية وظهوره ومسؤوليات المنظم"),
    "An event code is not the same as a password.": p("Etkinlik kodu bir şifreyle aynı değildir.", "رمز الفعالية ليس كلمة مرور."),
    "When personal data may be shared": p("Kişisel veriler ne zaman paylaşılabilir", "متى يمكن مشاركة البيانات الشخصية"),
    "We do not sell personal data. We may disclose data to:": p("Kişisel verileri satmayız. Verileri şu taraflarla paylaşabiliriz:", "لا نبيع البيانات الشخصية. قد نفصح عنها إلى:"),
    "Event organizers and participants": p("Etkinlik organizatörleri ve katılımcıları", "منظمي الفعالية والمشاركين"),
    "Infrastructure and service providers": p("Altyapı ve hizmet sağlayıcıları", "مزودي البنية التحتية والخدمات"),
    "Professional advisers": p("Profesyonel danışmanlar", "المستشارين المهنيين"),
    "Authorities or other parties": p("Yetkili makamlar veya diğer taraflar", "السلطات أو الأطراف الأخرى"),
    "A successor organization": p("Halef kuruluş", "جهة خلف"),
    "International data transfers": p("Uluslararası veri aktarımları", "نقل البيانات الدولي"),
    "Deployment detail to confirm before launch": p("Yayından önce doğrulanacak dağıtım bilgisi", "تفاصيل الاستضافة المطلوب تأكيدها قبل الإطلاق"),
    "How long we keep data": p("Verileri ne kadar süre saklarız", "مدة احتفاظنا بالبيانات"),
    "Data": p("Veri", "البيانات"),
    "Proposed retention rule": p("Önerilen saklama kuralı", "قاعدة الاحتفاظ المقترحة"),
    "Active account data": p("Aktif hesap verileri", "بيانات الحساب النشط"),
    "Event and uploaded media": p("Etkinlik ve yüklenen medya", "الفعالية والوسائط المرفوعة"),
    "Deleted account or event data": p("Silinen hesap veya etkinlik verileri", "بيانات الحساب أو الفعالية المحذوفة"),
    "Backups": p("Yedekler", "النسخ الاحتياطية"),
    "Security and technical logs": p("Güvenlik ve teknik günlükler", "سجلات الأمان والسجلات التقنية"),
    "Legal and request records": p("Hukuki kayıtlar ve talep kayıtları", "السجلات القانونية وسجلات الطلبات"),
    "How we protect data": p("Verileri nasıl koruruz", "كيف نحمي البيانات"),
    "Cookies, tokens, and local storage": p("Çerezler, belirteçler ve yerel depolama", "ملفات الارتباط والرموز والتخزين المحلي"),
    "Your privacy rights": p("Gizlilik hakların", "حقوق الخصوصية الخاصة بك"),
    "Rights under Türkiye’s Law No. 6698 (KVKK)": p("6698 sayılı Kanun (KVKK) kapsamındaki haklar", "الحقوق بموجب القانون التركي رقم 6698"),
    "Rights under the GDPR/EEA framework": p("GDPR/AEA çerçevesindeki haklar", "الحقوق بموجب إطار GDPR/المنطقة الاقتصادية الأوروبية"),
    "Event-specific requests": p("Etkinliğe özel talepler", "طلبات خاصة بالفعالية"),
    "Children’s privacy": p("Çocukların gizliliği", "خصوصية الأطفال"),
    "Changes to this Privacy Policy": p("Bu Gizlilik Politikasındaki değişiklikler", "التغييرات على سياسة الخصوصية"),
    "Contact us or submit a request": p("Bizimle iletişime geç veya talep gönder", "تواصل معنا أو قدم طلبًا"),
    "Controller": p("Veri sorumlusu", "مسؤول البيانات"),
    "Controller:": p("Veri sorumlusu:", "مسؤول البيانات:"),
    "Address:": p("Adres:", "العنوان:"),
    "Privacy email": p("Gizlilik e-postası", "بريد الخصوصية"),
    "Privacy email:": p("Gizlilik e-postası:", "بريد الخصوصية:"),
    "Postal address": p("Posta adresi", "العنوان البريدي"),
    "Return to": p("Geri dön", "العودة إلى"),
    "Related document": p("İlgili belge", "وثيقة ذات صلة"),
    "SnapUp Events home →": p("SnapUp Events ana sayfası →", "الصفحة الرئيسية لـ SnapUp Events ←"),
    "Terms of Use →": p("Kullanım Koşulları →", "شروط الاستخدام ←"),
    "Example: Melih Graduation Party": p("Örnek: Melih Mezuniyet Partisi", "مثال: حفل تخرج مليح"),
    "Example: Istanbul": p("Örnek: İstanbul", "مثال: إسطنبول"),
    "Write a short description for your event...": p("Etkinliğin için kısa bir açıklama yaz...", "اكتب وصفًا قصيرًا لفعاليتك..."),
    "Enter card holder name": p("Kart sahibinin adını gir", "أدخل اسم حامل البطاقة"),
    "Search by guest name...": p("Misafir adına göre ara...", "ابحث باسم الضيف..."),
    "Enter your name": p("Adını gir", "أدخل اسمك"),
    "Example: A7K92P": p("Örnek: A7K92P", "مثال: A7K92P"),
    "Write a memory or wish...": p("Bir anı veya dilek yaz...", "اكتب ذكرى أو أمنية..."),
    "Write your memory or wish...": p("Anını veya dileğini yaz...", "اكتب ذكرياتك أو أمنيتك..."),
    "Copied!": p("Kopyalandı!", "تم النسخ!"),
    "Uploaded!": p("Yüklendi!", "تم الرفع!"),
    "Processing...": p("İşleniyor...", "جارٍ التنفيذ..."),
    "Creating your event...": p("Etkinliğin oluşturuluyor...", "جارٍ إنشاء فعاليتك..."),
    "Payment Completed": p("Ödeme Tamamlandı", "اكتمل الدفع"),
    "Try Again": p("Tekrar Dene", "حاول مجددًا"),
    "Event could not be created.": p("Etkinlik oluşturulamadı.", "تعذر إنشاء الفعالية."),
    "Email address is required.": p("E-posta adresi zorunludur.", "البريد الإلكتروني مطلوب."),
    "Password is required.": p("Şifre zorunludur.", "كلمة المرور مطلوبة."),
    "Logging in...": p("Giriş yapılıyor...", "جارٍ تسجيل الدخول..."),
    "Full name is required.": p("Ad soyad zorunludur.", "الاسم الكامل مطلوب."),
    "Password must be at least 6 characters.": p("Şifre en az 6 karakter olmalıdır.", "يجب ألا تقل كلمة المرور عن 6 أحرف."),
    "Please confirm your password.": p("Lütfen şifreni doğrula.", "يرجى تأكيد كلمة المرور."),
    "Passwords do not match.": p("Şifreler eşleşmiyor.", "كلمتا المرور غير متطابقتين."),
    "Creating account...": p("Hesap oluşturuluyor...", "جارٍ إنشاء الحساب..."),
    "This email address is already registered.": p("Bu e-posta adresi zaten kayıtlı.", "هذا البريد الإلكتروني مسجل بالفعل."),
    "Untitled Event": p("Başlıksız Etkinlik", "فعالية بلا عنوان"),
    "Like action failed.": p("Beğeni işlemi başarısız oldu.", "فشلت عملية الإعجاب."),
    "Sending...": p("Gönderiliyor...", "جارٍ الإرسال..."),
    "View Gallery": p("Galeriyi Görüntüle", "عرض المعرض"),
    "Selected files": p("Seçilen dosyalar", "الملفات المختارة"),
    "Clear all": p("Tümünü temizle", "مسح الكل"),
    "Remove": p("Kaldır", "إزالة"),
    "Event could not be found.": p("Etkinlik bulunamadı.", "تعذر العثور على الفعالية."),
    "Message could not be sent.": p("Mesaj gönderilemedi.", "تعذر إرسال الرسالة."),
    "Please choose at least one file.": p("Lütfen en az bir dosya seç.", "يرجى اختيار ملف واحد على الأقل."),
    "Checking event code...": p("Etkinlik kodu kontrol ediliyor...", "جارٍ التحقق من رمز الفعالية..."),
    "Event found. You can send your memory.": p("Etkinlik bulundu. Anını gönderebilirsin.", "تم العثور على الفعالية. يمكنك إرسال ذكرياتك."),
    "Please enter event code.": p("Lütfen etkinlik kodunu gir.", "يرجى إدخال رمز الفعالية."),
    "Please enter your name.": p("Lütfen adını gir.", "يرجى إدخال اسمك."),
    "Please write a message.": p("Lütfen bir mesaj yaz.", "يرجى كتابة رسالة."),
    "Sending message...": p("Mesaj gönderiliyor...", "جارٍ إرسال الرسالة..."),
    "Message sent successfully!": p("Mesaj başarıyla gönderildi!", "تم إرسال الرسالة بنجاح!"),
    "Upload failed.": p("Yükleme başarısız oldu.", "فشل الرفع."),
    "Passive": p("Pasif", "غير نشط"),
    "Private": p("Özel", "خاص"),
    "Public": p("Herkese Açık", "عام"),
    "No guests have joined this event yet.": p("Bu etkinliğe henüz hiçbir misafir katılmadı.", "لم ينضم أي ضيف إلى هذه الفعالية بعد."),
    "Settings could not be updated.": p("Ayarlar güncellenemedi.", "تعذر تحديث الإعدادات."),
    "Event could not be deleted.": p("Etkinlik silinemedi.", "تعذر حذف الفعالية."),
    "Photo upload failed.": p("Fotoğraf yükleme başarısız oldu.", "فشل رفع الصورة."),
    "Preparing...": p("Hazırlanıyor...", "جارٍ التحضير..."),
    "Saving...": p("Kaydediliyor...", "جارٍ الحفظ..."),
    "Settings updated successfully.": p("Ayarlar başarıyla güncellendi.", "تم تحديث الإعدادات بنجاح."),
    "Deleting...": p("Siliniyor...", "جارٍ الحذف..."),
    "Approving...": p("Onaylanıyor...", "جارٍ الاعتماد..."),
    "Backend connection error.": p("Sunucu bağlantı hatası.", "خطأ في الاتصال بالخادم."),
    "Full name and email are required.": p("Ad soyad ve e-posta zorunludur.", "الاسم الكامل والبريد الإلكتروني مطلوبان."),
    "Update failed.": p("Güncelleme başarısız oldu.", "فشل التحديث."),
    "Account updated successfully.": p("Hesap başarıyla güncellendi.", "تم تحديث الحساب بنجاح."),
    "All password fields are required.": p("Tüm şifre alanları zorunludur.", "جميع حقول كلمة المرور مطلوبة."),
    "New password must be at least 6 characters.": p("Yeni şifre en az 6 karakter olmalıdır.", "يجب ألا تقل كلمة المرور الجديدة عن 6 أحرف."),
    "New passwords do not match.": p("Yeni şifreler eşleşmiyor.", "كلمتا المرور الجديدتان غير متطابقتين."),
    "Changing...": p("Değiştiriliyor...", "جارٍ التغيير..."),
    "Password update failed.": p("Şifre güncelleme başarısız oldu.", "فشل تحديث كلمة المرور."),
    "Password changed successfully.": p("Şifre başarıyla değiştirildi.", "تم تغيير كلمة المرور بنجاح.")
  };

  const policyParagraphs = {
    "This notice explains what personal data SnapUp Events processes, why we process it, who may receive it, how long it may be kept, and the choices and rights available to you.": p(
      "Bu bildirim, SnapUp Events’in hangi kişisel verileri işlediğini, bunları neden işlediğimizi, kimlerin alabileceğini, ne kadar süre saklanabileceğini ve sahip olduğun tercih ve hakları açıklar.",
      "يوضح هذا الإشعار البيانات الشخصية التي تعالجها SnapUp Events وأسباب معالجتها والجهات التي قد تستلمها ومدة الاحتفاظ بها والخيارات والحقوق المتاحة لك."
    ),
    "SnapUp Events helps event organizers create shared event spaces where guests can upload photos, videos, and messages. We process the information needed to provide that service, keep accounts and events secure, respond to requests, and improve reliability.": p(
      "SnapUp Events, organizatörlerin misafirlerin fotoğraf, video ve mesaj yükleyebildiği ortak etkinlik alanları oluşturmasına yardımcı olur. Bu hizmeti sunmak, hesapları ve etkinlikleri güvenli tutmak, talepleri yanıtlamak ve güvenilirliği artırmak için gerekli bilgileri işleriz.",
      "تساعد SnapUp Events منظمي الفعاليات على إنشاء مساحات مشتركة يرفع فيها الضيوف الصور والفيديوهات والرسائل. نعالج المعلومات اللازمة لتقديم الخدمة وتأمين الحسابات والفعاليات والرد على الطلبات وتحسين الموثوقية."
    ),
    "Only upload content you are allowed to share. Event media may contain personal data about you and other people.": p(
      "Yalnızca paylaşma hakkına sahip olduğun içerikleri yükle. Etkinlik medyası senin ve diğer kişilerin kişisel verilerini içerebilir.",
      "ارفع فقط المحتوى المسموح لك بمشاركته. قد تتضمن وسائط الفعالية بيانات شخصية عنك وعن أشخاص آخرين."
    ),
    "Organizers choose event settings, may approve content, and can control whether a gallery is restricted or shareable.": p(
      "Organizatörler etkinlik ayarlarını seçer, içerikleri onaylayabilir ve galerinin kısıtlı mı yoksa paylaşılabilir mi olacağını kontrol edebilir.",
      "يختار المنظمون إعدادات الفعالية وقد يوافقون على المحتوى ويتحكمون في كون المعرض مقيّدًا أو قابلًا للمشاركة."
    ),
    "Hosting, database, media delivery, and security providers may process data on our behalf to operate the service.": p(
      "Barındırma, veri tabanı, medya dağıtımı ve güvenlik sağlayıcıları hizmeti işletmek için bizim adımıza veri işleyebilir.",
      "قد يعالج مزودو الاستضافة وقواعد البيانات وتوصيل الوسائط والأمان البيانات نيابةً عنا لتشغيل الخدمة."
    ),
    "Depending on applicable law, you may ask to access, correct, delete, restrict, or obtain information about your data.": p(
      "Uygulanabilir hukuka bağlı olarak verilerine erişmeyi, verilerini düzeltmeyi, silmeyi, kısıtlamayı veya verilerin hakkında bilgi almayı talep edebilirsin.",
      "وفقًا للقانون المطبق، يمكنك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها أو تقييدها أو الحصول على معلومات عنها."
    ),
    "An event organizer decides why an event is created, who is invited, what guests are asked to upload, and how event content is used. Depending on the circumstances and applicable law, the organizer may be an independent data controller for that event content, while SnapUp Events may act as a service provider or data processor on the organizer’s behalf. Guests should contact the organizer first for event-specific questions when practical.": p(
      "Etkinlik organizatörü, etkinliğin neden oluşturulduğuna, kimlerin davet edildiğine, misafirlerden ne yüklemelerinin istendiğine ve içeriğin nasıl kullanılacağına karar verir. Koşullara ve uygulanabilir hukuka göre organizatör bu içerik için bağımsız veri sorumlusu olabilir; SnapUp Events ise organizatör adına hizmet sağlayıcı veya veri işleyen olarak hareket edebilir. Misafirler, mümkün olduğunda etkinliğe özel sorular için önce organizatörle iletişime geçmelidir.",
      "يقرر منظم الفعالية سبب إنشائها والمدعوين وما يُطلب من الضيوف رفعه وكيفية استخدام المحتوى. بحسب الظروف والقانون المطبق قد يكون المنظم مسؤول بيانات مستقلًا عن محتوى الفعالية، بينما قد تعمل SnapUp Events كمزود خدمة أو معالج بيانات نيابةً عنه. ينبغي للضيوف التواصل أولًا مع المنظم بشأن الأسئلة الخاصة بالفعالية متى كان ذلك عمليًا."
    ),
    "We do not intentionally use facial recognition, biometric identification, precise location tracking, advertising profiles, or automated decisions that produce legal or similarly significant effects. Photos or videos may nevertheless reveal sensitive information—such as health, religion, political views, or biometric characteristics—depending on what they show. Do not upload such content unless you have a lawful basis and all necessary permissions.": p(
      "Yüz tanıma, biyometrik kimlik tespiti, hassas konum takibi, reklam profilleri veya hukuki ya da benzer derecede önemli sonuç doğuran otomatik kararları bilinçli olarak kullanmayız. Bununla birlikte fotoğraf veya videolar, gösterdiklerine bağlı olarak sağlık, din, siyasi görüş veya biyometrik özellikler gibi hassas bilgileri açığa çıkarabilir. Hukuki dayanağın ve gerekli tüm izinlerin yoksa böyle içerikleri yükleme.",
      "لا نستخدم عمدًا التعرف على الوجه أو تحديد الهوية البيومترية أو تتبع الموقع الدقيق أو الملفات الإعلانية أو القرارات الآلية ذات الآثار القانونية المهمة. ومع ذلك قد تكشف الصور أو الفيديوهات معلومات حساسة كالصحة أو الدين أو الآراء السياسية أو السمات البيومترية. لا ترفع هذا المحتوى دون أساس قانوني وجميع الأذونات اللازمة."
    ),
    "The legal basis depends on the data, your relationship with us, and the law that applies. We may process personal data for the following purposes:": p(
      "Hukuki sebep; veriye, bizimle ilişkine ve uygulanabilir hukuka bağlıdır. Kişisel verileri aşağıdaki amaçlarla işleyebiliriz:",
      "يعتمد الأساس القانوني على البيانات وعلاقتك بنا والقانون المطبق. قد نعالج البيانات الشخصية للأغراض التالية:"
    ),
    "Anyone who receives or forwards a working event code or link may be able to reach the related event, subject to its settings. Do not publish codes for private events in public places.": p(
      "Çalışan bir etkinlik kodunu veya bağlantısını alan ya da ileten herkes, etkinlik ayarlarına bağlı olarak ilgili etkinliğe erişebilir. Özel etkinlik kodlarını herkese açık yerlerde yayımlama.",
      "قد يتمكن كل من يتلقى رمز فعالية أو رابطًا صالحًا أو يعيد توجيهه من الوصول إلى الفعالية وفق إعداداتها. لا تنشر رموز الفعاليات الخاصة في أماكن عامة."
    ),
    "Uploaders must have permission to share their content and must respect the privacy, publicity, copyright, and other rights of people shown or heard in it.": p(
      "Yükleme yapan kişiler içeriği paylaşma iznine sahip olmalı ve içerikte görülen veya duyulan kişilerin gizlilik, kişilik, telif ve diğer haklarına saygı göstermelidir.",
      "يجب أن يملك رافعو المحتوى إذنًا لمشاركته وأن يحترموا خصوصية وحقوق الصورة والنشر والتأليف وغيرها للأشخاص الظاهرين أو المسموعين فيه."
    ),
    "The providers that operate SnapUp Events may process or store data in countries other than the country where you live. This may include countries whose data-protection laws differ from local law.": p(
      "SnapUp Events’i işleten sağlayıcılar verileri yaşadığın ülkeden farklı ülkelerde işleyebilir veya saklayabilir. Bu ülkelerin veri koruma yasaları yerel hukuktan farklı olabilir.",
      "قد يعالج مزودو SnapUp Events البيانات أو يخزنونها في دول غير الدولة التي تقيم فيها، وقد تختلف قوانين حماية البيانات فيها عن القوانين المحلية."
    ),
    "We keep personal data only for as long as reasonably necessary for the purposes described in this policy, including providing the Service, maintaining security, resolving disputes, enforcing agreements, and meeting legal obligations.": p(
      "Kişisel verileri yalnızca Hizmeti sunmak, güvenliği sağlamak, uyuşmazlıkları çözmek, sözleşmeleri uygulamak ve hukuki yükümlülükleri yerine getirmek dahil bu politikada açıklanan amaçlar için makul ölçüde gerekli olduğu sürece saklarız.",
      "نحتفظ بالبيانات الشخصية فقط للمدة اللازمة بصورة معقولة للأغراض الموضحة في هذه السياسة، بما يشمل تقديم الخدمة والحفاظ على الأمان وحل النزاعات وإنفاذ الاتفاقيات والوفاء بالالتزامات القانونية."
    ),
    "We use technical and organizational measures designed to protect personal data against accidental or unlawful destruction, loss, alteration, unauthorized disclosure, or access. Measures may include password hashing, authentication tokens, access controls, encrypted transport, provider security features, least-privilege database rules, logging, moderation controls, backups, and dependency maintenance.": p(
      "Kişisel verileri kazara veya hukuka aykırı imha, kayıp, değişiklik, yetkisiz açıklama ya da erişime karşı korumak için tasarlanmış teknik ve organizasyonel önlemler kullanırız. Bunlar şifrelerin özetlenmesi, kimlik doğrulama belirteçleri, erişim kontrolleri, şifreli aktarım, sağlayıcı güvenlik özellikleri, en az yetkili veri tabanı kuralları, günlükleme, moderasyon kontrolleri, yedekler ve bağımlılık bakımı içerebilir.",
      "نستخدم تدابير تقنية وتنظيمية مصممة لحماية البيانات الشخصية من الإتلاف أو الفقد أو التغيير أو الإفصاح أو الوصول غير المصرح به. قد تشمل هذه التدابير تجزئة كلمات المرور ورموز المصادقة وضوابط الوصول والنقل المشفر وميزات أمان المزود وقواعد أقل الصلاحيات والسجلات والإشراف والنسخ الاحتياطية وصيانة الاعتماديات."
    ),
    "No online service can guarantee absolute security. You are responsible for protecting your account credentials and event access codes, using a secure device, and notifying us promptly if you suspect unauthorized access. If a personal-data breach occurs, we will assess it and provide notices to affected people and authorities where and when applicable law requires.": p(
      "Hiçbir çevrim içi hizmet mutlak güvenliği garanti edemez. Hesap bilgilerini ve etkinlik erişim kodlarını korumaktan, güvenli bir cihaz kullanmaktan ve yetkisiz erişimden şüphelendiğinde bizi derhâl bilgilendirmekten sen sorumlusun. Kişisel veri ihlali olursa durumu değerlendirir ve uygulanabilir hukukun gerektirdiği yer ve zamanda ilgili kişilere ve makamlara bildirim yaparız.",
      "لا يمكن لأي خدمة عبر الإنترنت ضمان الأمان المطلق. أنت مسؤول عن حماية بيانات حسابك ورموز الوصول واستخدام جهاز آمن وإبلاغنا فورًا عند الاشتباه في وصول غير مصرح به. عند وقوع خرق للبيانات سنقيّمه ونخطر الأشخاص والسلطات المتأثرة حينما يقتضي القانون ذلك."
    ),
    "Your rights depend on the law that applies and may be subject to exceptions. We may need to verify your identity and authority before completing a request. We will not ask for more information than reasonably necessary for verification.": p(
      "Hakların uygulanabilir hukuka bağlıdır ve istisnalara tabi olabilir. Bir talebi tamamlamadan önce kimliğini ve yetkini doğrulamamız gerekebilir. Doğrulama için makul ölçüde gerekenden fazla bilgi istemeyiz.",
      "تعتمد حقوقك على القانون المطبق وقد تخضع لاستثناءات. قد نحتاج إلى التحقق من هويتك وصلاحيتك قبل إكمال الطلب ولن نطلب معلومات أكثر مما يلزم بصورة معقولة للتحقق."
    ),
    "SnapUp Events is not directed to children who cannot lawfully consent to the relevant processing in their country. Children should not create accounts or upload personal data without the involvement and permission of a parent, guardian, or otherwise authorized adult where required.": p(
      "SnapUp Events, ülkelerinde ilgili veri işlemeye hukuken rıza veremeyen çocuklara yönelik değildir. Çocuklar, gerektiğinde bir ebeveynin, vasinin veya yetkili bir yetişkinin katılımı ve izni olmadan hesap oluşturmamalı ya da kişisel veri yüklememelidir.",
      "لا تستهدف SnapUp Events الأطفال الذين لا يستطيعون الموافقة قانونًا على المعالجة ذات الصلة في بلدهم. يجب ألا ينشئ الأطفال حسابات أو يرفعوا بيانات شخصية دون مشاركة وإذن ولي أمر أو وصي أو بالغ مخول حيثما يلزم."
    ),
    "We may update this policy when the Service, providers, processing activities, or law changes. The “Last updated” date and version at the top will identify the current notice. If a change materially affects how personal data is used, we will provide an appropriate additional notice before the change takes effect where required. Earlier versions should be archived for accountability.": p(
      "Hizmet, sağlayıcılar, işleme faaliyetleri veya hukuk değiştiğinde bu politikayı güncelleyebiliriz. Üstteki “Son güncelleme” tarihi ve sürüm güncel bildirimi gösterir. Bir değişiklik kişisel verilerin kullanımını önemli ölçüde etkilerse, gerektiğinde değişiklik yürürlüğe girmeden önce uygun ek bildirim yaparız. Önceki sürümler hesap verebilirlik için arşivlenmelidir.",
      "قد نحدّث هذه السياسة عند تغير الخدمة أو المزودين أو أنشطة المعالجة أو القانون. يحدد تاريخ «آخر تحديث» والإصدار في الأعلى الإشعار الحالي. إذا أثر التغيير جوهريًا في استخدام البيانات فسنقدم إشعارًا إضافيًا مناسبًا قبل نفاذه حيثما يلزم، وينبغي أرشفة الإصدارات السابقة للمساءلة."
    )
  };

  const policyDetails = {
    "Before publishing this page, replace every item marked": p("Bu sayfayı yayımlamadan önce işaretli tüm alanları değiştir:", "قبل نشر هذه الصفحة استبدل كل عنصر معلّم:"),
    ", confirm the actual retention periods and service-provider locations, and have the final notice reviewed for the countries where SnapUp Events is offered.": p(", gerçek saklama sürelerini ve hizmet sağlayıcı konumlarını doğrula ve son bildirimi SnapUp Events’in sunulduğu ülkeler açısından incelet.", "، وأكّد مدد الاحتفاظ الفعلية ومواقع مقدمي الخدمات واطلب مراجعة الإشعار النهائي للدول التي تُقدَّم فيها SnapUp Events."),
    "This Privacy Policy applies to the SnapUp Events website, account areas, event creation tools, guest upload experience, galleries, and related support interactions (collectively, the": p("Bu Gizlilik Politikası; SnapUp Events web sitesi, hesap alanları, etkinlik oluşturma araçları, misafir yükleme deneyimi, galeriler ve ilgili destek etkileşimleri için geçerlidir (topluca", "تنطبق سياسة الخصوصية هذه على موقع SnapUp Events ومناطق الحساب وأدوات إنشاء الفعاليات وتجربة رفع الضيوف والمعارض وتفاعلات الدعم ذات الصلة (ويُشار إليها مجتمعةً بـ"),
    "“Service”": p("“Hizmet”", "«الخدمة»"),
    "For account administration, platform security, service analytics, and direct support, the data controller is:": p("Hesap yönetimi, platform güvenliği, hizmet analitiği ve doğrudan destek bakımından veri sorumlusu:", "لإدارة الحساب وأمان المنصة وتحليلات الخدمة والدعم المباشر يكون مسؤول البيانات هو:"),
    "This policy does not cover third-party websites or services linked from the Service, nor an organizer’s independent use of media after downloading or exporting it.": p("Bu politika, Hizmet üzerinden bağlantı verilen üçüncü taraf siteleri veya hizmetleri ya da organizatörün medyayı indirdikten veya dışa aktardıktan sonraki bağımsız kullanımını kapsamaz.", "لا تغطي هذه السياسة مواقع أو خدمات الأطراف الثالثة المرتبطة بالخدمة ولا استخدام المنظم المستقل للوسائط بعد تنزيلها أو تصديرها."),
    "Name, email address, phone number, account status, password hash": p("Ad, e-posta adresi, telefon numarası, hesap durumu, şifre özeti", "الاسم والبريد الإلكتروني ورقم الهاتف وحالة الحساب وتجزئة كلمة المرور"),
    "Organizers and registered users": p("Organizatörler ve kayıtlı kullanıcılar", "المنظمون والمستخدمون المسجلون"),
    "Event name, date, description, access code, settings, organizer ID": p("Etkinlik adı, tarihi, açıklaması, erişim kodu, ayarlar, organizatör kimliği", "اسم الفعالية وتاريخها ووصفها ورمز الوصول والإعدادات ومعرّف المنظم"),
    "Organizers": p("Organizatörler", "المنظمون"),
    "Guest name or display name, event association, participation time": p("Misafir adı veya görünen ad, etkinlik ilişkisi, katılım zamanı", "اسم الضيف أو اسم العرض وارتباط الفعالية ووقت المشاركة"),
    "Photos, videos, captions, messages, filenames, media type, upload status": p("Fotoğraflar, videolar, açıklamalar, mesajlar, dosya adları, medya türü, yükleme durumu", "الصور والفيديوهات والتعليقات والرسائل وأسماء الملفات ونوع الوسائط وحالة الرفع"),
    "Uploaders and people depicted": p("Yükleyenler ve içerikte görülen kişiler", "رافعو المحتوى والأشخاص الظاهرون فيه"),
    "Likes, approvals, moderation actions, gallery interactions": p("Beğeniler, onaylar, moderasyon işlemleri, galeri etkileşimleri", "الإعجابات والموافقات وإجراءات الإشراف وتفاعلات المعرض"),
    "Users, guests, organizers": p("Kullanıcılar, misafirler, organizatörler", "المستخدمون والضيوف والمنظمون"),
    "IP address, browser and device type, operating system, timestamps, error and security logs": p("IP adresi, tarayıcı ve cihaz türü, işletim sistemi, zaman damgaları, hata ve güvenlik günlükleri", "عنوان IP ونوع المتصفح والجهاز ونظام التشغيل والطوابع الزمنية وسجلات الأخطاء والأمان"),
    "All visitors": p("Tüm ziyaretçiler", "جميع الزوار"),
    "Messages, issue details, screenshots, and correspondence sent to us": p("Bize gönderilen mesajlar, sorun ayrıntıları, ekran görüntüleri ve yazışmalar", "الرسائل وتفاصيل المشكلات ولقطات الشاشة والمراسلات المرسلة إلينا"),
    "People who contact us": p("Bizimle iletişim kuran kişiler", "الأشخاص الذين يتواصلون معنا"),
    "when you register, create or join an event, upload media, change settings, or contact support.": p("kayıt olduğunda, etkinlik oluşturduğunda veya katıldığında, medya yüklediğinde, ayarları değiştirdiğinde ya da destekle iletişim kurduğunda.", "عند التسجيل أو إنشاء فعالية أو الانضمام إليها أو رفع الوسائط أو تغيير الإعدادات أو التواصل مع الدعم."),
    "when they add your name, invite you, or upload content in which you appear.": p("adını eklediklerinde, seni davet ettiklerinde veya göründüğün bir içerik yüklediklerinde.", "عندما يضيفون اسمك أو يدعونك أو يرفعون محتوى تظهر فيه."),
    "when your browser or device communicates with the Service, including security and error logs.": p("tarayıcın veya cihazın, güvenlik ve hata günlükleri dahil Hizmet ile iletişim kurduğunda.", "عندما يتواصل متصفحك أو جهازك مع الخدمة، بما في ذلك سجلات الأمان والأخطاء."),
    "when they return technical, delivery, security, or error information needed to operate the Service.": p("Hizmeti işletmek için gerekli teknik, teslimat, güvenlik veya hata bilgilerini sunduklarında.", "عندما يعيدون معلومات تقنية أو معلومات توصيل أو أمان أو أخطاء لازمة لتشغيل الخدمة."),
    "Create accounts and events, accept uploads, display galleries, apply event settings, and provide requested features.": p("Hesap ve etkinlik oluşturmak, yüklemeleri kabul etmek, galerileri göstermek, etkinlik ayarlarını uygulamak ve istenen özellikleri sunmak.", "إنشاء الحسابات والفعاليات وقبول الملفات وعرض المعارض وتطبيق الإعدادات وتقديم الميزات المطلوبة."),
    "Contract performance · Requested service": p("Sözleşmenin ifası · Talep edilen hizmet", "تنفيذ العقد · الخدمة المطلوبة"),
    "Authenticate users, prevent abuse, investigate errors, moderate content, and protect rights, safety, and property.": p("Kullanıcıların kimliğini doğrulamak, kötüye kullanımı önlemek, hataları incelemek, içeriği denetlemek ve hakları, güvenliği ve mülkiyeti korumak.", "مصادقة المستخدمين ومنع الإساءة والتحقيق في الأخطاء والإشراف على المحتوى وحماية الحقوق والسلامة والممتلكات."),
    "Legitimate interests · Legal obligations": p("Meşru menfaatler · Hukuki yükümlülükler", "المصالح المشروعة · الالتزامات القانونية"),
    "Diagnose failures, measure technical performance, maintain backups, and improve usability without unnecessary profiling.": p("Arızaları teşhis etmek, teknik performansı ölçmek, yedekleri korumak ve gereksiz profilleme yapmadan kullanılabilirliği artırmak.", "تشخيص الأعطال وقياس الأداء التقني وصيانة النسخ الاحتياطية وتحسين سهولة الاستخدام دون تنميط غير ضروري."),
    "Legitimate interests · Consent where required": p("Meşru menfaatler · Gerektiğinde açık rıza", "المصالح المشروعة · الموافقة عند اللزوم"),
    "Send transactional notices, respond to support and privacy requests, and notify you of material service or policy changes.": p("İşlem bildirimleri göndermek, destek ve gizlilik taleplerini yanıtlamak ve önemli hizmet veya politika değişikliklerini bildirmek.", "إرسال إشعارات المعاملات والرد على طلبات الدعم والخصوصية وإبلاغك بالتغييرات الجوهرية في الخدمة أو السياسة."),
    "Keep records where required, respond to lawful requests, and establish, exercise, or defend legal rights.": p("Gerektiğinde kayıt tutmak, hukuka uygun talepleri yanıtlamak ve hukuki hakları tesis etmek, kullanmak veya savunmak.", "الاحتفاظ بالسجلات عند اللزوم والرد على الطلبات القانونية وإثبات الحقوق القانونية أو ممارستها أو الدفاع عنها."),
    "Legal obligations · Legal claims": p("Hukuki yükümlülükler · Hukuki talepler", "الالتزامات القانونية · المطالبات القانونية"),
    "Use non-essential cookies or send marketing only if and when those features are introduced and the required choice is given.": p("Zorunlu olmayan çerezleri kullanmak veya pazarlama iletileri göndermek yalnızca bu özellikler sunulduğunda ve gerekli seçim imkânı verildiğinde mümkündür.", "استخدام ملفات ارتباط غير ضرورية أو إرسال تسويق فقط عند تقديم هذه الميزات وإتاحة الاختيار المطلوب."),
    "Where processing relies on consent, you may withdraw consent at any time for future processing. Withdrawal does not make earlier lawful processing unlawful. Where we rely on legitimate interests, we balance those interests against your rights and reasonable expectations.": p("İşleme açık rızaya dayanıyorsa gelecekteki işlemler için rızanı her zaman geri çekebilirsin. Geri çekme, önceki hukuka uygun işlemeyi hukuka aykırı hâle getirmez. Meşru menfaatlere dayandığımızda bu menfaatleri hakların ve makul beklentilerinle dengeleriz.", "عندما تعتمد المعالجة على الموافقة يمكنك سحبها في أي وقت للمستقبل، ولا يجعل السحب المعالجة القانونية السابقة غير قانونية. وعندما نعتمد على المصالح المشروعة نوازنها مع حقوقك وتوقعاتك المعقولة."),
    "Organizers should clearly inform attendees that event media may be collected and shared, obtain any legally required permission, and use appropriate approval and access settings.": p("Organizatörler etkinlik medyasının toplanıp paylaşılabileceğini katılımcılara açıkça bildirmeli, hukuken gerekli izinleri almalı ve uygun onay ve erişim ayarlarını kullanmalıdır.", "ينبغي للمنظمين إبلاغ الحضور بوضوح بإمكانية جمع وسائط الفعالية ومشاركتها والحصول على الأذونات القانونية واستخدام إعدادات الموافقة والوصول المناسبة."),
    "Content marked “pending” may be visible to the organizer and authorized administrators before it appears in a gallery.": p("“Beklemede” olarak işaretlenen içerik, galeride görünmeden önce organizatör ve yetkili yöneticiler tarafından görülebilir.", "قد يكون المحتوى المعلّم «قيد الانتظار» مرئيًا للمنظم والمديرين المخولين قبل ظهوره في المعرض."),
    "Approved content may be visible to other event participants or anyone with access to the gallery, depending on event settings.": p("Onaylanan içerik, etkinlik ayarlarına bağlı olarak diğer katılımcılar veya galeriye erişimi olan herkes tarafından görülebilir.", "قد يكون المحتوى المعتمد مرئيًا للمشاركين الآخرين أو لكل من يملك وصولًا إلى المعرض وفق إعدادات الفعالية."),
    "Organizers may download or export event media. After export, their independent storage and use is outside SnapUp Events’ control and may be governed by their own privacy obligations.": p("Organizatörler etkinlik medyasını indirebilir veya dışa aktarabilir. Dışa aktarımdan sonraki bağımsız saklama ve kullanım SnapUp Events’in kontrolü dışındadır ve organizatörün kendi gizlilik yükümlülüklerine tabi olabilir.", "قد ينزّل المنظمون وسائط الفعالية أو يصدّرونها. بعد التصدير يصبح التخزين والاستخدام المستقلان خارج سيطرة SnapUp Events وقد يخضعان لالتزامات الخصوصية الخاصة بالمنظم."),
    "We may restrict or remove content reasonably believed to be unlawful, unsafe, abusive, infringing, or contrary to applicable terms.": p("Hukuka aykırı, güvensiz, kötüye kullanım içeren, hak ihlal eden veya geçerli koşullara aykırı olduğuna makul biçimde inanılan içeriği kısıtlayabilir ya da kaldırabiliriz.", "قد نقيّد أو نزيل المحتوى الذي نعتقد بصورة معقولة أنه غير قانوني أو غير آمن أو مسيء أو منتهك للحقوق أو مخالف للشروط."),
    "according to the event’s access, approval, and gallery settings.": p("etkinliğin erişim, onay ve galeri ayarlarına göre.", "وفق إعدادات الوصول والموافقة والمعرض الخاصة بالفعالية."),
    "that host the application, database, media, network delivery, security, logs, and support tools on our instructions.": p("talimatlarımız doğrultusunda uygulamayı, veri tabanını, medyayı, ağ dağıtımını, güvenliği, günlükleri ve destek araçlarını barındıran taraflar.", "الذين يستضيفون التطبيق وقاعدة البيانات والوسائط وتوصيل الشبكة والأمان والسجلات وأدوات الدعم وفق تعليماتنا."),
    "Database, authentication-related records, and application data.": p("Veri tabanı, kimlik doğrulamayla ilgili kayıtlar ve uygulama verileri.", "قاعدة البيانات وسجلات المصادقة وبيانات التطبيق."),
    "Uploaded media storage, transformation, and delivery.": p("Yüklenen medyanın saklanması, dönüştürülmesi ve dağıtımı.", "تخزين الوسائط المرفوعة وتحويلها وتوصيلها."),
    "Backend application hosting and technical logs.": p("Backend uygulama barındırması ve teknik günlükler.", "استضافة تطبيق الخلفية والسجلات التقنية."),
    "Frontend hosting, delivery, and basic operational logs.": p("Frontend barındırması, dağıtımı ve temel işletim günlükleri.", "استضافة الواجهة وتوصيلها وسجلات التشغيل الأساسية."),
    "Contract performance · Legal obligations": p("Sözleşmenin ifası · Hukuki yükümlülükler", "تنفيذ العقد · الالتزامات القانونية"),
    "such as legal, security, audit, or insurance advisers when reasonably necessary and subject to confidentiality duties.": p("makul ölçüde gerekli olduğunda ve gizlilik yükümlülüklerine tabi hukuk, güvenlik, denetim veya sigorta danışmanları gibi.", "مثل المستشارين القانونيين أو مستشاري الأمان أو التدقيق أو التأمين عند الحاجة المعقولة ومع خضوعهم لواجبات السرية."),
    "when required by law, a valid legal process, or to protect rights, safety, and security.": p("hukuk, geçerli bir hukuki süreç veya hakları ve güvenliği korumak gerektirdiğinde.", "عندما يقتضي القانون أو إجراء قانوني صحيح أو لحماية الحقوق والسلامة والأمان."),
    "in connection with a merger, reorganization, financing, acquisition, or transfer of the Service, subject to applicable notice and legal safeguards.": p("uygulanabilir bildirim ve hukuki güvencelere tabi bir birleşme, yeniden yapılanma, finansman, devralma veya Hizmet devriyle bağlantılı olarak.", "في سياق اندماج أو إعادة تنظيم أو تمويل أو استحواذ أو نقل للخدمة مع مراعاة الإشعارات والضمانات القانونية المطبقة."),
    "Provider list based on the current SnapUp Events architecture. Update this section before launch whenever a provider or purpose changes. Each provider also publishes its own privacy and security information.": p("Sağlayıcı listesi mevcut SnapUp Events mimarisine dayanır. Bir sağlayıcı veya amaç değiştiğinde bu bölümü yayından önce güncelle. Her sağlayıcı kendi gizlilik ve güvenlik bilgilerini de yayımlar.", "تستند قائمة المزودين إلى بنية SnapUp Events الحالية. حدّث هذا القسم قبل الإطلاق كلما تغير مزود أو غرض، وينشر كل مزود معلومات الخصوصية والأمان الخاصة به."),
    "Where required, international transfers will be supported by an applicable legal mechanism, such as an adequacy decision, approved standard contractual clauses, binding corporate rules, explicit consent in limited cases, or another safeguard permitted by law. For transfers subject to Türkiye’s Law No. 6698, SnapUp Events will use a mechanism allowed under the applicable cross-border transfer rules. For transfers subject to the GDPR, appropriate safeguards may include EU Standard Contractual Clauses and supplementary measures where necessary.": p("Gerektiğinde uluslararası aktarımlar; yeterlilik kararı, onaylı standart sözleşme maddeleri, bağlayıcı şirket kuralları, sınırlı hâllerde açık rıza veya hukukun izin verdiği başka bir güvence gibi uygulanabilir bir hukuki mekanizmaya dayanacaktır. 6698 sayılı Kanuna tabi aktarımlarda SnapUp Events, geçerli yurt dışı aktarım kurallarının izin verdiği bir mekanizma kullanacaktır. GDPR kapsamındaki aktarımlarda uygun güvenceler AB Standart Sözleşme Maddelerini ve gerektiğinde tamamlayıcı önlemleri içerebilir.", "عند اللزوم ستستند عمليات النقل الدولي إلى آلية قانونية مناسبة مثل قرار الكفاية أو البنود التعاقدية القياسية المعتمدة أو قواعد الشركات الملزمة أو الموافقة الصريحة في حالات محدودة أو ضمان آخر يسمح به القانون. في عمليات النقل الخاضعة للقانون التركي رقم 6698 ستستخدم SnapUp Events آلية مسموحًا بها، وفي نطاق GDPR قد تشمل الضمانات بنود الاتحاد الأوروبي القياسية وتدابير تكميلية عند الحاجة."),
    "Record the selected regions for Supabase, Cloudinary, Render, and Netlify and document the transfer mechanism used for each:": p("Supabase, Cloudinary, Render ve Netlify için seçilen bölgeleri kaydet ve her biri için kullanılan aktarım mekanizmasını belgele:", "سجّل المناطق المختارة لـ Supabase وCloudinary وRender وNetlify ووثّق آلية النقل المستخدمة لكل منها:"),
    "While the account remains active and as needed to provide the Service.": p("Hesap aktif kaldığı ve Hizmeti sunmak için gerektiği sürece.", "ما دام الحساب نشطًا وبالقدر اللازم لتقديم الخدمة."),
    "For the period required by law or reasonably needed to establish or defend claims.": p("Hukukun gerektirdiği veya talepleri tesis etmek ya da savunmak için makul ölçüde gerekli süre boyunca.", "للمدة التي يقتضيها القانون أو اللازمة بصورة معقولة لإثبات المطالبات أو الدفاع عنها."),
    "Deletion from the active Service may not immediately remove copies from rotating backups or cached delivery systems. Those copies should be isolated from ordinary use and deleted or overwritten according to the applicable backup lifecycle, unless preservation is legally required.": p("Aktif Hizmetten silme, dönen yedeklerdeki veya önbelleğe alınmış dağıtım sistemlerindeki kopyaları hemen kaldırmayabilir. Hukuken saklama gerekmedikçe bu kopyalar normal kullanımdan ayrılmalı ve geçerli yedek yaşam döngüsüne göre silinmeli ya da üzerine yazılmalıdır.", "قد لا يزيل الحذف من الخدمة النشطة النسخ فورًا من النسخ الاحتياطية الدورية أو أنظمة التوصيل المؤقتة. ينبغي عزل هذه النسخ عن الاستخدام العادي وحذفها أو الكتابة فوقها وفق دورة النسخ الاحتياطية ما لم يتطلب القانون الاحتفاظ بها."),
    "SnapUp Events may use browser storage that is necessary to keep you signed in, remember security state, preserve an intended destination after login, and provide requested functionality. For example, an authentication token may be stored under a local browser key such as": p("SnapUp Events oturumunu açık tutmak, güvenlik durumunu hatırlamak, girişten sonraki hedefi korumak ve istenen işlevleri sunmak için gerekli tarayıcı depolamasını kullanabilir. Örneğin bir kimlik doğrulama belirteci şu yerel tarayıcı anahtarı altında saklanabilir:", "قد تستخدم SnapUp Events تخزين المتصفح اللازم لإبقائك مسجّلًا وتذكر حالة الأمان والحفاظ على الوجهة بعد الدخول وتقديم الوظائف المطلوبة. مثلًا قد يُخزن رمز مصادقة تحت مفتاح محلي مثل:"),
    "Strictly necessary storage is used to deliver or secure a service you request. If analytics, advertising, or other non-essential cookies are introduced, this policy and the consent interface must be updated before those technologies are activated. You can clear browser storage through your browser settings, but doing so may sign you out or reset features.": p("Kesinlikle gerekli depolama, talep ettiğin hizmeti sunmak veya güvenceye almak için kullanılır. Analitik, reklam veya zorunlu olmayan başka çerezler eklenirse bu teknolojiler etkinleştirilmeden önce politika ve rıza arayüzü güncellenmelidir. Tarayıcı ayarlarından depolamayı temizleyebilirsin; ancak bu işlem oturumunu kapatabilir veya özellikleri sıfırlayabilir.", "يُستخدم التخزين الضروري لتقديم خدمة تطلبها أو تأمينها. إذا أُضيفت تحليلات أو إعلانات أو ملفات ارتباط غير ضرورية فيجب تحديث السياسة وواجهة الموافقة قبل تفعيلها. يمكنك مسح التخزين من إعدادات المتصفح لكن ذلك قد يسجّل خروجك أو يعيد ضبط الميزات."),
    "Subject to Article 11 and other applicable provisions, you may have the right to:": p("11. madde ve diğer uygulanabilir hükümler kapsamında şu haklara sahip olabilirsin:", "وفق المادة 11 والأحكام المطبقة الأخرى قد يحق لك:"),
    "learn whether your personal data is processed;": p("kişisel verilerinin işlenip işlenmediğini öğrenme;", "معرفة ما إذا كانت بياناتك الشخصية تُعالج؛"),
    "request information about processing;": p("işleme hakkında bilgi talep etme;", "طلب معلومات عن المعالجة؛"),
    "learn the purpose of processing and whether data is used accordingly;": p("işleme amacını ve verilerin buna uygun kullanılıp kullanılmadığını öğrenme;", "معرفة غرض المعالجة ومدى استخدام البيانات وفقًا له؛"),
    "know third parties to whom data is transferred domestically or abroad;": p("verilerin yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme;", "معرفة الأطراف الثالثة التي تُنقل إليها البيانات محليًا أو دوليًا؛"),
    "request correction of incomplete or inaccurate data;": p("eksik veya yanlış verilerin düzeltilmesini talep etme;", "طلب تصحيح البيانات الناقصة أو غير الدقيقة؛"),
    "request deletion or destruction where legal conditions are met;": p("hukuki şartlar oluştuğunda silme veya yok etme talep etme;", "طلب الحذف أو الإتلاف عند تحقق الشروط القانونية؛"),
    "request notification of correction, deletion, or destruction to relevant recipients;": p("düzeltme, silme veya yok etmenin ilgili alıcılara bildirilmesini talep etme;", "طلب إخطار المستلمين المعنيين بالتصحيح أو الحذف أو الإتلاف؛"),
    "object to a result against you produced exclusively by automated analysis; and": p("yalnızca otomatik analizle aleyhine ortaya çıkan sonuca itiraz etme; ve", "الاعتراض على نتيجة ضدك ناتجة حصريًا عن التحليل الآلي؛ و"),
    "claim compensation if you suffer damage due to unlawful processing.": p("hukuka aykırı işleme nedeniyle zarara uğrarsan tazminat talep etme.", "المطالبة بالتعويض إذا لحقت بك أضرار بسبب معالجة غير قانونية."),
    "Include the event name or code, your guest/display name, the approximate upload date, and a description of the relevant media. Do not send your password or unnecessary identity documents by ordinary email.": p("Etkinlik adını veya kodunu, misafir/görünen adını, yaklaşık yükleme tarihini ve ilgili medyanın açıklamasını ekle. Şifreni veya gereksiz kimlik belgelerini normal e-postayla gönderme.", "اذكر اسم الفعالية أو رمزها واسم الضيف أو العرض وتاريخ الرفع التقريبي ووصف الوسائط. لا ترسل كلمة المرور أو وثائق هوية غير ضرورية بالبريد العادي."),
    "Where the GDPR applies, you may have rights to be informed, access, rectification, erasure, restriction, data portability, objection, withdrawal of consent, and safeguards relating to automated decision-making. You may also complain to the supervisory authority in the country where you live, work, or believe an infringement occurred.": p("GDPR uygulandığında bilgilendirilme, erişim, düzeltme, silme, kısıtlama, veri taşınabilirliği, itiraz, rızayı geri çekme ve otomatik karar vermeye ilişkin güvencelerden yararlanma hakların olabilir. Yaşadığın, çalıştığın veya ihlal olduğuna inandığın ülkedeki denetim makamına da şikâyet edebilirsin.", "عندما ينطبق GDPR قد تكون لك حقوق في الإبلاغ والوصول والتصحيح والمحو والتقييد ونقل البيانات والاعتراض وسحب الموافقة وضمانات القرارات الآلية. ويمكنك الشكوى إلى سلطة الإشراف في بلد إقامتك أو عملك أو البلد الذي تعتقد وقوع الانتهاك فيه."),
    "Organizers of events involving children are responsible for selecting appropriately restricted settings, giving required notices, obtaining permissions, and avoiding public sharing. If you believe a child’s data was provided without proper authorization, contact us with enough information to locate the content.": p("Çocukların yer aldığı etkinliklerin organizatörleri uygun şekilde kısıtlı ayarları seçmekten, gerekli bildirimleri yapmaktan, izinleri almaktan ve herkese açık paylaşımdan kaçınmaktan sorumludur. Bir çocuğun verisinin uygun yetki olmadan sağlandığını düşünüyorsan içeriği bulmamıza yetecek bilgiyle bize ulaş.", "يتحمل منظمو الفعاليات التي تشمل أطفالًا مسؤولية اختيار إعدادات مقيّدة مناسبة وتقديم الإشعارات والحصول على الأذونات وتجنب المشاركة العامة. إذا اعتقدت أن بيانات طفل قُدمت دون تفويض مناسب فتواصل معنا بمعلومات تكفي لتحديد المحتوى."),
    "To ask a privacy question or exercise a privacy right, contact the controller using the details below. Please state that your message is a “Privacy Request” and describe the request clearly.": p("Gizlilik sorusu sormak veya bir gizlilik hakkını kullanmak için aşağıdaki bilgilerle veri sorumlusuna ulaş. Mesajının bir “Gizlilik Talebi” olduğunu belirt ve talebini açıkça açıkla.", "لطرح سؤال خصوصية أو ممارسة حق تواصل مع مسؤول البيانات بالتفاصيل أدناه. اذكر أن رسالتك «طلب خصوصية» واشرح طلبك بوضوح."),
    "We may request reasonable information to verify identity, locate the relevant data, and prevent unauthorized disclosure. Authorized agents may be required to show evidence of authority.": p("Kimliği doğrulamak, ilgili verileri bulmak ve yetkisiz açıklamayı önlemek için makul bilgiler isteyebiliriz. Yetkili temsilcilerden yetkilerini kanıtlamaları istenebilir.", "قد نطلب معلومات معقولة للتحقق من الهوية وتحديد البيانات ومنع الإفصاح غير المصرح به، وقد يُطلب من الوكلاء إثبات صلاحيتهم.")
  };

  Object.assign(phrases, policyParagraphs, policyDetails);

  const attributeNames = ["placeholder", "aria-label", "title", "alt", "content"];
  const skipParents = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE"]);

  function normalized(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function translate(value, lang = language) {
    if (lang === "en") return value;
    const key = normalized(value);
    const item = phrases[key];
    if (item?.[lang]) return item[lang];

    const guestCount = key.match(/^(\d+) guests$/i);
    if (guestCount) return lang === "tr" ? `${guestCount[1]} misafir` : `${guestCount[1]} ضيف`;
    const photoCount = key.match(/^(\d+) photos?$/i);
    if (photoCount) return lang === "tr" ? `${photoCount[1]} fotoğraf` : `${photoCount[1]} صورة`;
    const memoryCount = key.match(/^(\d+) memories?$/i);
    if (memoryCount) return lang === "tr" ? `${memoryCount[1]} anı` : `${memoryCount[1]} ذكرى`;
    const uploadedBy = key.match(/^Uploaded by (.+)$/i);
    if (uploadedBy) return lang === "tr" ? `${uploadedBy[1]} tarafından yüklendi` : `رفعه ${uploadedBy[1]}`;
    const uploadingFiles = key.match(/^Uploading (\d+) file\(s\)\.\.\.$/i);
    if (uploadingFiles) return lang === "tr" ? `${uploadingFiles[1]} dosya yükleniyor...` : `جارٍ رفع ${uploadingFiles[1]} ملف...`;
    const uploadedFiles = key.match(/^(\d+) file\(s\) uploaded successfully!$/i);
    if (uploadedFiles) return lang === "tr" ? `${uploadedFiles[1]} dosya başarıyla yüklendi!` : `تم رفع ${uploadedFiles[1]} ملف بنجاح!`;
    const guestsFound = key.match(/^(\d+) of (\d+) guests found\.$/i);
    if (guestsFound) return lang === "tr"
      ? `${guestsFound[2]} misafirden ${guestsFound[1]} tanesi bulundu.`
      : `تم العثور على ${guestsFound[1]} من أصل ${guestsFound[2]} ضيف.`;

    return value;
  }

  function translateTextNode(node) {
    if (!node?.parentElement || skipParents.has(node.parentElement.tagName)) return;
    const original = normalized(node.nodeValue);
    if (!original) return;
    const translated = translate(original);
    if (translated !== original) {
      const leading = node.nodeValue.match(/^\s*/)?.[0] || "";
      const trailing = node.nodeValue.match(/\s*$/)?.[0] || "";
      node.nodeValue = `${leading}${translated}${trailing}`;
    }
  }

  function translateElement(element) {
    if (!(element instanceof Element)) return;
    attributeNames.forEach((name) => {
      if (!element.hasAttribute(name)) return;
      const value = element.getAttribute(name);
      const translated = translate(value);
      if (translated !== value) element.setAttribute(name, translated);
    });
    element.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
    });
  }

  function translateTree(root = document.body) {
    if (language === "en" || !root) return;
    if (root instanceof Element) translateElement(root);
    root.querySelectorAll?.("*").forEach(translateElement);
  }

  function addSelector() {
    if (!document.body || document.querySelector(".snapup-language")) return;
    const languageNames = {
      en: { short: "EN", label: "English" },
      tr: { short: "TR", label: "Türkçe" },
      ar: { short: "AR", label: "العربية" }
    };
    const wrapper = document.createElement("div");
    wrapper.className = "snapup-language";
    wrapper.setAttribute("aria-label", language === "tr" ? "Dil seç" : language === "ar" ? "اختر اللغة" : "Choose language");
    wrapper.innerHTML = `
      <button
        class="snapup-language__trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded="false"
        aria-controls="snapup-language-menu"
      >
        <svg class="snapup-language__globe" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M3 12h18M12 3c2.3 2.45 3.5 5.45 3.5 9s-1.2 6.55-3.5 9c-2.3-2.45-3.5-5.45-3.5-9S9.7 5.45 12 3Z"></path>
        </svg>
        <span class="snapup-language__current">${languageNames[language].short}</span>
        <svg class="snapup-language__chevron" viewBox="0 0 16 16" aria-hidden="true">
          <path d="m4 6 4 4 4-4"></path>
        </svg>
      </button>
      <div class="snapup-language__menu" id="snapup-language-menu" role="menu" hidden>
        ${SUPPORTED.map(
          (code) => `
            <button
              type="button"
              role="menuitemradio"
              aria-checked="${code === language}"
              data-language="${code}"
              lang="${code}"
            >
              <span>${languageNames[code].label}</span>
              <small>${languageNames[code].short}</small>
            </button>
          `
        ).join("")}
      </div>
    `;

    const trigger = wrapper.querySelector(".snapup-language__trigger");
    const menu = wrapper.querySelector(".snapup-language__menu");
    const setOpen = (open) => {
      trigger.setAttribute("aria-expanded", String(open));
      menu.hidden = !open;
      wrapper.classList.toggle("is-open", open);
      if (open) {
        menu.querySelector('[aria-checked="true"]')?.focus();
      }
    };

    trigger.addEventListener("click", () => {
      setOpen(trigger.getAttribute("aria-expanded") !== "true");
    });

    menu.addEventListener("click", (event) => {
      const option = event.target.closest("[data-language]");
      if (!option) return;
      const nextLanguage = option.dataset.language;
      if (nextLanguage === language) {
        setOpen(false);
        trigger.focus();
        return;
      }
      localStorage.setItem(STORAGE_KEY, nextLanguage);
      window.location.reload();
    });

    document.addEventListener("click", (event) => {
      if (!wrapper.contains(event.target)) setOpen(false);
    });

    wrapper.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      trigger.focus();
    });

    document.body.appendChild(wrapper);
  }

  function init() {
    translateTree();
    addSelector();

    let queued = false;
    const observer = new MutationObserver((records) => {
      if (queued || language === "en") return;
      queued = true;
      queueMicrotask(() => {
        records.forEach((record) => {
          record.addedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
            if (node.nodeType === Node.ELEMENT_NODE) translateTree(node);
          });
        });
        queued = false;
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.SnapUpI18n = {
    get language() {
      return language;
    },
    t: translate,
    setLanguage(next) {
      if (!SUPPORTED.includes(next)) return;
      localStorage.setItem(STORAGE_KEY, next);
      window.location.reload();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
