"use strict";

const EMAIL_LANGUAGE_METADATA = {
  "en": {
    "label": "English",
    "locale": "en-US",
    "direction": "ltr"
  },
  "tr": {
    "label": "Türkçe",
    "locale": "tr-TR",
    "direction": "ltr"
  },
  "ar": {
    "label": "العربية",
    "locale": "ar-SA",
    "direction": "rtl"
  },
  "de": {
    "label": "Deutsch",
    "locale": "de-DE",
    "direction": "ltr"
  },
  "fr": {
    "label": "Français",
    "locale": "fr-FR",
    "direction": "ltr"
  },
  "es": {
    "label": "Español",
    "locale": "es-ES",
    "direction": "ltr"
  },
  "it": {
    "label": "Italiano",
    "locale": "it-IT",
    "direction": "ltr"
  },
  "nl": {
    "label": "Nederlands",
    "locale": "nl-NL",
    "direction": "ltr"
  },
  "bg": {
    "label": "Български",
    "locale": "bg-BG",
    "direction": "ltr"
  },
  "ro": {
    "label": "Română",
    "locale": "ro-RO",
    "direction": "ltr"
  },
  "el": {
    "label": "Ελληνικά",
    "locale": "el-GR",
    "direction": "ltr"
  },
  "sr": {
    "label": "Srpski",
    "locale": "sr-RS",
    "direction": "ltr"
  },
  "hr": {
    "label": "Hrvatski",
    "locale": "hr-HR",
    "direction": "ltr"
  },
  "bs": {
    "label": "Bosanski",
    "locale": "bs-BA",
    "direction": "ltr"
  },
  "sq": {
    "label": "Shqip",
    "locale": "sq-AL",
    "direction": "ltr"
  },
  "mk": {
    "label": "Македонски",
    "locale": "mk-MK",
    "direction": "ltr"
  },
  "hi": {
    "label": "हिन्दी",
    "locale": "hi-IN",
    "direction": "ltr"
  },
  "ur": {
    "label": "اردو",
    "locale": "ur-PK",
    "direction": "rtl"
  },
  "fa": {
    "label": "فارسی",
    "locale": "fa-IR",
    "direction": "rtl"
  },
  "ja": {
    "label": "日本語",
    "locale": "ja-JP",
    "direction": "ltr"
  },
  "zh": {
    "label": "简体中文",
    "locale": "zh-CN",
    "direction": "ltr"
  },
  "ko": {
    "label": "한국어",
    "locale": "ko-KR",
    "direction": "ltr"
  },
  "pt": {
    "label": "Português (Brasil)",
    "locale": "pt-BR",
    "direction": "ltr",
    "translationCode": "pt"
  },
  "ru": {
    "label": "Русский",
    "locale": "ru-RU",
    "direction": "ltr"
  },
  "id": {
    "label": "Bahasa Indonesia",
    "locale": "id-ID",
    "direction": "ltr"
  },
  "pl": {
    "label": "Polski",
    "locale": "pl-PL",
    "direction": "ltr"
  },
  "vi": {
    "label": "Tiếng Việt",
    "locale": "vi-VN",
    "direction": "ltr"
  },
  "uk": {
    "label": "Українська",
    "locale": "uk-UA",
    "direction": "ltr"
  },
  "th": {
    "label": "ไทย",
    "locale": "th-TH",
    "direction": "ltr"
  },
  "cs": {
    "label": "Čeština",
    "locale": "cs-CZ",
    "direction": "ltr"
  },
  "he": {
    "label": "עברית",
    "locale": "he-IL",
    "direction": "rtl"
  },
  "hu": {
    "label": "Magyar",
    "locale": "hu-HU",
    "direction": "ltr"
  },
  "sv": {
    "label": "Svenska",
    "locale": "sv-SE",
    "direction": "ltr"
  },
  "bn": {
    "label": "বাংলা",
    "locale": "bn-BD",
    "direction": "ltr"
  },
  "ms": {
    "label": "Bahasa Melayu",
    "locale": "ms-MY",
    "direction": "ltr"
  },
  "fil": {
    "label": "Filipino",
    "locale": "fil-PH",
    "direction": "ltr"
  },
  "zh-tw": {
    "label": "繁體中文",
    "locale": "zh-TW",
    "direction": "ltr",
    "translationCode": "zh-TW"
  },
  "pt-pt": {
    "label": "Português (Portugal)",
    "locale": "pt-PT",
    "direction": "ltr",
    "translationCode": "pt-PT"
  },
  "da": {
    "label": "Dansk",
    "locale": "da-DK",
    "direction": "ltr"
  },
  "fi": {
    "label": "Suomi",
    "locale": "fi-FI",
    "direction": "ltr"
  },
  "nb": {
    "label": "Norsk bokmål",
    "locale": "nb-NO",
    "direction": "ltr",
    "translationCode": "no"
  },
  "sk": {
    "label": "Slovenčina",
    "locale": "sk-SK",
    "direction": "ltr"
  },
  "lt": {
    "label": "Lietuvių",
    "locale": "lt-LT",
    "direction": "ltr"
  },
  "lv": {
    "label": "Latviešu",
    "locale": "lv-LV",
    "direction": "ltr"
  },
  "et": {
    "label": "Eesti",
    "locale": "et-EE",
    "direction": "ltr"
  },
  "sl": {
    "label": "Slovenščina",
    "locale": "sl-SI",
    "direction": "ltr"
  },
  "ta": {
    "label": "தமிழ்",
    "locale": "ta-IN",
    "direction": "ltr"
  },
  "te": {
    "label": "తెలుగు",
    "locale": "te-IN",
    "direction": "ltr"
  },
  "mr": {
    "label": "मराठी",
    "locale": "mr-IN",
    "direction": "ltr"
  },
  "sw": {
    "label": "Kiswahili",
    "locale": "sw-KE",
    "direction": "ltr"
  }
};

const EMAIL_COPIES = {
  "en": {
    "common": {
      "fallbackName": "there",
      "hello": "Hello {{name}},",
      "buttonFallback": "Button not working? Copy and paste this address into your browser:",
      "footerTagline": "Every guest. Every moment. One shared album.",
      "footerSecurity": "This is an automated account-security email."
    },
    "verification": {
      "subject": "Verify your email — SnapUp Events",
      "documentTitle": "Verify your SnapUp Events email",
      "preheader": "Verify your email address to start creating events on SnapUp Events.",
      "headerLabel": "Email verification",
      "eyebrow": "Welcome to SnapUp",
      "heading": "Verify your email",
      "introduction": "Confirm your email address to start creating events, sharing QR codes, and collecting every guest moment in one shared album.",
      "button": "Verify my email",
      "secureLabel": "Secure link:",
      "secureText": "This link expires in 24 hours and can only be used once. If you did not create this account, no action is required.",
      "textWelcome": "Welcome to SnapUp Events. Verify your email address to start creating and managing events.",
      "textExpires": "This verification link expires in 24 hours and can only be used once.",
      "textIgnore": "If you did not create this account, you can safely ignore this email."
    },
    "passwordReset": {
      "subject": "Reset your password — SnapUp Events",
      "documentTitle": "Reset your SnapUp Events password",
      "preheader": "Use this secure, single-use link to reset your SnapUp Events password.",
      "headerLabel": "Account security",
      "eyebrow": "Password recovery",
      "heading": "Reset your password.",
      "introduction": "We received a request to create a new password for your SnapUp Events account.",
      "button": "Create a new password",
      "secureLabel": "Secure, single-use link.",
      "secureText": "It expires in 30 minutes. If you did not request this change, your current password remains unchanged.",
      "textRequest": "We received a request to reset your SnapUp Events password.",
      "textExpires": "This reset link expires in 30 minutes and can only be used once.",
      "textIgnore": "If you did not request a password reset, you can safely ignore this email."
    }
  },
  "tr": {
    "common": {
      "fallbackName": "işte orada",
      "hello": "merhaba {{name}},",
      "buttonFallback": "düğme çalışmıyor mu? bu adresi tarayıcınıza kopyalayın ve yapıştırın:",
      "footerTagline": "her misafir. her an. sayıda bir albüm.",
      "footerSecurity": "bu otomatik bir hesap-güvenlik e-postasıdır."
    },
    "verification": {
      "subject": "e-postanızı doğrulayın — SnapUp Events",
      "documentTitle": "e-postanızı SnapUp Events doğrulayın",
      "preheader": "güncelleştirmeler SnapUp Events üzerinden etkinlik oluşturmaya başlamak için e-posta adresinizi doğrulayın.",
      "headerLabel": "-E-posta doğrulaması",
      "eyebrow": "tebrikler SnapUp",
      "heading": "e-postanızı doğrulayın",
      "introduction": "calim oluşturmaya başlamak, QR kodlarını paylaşmak QR ve paylaşılan bir albümde her konuk anını toplamak için e-posta adresinizi onaylayın.",
      "button": "e-postamı doğrulayın",
      "secureLabel": "güvenli bağlantı:",
      "secureText": "bu bağlantı 24 saat içinde sona erer ve sadece bir kez kullanılabilir. eğer bu hesabı oluşturmadıysanız, herhangi bir eylem gerekmez.",
      "textWelcome": "tebrikler. SnapUp Events adresine hoş geldiniz. cay oluşturmak ve yönetmeye başlamak için e-posta adresinizi doğrulayın.",
      "textExpires": "bu doğrulama bağlantısı 24 saat içinde sona erer ve yalnızca bir kez kullanılabilir.",
      "textIgnore": "eğer bu hesabı oluşturmadıysanız, bu e-postayı güvenle görmezden gelebilirsiniz."
    },
    "passwordReset": {
      "subject": "şifrenizi sıfırla — SnapUp Events",
      "documentTitle": "son dakikanızı SnapUp Events şifrenizi sıfırlayın",
      "preheader": "SnapUp Events şifrenizi sıfırlamak için bu güvenli, tek kullanımlık bağlantıyı kullanın.",
      "headerLabel": "lu hesap güvenliği",
      "eyebrow": "luluk kurtarma",
      "heading": "şifrenizi sıfırlayın.",
      "introduction": "lu yazınız SnapUp Events hesabı için yeni bir şifre oluşturma talebi aldık.",
      "button": "yeni bir şifre oluşturun",
      "secureLabel": "güvenli, tek kullanımlık bir bağlantı.",
      "secureText": "son 30 dakika içinde sona erer. eğer bu değişikliği talep etmediyseniz, mevcut şifreniz değişmeden kalır.",
      "textRequest": "şifrenizi SnapUp Events sıfırlama talebi aldık.",
      "textExpires": "bu sıfırlama bağlantısı 30 dakika içinde sona erer ve sadece bir kez kullanılabilir.",
      "textIgnore": "parola sıfırlama talebinde bulunmadıysanız, bu e-postayı güvenle görmezden gelebilirsiniz."
    }
  },
  "ar": {
    "common": {
      "fallbackName": "هناك",
      "hello": "مرحبا {{name}},",
      "buttonFallback": "الزر لا يعمل؟ نسخ ولصق هذا العنوان في المتصفح الخاص بك:",
      "footerTagline": "كل ضيف. كل لحظة. الألبوم المشترك واحد.",
      "footerSecurity": "ّهُ a رسالة بريد إلكتروني آلي لأمن الحساب."
    },
    "verification": {
      "subject": "التحقق من البريد الإلكتروني الخاص بك — SnapUp Events",
      "documentTitle": "التحقق من البريد الإلكتروني الخاص SnapUp Events",
      "preheader": "التحقق من عنوان البريد الإلكتروني الخاص بك لبدء إنشاء الأحداث على SnapUp Events.",
      "headerLabel": "التحقق من البريد الإلكتروني",
      "eyebrow": "مرحبا بكم في SnapUp",
      "heading": "التحقق من بريدك الإلكتروني",
      "introduction": "تأكيد عنوان البريد الإلكتروني الخاص بك لبدء إنشاء الأحداث، وتبادل QR الرموز، وجمع كل لحظة ضيف في ألبوم واحد مشترك.",
      "button": "التحقق من البريد الإلكتروني الخاص بي",
      "secureLabel": "رابط آمن:",
      "secureText": "تنتهي صلاحية هذا الرابط خلال 24 ساعة ولا يمكن استخدامه إلا مرة واحدة. إذا لم تقم بإنشاء هذا الحساب، لا يلزم اتخاذ إجراء.",
      "textWelcome": "مرحبا بكم في SnapUp Events. على التحقق من عنوان بريدك الإلكتروني لبدء إنشاء الأحداث وإدارتها.",
      "textExpires": "تنتهي صلاحية رابط التحقق هذا خلال 24 ساعة ولا يمكن استخدامه إلا مرة واحدة.",
      "textIgnore": "إذا لم تقم بإنشاء هذا الحساب، يمكنك تجاهل هذا البريد الإلكتروني بأمان."
    },
    "passwordReset": {
      "subject": "إعادة تعيين كلمة المرور الخاصة بك — SnapUp Events",
      "documentTitle": "إعادة تعيين كلمة المرور الخاصة SnapUp Events",
      "preheader": "استخدام هذا الرابط الآمن أحادي الاستخدام لإعادة تعيين كلمة مرورك SnapUp Events.",
      "headerLabel": "تأمين الحساب",
      "eyebrow": "استعادة كلمة المرور",
      "heading": "إعادة تعيين كلمة المرور الخاصة بك.",
      "introduction": "تلقينا طلبًا لإنشاء كلمة مرور جديدة لحسابك SnapUp Events.",
      "button": "انشاء كلمة مرور جديدة",
      "secureLabel": "رابط آمن، استخدام واحد.",
      "secureText": "تنتهي صلاحيتها في 30 دقيقة. إذا لم تطلب هذا التغيير، تظل كلمة المرور الحالية دون تغيير.",
      "textRequest": "تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة SnapUp Events.",
      "textExpires": "تنتهي صلاحية رابط إعادة الضبط هذا في 30 دقيقة ولا يمكن استخدامه إلا مرة واحدة.",
      "textIgnore": "إذا لم تطلب إعادة تعيين كلمة المرور ، فيمكنك تجاهل هذا البريد الإلكتروني بأمان."
    }
  },
  "de": {
    "common": {
      "fallbackName": "Hin",
      "hello": ". Hallo {{name}},",
      "buttonFallback": "Button funktioniert nicht? Kopieren und fügen Sie diese Adresse in Ihren Browser ein:",
      "footerTagline": "Jeder Gast. Jeden Moment. ein gemeinsames Album.",
      "footerSecurity": "Eine automatisierte Account-Security-E-Mail."
    },
    "verification": {
      "subject": "Überprüfen Sie Ihre E-Mail-Adresse — SnapUp Events",
      "documentTitle": "Ihre SnapUp Events E-Mail-Adresse bestätigen",
      "preheader": "Überprüfen Sie Ihre E-Mail-Adresse, um mit der Erstellung von Veranstaltungen auf SnapUp Events zu beginnen.",
      "headerLabel": "E-Mail-Verifizierung",
      "eyebrow": "Willkommen bei SnapUp",
      "heading": "Überprüfen Sie Ihre E-Mail",
      "introduction": "Bestätigen Sie Ihre E-Mail-Adresse, um mit der Erstellung von Veranstaltungen zu beginnen, Codes von QR zu teilen und jeden Gastmoment in einem gemeinsamen Album zu sammeln.",
      "button": "Meine E-Mail bestätigen",
      "secureLabel": "Sicherer Link:",
      "secureText": "Dieser Link läuft innerhalb von 24 Stunden ab und kann nur einmal verwendet werden. Wenn Sie dieses Konto nicht erstellt haben, ist keine Aktion erforderlich.",
      "textWelcome": "Willkommen bei SnapUp Events. Überprüfen Sie Ihre E-Mail-Adresse, um mit der Erstellung und Verwaltung von Ereignissen zu beginnen.",
      "textExpires": "Dieser Verifizierungslink läuft innerhalb von 24 Stunden ab und kann nur einmal verwendet werden.",
      "textIgnore": "Wenn Sie dieses Konto nicht erstellt haben, können Sie diese E-Mail sicher ignorieren."
    },
    "passwordReset": {
      "subject": "Passwort zurücksetzen — SnapUp Events",
      "documentTitle": "Passwort für SnapUp Events zurücksetzen",
      "preheader": "Mit diesem sicheren Einweg-Link können Sie Ihr SnapUp Events-Passwort zurücksetzen.",
      "headerLabel": "-Kontosicherheit",
      "eyebrow": "Passwort Wiederherstellung",
      "heading": "Ihr Passwort zurücksetzen.",
      "introduction": "Wir haben eine Anfrage erhalten, um ein neues Passwort für Ihr SnapUp Events-Konto zu erstellen.",
      "button": "Neues Passwort erstellen",
      "secureLabel": "Sicherer, Einweg-Link.",
      "secureText": "Es läuft in 30 Minuten ab. Wenn Sie diese Änderung nicht beantragt haben, bleibt Ihr aktuelles Passwort unverändert.",
      "textRequest": "Wir haben eine Anfrage erhalten, um Ihr SnapUp Events Passwort zurückzusetzen.",
      "textExpires": "Dieser Reset-Link läuft in 30 Minuten ab und kann nur einmal verwendet werden.",
      "textIgnore": "Wenn Sie kein Zurücksetzen des Passworts angefordert haben, können Sie diese E-Mail sicher ignorieren."
    }
  },
  "fr": {
    "common": {
      "fallbackName": "là",
      "hello": "Bonjour {{name}},",
      "buttonFallback": "Bouton ne fonctionne pas ? Copiez et collez cette adresse dans votre navigateur:",
      "footerTagline": "Chaque invité. à chaque instant. Un album partagé.",
      "footerSecurity": "Il s'agit d'un e-mail automatisé de sécurité de compte."
    },
    "verification": {
      "subject": "Vérifiez votre email — SnapUp Events",
      "documentTitle": "Vérifiez votre SnapUp Events email",
      "preheader": "Vérifiez votre adresse e-mail pour commencer à créer des événements sur SnapUp Events.",
      "headerLabel": "Vérification des courriels",
      "eyebrow": "Bienvenue à SnapUp",
      "heading": "Vérifiez votre email",
      "introduction": "Confirmez votre adresse e-mail pour commencer à créer des événements, partager QR des codes et collecter chaque moment invité dans un album partagé.",
      "button": "Vérifier mon email",
      "secureLabel": "Lien sécurisé:",
      "secureText": "Ce lien expire dans 24 heures et ne peut être utilisé qu'une seule fois. Si vous n'avez pas créé ce compte, aucune action n'est nécessaire.",
      "textWelcome": "Bienvenue sur SnapUp Events. Vérifiez votre adresse e-mail pour commencer à créer et gérer des événements.",
      "textExpires": "Ce lien de vérification expire en 24 heures et ne peut être utilisé qu'une seule fois.",
      "textIgnore": "Si vous n'avez pas créé ce compte, vous pouvez ignorer ce courriel en toute sécurité."
    },
    "passwordReset": {
      "subject": "Réinitialiser votre mot de passe — SnapUp Events",
      "documentTitle": "Réinitialiser votre SnapUp Events mot de passe",
      "preheader": "Utilisez ce lien sécurisé à usage unique pour réinitialiser votre SnapUp Events mot de passe.",
      "headerLabel": "Sécurité du compte",
      "eyebrow": "Récupération de mot de passe",
      "heading": "Réinitialiser votre mot de passe.",
      "introduction": "Nous avons reçu une demande pour créer un nouveau mot de passe pour votre SnapUp Events compte.",
      "button": "Créer un nouveau mot de passe",
      "secureLabel": "lien sécurisé à usage unique.",
      "secureText": "Il expire dans 30 minutes. Si vous n'avez pas demandé cette modification, votre mot de passe actuel reste inchangé.",
      "textRequest": "Nous avons reçu une demande de réinitialisation de votre SnapUp Events mot de passe.",
      "textExpires": "Ce lien de réinitialisation expire dans 30 minutes et ne peut être utilisé qu'une seule fois.",
      "textIgnore": "Si vous n'avez pas demandé de réinitialisation de mot de passe, vous pouvez ignorer ce courriel en toute sécurité."
    }
  },
  "es": {
    "common": {
      "fallbackName": "ahí",
      "hello": "HO {{name}},",
      "buttonFallback": "boton no funciona? Copia y pega esta dirección en tu navegador:",
      "footerTagline": "cada invitado. cada momento. Un álbum compartido.",
      "footerSecurity": "se trata de un correo electrónico automatizado de seguridad de cuenta."
    },
    "verification": {
      "subject": "Verifique su correo electrónico — SnapUp Events",
      "documentTitle": "Verifique su SnapUp Events correo electrónico",
      "preheader": "Verifique su dirección de correo electrónico para comenzar a crear eventos en SnapUp Events.",
      "headerLabel": "de verificación de correo electrónico",
      "eyebrow": "bienvenido a SnapUp",
      "heading": "Verifique su correo electrónico",
      "introduction": "confirma tu dirección de correo electrónico para comenzar a crear eventos, compartir QR códigos y recopilar cada momento de invitado en un álbum compartido.",
      "button": "Verifique mi correo electrónico",
      "secureLabel": "de enlace seguro:",
      "secureText": "Este enlace expira en 24 horas y solo se puede utilizar una vez. Si no creó esta cuenta, no se requiere ninguna acción.",
      "textWelcome": "bienvenido a SnapUp Events. Verifique su dirección de correo electrónico para comenzar a crear y administrar eventos.",
      "textExpires": "Este enlace de verificación expira en 24 horas y solo se puede utilizar una vez.",
      "textIgnore": "Si no creó esta cuenta, puede ignorar este correo electrónico de forma segura."
    },
    "passwordReset": {
      "subject": "restablecer su contraseña — SnapUp Events",
      "documentTitle": "restablecer su SnapUp Events contraseña",
      "preheader": "Utilice este enlace seguro de un solo uso para restablecer su SnapUp Events contraseña.",
      "headerLabel": "Seguridad de la cuenta",
      "eyebrow": "Recuperación de contraseñas",
      "heading": "restablecer su contraseña.",
      "introduction": "Recibimos una solicitud para crear una nueva contraseña para su SnapUp Events cuenta.",
      "button": "Crear una nueva contraseña",
      "secureLabel": "Enlace seguro de un solo uso.",
      "secureText": "expira en 30 minutos. Si no solicitó este cambio, su contraseña actual permanece sin cambios.",
      "textRequest": "Recibimos una solicitud para restablecer su SnapUp Events contraseña.",
      "textExpires": "Este enlace de reinicio expira en 30 minutos y solo se puede utilizar una vez.",
      "textIgnore": "Si no solicitó un restablecimiento de contraseña, puede ignorar este correo electrónico de forma segura."
    }
  },
  "it": {
    "common": {
      "fallbackName": "là",
      "hello": "Ciao {{name}},",
      "buttonFallback": "dei bottoni che non funzionano? copiare e incollare questo indirizzo nel tuo browser:",
      "footerTagline": "ogni ospite. ogni momento. un album condiviso.",
      "footerSecurity": "questa è un'e-mail di sicurezza dell'account automatizzato."
    },
    "verification": {
      "subject": "— SnapUp Events",
      "documentTitle": "Verifica la tua SnapUp Events email",
      "preheader": "Verifica il tuo indirizzo email per iniziare a creare eventi su SnapUp Events.",
      "headerLabel": "Verifica e-mail",
      "eyebrow": "benvenuti su SnapUp",
      "heading": "Verifica la tua email",
      "introduction": "per iniziare a creare eventi, condividere QR codici e raccogliere ogni momento ospite in un album condiviso.",
      "button": "Verifica la mia email",
      "secureLabel": "di collegamento sicuro:",
      "secureText": "questo link scade in 24 ore e può essere utilizzato solo una volta. se non hai creato questo account, non è necessaria alcuna azione.",
      "textWelcome": "Benvenuti a SnapUp Events. verifica il tuo indirizzo email per iniziare a creare e gestire eventi.",
      "textExpires": "questo link di verifica scade in 24 ore e può essere utilizzato solo una volta.",
      "textIgnore": "se non hai creato questo account, puoi tranquillamente ignorare questa e-mail."
    },
    "passwordReset": {
      "subject": "Leggi la password — SnapUp Events",
      "documentTitle": "reimposta la password di SnapUp Events",
      "preheader": "utilizzare questo collegamento sicuro e monouso per reimpostare la password SnapUp Events.",
      "headerLabel": "sicurezza del conto",
      "eyebrow": "di recupero della password",
      "heading": "di reimposta la password.",
      "introduction": "abbiamo ricevuto una richiesta per creare una nuova password per il tuo SnapUp Events account.",
      "button": "crea una nuova password",
      "secureLabel": "sicuro, collegamento monouso.",
      "secureText": "scade in 30 minuti. se non hai richiesto questa modifica, la tua password attuale rimane invariata.",
      "textRequest": "abbiamo ricevuto una richiesta per reimpostare la password di SnapUp Events.",
      "textExpires": "questo link di reset scade in 30 minuti e può essere utilizzato solo una volta.",
      "textIgnore": "se non hai richiesto un ripristino della password, puoi tranquillamente ignorare questa e-mail."
    }
  },
  "nl": {
    "common": {
      "fallbackName": "daar",
      "hello": "hal {{name}},",
      "buttonFallback": "Button werkt niet? kopiëren en plakken van dit adres in uw browser:",
      "footerTagline": "elke gast. elk moment. een gedeeld album.",
      "footerSecurity": "dit is een geautomatiseerde accountbeveiligingsmail."
    },
    "verification": {
      "subject": "uw e-mail verifiëren — SnapUp Events",
      "documentTitle": "uw SnapUp Events e-mail verifiëren",
      "preheader": "verifieer uw e-mailadres om te beginnen met het maken van evenementen op SnapUp Events.",
      "headerLabel": "e-mailverificatie",
      "eyebrow": "welkom op SnapUp",
      "heading": "uw e-mail verifiëren",
      "introduction": "Bevestig uw e-mailadres om te beginnen met het maken van evenementen, het delen QR van codes en het verzamelen van elk gastmoment in één gedeeld album.",
      "button": "mijn e-mailadres verifiëren",
      "secureLabel": "beveiligde link:",
      "secureText": "Deze link vervalt binnen 24 uur en kan slechts één keer worden gebruikt. als u dit account niet hebt gemaakt, is er geen actie vereist.",
      "textWelcome": "welkom bij SnapUp Events. verifieer uw e-mailadres om te beginnen met het maken en beheren van evenementen.",
      "textExpires": "Deze verificatielink vervalt binnen 24 uur en kan slechts één keer worden gebruikt.",
      "textIgnore": "heb je dit account niet aangemaakt, dan kun je deze e-mail veilig negeren."
    },
    "passwordReset": {
      "subject": "uw wachtwoord opnieuw instellen — SnapUp Events",
      "documentTitle": "uw SnapUp Events wachtwoord opnieuw instellen",
      "preheader": "gebruik deze beveiligde link voor eenmalig gebruik om uw SnapUp Events wachtwoord opnieuw in te stellen.",
      "headerLabel": "accountbeveiliging",
      "eyebrow": "wachtwoord herstel",
      "heading": "uw wachtwoord opnieuw instellen.",
      "introduction": "we kregen een verzoek om een nieuw wachtwoord aan te maken voor uw SnapUp Events account.",
      "button": "een nieuw wachtwoord aanmaken",
      "secureLabel": "beveiligde link voor eenmalig gebruik.",
      "secureText": "het vervalt binnen 30 minuten. hebt u deze wijziging niet aangevraagd, dan blijft uw huidige wachtwoord ongewijzigd.",
      "textRequest": "we hebben een verzoek ontvangen om uw SnapUp Events wachtwoord opnieuw in te stellen.",
      "textExpires": "Deze resetlink verloopt binnen 30 minuten en kan slechts één keer worden gebruikt.",
      "textIgnore": "hebt u geen wachtwoordreset aangevraagd, dan kunt u deze e-mail veilig negeren."
    }
  },
  "bg": {
    "common": {
      "fallbackName": "там",
      "hello": "Здравейте {{name}},",
      "buttonFallback": ", че Бътън не работи? копирайте и поставете този адрес в браузъра си:",
      "footerTagline": "всеки гост. всеки миг. един споделен албум.",
      "footerSecurity": "това е автоматизиран имейл за сигурност на акаунта."
    },
    "verification": {
      "subject": "Проверете имейла си — SnapUp Events",
      "documentTitle": "проверете вашия SnapUp Events имейл",
      "preheader": "Проверете имейл адреса си, за да започнете да създавате събития на SnapUp Events.",
      "headerLabel": "потвърждаване на имейл",
      "eyebrow": "добре дошли в SnapUp",
      "heading": "потвърждаване на вашия имейл",
      "introduction": "потвърдете имейл адреса си, за да започнете да създавате събития, да споделяте QR кодове и да събирате всеки момент за гости в един споделен албум.",
      "button": "потвърди имейла ми",
      "secureLabel": "сигурна връзка:",
      "secureText": "тази връзка изтича след 24 часа и може да се използва само веднъж. че не сте създали този акаунт, не се изискват действия.",
      "textWelcome": "добре дошли в SnapUp Events. Потвърдете имейл адреса си, за да започнете да създавате и управлявате събития.",
      "textExpires": "тази връзка за проверка изтича след 24 часа и може да се използва само веднъж.",
      "textIgnore": "Ако не сте създали този акаунт, можете спокойно да игнорирате този имейл."
    },
    "passwordReset": {
      "subject": "Нулиране на паролата ви — SnapUp Events",
      "documentTitle": "Нулирайте паролата си SnapUp Events",
      "preheader": "използвайте тази сигурна връзка за еднократна употреба, за да нулирате паролата си SnapUp Events.",
      "headerLabel": "сигурност на сметката",
      "eyebrow": "възстановяване на парола",
      "heading": "нулирайте паролата си.",
      "introduction": "получихме заявка за създаване на нова парола за вашия SnapUp Events акаунт.",
      "button": "създаване на нова парола",
      "secureLabel": "Secure, връзка за еднократна употреба.",
      "secureText": "изтича след 30 минути. че не сте поискали тази промяна, текущата ви парола остава непроменена.",
      "textRequest": "получихме заявка за нулиране на паролата ви SnapUp Events.",
      "textExpires": "тази връзка за нулиране изтича след 30 минути и може да се използва само веднъж.",
      "textIgnore": "Ако не сте поискали нулиране на паролата, можете спокойно да игнорирате този имейл."
    }
  },
  "ro": {
    "common": {
      "fallbackName": "acolo",
      "hello": "Bună {{name}},",
      "buttonFallback": "ton nu funcţionează? aintește și lipește această adresă în browser:",
      "footerTagline": "fiecare oaspete. în fiecare moment. un album comun.",
      "footerSecurity": "acesta este un e-mail automat de securitate a contului."
    },
    "verification": {
      "subject": "verifica e-mailul – SnapUp Events",
      "documentTitle": "verificat adresa dvs. SnapUp Events",
      "preheader": "verifica adresa ta de e-mail pentru a începe crearea de evenimente pe SnapUp Events.",
      "headerLabel": "verificare prin e-mail",
      "eyebrow": "are bun venit la SnapUp",
      "heading": "verifica e-mailul tău",
      "introduction": "tna adresa de e-mail pentru a începe să creezi evenimente, să împărtășești QR coduri și să colecționezi fiecare moment de invitat într-un album comun.",
      "button": "Verifică-mi e-mailul",
      "secureLabel": "securizat Link:",
      "secureText": "acest link expiră în 24 de ore și poate fi folosit o singură dată. nu ați creat acest cont, nu este necesară nicio acțiune.",
      "textWelcome": "are bun venit la SnapUp Events. verifica adresa de e-mail pentru a începe să creezi și să gestionezi evenimentele.",
      "textExpires": "acest link de verificare expiră în 24 de ore și poate fi utilizat o singură dată.",
      "textIgnore": "nu ați creat acest cont, puteți ignora în siguranță acest e-mail."
    },
    "passwordReset": {
      "subject": "resetați parola — SnapUp Events",
      "documentTitle": "resetați parola dvs. SnapUp Events",
      "preheader": "foli acest link securizat, de unică folosință, pentru a reseta parola SnapUp Events.",
      "headerLabel": "a securitatea contului",
      "eyebrow": "recuperare de parolă",
      "heading": "resetați parola.",
      "introduction": "primit o solicitare pentru a crea o parolă nouă pentru contul tău SnapUp Events.",
      "button": "Creează o nouă parolă",
      "secureLabel": "securizat, o singură utilizare.",
      "secureText": "expiră în 30 de minute. nu solicitați această modificare, parola curentă rămâne neschimbată.",
      "textRequest": "primit o cerere de resetare a parolei dvs. SnapUp Events.",
      "textExpires": "această legătură de resetare expiră în 30 de minute și poate fi utilizată o singură dată.",
      "textIgnore": "nu ați solicitat o resetare a parolei, puteți ignora în siguranță acest e-mail."
    }
  },
  "el": {
    "common": {
      "fallbackName": "κεί εκεί",
      "hello": "Γεια σας {{name}},",
      "buttonFallback": "Μπάτον δεν δουλεύει; \" Αντιγράψτε και επικολλήστε αυτή τη διεύθυνση στο πρόγραμμα περιήγησής σας:",
      "footerTagline": "αραϊκανό. Κάθε καλεσμένος. Κάθε στιγμή. Ένα κοινό άλμπουμ.",
      "footerSecurity": "Αυτό είναι ένα αυτοματοποιημένο email ασφαλείας λογαριασμού."
    },
    "verification": {
      "subject": "Επαλάστε το email σας — SnapUp Events",
      "documentTitle": "Επαλάστε το email σας SnapUp Events",
      "preheader": "Επαλάστε τη διεύθυνση ηλεκτρονικού ταχυδρομείου σας για να αρχίσετε να δημιουργείτε εκδηλώσεις στο SnapUp Events.",
      "headerLabel": "ΕΞΑΓκυλή Ηλεκτρονικού",
      "eyebrow": "Καλώς ήρθατε στο SnapUp",
      "heading": "Επαλάστε το email σας",
      "introduction": "επιβεβαιώστε τη διεύθυνση ηλεκτρονικού ταχυδρομείου σας για να ξεκινήσετε τη δημιουργία εκδηλώσεων, την κοινή χρήση QR κωδίκων και τη συλλογή κάθε στιγμή επισκέπτη σε ένα κοινό άλμπουμ.",
      "button": "Επαλάστε το email μου",
      "secureLabel": "Ασφαλής σύνδεσμος:",
      "secureText": "υροκοπά μία η σύνδεση λήγει σε 24 ώρες και μπορεί να χρησιμοποιηθεί μόνο μία φορά. Αν δεν δημιουργήσατε αυτόν τον λογαριασμό, δεν απαιτείται καμία ενέργεια.",
      "textWelcome": "Καλώς ήρθατε στο SnapUp Events. ΕΞΕΡΑΤΕ τη διεύθυνση ηλεκτρονικού ταχυδρομείου σας για να ξεκινήσετε τη δημιουργία και τη διαχείριση συμβάντων.",
      "textExpires": "Συναυλία αυτή η σύνδεση επαλήθευσης λήγει σε 24 ώρες και μπορεί να χρησιμοποιηθεί μόνο μία φορά.",
      "textIgnore": "Αν δεν δημιουργήσατε αυτόν τον λογαριασμό, μπορείτε να αγνοήσετε με ασφάλεια αυτό το μήνυμα ηλεκτρονικού ταχυδρομείου."
    },
    "passwordReset": {
      "subject": "ρεπολόγηση του κωδικού πρόσβασής σας — SnapUp Events",
      "documentTitle": "ρευμάνθηκε τον κωδικό πρόσβασης SnapUp Events",
      "preheader": "χρησιμοποιήστε αυτόν τον ασφαλή σύνδεσμο μίας χρήσης για να επαναφέρετε τον κωδικό πρόσβασης σας SnapUp Events.",
      "headerLabel": "ειρην αναφοράς\"",
      "eyebrow": "ανωμερή αντιστοιχία κωδικού πρόσβασης",
      "heading": "\" Επαναφορά του κωδικού πρόσβασής σας.",
      "introduction": "Δεν λάβαμε ένα αίτημα για να δημιουργήσουμε έναν νέο κωδικό πρόσβασης για τον λογαριασμό σας SnapUp Events.",
      "button": "Δημιουργία νέου κωδικού πρόσβασης",
      "secureLabel": "Ασφαλής, ενιαίος σύνδεσμος χρήσης.",
      "secureText": "ΛΟΜΩΝΤΑΛΗΣΚΕΙΑΣΕ σε 30 λεπτά. Αν δεν ζητήσατε αυτή την αλλαγή, ο τρέχων κωδικός πρόσβασής σας παραμένει αμετάβλητος.",
      "textRequest": "Δεν λάβαμε αίτημα για επαναφορά του κωδικού πρόσβασής σας SnapUp Events.",
      "textExpires": "ΑΛΗΛΟΣΑΜΑ ΑΡΕΤΑΙ αυτή η σύνδεση επαναδιατύπωσης λήγει σε 30 λεπτά και μπορεί να χρησιμοποιηθεί μόνο μία φορά.",
      "textIgnore": "Αν δεν ζητήσατε επαναφορά κωδικού πρόσβασης, μπορείτε να αγνοήσετε με ασφάλεια αυτό το email."
    }
  },
  "sr": {
    "common": {
      "fallbackName": "тамо",
      "hello": "Здраво {{name}},",
      "buttonFallback": "п> Дугме не ради? Копирајте и налепите ову адресу у свој претраживач:",
      "footerTagline": "Сваки гост. Сваки тренутак. ка је један заједнички албум.",
      "footerSecurity": "Ово је аутоматизована е-пошта о безбедности налога."
    },
    "verification": {
      "subject": "Потврдите своју е-пошту - SnapUp Events",
      "documentTitle": "потврдите своју SnapUp Events е-пошту",
      "preheader": "Потврдите своју адресу е-поште да бисте почели да креирате догађаје на SnapUp Events.",
      "headerLabel": "Верификација е-поште",
      "eyebrow": "Добродошли на SnapUp",
      "heading": "Верификујте своју е-пошту",
      "introduction": "потврдите своју адресу е-поште да бисте започели креирање догађаја, дељење QR кодова и прикупљање сваког тренутка гостију у једном заједничком албуму.",
      "button": "потврдите моју е-пошту",
      "secureLabel": "Сигурна веза:",
      "secureText": "овај линк истиче за 24 сата и може се користити само једном. ако нисте креирали овај налог, није потребна никаква радња.",
      "textWelcome": "Добродошли на SnapUp Events. Потврдите своју адресу е-поште да бисте започели креирање и управљање догађајима.",
      "textExpires": "ка за верификацију истиче за 24 сата и може се користити само једном.",
      "textIgnore": "ако нисте креирали овај налог, можете безбедно да игноришете ову е-пошту."
    },
    "passwordReset": {
      "subject": "Ресетујте лозинку - SnapUp Events",
      "documentTitle": "ресетујте своју SnapUp Events лозинку",
      "preheader": "користите ову безбедну везу за једнократну употребу да бисте ресетовали лозинку за SnapUp Events.",
      "headerLabel": "Безбедност налога",
      "eyebrow": "Опоравак лозинке",
      "heading": "Ресетујте своју лозинку.",
      "introduction": "Примили смо захтев за креирање нове лозинке за ваш SnapUp Events налог.",
      "button": "Направите нову лозинку",
      "secureLabel": "Сигурна веза за једнократну употребу.",
      "secureText": "истиче за 30 минута. ако нисте затражили ову промену, ваша тренутна лозинка остаје непромењена.",
      "textRequest": "Примили смо захтев за ресетовање ваше SnapUp Events лозинке.",
      "textExpires": "ова веза за ресетовање истиче за 30 минута и може се користити само једном.",
      "textIgnore": "Ако нисте затражили ресетовање лозинке, можете безбедно да игноришете ову е-пошту."
    }
  },
  "hr": {
    "common": {
      "fallbackName": "tamo",
      "hello": "Pozdrav {{name}},",
      "buttonFallback": "Ton ne radi? Kopirajte i zalijepite ovu adresu u svoj preglednik:",
      "footerTagline": "svaki gost. svaki trenutak. Jedan zajednički album.",
      "footerSecurity": "Ovo je automatizirana e-pošta za sigurnost računa."
    },
    "verification": {
      "subject": "Potvrdite svoju e-poštu — SnapUp Events",
      "documentTitle": "Potvrdite svoju SnapUp Events e-poštu",
      "preheader": "Potvrdite svoju adresu e-pošte da biste započeli stvaranje događaja na SnapUp Events.",
      "headerLabel": "provjera e-pošte",
      "eyebrow": "Dobrodošli na SnapUp",
      "heading": "Potvrdi svoju e-poštu",
      "introduction": "Potvrdite svoju adresu e-pošte da biste započeli stvaranje događaja, dijeljenje QR kodova i prikupljanje svakog trenutka gosta u jednom zajedničkom albumu.",
      "button": "Potvrdi moju e-poštu",
      "secureLabel": "Sigurna veza:",
      "secureText": "Ova veza istječe za 24 sata i može se koristiti samo jednom. Ako niste stvorili ovaj račun, nije potrebna nikakva radnja.",
      "textWelcome": "Dobrodošli na SnapUp Events. Provjerite svoju adresu e-pošte da biste započeli s stvaranjem i upravljanjem događajima.",
      "textExpires": "Ova veza za potvrdu istječe za 24 sata i može se koristiti samo jednom.",
      "textIgnore": "Ako niste stvorili ovaj račun, možete sigurno zanemariti ovu e-poštu."
    },
    "passwordReset": {
      "subject": "Vratite lozinku — SnapUp Events",
      "documentTitle": "Vratite lozinku za SnapUp Events",
      "preheader": "Koristite ovu sigurnu vezu za jednokratnu upotrebu da biste resetirali lozinku SnapUp Events za resetiranje.",
      "headerLabel": "Sigurnost računa",
      "eyebrow": "oporavak lozinke",
      "heading": "Vratite lozinku.",
      "introduction": "Primili smo zahtjev za izradu nove lozinke za vaš SnapUp Events račun.",
      "button": "Stvaranje nove lozinke",
      "secureLabel": "Sigurna veza za jednokratnu upotrebu.",
      "secureText": "Istječe za 30 minuta. Ako niste zatražili ovu promjenu, vaša trenutna lozinka ostaje nepromijenjena.",
      "textRequest": "Primili smo zahtjev za resetiranje lozinke za SnapUp Events.",
      "textExpires": "Ova veza za resetiranje istječe za 30 minuta i može se koristiti samo jednom.",
      "textIgnore": "Ako niste zatražili ponovno postavljanje lozinke, možete sigurno zanemariti ovu e-poštu."
    }
  },
  "bs": {
    "common": {
      "fallbackName": "tamo",
      "hello": "Ćao {{name}},",
      "buttonFallback": "Dugme ne radi? Kopirajte i nalepite ovu adresu u svoj pretraživač:",
      "footerTagline": "svaki gost. s svakog momenta. jedan zajednički album.",
      "footerSecurity": "Ovo je automatizovani e-mail za bezbednost računa."
    },
    "verification": {
      "subject": ". Pogledajte svoj email — SnapUp Events",
      "documentTitle": "Verifikujte svoj SnapUp Events email",
      "preheader": "Verifikujte svoju email adresu da biste počeli da kreirate događaje na SnapUp Events.",
      "headerLabel": "E-mail verifikacija",
      "eyebrow": "Dobrodosli na SnapUp",
      "heading": "Verifikujte svoj email",
      "introduction": "Potvrdite svoju email adresu da biste počeli da kreirate događaje, delite QR kodove i prikupljate svaki trenutak za goste u jednom zajedničkom albumu.",
      "button": "Verifikuj moj email",
      "secureLabel": "Bezbedan link:",
      "secureText": "Ovaj link ističe za 24 sata i može se koristiti samo jednom. Ukoliko niste kreirali ovaj nalog, nije potrebna nikakva akcija.",
      "textWelcome": "Dobrodosli na SnapUp Events. Potvrdite svoju email adresu da biste počeli da kreirate i upravljate događajima.",
      "textExpires": "Ovaj link za verifikaciju ističe za 24 sata i može se koristiti samo jednom.",
      "textIgnore": "Ako niste kreirali ovaj nalog, možete bezbedno da ignorišete ovaj email."
    },
    "passwordReset": {
      "subject": "Ponovo podesite svoju lozinku — SnapUp Events",
      "documentTitle": "Resetujte svoju SnapUp Events lozinku",
      "preheader": "Koristite ovu sigurnu vezu za jednokratnu upotrebu da resetujete svoju SnapUp Events lozinku.",
      "headerLabel": "Bezbjednost računa",
      "eyebrow": "Oporavak lozinke",
      "heading": "Resetuj svoju lozinku.",
      "introduction": "Dobili smo zahtev za kreiranje nove lozinke za Vaš SnapUp Events nalog.",
      "button": "kreiraj novu lozinku",
      "secureLabel": "Bezbedan, jednokratni link.",
      "secureText": "ističe za 30 minuta. Ukoliko niste zahtevali ovu promenu, vaša trenutna lozinka ostaje nepromenjena.",
      "textRequest": "Dobili smo zahtev za resetovanje vaše SnapUp Events lozinke.",
      "textExpires": "Ovaj link za resetiranje ističe za 30 minuta i može se koristiti samo jednom.",
      "textIgnore": "ako niste zatražili resetovanje lozinke, možete bezbedno da ignorišete ovaj email."
    }
  },
  "sq": {
    "common": {
      "fallbackName": "mik",
      "hello": "Përshëndetje {{name}},",
      "buttonFallback": "Butoni nuk funksionon? Kopjoni dhe ngjisni këtë adresë në shfletuesin tuaj:",
      "footerTagline": "Çdo i ftuar. Çdo çast. Një album i përbashkët.",
      "footerSecurity": "Ky është një email i automatizuar për sigurinë e llogarisë."
    },
    "verification": {
      "subject": "Verifikoni emailin tuaj — SnapUp Events",
      "documentTitle": "Verifikoni emailin tuaj të SnapUp Events",
      "preheader": "Verifikoni adresën tuaj të emailit për të filluar krijimin e eventeve në SnapUp Events.",
      "headerLabel": "Verifikimi i emailit",
      "eyebrow": "Mirë se vini në SnapUp",
      "heading": "Verifikoni emailin tuaj",
      "introduction": "Konfirmoni adresën tuaj të emailit për të filluar krijimin e eventeve, ndarjen e kodeve QR dhe mbledhjen e çdo çasti të të ftuarve në një album të përbashkët.",
      "button": "Verifiko emailin tim",
      "secureLabel": "Lidhje e sigurt:",
      "secureText": "Kjo lidhje skadon pas 24 orësh dhe mund të përdoret vetëm një herë. Nëse nuk e keni krijuar këtë llogari, nuk kërkohet asnjë veprim.",
      "textWelcome": "Mirë se vini në SnapUp Events. Verifikoni adresën tuaj të emailit për të filluar krijimin dhe menaxhimin e eventeve.",
      "textExpires": "Kjo lidhje verifikimi skadon pas 24 orësh dhe mund të përdoret vetëm një herë.",
      "textIgnore": "Nëse nuk e keni krijuar këtë llogari, mund ta shpërfillni pa problem këtë email."
    },
    "passwordReset": {
      "subject": "Rivendosni fjalëkalimin tuaj — SnapUp Events",
      "documentTitle": "Rivendosni fjalëkalimin tuaj të SnapUp Events",
      "preheader": "Përdorni këtë lidhje të sigurt dhe njëpërdorimshme për të rivendosur fjalëkalimin tuaj të SnapUp Events.",
      "headerLabel": "Siguria e llogarisë",
      "eyebrow": "Rikuperimi i fjalëkalimit",
      "heading": "Rivendosni fjalëkalimin tuaj.",
      "introduction": "Kemi marrë një kërkesë për të krijuar një fjalëkalim të ri për llogarinë tuaj SnapUp Events.",
      "button": "Krijo një fjalëkalim të ri",
      "secureLabel": "Lidhje e sigurt, njëpërdorimshme.",
      "secureText": "Skadon pas 30 minutash. Nëse nuk e keni kërkuar këtë ndryshim, fjalëkalimi juaj aktual mbetet i pandryshuar.",
      "textRequest": "Kemi marrë një kërkesë për të rivendosur fjalëkalimin tuaj të SnapUp Events.",
      "textExpires": "Kjo lidhje për rivendosjen skadon pas 30 minutash dhe mund të përdoret vetëm një herë.",
      "textIgnore": "Nëse nuk keni kërkuar rivendosjen e fjalëkalimit, mund ta shpërfillni pa problem këtë email."
    }
  },
  "mk": {
    "common": {
      "fallbackName": "пријателе",
      "hello": "Здраво {{name}},",
      "buttonFallback": "Копчето не работи? Копирајте ја и залепете ја оваа адреса во вашиот прелистувач:",
      "footerTagline": "Секој гостин. Секој момент. Еден заеднички албум.",
      "footerSecurity": "Ова е автоматска е-пошта за безбедноста на сметката."
    },
    "verification": {
      "subject": "Потврдете ја вашата е-пошта — SnapUp Events",
      "documentTitle": "Потврдете ја вашата е-пошта за SnapUp Events",
      "preheader": "Потврдете ја вашата адреса за е-пошта за да започнете да создавате настани на SnapUp Events.",
      "headerLabel": "Потврда на е-пошта",
      "eyebrow": "Добре дојдовте во SnapUp",
      "heading": "Потврдете ја вашата е-пошта",
      "introduction": "Потврдете ја вашата адреса за е-пошта за да започнете да создавате настани, да споделувате QR-кодови и да го собирате секој момент на гостите во еден заеднички албум.",
      "button": "Потврди ја мојата е-пошта",
      "secureLabel": "Безбедна врска:",
      "secureText": "Оваа врска истекува за 24 часа и може да се користи само еднаш. Ако не сте ја создале оваа сметка, не е потребно никакво дејство.",
      "textWelcome": "Добре дојдовте во SnapUp Events. Потврдете ја вашата адреса за е-пошта за да започнете да создавате и управувате со настани.",
      "textExpires": "Оваа врска за потврда истекува за 24 часа и може да се користи само еднаш.",
      "textIgnore": "Ако не сте ја создале оваа сметка, можете безбедно да ја игнорирате оваа е-пошта."
    },
    "passwordReset": {
      "subject": "Ресетирајте ја вашата лозинка — SnapUp Events",
      "documentTitle": "Ресетирајте ја вашата лозинка за SnapUp Events",
      "preheader": "Користете ја оваа безбедна врска за еднократна употреба за да ја ресетирате вашата лозинка за SnapUp Events.",
      "headerLabel": "Безбедност на сметката",
      "eyebrow": "Враќање на лозинката",
      "heading": "Ресетирајте ја вашата лозинка.",
      "introduction": "Добивме барање за создавање нова лозинка за вашата сметка на SnapUp Events.",
      "button": "Создај нова лозинка",
      "secureLabel": "Безбедна врска за еднократна употреба.",
      "secureText": "Истекува за 30 минути. Ако не сте ја побарале оваа промена, вашата тековна лозинка останува непроменета.",
      "textRequest": "Добивме барање за ресетирање на вашата лозинка за SnapUp Events.",
      "textExpires": "Оваа врска за ресетирање истекува за 30 минути и може да се користи само еднаш.",
      "textIgnore": "Ако не сте побарале ресетирање на лозинката, можете безбедно да ја игнорирате оваа е-пошта."
    }
  },
  "hi": {
    "common": {
      "fallbackName": "वहाँ",
      "hello": "नमस्ते {{name}},",
      "buttonFallback": "बटन काम नहीं कर रहा? इस पते को कॉपी करके अपने ब्राउज़र में पेस्ट करें:",
      "footerTagline": "हर मेहमान. हर क्षण। एक साझा एल्बम.",
      "footerSecurity": "यह एक स्वचालित खाता-सुरक्षा ईमेल है."
    },
    "verification": {
      "subject": "अपना ईमेल सत्यापित करें - SnapUp Events",
      "documentTitle": "अपना SnapUp Events ईमेल सत्यापित करें",
      "preheader": "SnapUp Events पर ईवेंट बनाना प्रारंभ करने के लिए अपना ईमेल पता सत्यापित करें।",
      "headerLabel": "ईमेल सत्यापन",
      "eyebrow": "SnapUp में आपका स्वागत है",
      "heading": "अपना ईमेल सत्यापित करें",
      "introduction": "ईवेंट बनाना शुरू करने, QR कोड साझा करने और प्रत्येक अतिथि क्षण को एक साझा एल्बम में एकत्रित करने के लिए अपने ईमेल पते की पुष्टि करें।",
      "button": "मेरा ईमेल सत्यापित करें",
      "secureLabel": "सुरक्षित लिंक:",
      "secureText": "यह लिंक 24 घंटे में समाप्त हो जाता है और इसका उपयोग केवल एक बार किया जा सकता है। यदि आपने यह खाता नहीं बनाया है, तो किसी कार्रवाई की आवश्यकता नहीं है।",
      "textWelcome": "SnapUp Events में आपका स्वागत है। ईवेंट बनाना और प्रबंधित करना शुरू करने के लिए अपना ईमेल पता सत्यापित करें।",
      "textExpires": "यह सत्यापन लिंक 24 घंटे में समाप्त हो जाता है और इसका उपयोग केवल एक बार किया जा सकता है।",
      "textIgnore": "यदि आपने यह खाता नहीं बनाया है, तो आप इस ईमेल को सुरक्षित रूप से अनदेखा कर सकते हैं।"
    },
    "passwordReset": {
      "subject": "अपना पासवर्ड रीसेट करें - SnapUp Events",
      "documentTitle": "अपना SnapUp Events पासवर्ड रीसेट करें",
      "preheader": "अपना SnapUp Events पासवर्ड रीसेट करने के लिए इस सुरक्षित, एकल-उपयोग लिंक का उपयोग करें।",
      "headerLabel": "खाता सुरक्षा",
      "eyebrow": "पासवर्ड पुनर्प्राप्ति",
      "heading": "अपना पासवर्ड रीसेट करें.",
      "introduction": "हमें आपके SnapUp Events खाते के लिए एक नया पासवर्ड बनाने का अनुरोध प्राप्त हुआ।",
      "button": "एक नया पासवर्ड बनाएं",
      "secureLabel": "सुरक्षित, एकल-उपयोग लिंक।",
      "secureText": "यह 30 मिनट में समाप्त हो जाता है. यदि आपने इस परिवर्तन का अनुरोध नहीं किया है, तो आपका वर्तमान पासवर्ड अपरिवर्तित रहेगा।",
      "textRequest": "हमें आपका SnapUp Events पासवर्ड रीसेट करने का अनुरोध प्राप्त हुआ।",
      "textExpires": "यह रीसेट लिंक 30 मिनट में समाप्त हो जाएगा और इसका उपयोग केवल एक बार किया जा सकता है।",
      "textIgnore": "यदि आपने पासवर्ड रीसेट का अनुरोध नहीं किया है, तो आप इस ईमेल को सुरक्षित रूप से अनदेखा कर सकते हैं।"
    }
  },
  "ur": {
    "common": {
      "fallbackName": "وہاں",
      "hello": "ہیلو {{name}}،",
      "buttonFallback": "بٹن کام نہیں کر رہا ہے؟ اس پتے کو کاپی اور اپنے براؤزر میں پیسٹ کریں:",
      "footerTagline": "ہر مہمان۔ ہر لمحہ۔ ایک مشترکہ البم۔",
      "footerSecurity": "یہ ایک خودکار اکاؤنٹ سیکیورٹی ای میل ہے۔"
    },
    "verification": {
      "subject": "اپنے ای میل کی تصدیق کریں — SnapUp Events",
      "documentTitle": "اپنے SnapUp Events ای میل کی تصدیق کریں۔",
      "preheader": "SnapUp Events پر ایونٹس بنانا شروع کرنے کے لیے اپنے ای میل ایڈریس کی تصدیق کریں۔",
      "headerLabel": "ای میل کی توثیق",
      "eyebrow": "SnapUp میں خوش آمدید",
      "heading": "اپنے ای میل کی تصدیق کریں۔",
      "introduction": "ایونٹس بنانا، QR کوڈز کا اشتراک، اور ایک مشترکہ البم میں مہمان کے ہر لمحے کو جمع کرنے کے لیے اپنے ای میل ایڈریس کی تصدیق کریں۔",
      "button": "میرے ای میل کی تصدیق کریں۔",
      "secureLabel": "محفوظ لنک:",
      "secureText": "یہ لنک 24 گھنٹے میں ختم ہو جاتا ہے اور صرف ایک بار استعمال کیا جا سکتا ہے۔ اگر آپ نے یہ اکاؤنٹ نہیں بنایا تو کسی کارروائی کی ضرورت نہیں ہے۔",
      "textWelcome": "SnapUp Events میں خوش آمدید۔ ایونٹس بنانا اور ان کا نظم کرنا شروع کرنے کے لیے اپنے ای میل ایڈریس کی تصدیق کریں۔",
      "textExpires": "اس تصدیقی لنک کی میعاد 24 گھنٹے میں ختم ہو جاتی ہے اور اسے صرف ایک بار استعمال کیا جا سکتا ہے۔",
      "textIgnore": "اگر آپ نے یہ اکاؤنٹ نہیں بنایا ہے، تو آپ اس ای میل کو محفوظ طریقے سے نظر انداز کر سکتے ہیں۔"
    },
    "passwordReset": {
      "subject": "اپنا پاس ورڈ دوبارہ ترتیب دیں — SnapUp Events",
      "documentTitle": "اپنا SnapUp Events پاس ورڈ دوبارہ ترتیب دیں۔",
      "preheader": "اپنا SnapUp Events پاس ورڈ دوبارہ ترتیب دینے کے لیے اس محفوظ، واحد استعمال کا لنک استعمال کریں۔",
      "headerLabel": "اکاؤنٹ سیکیورٹی",
      "eyebrow": "پاس ورڈ کی بازیابی۔",
      "heading": "اپنا پاس ورڈ دوبارہ ترتیب دیں۔",
      "introduction": "ہمیں آپ کے SnapUp Events اکاؤنٹ کے لیے نیا پاس ورڈ بنانے کی درخواست موصول ہوئی ہے۔",
      "button": "نیا پاس ورڈ بنائیں",
      "secureLabel": "محفوظ، واحد استعمال کا لنک۔",
      "secureText": "اس کی میعاد 30 منٹ میں ختم ہو جاتی ہے۔ اگر آپ نے اس تبدیلی کی درخواست نہیں کی ہے، تو آپ کا موجودہ پاس ورڈ غیر تبدیل شدہ رہے گا۔",
      "textRequest": "ہمیں آپ کا SnapUp Events پاس ورڈ دوبارہ ترتیب دینے کی درخواست موصول ہوئی ہے۔",
      "textExpires": "یہ ری سیٹ لنک 30 منٹ میں ختم ہو جاتا ہے اور صرف ایک بار استعمال کیا جا سکتا ہے۔",
      "textIgnore": "اگر آپ نے پاس ورڈ دوبارہ ترتیب دینے کی درخواست نہیں کی ہے، تو آپ محفوظ طریقے سے اس ای میل کو نظر انداز کر سکتے ہیں۔"
    }
  },
  "fa": {
    "common": {
      "fallbackName": "وجود دارد",
      "hello": "سلام {{name}}،",
      "buttonFallback": "دکمه کار نمی کند؟ این آدرس را کپی و در مرورگر خود پیست کنید:",
      "footerTagline": "هر مهمان هر لحظه یک آلبوم مشترک",
      "footerSecurity": "این یک ایمیل امنیتی حساب خودکار است."
    },
    "verification": {
      "subject": "ایمیل خود را تأیید کنید — SnapUp Events",
      "documentTitle": "ایمیل SnapUp Events خود را تأیید کنید",
      "preheader": "آدرس ایمیل خود را برای شروع ایجاد رویدادها در SnapUp Events تأیید کنید.",
      "headerLabel": "تایید ایمیل",
      "eyebrow": "به SnapUp خوش آمدید",
      "heading": "ایمیل خود را تایید کنید",
      "introduction": "آدرس ایمیل خود را برای شروع ایجاد رویدادها، به اشتراک گذاری کدهای QR و جمع آوری هر لحظه مهمان در یک آلبوم مشترک، تأیید کنید.",
      "button": "ایمیل من را تایید کنید",
      "secureLabel": "لینک امن:",
      "secureText": "این لینک 24 ساعت دیگر منقضی می شود و فقط یک بار قابل استفاده است. اگر شما این حساب را ایجاد نکرده اید، هیچ اقدامی لازم نیست.",
      "textWelcome": "به SnapUp Events خوش آمدید. آدرس ایمیل خود را برای شروع ایجاد و مدیریت رویدادها تأیید کنید.",
      "textExpires": "این پیوند تأیید در عرض 24 ساعت منقضی می شود و فقط یک بار قابل استفاده است.",
      "textIgnore": "اگر شما این حساب را ایجاد نکرده اید، می توانید با خیال راحت این ایمیل را نادیده بگیرید."
    },
    "passwordReset": {
      "subject": "رمز عبور خود را بازنشانی کنید — SnapUp Events",
      "documentTitle": "رمز عبور SnapUp Events خود را بازنشانی کنید",
      "preheader": "از این پیوند امن و یکبار مصرف برای بازنشانی رمز عبور SnapUp Events خود استفاده کنید.",
      "headerLabel": "امنیت حساب",
      "eyebrow": "بازیابی رمز عبور",
      "heading": "رمز عبور خود را بازنشانی کنید.",
      "introduction": "ما درخواستی برای ایجاد رمز عبور جدید برای حساب SnapUp Events شما دریافت کردیم.",
      "button": "رمز عبور جدید ایجاد کنید",
      "secureLabel": "لینک ایمن و یکبار مصرف",
      "secureText": "30 دقیقه دیگر منقضی می شود. اگر شما این تغییر را درخواست نکرده اید، رمز عبور فعلی شما بدون تغییر باقی می ماند.",
      "textRequest": "ما درخواستی برای بازنشانی رمز عبور SnapUp Events شما دریافت کردیم.",
      "textExpires": "این پیوند بازنشانی در عرض 30 دقیقه منقضی می‌شود و فقط یک بار قابل استفاده است.",
      "textIgnore": "اگر بازنشانی رمز عبور را درخواست نکرده‌اید، می‌توانید با خیال راحت این ایمیل را نادیده بگیرید."
    }
  },
  "ja": {
    "common": {
      "fallbackName": "そこに",
      "hello": "{{name}} さん、こんにちは。",
      "buttonFallback": "ボタンが機能しないのですが？このアドレスをコピーしてブラウザに貼り付けます。",
      "footerTagline": "ゲスト全員。あらゆる瞬間。 1 つの共有アルバム。",
      "footerSecurity": "これは自動アカウントセキュリティメールです。"
    },
    "verification": {
      "subject": "メールアドレスを確認してください — SnapUp Events",
      "documentTitle": "SnapUp Events メールを確認してください",
      "preheader": "SnapUp Events でイベントの作成を開始するには、メール アドレスを確認してください。",
      "headerLabel": "メール認証",
      "eyebrow": "SnapUp へようこそ",
      "heading": "メールアドレスを確認してください",
      "introduction": "メール アドレスを確認して、イベントの作成、QR コードの共有、ゲストのあらゆる瞬間を 1 つの共有アルバムに収集し始めます。",
      "button": "メールアドレスを確認してください",
      "secureLabel": "安全なリンク:",
      "secureText": "このリンクの有効期限は 24 時間であり、使用できるのは 1 回だけです。このアカウントを作成していない場合は、何もする必要はありません。",
      "textWelcome": "SnapUp Events へようこそ。イベントの作成と管理を開始するには、メール アドレスを確認してください。",
      "textExpires": "この確認リンクは 24 時間で期限切れになり、使用できるのは 1 回だけです。",
      "textIgnore": "このアカウントを作成していない場合は、このメールを無視しても問題ありません。"
    },
    "passwordReset": {
      "subject": "パスワードをリセットします — SnapUp Events",
      "documentTitle": "SnapUp Events パスワードをリセットします",
      "preheader": "この安全な使い捨てリンクを使用して、SnapUp Events パスワードをリセットします。",
      "headerLabel": "アカウントのセキュリティ",
      "eyebrow": "パスワードの回復",
      "heading": "パスワードをリセットします。",
      "introduction": "SnapUp Events アカウントの新しいパスワードを作成するリクエストを受け取りました。",
      "button": "新しいパスワードを作成する",
      "secureLabel": "安全な使い捨てリンク。",
      "secureText": "有効期限は 30 分です。この変更をリクエストしなかった場合、現在のパスワードは変更されません。",
      "textRequest": "SnapUp Events パスワードをリセットするリクエストを受け取りました。",
      "textExpires": "このリセット リンクは 30 分で期限切れになり、使用できるのは 1 回だけです。",
      "textIgnore": "パスワードのリセットをリクエストしていない場合は、このメールを無視しても問題ありません。"
    }
  },
  "zh": {
    "common": {
      "fallbackName": "那里",
      "hello": "你好{{name}}，",
      "buttonFallback": "按钮不起作用？复制该地址并将其粘贴到您的浏览器中：",
      "footerTagline": "每位客人。每一刻。一张共享专辑。",
      "footerSecurity": "这是一封自动帐户安全电子邮件。"
    },
    "verification": {
      "subject": "验证您的电子邮件 — SnapUp Events",
      "documentTitle": "验证您的 SnapUp Events 电子邮件",
      "preheader": "验证您的电子邮件地址以开始在 SnapUp Events 上创建活动。",
      "headerLabel": "邮箱验证",
      "eyebrow": "欢迎来到SnapUp",
      "heading": "验证您的电子邮件",
      "introduction": "确认您的电子邮件地址以开始创建活动、共享 QR 代码以及将每一位来宾时刻收集到一个共享相册中。",
      "button": "验证我的电子邮件",
      "secureLabel": "安全链接：",
      "secureText": "此链接将在 24 小时内过期，并且只能使用一次。如果您没有创建此帐户，则无需执行任何操作。",
      "textWelcome": "欢迎来到SnapUp Events。验证您的电子邮件地址以开始创建和管理活动。",
      "textExpires": "此验证链接将在 24 小时后过期，并且只能使用一次。",
      "textIgnore": "如果您没有创建此帐户，您可以安全地忽略此电子邮件。"
    },
    "passwordReset": {
      "subject": "重置您的密码 — SnapUp Events",
      "documentTitle": "重置您的 SnapUp Events 密码",
      "preheader": "使用此安全的一次性链接重置您的 SnapUp Events 密码。",
      "headerLabel": "账户安全",
      "eyebrow": "密码恢复",
      "heading": "重置您的密码。",
      "introduction": "我们收到了为您的 SnapUp Events 帐户创建新密码的请求。",
      "button": "创建新密码",
      "secureLabel": "安全的一次性链接。",
      "secureText": "30 分钟后到期。如果您没有请求进行此更改，您当前的密码将保持不变。",
      "textRequest": "我们收到了重置您的 SnapUp Events 密码的请求。",
      "textExpires": "此重置链接将在 30 分钟后过期，并且只能使用一次。",
      "textIgnore": "如果您没有请求重置密码，您可以放心地忽略这封电子邮件。"
    }
  },
  "ko": {
    "common": {
      "fallbackName": "거기",
      "hello": "안녕하세요 {{name}} 님,",
      "buttonFallback": "버튼이 작동하지 않나요? 다음 주소를 복사하여 브라우저에 붙여넣으세요.",
      "footerTagline": "모든 손님. 매 순간. 공유 앨범 1개",
      "footerSecurity": "이 이메일은 자동 계정 보안 이메일입니다."
    },
    "verification": {
      "subject": "이메일 확인 — SnapUp Events",
      "documentTitle": "SnapUp Events 이메일을 확인하세요",
      "preheader": "SnapUp Events에 이벤트 생성을 시작하려면 이메일 주소를 확인하세요.",
      "headerLabel": "이메일 인증",
      "eyebrow": "SnapUp에 오신 것을 환영합니다.",
      "heading": "이메일을 확인하세요",
      "introduction": "이벤트 생성, QR 코드 공유, 게스트의 모든 순간을 하나의 공유 앨범에 수집하려면 이메일 주소를 확인하세요.",
      "button": "내 이메일을 확인하세요",
      "secureLabel": "보안 링크:",
      "secureText": "이 링크는 24시간 후에 만료되며 한 번만 사용할 수 있습니다. 이 계정을 만들지 않은 경우 별도의 조치가 필요하지 않습니다.",
      "textWelcome": "SnapUp Events에 오신 것을 환영합니다. 이벤트 생성 및 관리를 시작하려면 이메일 주소를 확인하세요.",
      "textExpires": "이 확인 링크는 24시간 후에 만료되며 한 번만 사용할 수 있습니다.",
      "textIgnore": "이 계정을 만들지 않으셨다면 이 이메일을 무시하셔도 됩니다."
    },
    "passwordReset": {
      "subject": "비밀번호 재설정 — SnapUp Events",
      "documentTitle": "SnapUp Events 비밀번호 재설정",
      "preheader": "이 안전한 일회용 링크를 사용하여 SnapUp Events 비밀번호를 재설정하세요.",
      "headerLabel": "계정 보안",
      "eyebrow": "비밀번호 복구",
      "heading": "비밀번호를 재설정하세요.",
      "introduction": "귀하의 SnapUp Events 계정에 대한 새 비밀번호를 생성해 달라는 요청을 받았습니다.",
      "button": "새 비밀번호 만들기",
      "secureLabel": "안전한 일회용 링크.",
      "secureText": "30분 후에 만료됩니다. 변경을 요청하지 않으셨다면 현재 비밀번호는 변경되지 않은 상태로 유지됩니다.",
      "textRequest": "SnapUp Events 비밀번호 재설정 요청을 받았습니다.",
      "textExpires": "이 재설정 링크는 30분 후에 만료되며 한 번만 사용할 수 있습니다.",
      "textIgnore": "비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하셔도 됩니다."
    }
  },
  "pt": {
    "common": {
      "fallbackName": "lá",
      "hello": "Olá {{name}},",
      "buttonFallback": "O botão não funciona? Copie e cole este endereço em seu navegador:",
      "footerTagline": "Cada convidado. Cada momento. Um álbum compartilhado.",
      "footerSecurity": "Este é um e-mail automatizado de segurança da conta."
    },
    "verification": {
      "subject": "Verifique seu e-mail — SnapUp Events",
      "documentTitle": "Verifique seu e-mail SnapUp Events",
      "preheader": "Verifique seu endereço de e-mail para começar a criar eventos em SnapUp Events.",
      "headerLabel": "Verificação de e-mail",
      "eyebrow": "Bem-vindo ao SnapUp",
      "heading": "Verifique seu e-mail",
      "introduction": "Confirme seu endereço de e-mail para começar a criar eventos, compartilhar códigos QR e coletar todos os momentos dos convidados em um álbum compartilhado.",
      "button": "Verifique meu e-mail",
      "secureLabel": "Link seguro:",
      "secureText": "Este link expira em 24 horas e só pode ser usado uma vez. Se você não criou esta conta, nenhuma ação será necessária.",
      "textWelcome": "Bem-vindo ao SnapUp Events. Verifique seu endereço de e-mail para começar a criar e gerenciar eventos.",
      "textExpires": "Este link de verificação expira em 24 horas e só pode ser usado uma vez.",
      "textIgnore": "Se você não criou esta conta, pode ignorar este e-mail com segurança."
    },
    "passwordReset": {
      "subject": "Redefinir sua senha — SnapUp Events",
      "documentTitle": "Redefina sua senha SnapUp Events",
      "preheader": "Use este link seguro e descartável para redefinir sua senha SnapUp Events.",
      "headerLabel": "Segurança da conta",
      "eyebrow": "Recuperação de senha",
      "heading": "Redefina sua senha.",
      "introduction": "Recebemos uma solicitação para criar uma nova senha para sua conta SnapUp Events.",
      "button": "Crie uma nova senha",
      "secureLabel": "Link seguro e de uso único.",
      "secureText": "Expira em 30 minutos. Se você não solicitou esta alteração, sua senha atual permanecerá inalterada.",
      "textRequest": "Recebemos uma solicitação para redefinir sua senha SnapUp Events.",
      "textExpires": "Este link de redefinição expira em 30 minutos e só pode ser usado uma vez.",
      "textIgnore": "Se você não solicitou uma redefinição de senha, pode ignorar este e-mail com segurança."
    }
  },
  "ru": {
    "common": {
      "fallbackName": "там",
      "hello": "Привет {{name}}!",
      "buttonFallback": "Кнопка не работает? Скопируйте и вставьте этот адрес в свой браузер:",
      "footerTagline": "Каждый гость. Каждый момент. Один общий альбом.",
      "footerSecurity": "Это автоматическое электронное письмо для обеспечения безопасности учетной записи."
    },
    "verification": {
      "subject": "Подтвердите свой адрес электронной почты — SnapUp Events",
      "documentTitle": "Подтвердите свой адрес электронной почты SnapUp Events",
      "preheader": "Подтвердите свой адрес электронной почты, чтобы начать создавать мероприятия на SnapUp Events.",
      "headerLabel": "Проверка электронной почты",
      "eyebrow": "Добро пожаловать в SnapUp",
      "heading": "Подтвердите свой адрес электронной почты",
      "introduction": "Подтвердите свой адрес электронной почты, чтобы начать создавать мероприятия, делиться кодами QR и собирать моменты каждого гостя в одном общем альбоме.",
      "button": "Подтвердите мою электронную почту",
      "secureLabel": "Безопасная ссылка:",
      "secureText": "Срок действия этой ссылки истекает через 24 часа, и ее можно использовать только один раз. Если вы не создавали эту учетную запись, никаких действий не требуется.",
      "textWelcome": "Добро пожаловать в SnapUp Events. Подтвердите свой адрес электронной почты, чтобы начать создавать мероприятия и управлять ими.",
      "textExpires": "Срок действия этой ссылки для проверки истекает через 24 часа, и ее можно использовать только один раз.",
      "textIgnore": "Если вы не создавали эту учетную запись, вы можете смело игнорировать это письмо."
    },
    "passwordReset": {
      "subject": "Сбросьте пароль — SnapUp Events",
      "documentTitle": "Сбросьте пароль SnapUp Events",
      "preheader": "Используйте эту безопасную одноразовую ссылку для сброса пароля SnapUp Events.",
      "headerLabel": "Безопасность аккаунта",
      "eyebrow": "Восстановление пароля",
      "heading": "Сбросьте пароль.",
      "introduction": "Мы получили запрос на создание нового пароля для вашей учетной записи SnapUp Events.",
      "button": "Создать новый пароль",
      "secureLabel": "Безопасная одноразовая ссылка.",
      "secureText": "Срок действия истекает через 30 минут. Если вы не запрашивали это изменение, ваш текущий пароль останется неизменным.",
      "textRequest": "Мы получили запрос на сброс вашего пароля SnapUp Events.",
      "textExpires": "Срок действия этой ссылки для сброса истекает через 30 минут, и ее можно использовать только один раз.",
      "textIgnore": "Если вы не запрашивали сброс пароля, вы можете смело игнорировать это письмо."
    }
  },
  "id": {
    "common": {
      "fallbackName": "di sana",
      "hello": "Halo {{name}},",
      "buttonFallback": "Tombol tidak berfungsi? Salin dan tempel alamat ini ke browser Anda:",
      "footerTagline": "Setiap tamu. Setiap saat. Satu album bersama.",
      "footerSecurity": "Ini adalah email keamanan akun otomatis."
    },
    "verification": {
      "subject": "Verifikasi email Anda — SnapUp Events",
      "documentTitle": "Verifikasi email SnapUp Events Anda",
      "preheader": "Verifikasi alamat email Anda untuk mulai membuat acara di SnapUp Events.",
      "headerLabel": "Verifikasi email",
      "eyebrow": "Selamat datang di SnapUp",
      "heading": "Verifikasi email Anda",
      "introduction": "Konfirmasikan alamat email Anda untuk mulai membuat acara, membagikan kode QR, dan mengumpulkan setiap momen tamu dalam satu album bersama.",
      "button": "Verifikasi email saya",
      "secureLabel": "Tautan aman:",
      "secureText": "Tautan ini kedaluwarsa dalam 24 jam dan hanya dapat digunakan satu kali. Jika Anda tidak membuat akun ini, tidak ada tindakan yang diperlukan.",
      "textWelcome": "Selamat datang di SnapUp Events. Verifikasi alamat email Anda untuk mulai membuat dan mengelola acara.",
      "textExpires": "Tautan verifikasi ini akan habis masa berlakunya dalam 24 jam dan hanya dapat digunakan satu kali.",
      "textIgnore": "Jika Anda tidak membuat akun ini, Anda dapat mengabaikan email ini dengan aman."
    },
    "passwordReset": {
      "subject": "Setel ulang kata sandi Anda — SnapUp Events",
      "documentTitle": "Setel ulang kata sandi SnapUp Events Anda",
      "preheader": "Gunakan tautan sekali pakai yang aman ini untuk mengatur ulang kata sandi SnapUp Events Anda.",
      "headerLabel": "Keamanan akun",
      "eyebrow": "Pemulihan kata sandi",
      "heading": "Setel ulang kata sandi Anda.",
      "introduction": "Kami menerima permintaan untuk membuat kata sandi baru untuk akun SnapUp Events Anda.",
      "button": "Buat kata sandi baru",
      "secureLabel": "Tautan aman dan sekali pakai.",
      "secureText": "Masa berlakunya habis dalam 30 menit. Jika Anda tidak meminta perubahan ini, kata sandi Anda saat ini tetap tidak berubah.",
      "textRequest": "Kami menerima permintaan untuk mengatur ulang kata sandi SnapUp Events Anda.",
      "textExpires": "Tautan reset ini kedaluwarsa dalam 30 menit dan hanya dapat digunakan satu kali.",
      "textIgnore": "Jika Anda tidak meminta pengaturan ulang kata sandi, Anda dapat mengabaikan email ini dengan aman."
    }
  },
  "pl": {
    "common": {
      "fallbackName": "tam",
      "hello": "Witaj {{name}},",
      "buttonFallback": "Przycisk nie działa? Skopiuj i wklej ten adres do swojej przeglądarki:",
      "footerTagline": "Każdy gość. W każdej chwili. Jeden udostępniony album.",
      "footerSecurity": "To jest automatyczna wiadomość e-mail dotycząca bezpieczeństwa konta."
    },
    "verification": {
      "subject": "Zweryfikuj swój adres e-mail — SnapUp Events",
      "documentTitle": "Zweryfikuj swój adres e-mail SnapUp Events",
      "preheader": "Zweryfikuj swój adres e-mail, aby rozpocząć tworzenie wydarzeń na SnapUp Events.",
      "headerLabel": "Weryfikacja e-mailowa",
      "eyebrow": "Witamy w SnapUp",
      "heading": "Zweryfikuj swój adres e-mail",
      "introduction": "Potwierdź swój adres e-mail, aby rozpocząć tworzenie wydarzeń, udostępnianie kodów QR i gromadzenie chwil gości w jednym udostępnionym albumie.",
      "button": "Zweryfikuj mój e-mail",
      "secureLabel": "Bezpieczny link:",
      "secureText": "Ten link wygasa w ciągu 24 godzin i można go użyć tylko raz. Jeśli to nie Ty utworzyłeś to konto, nie jest wymagane żadne działanie.",
      "textWelcome": "Witamy w SnapUp Events. Zweryfikuj swój adres e-mail, aby rozpocząć tworzenie wydarzeń i zarządzanie nimi.",
      "textExpires": "Ten link weryfikacyjny wygasa po 24 godzinach i można go użyć tylko raz.",
      "textIgnore": "Jeśli to nie Ty utworzyłeś to konto, możesz bezpiecznie zignorować tę wiadomość e-mail."
    },
    "passwordReset": {
      "subject": "Zresetuj hasło — SnapUp Events",
      "documentTitle": "Zresetuj swoje hasło SnapUp Events",
      "preheader": "Użyj tego bezpiecznego, jednorazowego łącza, aby zresetować hasło SnapUp Events.",
      "headerLabel": "Bezpieczeństwo konta",
      "eyebrow": "Odzyskiwanie hasła",
      "heading": "Zresetuj swoje hasło.",
      "introduction": "Otrzymaliśmy prośbę o utworzenie nowego hasła dla Twojego konta SnapUp Events.",
      "button": "Utwórz nowe hasło",
      "secureLabel": "Bezpieczny, jednorazowy link.",
      "secureText": "Wygasa za 30 minut. Jeśli nie prosiłeś o tę zmianę, Twoje obecne hasło pozostanie niezmienione.",
      "textRequest": "Otrzymaliśmy prośbę o zresetowanie Twojego hasła SnapUp Events.",
      "textExpires": "Ten link resetujący wygasa po 30 minutach i można go użyć tylko raz.",
      "textIgnore": "Jeśli nie prosiłeś o zresetowanie hasła, możesz bezpiecznie zignorować tę wiadomość."
    }
  },
  "vi": {
    "common": {
      "fallbackName": "ở đó",
      "hello": "Xin chào {{name}},",
      "buttonFallback": "Nút không hoạt động? Sao chép và dán địa chỉ này vào trình duyệt của bạn:",
      "footerTagline": "Mỗi vị khách. Mọi khoảnh khắc. Một album được chia sẻ.",
      "footerSecurity": "Đây là email bảo mật tài khoản tự động."
    },
    "verification": {
      "subject": "Xác minh email của bạn — SnapUp Events",
      "documentTitle": "Xác minh email SnapUp Events của bạn",
      "preheader": "Xác minh địa chỉ email của bạn để bắt đầu tạo sự kiện trên SnapUp Events.",
      "headerLabel": "Xác minh email",
      "eyebrow": "Chào mừng đến với SnapUp",
      "heading": "Xác minh email của bạn",
      "introduction": "Xác nhận địa chỉ email của bạn để bắt đầu tạo sự kiện, chia sẻ mã QR và thu thập mọi khoảnh khắc của khách trong một album chia sẻ.",
      "button": "Xác minh email của tôi",
      "secureLabel": "Liên kết an toàn:",
      "secureText": "Liên kết này sẽ hết hạn sau 24 giờ và chỉ có thể được sử dụng một lần. Nếu bạn không tạo tài khoản này thì không cần thực hiện hành động nào.",
      "textWelcome": "Chào mừng đến với SnapUp Events. Xác minh địa chỉ email của bạn để bắt đầu tạo và quản lý sự kiện.",
      "textExpires": "Liên kết xác minh này sẽ hết hạn sau 24 giờ và chỉ có thể được sử dụng một lần.",
      "textIgnore": "Nếu bạn không tạo tài khoản này, bạn có thể yên tâm bỏ qua email này."
    },
    "passwordReset": {
      "subject": "Đặt lại mật khẩu của bạn — SnapUp Events",
      "documentTitle": "Đặt lại mật khẩu SnapUp Events của bạn",
      "preheader": "Hãy sử dụng liên kết an toàn, dùng một lần này để đặt lại mật khẩu SnapUp Events của bạn.",
      "headerLabel": "Bảo mật tài khoản",
      "eyebrow": "Khôi phục mật khẩu",
      "heading": "Đặt lại mật khẩu của bạn.",
      "introduction": "Chúng tôi đã nhận được yêu cầu tạo mật khẩu mới cho tài khoản SnapUp Events của bạn.",
      "button": "Tạo mật khẩu mới",
      "secureLabel": "Liên kết an toàn, sử dụng một lần.",
      "secureText": "Nó hết hạn sau 30 phút. Nếu bạn không yêu cầu thay đổi này, mật khẩu hiện tại của bạn vẫn không thay đổi.",
      "textRequest": "Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu SnapUp Events của bạn.",
      "textExpires": "Liên kết đặt lại này sẽ hết hạn sau 30 phút và chỉ có thể được sử dụng một lần.",
      "textIgnore": "Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể yên tâm bỏ qua email này."
    }
  },
  "uk": {
    "common": {
      "fallbackName": "там",
      "hello": "Привіт {{name}},",
      "buttonFallback": "Кнопка не працює? Скопіюйте та вставте цю адресу у свій браузер:",
      "footerTagline": "Кожен гість. Кожну мить. Один спільний альбом.",
      "footerSecurity": "Це автоматичний електронний лист для безпеки облікового запису."
    },
    "verification": {
      "subject": "Підтвердьте свою електронну адресу — SnapUp Events",
      "documentTitle": "Підтвердьте свою електронну адресу SnapUp Events",
      "preheader": "Підтвердьте свою електронну адресу, щоб почати створювати події на SnapUp Events.",
      "headerLabel": "Підтвердження електронної пошти",
      "eyebrow": "Ласкаво просимо до SnapUp",
      "heading": "Підтвердьте свою електронну адресу",
      "introduction": "Підтвердьте свою адресу електронної пошти, щоб почати створювати події, ділитися кодами QR і збирати моменти кожного гостя в одному спільному альбомі.",
      "button": "Підтвердити мій email",
      "secureLabel": "Безпечне посилання:",
      "secureText": "Термін дії цього посилання закінчується через 24 години, і ним можна скористатися лише один раз. Якщо ви не створювали цей обліковий запис, нічого робити не потрібно.",
      "textWelcome": "Ласкаво просимо до SnapUp Events. Підтвердьте свою електронну адресу, щоб почати створювати події та керувати ними.",
      "textExpires": "Термін дії цього посилання для підтвердження закінчується через 24 години, і його можна використати лише один раз.",
      "textIgnore": "Якщо ви не створювали цей обліковий запис, можете сміливо ігнорувати цей електронний лист."
    },
    "passwordReset": {
      "subject": "Скинути пароль — SnapUp Events",
      "documentTitle": "Скиньте свій пароль SnapUp Events",
      "preheader": "Скористайтеся цим безпечним одноразовим посиланням, щоб скинути свій пароль SnapUp Events.",
      "headerLabel": "Безпека облікового запису",
      "eyebrow": "Відновлення пароля",
      "heading": "Скинути пароль.",
      "introduction": "Ми отримали запит на створення нового пароля для вашого облікового запису SnapUp Events.",
      "button": "Створіть новий пароль",
      "secureLabel": "Безпечне одноразове посилання.",
      "secureText": "Термін дії закінчується через 30 хвилин. Якщо ви не запитували цю зміну, ваш поточний пароль залишиться незмінним.",
      "textRequest": "Ми отримали запит на скидання вашого пароля SnapUp Events.",
      "textExpires": "Це посилання для скидання закінчується через 30 хвилин, і його можна використати лише один раз.",
      "textIgnore": "Якщо ви не надсилали запит на скидання пароля, можете сміливо ігнорувати цей електронний лист."
    }
  },
  "th": {
    "common": {
      "fallbackName": "ที่นั่น",
      "hello": "สวัสดี {{name}}",
      "buttonFallback": "ปุ่มไม่ทำงาน? คัดลอกและวางที่อยู่นี้ลงในเบราว์เซอร์ของคุณ:",
      "footerTagline": "แขกทุกท่าน. ทุกช่วงเวลา หนึ่งอัลบั้มที่แชร์",
      "footerSecurity": "นี่คืออีเมลรักษาความปลอดภัยบัญชีอัตโนมัติ"
    },
    "verification": {
      "subject": "ยืนยันอีเมลของคุณ — SnapUp Events",
      "documentTitle": "ยืนยันอีเมล SnapUp Events ของคุณ",
      "preheader": "ยืนยันที่อยู่อีเมลของคุณเพื่อเริ่มสร้างกิจกรรมบน SnapUp Events",
      "headerLabel": "การยืนยันอีเมล",
      "eyebrow": "ยินดีต้อนรับสู่ SnapUp",
      "heading": "ยืนยันอีเมลของคุณ",
      "introduction": "ยืนยันที่อยู่อีเมลของคุณเพื่อเริ่มสร้างกิจกรรม แบ่งปันรหัส QR และรวบรวมทุกช่วงเวลาของแขกรับเชิญไว้ในอัลบั้มที่แชร์เพียงอัลบั้มเดียว",
      "button": "ยืนยันอีเมลของฉัน",
      "secureLabel": "ลิงค์ที่ปลอดภัย:",
      "secureText": "ลิงก์นี้จะหมดอายุใน 24 ชั่วโมงและสามารถใช้ได้เพียงครั้งเดียวเท่านั้น หากคุณไม่ได้สร้างบัญชีนี้ ก็ไม่จำเป็นต้องดำเนินการใดๆ",
      "textWelcome": "ยินดีต้อนรับสู่ SnapUp Events ยืนยันที่อยู่อีเมลของคุณเพื่อเริ่มสร้างและจัดการกิจกรรม",
      "textExpires": "ลิงก์ยืนยันนี้จะหมดอายุใน 24 ชั่วโมงและสามารถใช้ได้เพียงครั้งเดียวเท่านั้น",
      "textIgnore": "หากคุณไม่ได้สร้างบัญชีนี้ คุณสามารถเพิกเฉยต่ออีเมลนี้ได้อย่างปลอดภัย"
    },
    "passwordReset": {
      "subject": "รีเซ็ตรหัสผ่านของคุณ — SnapUp Events",
      "documentTitle": "รีเซ็ตรหัสผ่าน SnapUp Events ของคุณ",
      "preheader": "ใช้ลิงก์แบบใช้ครั้งเดียวที่ปลอดภัยนี้เพื่อรีเซ็ตรหัสผ่าน SnapUp Events ของคุณ",
      "headerLabel": "ความปลอดภัยของบัญชี",
      "eyebrow": "การกู้คืนรหัสผ่าน",
      "heading": "รีเซ็ตรหัสผ่านของคุณ",
      "introduction": "เราได้รับคำขอให้สร้างรหัสผ่านใหม่สำหรับบัญชี SnapUp Events ของคุณ",
      "button": "สร้างรหัสผ่านใหม่",
      "secureLabel": "ลิงก์แบบใช้ครั้งเดียวที่ปลอดภัย",
      "secureText": "มันจะหมดอายุใน 30 นาที หากคุณไม่ได้ร้องขอการเปลี่ยนแปลงนี้ รหัสผ่านปัจจุบันของคุณจะยังคงไม่เปลี่ยนแปลง",
      "textRequest": "เราได้รับคำขอให้รีเซ็ตรหัสผ่าน SnapUp Events ของคุณ",
      "textExpires": "ลิงก์รีเซ็ตนี้จะหมดอายุใน 30 นาที และสามารถใช้ได้เพียงครั้งเดียวเท่านั้น",
      "textIgnore": "หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน คุณสามารถเพิกเฉยต่ออีเมลฉบับนี้ได้อย่างปลอดภัย"
    }
  },
  "cs": {
    "common": {
      "fallbackName": "tam",
      "hello": "Dobrý den {{name}},",
      "buttonFallback": "Tlačítko nefunguje? Zkopírujte a vložte tuto adresu do svého prohlížeče:",
      "footerTagline": "Každý host. Každou chvíli. Jedno sdílené album.",
      "footerSecurity": "Toto je automatický e-mail pro zabezpečení účtu."
    },
    "verification": {
      "subject": "Ověřte svůj e-mail — SnapUp Events",
      "documentTitle": "Ověřte svůj e-mail SnapUp Events",
      "preheader": "Ověřte svou e-mailovou adresu a začněte vytvářet události na SnapUp Events.",
      "headerLabel": "Ověření e-mailem",
      "eyebrow": "Vítejte na SnapUp",
      "heading": "Ověřte svůj e-mail",
      "introduction": "Potvrďte svou e-mailovou adresu a začněte vytvářet události, sdílet QR kódy a shromažďovat každý moment hosta do jednoho sdíleného alba.",
      "button": "Ověřte můj email",
      "secureLabel": "Zabezpečený odkaz:",
      "secureText": "Platnost tohoto odkazu vyprší za 24 hodin a lze jej použít pouze jednou. Pokud jste tento účet nevytvořili, není vyžadována žádná akce.",
      "textWelcome": "Vítejte v SnapUp Events. Chcete-li začít vytvářet a spravovat události, ověřte svou e-mailovou adresu.",
      "textExpires": "Platnost tohoto ověřovacího odkazu vyprší za 24 hodin a lze jej použít pouze jednou.",
      "textIgnore": "Pokud jste si tento účet nevytvořili, můžete tento e-mail bezpečně ignorovat."
    },
    "passwordReset": {
      "subject": "Resetujte své heslo — SnapUp Events",
      "documentTitle": "Resetujte své heslo SnapUp Events",
      "preheader": "Pomocí tohoto zabezpečeného jednorázového odkazu resetujte své heslo SnapUp Events.",
      "headerLabel": "Zabezpečení účtu",
      "eyebrow": "Obnovení hesla",
      "heading": "Obnovte heslo.",
      "introduction": "Obdrželi jsme žádost o vytvoření nového hesla pro váš účet SnapUp Events.",
      "button": "Vytvořte nové heslo",
      "secureLabel": "Bezpečný odkaz na jedno použití.",
      "secureText": "Vyprší za 30 minut. Pokud jste o tuto změnu nepožádali, vaše aktuální heslo zůstane nezměněno.",
      "textRequest": "Obdrželi jsme žádost o resetování vašeho hesla SnapUp Events.",
      "textExpires": "Platnost tohoto odkazu pro reset vyprší za 30 minut a lze jej použít pouze jednou.",
      "textIgnore": "Pokud jste o reset hesla nepožádali, můžete tento e-mail bezpečně ignorovat."
    }
  },
  "he": {
    "common": {
      "fallbackName": "שם",
      "hello": "שלום {{name}},",
      "buttonFallback": "הכפתור לא עובד? העתק והדבק כתובת זו בדפדפן שלך:",
      "footerTagline": "כל אורח. כל רגע. אלבום אחד משותף.",
      "footerSecurity": "זהו דוא\"ל אוטומטי לאבטחת חשבון."
    },
    "verification": {
      "subject": "אמת את האימייל שלך - SnapUp Events",
      "documentTitle": "אמת את האימייל SnapUp Events שלך",
      "preheader": "אמת את כתובת הדוא\"ל שלך כדי להתחיל ליצור אירועים ב-SnapUp Events.",
      "headerLabel": "אימות דוא\"ל",
      "eyebrow": "ברוכים הבאים אל SnapUp",
      "heading": "אמת את האימייל שלך",
      "introduction": "אשר את כתובת האימייל שלך כדי להתחיל ליצור אירועים, לשתף קודי QR, ולאסוף כל רגע אורח באלבום משותף אחד.",
      "button": "אמת את האימייל שלי",
      "secureLabel": "קישור מאובטח:",
      "secureText": "קישור זה יפוג בעוד 24 שעות וניתן להשתמש בו רק פעם אחת. אם לא יצרת חשבון זה, אין צורך בפעולה.",
      "textWelcome": "ברוכים הבאים אל SnapUp Events. אמת את כתובת הדוא\"ל שלך כדי להתחיל ליצור ולנהל אירועים.",
      "textExpires": "קישור אימות זה יפוג בעוד 24 שעות וניתן להשתמש בו רק פעם אחת.",
      "textIgnore": "אם לא יצרת חשבון זה, תוכל להתעלם בבטחה מהאימייל הזה."
    },
    "passwordReset": {
      "subject": "אפס את הסיסמה שלך - SnapUp Events",
      "documentTitle": "אפס את הסיסמה SnapUp Events שלך",
      "preheader": "השתמש בקישור מאובטח זה לשימוש חד פעמי כדי לאפס את סיסמת SnapUp Events שלך.",
      "headerLabel": "אבטחת חשבון",
      "eyebrow": "שחזור סיסמא",
      "heading": "אפס את הסיסמה שלך.",
      "introduction": "קיבלנו בקשה ליצור סיסמה חדשה לחשבון SnapUp Events שלך.",
      "button": "צור סיסמה חדשה",
      "secureLabel": "קישור מאובטח לשימוש חד פעמי.",
      "secureText": "זה יפוג בעוד 30 דקות. אם לא ביקשת שינוי זה, הסיסמה הנוכחית שלך תישאר ללא שינוי.",
      "textRequest": "קיבלנו בקשה לאפס את הסיסמה SnapUp Events שלך.",
      "textExpires": "קישור האיפוס הזה יפוג בעוד 30 דקות וניתן להשתמש בו רק פעם אחת.",
      "textIgnore": "אם לא ביקשת איפוס סיסמה, תוכל להתעלם בבטחה מאימייל זה."
    }
  },
  "hu": {
    "common": {
      "fallbackName": "ott",
      "hello": "Kedves {{name}}!",
      "buttonFallback": "Nem működik a gomb? Másolja ki és illessze be ezt a címet a böngészőjébe:",
      "footerTagline": "Minden vendég. Minden pillanatban. Egy megosztott album.",
      "footerSecurity": "Ez egy automatikus fiókbiztonsági e-mail."
    },
    "verification": {
      "subject": "Igazolja e-mail-címét – SnapUp Events",
      "documentTitle": "Igazolja SnapUp Events e-mail-címét",
      "preheader": "Erősítse meg e-mail címét az események létrehozásának megkezdéséhez a SnapUp Events webhelyen.",
      "headerLabel": "E-mail ellenőrzés",
      "eyebrow": "Üdvözli a SnapUp",
      "heading": "Igazolja e-mail-címét",
      "introduction": "Erősítse meg e-mail címét az események létrehozásához, a QR kódok megosztásához, és minden vendég pillanatának egy megosztott albumba gyűjtéséhez.",
      "button": "Igazolja az e-mail címemet",
      "secureLabel": "Biztonságos link:",
      "secureText": "Ez a link 24 órán belül lejár, és csak egyszer használható. Ha nem Ön hozta létre ezt a fiókot, nincs teendője.",
      "textWelcome": "Üdvözli a SnapUp Events. Az események létrehozásának és kezelésének megkezdéséhez igazolja e-mail címét.",
      "textExpires": "Ez az ellenőrző link 24 órán belül lejár, és csak egyszer használható.",
      "textIgnore": "Ha nem Ön hozta létre ezt a fiókot, nyugodtan figyelmen kívül hagyhatja ezt az e-mailt."
    },
    "passwordReset": {
      "subject": "Állítsa vissza jelszavát — SnapUp Events",
      "documentTitle": "Állítsa vissza a SnapUp Events jelszavát",
      "preheader": "Ezzel a biztonságos, egyszer használatos hivatkozással állítsa vissza SnapUp Events jelszavát.",
      "headerLabel": "Számlabiztonság",
      "eyebrow": "Jelszó helyreállítás",
      "heading": "Állítsa vissza jelszavát.",
      "introduction": "Megkaptuk a kérést, hogy hozzunk létre új jelszót SnapUp Events fiókjához.",
      "button": "Hozzon létre egy új jelszót",
      "secureLabel": "Biztonságos, egyszer használatos link.",
      "secureText": "30 perc múlva lejár. Ha nem Ön kérte ezt a módosítást, jelenlegi jelszava változatlan marad.",
      "textRequest": "Kaptunk egy kérést, hogy állítsuk vissza SnapUp Events jelszavát.",
      "textExpires": "Ez a visszaállítási hivatkozás 30 percen belül lejár, és csak egyszer használható.",
      "textIgnore": "Ha nem kérte a jelszó visszaállítását, nyugodtan figyelmen kívül hagyhatja ezt az e-mailt."
    }
  },
  "sv": {
    "common": {
      "fallbackName": "där",
      "hello": "Hej {{name}},",
      "buttonFallback": "Fungerar inte knappen? Kopiera och klistra in den här adressen i din webbläsare:",
      "footerTagline": "Varje gäst. Varje ögonblick. Ett delat album.",
      "footerSecurity": "Detta är ett automatiskt kontosäkerhetsmeddelande."
    },
    "verification": {
      "subject": "Verifiera din e-post — SnapUp Events",
      "documentTitle": "Verifiera din SnapUp Events e-post",
      "preheader": "Verifiera din e-postadress för att börja skapa händelser på SnapUp Events.",
      "headerLabel": "E-postverifiering",
      "eyebrow": "Välkommen till SnapUp",
      "heading": "Verifiera din e-post",
      "introduction": "Bekräfta din e-postadress för att börja skapa händelser, dela QR-koder och samla varje gästögonblick i ett delat album.",
      "button": "Verifiera min e-post",
      "secureLabel": "Säker länk:",
      "secureText": "Denna länk upphör om 24 timmar och kan endast användas en gång. Om du inte skapade det här kontot krävs ingen åtgärd.",
      "textWelcome": "Välkommen till SnapUp Events. Verifiera din e-postadress för att börja skapa och hantera händelser.",
      "textExpires": "Denna verifieringslänk löper ut om 24 timmar och kan bara användas en gång.",
      "textIgnore": "Om du inte skapade det här kontot kan du lugnt ignorera det här e-postmeddelandet."
    },
    "passwordReset": {
      "subject": "Återställ ditt lösenord — SnapUp Events",
      "documentTitle": "Återställ ditt SnapUp Events-lösenord",
      "preheader": "Använd den här säkra engångslänken för att återställa ditt SnapUp Events-lösenord.",
      "headerLabel": "Kontosäkerhet",
      "eyebrow": "Lösenordsåterställning",
      "heading": "Återställ ditt lösenord.",
      "introduction": "Vi fick en begäran om att skapa ett nytt lösenord för ditt SnapUp Events-konto.",
      "button": "Skapa ett nytt lösenord",
      "secureLabel": "Säker engångslänk.",
      "secureText": "Den löper ut om 30 minuter. Om du inte begärde denna ändring förblir ditt nuvarande lösenord oförändrat.",
      "textRequest": "Vi fick en begäran om att återställa ditt SnapUp Events-lösenord.",
      "textExpires": "Denna återställningslänk går ut om 30 minuter och kan bara användas en gång.",
      "textIgnore": "Om du inte begärde en lösenordsåterställning kan du lugnt ignorera detta e-postmeddelande."
    }
  },
  "bn": {
    "common": {
      "fallbackName": "সেখানে",
      "hello": "হ্যালো {{name}},",
      "buttonFallback": "বোতাম কাজ করছে না? আপনার ব্রাউজারে এই ঠিকানাটি অনুলিপি করুন এবং আটকান:",
      "footerTagline": "প্রত্যেক অতিথি। প্রতি মুহূর্তে। একটি শেয়ার করা অ্যালবাম।",
      "footerSecurity": "এটি একটি স্বয়ংক্রিয় অ্যাকাউন্ট-নিরাপত্তা ইমেল।"
    },
    "verification": {
      "subject": "আপনার ইমেল যাচাই করুন — SnapUp Events",
      "documentTitle": "আপনার SnapUp Events ইমেল যাচাই করুন",
      "preheader": "SnapUp Events এ ইভেন্ট তৈরি শুরু করতে আপনার ইমেল ঠিকানা যাচাই করুন।",
      "headerLabel": "ইমেল যাচাইকরণ",
      "eyebrow": "SnapUp এ স্বাগতম",
      "heading": "আপনার ইমেল যাচাই করুন",
      "introduction": "ইভেন্ট তৈরি করা, QR কোড শেয়ার করা, এবং একটি শেয়ার করা অ্যালবামে প্রতিটি অতিথি মুহূর্ত সংগ্রহ করতে আপনার ইমেল ঠিকানা নিশ্চিত করুন৷",
      "button": "আমার ইমেইল যাচাই করুন",
      "secureLabel": "নিরাপদ লিঙ্ক:",
      "secureText": "এই লিঙ্কটি 24 ঘন্টার মধ্যে মেয়াদ শেষ হয়ে যায় এবং শুধুমাত্র একবার ব্যবহার করা যেতে পারে। আপনি যদি এই অ্যাকাউন্টটি তৈরি না করে থাকেন তবে কোনও পদক্ষেপের প্রয়োজন নেই৷",
      "textWelcome": "SnapUp Events এ স্বাগতম। ইভেন্টগুলি তৈরি এবং পরিচালনা শুরু করতে আপনার ইমেল ঠিকানা যাচাই করুন৷",
      "textExpires": "এই যাচাইকরণ লিঙ্কটি 24 ঘন্টার মধ্যে মেয়াদ শেষ হয়ে যায় এবং শুধুমাত্র একবার ব্যবহার করা যেতে পারে।",
      "textIgnore": "আপনি যদি এই অ্যাকাউন্টটি তৈরি না করে থাকেন তবে আপনি নিরাপদে এই ইমেলটিকে উপেক্ষা করতে পারেন৷"
    },
    "passwordReset": {
      "subject": "আপনার পাসওয়ার্ড পুনরায় সেট করুন — SnapUp Events",
      "documentTitle": "আপনার SnapUp Events পাসওয়ার্ড রিসেট করুন",
      "preheader": "আপনার SnapUp Events পাসওয়ার্ড পুনরায় সেট করতে এই সুরক্ষিত, একক-ব্যবহারের লিঙ্কটি ব্যবহার করুন৷",
      "headerLabel": "অ্যাকাউন্ট নিরাপত্তা",
      "eyebrow": "পাসওয়ার্ড পুনরুদ্ধার",
      "heading": "আপনার পাসওয়ার্ড রিসেট করুন।",
      "introduction": "আমরা আপনার SnapUp Events অ্যাকাউন্টের জন্য একটি নতুন পাসওয়ার্ড তৈরি করার অনুরোধ পেয়েছি।",
      "button": "একটি নতুন পাসওয়ার্ড তৈরি করুন",
      "secureLabel": "সুরক্ষিত, একক-ব্যবহারের লিঙ্ক।",
      "secureText": "এটি 30 মিনিটের মধ্যে মেয়াদ শেষ হয়ে যায়। আপনি এই পরিবর্তনের অনুরোধ না করলে, আপনার বর্তমান পাসওয়ার্ড অপরিবর্তিত থাকবে।",
      "textRequest": "আমরা আপনার SnapUp Events পাসওয়ার্ড পুনরায় সেট করার জন্য একটি অনুরোধ পেয়েছি।",
      "textExpires": "এই রিসেট লিঙ্কটি 30 মিনিটের মধ্যে মেয়াদ শেষ হয়ে যায় এবং শুধুমাত্র একবার ব্যবহার করা যেতে পারে।",
      "textIgnore": "আপনি যদি পাসওয়ার্ড রিসেট করার অনুরোধ না করে থাকেন, তাহলে আপনি নিরাপদে এই ইমেলটি উপেক্ষা করতে পারেন৷"
    }
  },
  "ms": {
    "common": {
      "fallbackName": "di sana",
      "hello": "Helo {{name}},",
      "buttonFallback": "Butang tidak berfungsi? Salin dan tampal alamat ini ke dalam penyemak imbas anda:",
      "footerTagline": "Setiap tetamu. Setiap saat. Satu album kongsi.",
      "footerSecurity": "Ini ialah e-mel keselamatan akaun automatik."
    },
    "verification": {
      "subject": "Sahkan e-mel anda — SnapUp Events",
      "documentTitle": "Sahkan e-mel SnapUp Events anda",
      "preheader": "Sahkan alamat e-mel anda untuk mula membuat acara di SnapUp Events.",
      "headerLabel": "Pengesahan e-mel",
      "eyebrow": "Selamat datang ke SnapUp",
      "heading": "Sahkan e-mel anda",
      "introduction": "Sahkan alamat e-mel anda untuk mula membuat acara, berkongsi kod QR dan mengumpul setiap detik tetamu dalam satu album kongsi.",
      "button": "Sahkan e-mel saya",
      "secureLabel": "Pautan selamat:",
      "secureText": "Pautan ini tamat tempoh dalam masa 24 jam dan hanya boleh digunakan sekali. Jika anda tidak membuat akaun ini, tiada tindakan diperlukan.",
      "textWelcome": "Selamat datang ke SnapUp Events. Sahkan alamat e-mel anda untuk mula membuat dan mengurus acara.",
      "textExpires": "Pautan pengesahan ini tamat tempoh dalam masa 24 jam dan hanya boleh digunakan sekali.",
      "textIgnore": "Jika anda tidak membuat akaun ini, anda boleh mengabaikan e-mel ini dengan selamat."
    },
    "passwordReset": {
      "subject": "Tetapkan semula kata laluan anda — SnapUp Events",
      "documentTitle": "Tetapkan semula kata laluan SnapUp Events anda",
      "preheader": "Gunakan pautan selamat dan sekali guna ini untuk menetapkan semula kata laluan SnapUp Events anda.",
      "headerLabel": "Keselamatan akaun",
      "eyebrow": "Pemulihan kata laluan",
      "heading": "Tetapkan semula kata laluan anda.",
      "introduction": "Kami menerima permintaan untuk membuat kata laluan baharu untuk akaun SnapUp Events anda.",
      "button": "Buat kata laluan baharu",
      "secureLabel": "Pautan selamat, sekali guna.",
      "secureText": "Ia tamat tempoh dalam 30 minit. Jika anda tidak meminta perubahan ini, kata laluan semasa anda kekal tidak berubah.",
      "textRequest": "Kami menerima permintaan untuk menetapkan semula kata laluan SnapUp Events anda.",
      "textExpires": "Pautan set semula ini tamat tempoh dalam masa 30 minit dan hanya boleh digunakan sekali.",
      "textIgnore": "Jika anda tidak meminta tetapan semula kata laluan, anda boleh mengabaikan e-mel ini dengan selamat."
    }
  },
  "fil": {
    "common": {
      "fallbackName": "doon",
      "hello": "Kamusta {{name}},",
      "buttonFallback": "Hindi gumagana ang button? Kopyahin at i-paste ang address na ito sa iyong browser:",
      "footerTagline": "Bawat bisita. Bawat sandali. Isang nakabahaging album.",
      "footerSecurity": "Ito ay isang automated na account-security email."
    },
    "verification": {
      "subject": "I-verify ang iyong email — SnapUp Events",
      "documentTitle": "I-verify ang iyong SnapUp Events email",
      "preheader": "I-verify ang iyong email address upang simulan ang paggawa ng mga kaganapan sa SnapUp Events.",
      "headerLabel": "Email verification",
      "eyebrow": "Maligayang pagdating sa SnapUp",
      "heading": "I-verify ang iyong email",
      "introduction": "Kumpirmahin ang iyong email address upang simulan ang paggawa ng mga kaganapan, pagbabahagi ng QR code, at pagkolekta ng bawat sandali ng bisita sa isang nakabahaging album.",
      "button": "I-verify ang aking email",
      "secureLabel": "Secure na link:",
      "secureText": "Mag-e-expire ang link na ito sa loob ng 24 na oras at isang beses lang magagamit. Kung hindi mo ginawa ang account na ito, walang kinakailangang aksyon.",
      "textWelcome": "Maligayang pagdating sa SnapUp Events. I-verify ang iyong email address upang simulan ang paggawa at pamamahala ng mga kaganapan.",
      "textExpires": "Mag-e-expire ang link sa pag-verify na ito sa loob ng 24 na oras at isang beses lang magagamit.",
      "textIgnore": "Kung hindi mo ginawa ang account na ito, maaari mong ligtas na balewalain ang email na ito."
    },
    "passwordReset": {
      "subject": "I-reset ang iyong password — SnapUp Events",
      "documentTitle": "I-reset ang iyong SnapUp Events password",
      "preheader": "Gamitin ang secure, single-use na link na ito para i-reset ang iyong SnapUp Events password.",
      "headerLabel": "Seguridad ng account",
      "eyebrow": "Pagbawi ng password",
      "heading": "I-reset ang iyong password.",
      "introduction": "Nakatanggap kami ng kahilingang gumawa ng bagong password para sa iyong SnapUp Events account.",
      "button": "Gumawa ng bagong password",
      "secureLabel": "Secure, single-use na link.",
      "secureText": "Mag-e-expire ito sa loob ng 30 minuto. Kung hindi mo hiniling ang pagbabagong ito, mananatiling hindi nagbabago ang iyong kasalukuyang password.",
      "textRequest": "Nakatanggap kami ng kahilingang i-reset ang iyong SnapUp Events password.",
      "textExpires": "Mag-e-expire ang link na ito sa pag-reset sa loob ng 30 minuto at isang beses lang magagamit.",
      "textIgnore": "Kung hindi ka humiling ng pag-reset ng password, maaari mong ligtas na balewalain ang email na ito."
    }
  },
  "zh-tw": {
    "common": {
      "fallbackName": "朋友",
      "hello": "哈囉{{name}},",
      "buttonFallback": "按鈕無法運作? 將此地址複製並貼到您的瀏覽器中:",
      "footerTagline": "每一位客人。 每一刻。 一張共享專輯。",
      "footerSecurity": "這是一封自動化的帳戶安全電子郵件。"
    },
    "verification": {
      "subject": "驗證您的電子郵件 — SnapUp Events",
      "documentTitle": "確認您的SnapUp Events電子郵件",
      "preheader": "請確認您的電子郵件地址,以開始在 SnapUp Events 上建立活動。",
      "headerLabel": "電子郵件驗證",
      "eyebrow": "歡迎來到SnapUp",
      "heading": "驗證您的電子郵件",
      "introduction": "確認您的電子郵件地址,開始建立活動、分享 QR 代碼,並收集一張共享相簿中的每位來賓。",
      "button": "驗證我的電子郵件",
      "secureLabel": "安全連結:",
      "secureText": "此連結將於24小時內到期,且僅能使用一次。 如果您未建立此帳戶,則無需採取任何行動。",
      "textWelcome": "歡迎使用SnapUp Events。 驗證您的電子郵件地址,以開始建立和管理事件。",
      "textExpires": "此驗證連結將於24小時內到期,且僅可使用一次。",
      "textIgnore": "如果您未建立此帳號,可以放心地忽略這封電子郵件。"
    },
    "passwordReset": {
      "subject": "重設您的密碼 — SnapUp Events",
      "documentTitle": "重設您的SnapUp Events密碼",
      "preheader": "使用此安全的一次性連結來重設您的 SnapUp Events 密碼。",
      "headerLabel": "帳戶安全",
      "eyebrow": "密碼復原",
      "heading": "重設您的密碼。",
      "introduction": "我們收到申請,要為您的SnapUp Events帳戶建立新密碼。",
      "button": "建立新的密碼",
      "secureLabel": "安全且一次性的連結。",
      "secureText": "30分鐘內就到期了。 如果您未要求變更此變更,您目前的密碼保持不變。",
      "textRequest": "我們收到請求,要求重設您的SnapUp Events密碼。",
      "textExpires": "此重置連結在30分鐘內到期,僅能使用一次。",
      "textIgnore": "如果您未要求重設密碼,可以安全地忽略此電子郵件。"
    }
  },
  "pt-pt": {
    "common": {
      "fallbackName": "lá",
      "hello": "Olá {{name}},",
      "buttonFallback": "Botão não funciona? Copiar e colar este endereço no seu navegador:",
      "footerTagline": "Todos os convidados. Todos os momentos. Um álbum compartilhado.",
      "footerSecurity": "Este é um e-mail automatizado de segurança de conta."
    },
    "verification": {
      "subject": "Verifique seu e-mail — SnapUp Events",
      "documentTitle": "Verifique o seu SnapUp Events e-mail",
      "preheader": "Verifique seu endereço de e-mail para começar a criar eventos em SnapUp Events.",
      "headerLabel": "Verificação de e-mail",
      "eyebrow": "Bem-vindo ao SnapUp",
      "heading": "Verifique seu e-mail",
      "introduction": "Confirme seu endereço de e-mail para começar a criar eventos, compartilhar QR códigos e coletar cada momento do convidado em um álbum compartilhado.",
      "button": "Verificar meu e-mail",
      "secureLabel": "Link seguro:",
      "secureText": "este link expira em 24 horas e só pode ser utilizado uma vez. Se você não criou essa conta, nenhuma ação é necessária.",
      "textWelcome": "Bem-vindo ao SnapUp Events. Verifique seu endereço de e-mail para começar a criar e gerenciar eventos.",
      "textExpires": "este link de verificação expira em 24 horas e só pode ser usado uma vez.",
      "textIgnore": "Se você não criou esta conta, você pode ignorar com segurança este e-mail."
    },
    "passwordReset": {
      "subject": "Redefina sua senha — SnapUp Events",
      "documentTitle": "Redefina a sua SnapUp Events password",
      "preheader": "Utilize este link seguro e de uso único para redefinir a sua SnapUp Events.",
      "headerLabel": "Segurança da conta",
      "eyebrow": "Recuperação de senha",
      "heading": "Redefina a sua palavra-passe.",
      "introduction": "Recebemos um pedido para criar uma nova senha para sua SnapUp Events conta.",
      "button": "Criar uma nova senha",
      "secureLabel": "com uma ligação segura e de uso único.",
      "secureText": "expira em 30 minutos. Se você não solicitou essa alteração, sua senha atual permanece inalterada.",
      "textRequest": "Recebemos uma solicitação para redefinir sua SnapUp Events senha.",
      "textExpires": "este link de redefinição expira em 30 minutos e só pode ser usado uma vez.",
      "textIgnore": "Se você não solicitou uma redefinição de senha, você pode ignorar com segurança este e-mail."
    }
  },
  "da": {
    "common": {
      "fallbackName": "der er der",
      "hello": "Hej {{name}},",
      "buttonFallback": "Knap virker ikke? Kopier og indsæt denne adresse i din browser:",
      "footerTagline": "alle hver gæst. hvert øjeblik. et af de delte album.",
      "footerSecurity": "en automatiseret konto-sikkerheds-e-mail."
    },
    "verification": {
      "subject": "Bekræft din e-mail — SnapUp Events",
      "documentTitle": "din SnapUp Events e-mail",
      "preheader": "din e-mail adresse skal begynde at oprette begivenheder på SnapUp Events.",
      "headerLabel": "e-mail-bekræftelse",
      "eyebrow": "voyelt til SnapUp",
      "heading": "at bekræfte din e-mail",
      "introduction": "bekræfte din e-mail-adresse for at begynde at oprette begivenheder, dele QR-koder og indsamle hvert gæsteøjeblik i et delt album.",
      "button": "at bekræfte min e-mail",
      "secureLabel": "Sikkert link:",
      "secureText": "dette link udløber om 24 timer og kan kun bruges én gang. hvis du ikke har oprettet denne konto, kræves der ingen handling.",
      "textWelcome": "voyet til SnapUp Events. din e-mail-adresse skal bestilles og administrere begivenheder.",
      "textExpires": "dette verifikationslink udløber om 24 timer og kan kun bruges én gang.",
      "textIgnore": "hvis du ikke har oprettet denne konto, kan du sikkert ignorere denne e-mail."
    },
    "passwordReset": {
      "subject": "Nuser dig til din adgangskode — SnapUp Events",
      "documentTitle": "Nusse dit SnapUp Events kodeord",
      "preheader": "dette sikre link til engangsbrug for at nulstille din SnapUp Events adgangskode.",
      "headerLabel": "sikkerhed på kontoen",
      "eyebrow": "Adgangskode opsving opsving",
      "heading": "Nulstil dit kodeord.",
      "introduction": "vi har modtaget en anmodning om at oprette en ny adgangskode til din SnapUp Events konto.",
      "button": "Opret en ny adgangskode",
      "secureLabel": "Secure, engangs link.",
      "secureText": "den udløber om 30 minutter. du ikke anmodede om denne ændring, forbliver din nuværende adgangskode uændret.",
      "textRequest": "vi har modtaget en anmodning om at nulstille din SnapUp Events adgangskode.",
      "textExpires": "dette nulstillingslink udløber på 30 minutter og kan kun bruges én gang.",
      "textIgnore": "du ikke har anmodet om en nulstilling af adgangskode, kan du sikkert ignorere denne e-mail."
    }
  },
  "fi": {
    "common": {
      "fallbackName": "siellä siellä",
      "hello": "Hei {{name}},",
      "buttonFallback": "ei toimi nappi? kopioi ja liitä tämä osoite selaimeesi:",
      "footerTagline": "jokainen vieras. joka hetki. yksi jaettu albumi.",
      "footerSecurity": "tämä on automaattinen tilin suojaussähköposti."
    },
    "verification": {
      "subject": "Vahvista sähköpostiosoitteesi – SnapUp Events",
      "documentTitle": "Vahvista SnapUp Events-sähköpostiosoitteesi",
      "preheader": "Vahvista sähköpostiosoitteesi, niin aloitat tapahtumien luomisen osoitteessa SnapUp Events.",
      "headerLabel": "sähköpostin vahvistus",
      "eyebrow": "Osoitteeseen SnapUp",
      "heading": "Vahvista sähköpostisi",
      "introduction": "Vahvista sähköpostiosoitteesi aloittaaksesi tapahtumien luomisen, jakamalla QR-koodeja ja keräämällä jokaisen vierashetken yhdellä jaetulla albumilla.",
      "button": "Vahvista sähköpostini",
      "secureLabel": "suojattu linkki:",
      "secureText": "tämä linkki vanhenee 24 tunnissa ja sitä voidaan käyttää vain kerran. jos et ole luonut tätä tiliä, mitään toimenpiteitä ei tarvita.",
      "textWelcome": "Tervetuloa osoitteeseen SnapUp Events. Vahvista sähköpostiosoitteesi, jotta voit aloittaa tapahtumien luomisen ja hallinnan.",
      "textExpires": "Tämä vahvistuslinkki vanhenee 24 tunnin kuluessa, ja sitä voidaan käyttää vain kerran.",
      "textIgnore": "jos et luonut tätä tiliä, voit turvallisesti ohittaa tämän sähköpostin."
    },
    "passwordReset": {
      "subject": "Nollaa salasanasi – SnapUp Events",
      "documentTitle": "Nollaa SnapUp Events salasana",
      "preheader": "Käytä tätä turvallista, kertakäyttöistä linkkiä palauttaaksesi SnapUp Events-salasanasi.",
      "headerLabel": "tilin turvallisuus",
      "eyebrow": "Salasanan palautus",
      "heading": "Nollaa salasanasi.",
      "introduction": "saimme pyynnön luoda uusi salasana tilillesi SnapUp Events.",
      "button": "Luo uusi salasana",
      "secureLabel": "Turvallinen, kertakäyttöinen linkki.",
      "secureText": "se vanhenee 30 minuutissa. jos et ole pyytänyt tätä muutosta, nykyinen salasanasi pysyy muuttumattomana.",
      "textRequest": "saimme pyynnön nollata SnapUp Events-salasanasi.",
      "textExpires": "Tämä nollauslinkki vanhenee 30 minuutissa ja sitä voidaan käyttää vain kerran.",
      "textIgnore": "Jos et pyytänyt salasanan vaihtamista, voit turvallisesti ohittaa tämän sähköpostin."
    }
  },
  "nb": {
    "common": {
      "fallbackName": "dere",
      "hello": "hil {{name}},",
      "buttonFallback": "Button virker ikke? Kopier og lim inn denne adressen i nettleseren din:",
      "footerTagline": "Alle gjester. hvert øyeblikk. Et av delt album.",
      "footerSecurity": "Dette er en automatisert konto-sikkerhet-e-post."
    },
    "verification": {
      "subject": "evert e-posten din — SnapUp Events",
      "documentTitle": "er din SnapUp Events e-post",
      "preheader": "rett e-postadressen din for å begynne å opprette hendelser på SnapUp Events.",
      "headerLabel": "statsverifisering av e-",
      "eyebrow": "Velkommen til SnapUp",
      "heading": "er bekreftelse på e-posten din",
      "introduction": "Bekreft e-postadressen din til å begynne å opprette arrangementer, dele QR-koder og samle hvert gjesteøyeblikk i ett delt album.",
      "button": "Kontroller e-posten min",
      "secureLabel": "Sikre link:",
      "secureText": "Denne lenken utløper i løpet av 24 timer og kan bare brukes én gang. Hvis du ikke opprettet denne kontoen, er det ikke nødvendig med noen handling.",
      "textWelcome": "Velkommen til SnapUp Events. er Bekreft e-postadressen din for å begynne å opprette og administrere hendelser.",
      "textExpires": "Denne bekreftelseskoblingen utløper i løpet av 24 timer og kan kun brukes én gang.",
      "textIgnore": "Hvis du ikke opprettet denne kontoen, kan du trygt ignorere denne e-posten."
    },
    "passwordReset": {
      "subject": "Tilbakestill passordet ditt — SnapUp Events",
      "documentTitle": "Tilbakestill ditt SnapUp Events passord",
      "preheader": "Bruk denne sikre koblingen til engangsbruk for å tilbakestille passordet ditt SnapUp Events.",
      "headerLabel": "Kontosikkerhet",
      "eyebrow": "Passordgjenoppretting",
      "heading": "Tilbakestill passordet ditt.",
      "introduction": "Vi mottok en forespørsel om å opprette et nytt passord for din SnapUp Events-konto.",
      "button": "Opprett et nytt passord",
      "secureLabel": "Sikre, engangskobling.",
      "secureText": "Den utløper om 30 minutter. Hvis du ikke har bedt om denne endringen, forblir ditt nåværende passord uendret.",
      "textRequest": "Vi mottok en forespørsel om å tilbakestille passordet ditt SnapUp Events.",
      "textExpires": "Denne tilbakestillingskoblingen utløper på 30 minutter og kan bare brukes én gang.",
      "textIgnore": "Hvis du ikke har bedt om tilbakestilling av passord, kan du trygt ignorere denne e-posten."
    }
  },
  "sk": {
    "common": {
      "fallbackName": "tam",
      "hello": "Dobrý {{name}}, Dobrý deň,",
      "buttonFallback": "aguľka nefunguje? skopírovať a vložiť túto adresu do vášho prehliadača:",
      "footerTagline": "každého hosťa. každú chvíľu. jeden zdieľaný album.",
      "footerSecurity": "je to automatizovaný e-mail s bezpečnosťou účtu."
    },
    "verification": {
      "subject": "Overte si svoj e-mail – SnapUp Events",
      "documentTitle": "Overte si SnapUp Events e-mail",
      "preheader": "SnapUp Events si overte svoju e-mailovú adresu a začnite vytvárať udalosti.",
      "headerLabel": "overenie e-mailu",
      "eyebrow": "vítajte na SnapUp",
      "heading": "overte si svoj e-mail",
      "introduction": "potvrdenie vašej e-mailovej adresy, aby ste mohli začať vytvárať udalosti, zdieľať QR kódy a zhromažďovať každý moment hosťa v jednom zdieľanom albume.",
      "button": "Overte si môj e-mail",
      "secureLabel": "bezpečný odkaz:",
      "secureText": "tento odkaz vyprší do 24 hodín a môže sa použiť iba raz. ak ste si tento účet nevytvorili, nie je potrebná žiadna akcia.",
      "textWelcome": "Vitajte na SnapUp Events. Overte si svoju e-mailovú adresu a začnite vytvárať a spravovať udalosti.",
      "textExpires": "toto overovacie spojenie uplynie do 24 hodín a môže sa použiť iba raz.",
      "textIgnore": "ak ste si tento účet nevytvorili, môžete tento e-mail bezpečne ignorovať."
    },
    "passwordReset": {
      "subject": "Obnoviť svoje heslo – SnapUp Events",
      "documentTitle": "Obnoviť heslo na SnapUp Events",
      "preheader": "na obnovenie vášho SnapUp Events hesla použite tento bezpečný odkaz na jedno použitie.",
      "headerLabel": "účinkové zabezpečenie účtu",
      "eyebrow": "Obnova hesla",
      "heading": "Obnovte svoje heslo.",
      "introduction": "SnapUp Events účtu sme dostali žiadosť o vytvorenie nového hesla.",
      "button": "Vytvorenie nového hesla",
      "secureLabel": "zabezpečený, jednorazový link.",
      "secureText": "Vyprší o 30 minút. ak ste o túto zmenu nepožiadali, vaše aktuálne heslo zostáva nezmenené.",
      "textRequest": "SnapUp Events heslo sme dostali žiadosť o obnovenie.",
      "textExpires": "toto prepojenie na resetovanie vyprší do 30 minút a môže sa použiť iba raz.",
      "textIgnore": "ak ste nepožiadali o obnovenie hesla, môžete tento e-mail bezpečne ignorovať."
    }
  },
  "lt": {
    "common": {
      "fallbackName": "štai čia",
      "hello": "hello {{name}}, Jungtinės Amerikos Valstijos",
      "buttonFallback": "ar nedirba mygtukas? ir įklijuokite šį adresą į savo naršyklę:",
      "footerTagline": "Kiekvienas svečias. kiekvieną akimirką. vienas bendras albumas.",
      "footerSecurity": "tai automatinis paskyros saugumo el. paštas."
    },
    "verification": {
      "subject": "tifikuokite savo el. laišką SnapUp Events",
      "documentTitle": "TIRKITE savo SnapUp Events el. paštą",
      "preheader": "tol. Patikrinkite savo el. pašto adresą, kad pradėtumėte kurti renginius SnapUp Events.",
      "headerLabel": "el. pašto patvirtinimas",
      "eyebrow": "SnapUp",
      "heading": "Patvirtinkite savo el. laišką",
      "introduction": "patvirtinkite savo el. pašto adresą, kad pradėtumėte kurti renginius, dalydamiesi QR kodais ir rinkdami kiekvieną svečio akimirką viename bendrame albume.",
      "button": "Patvirtinkite mano el. laišką",
      "secureLabel": ": Saugi nuoroda:",
      "secureText": "ažaspalandis baigiasi per 24 valandas ir gali būti naudojamas tik vieną kartą. jei nesukūrėte šios paskyros, nereikia imtis jokių veiksmų.",
      "textWelcome": "SnapUp Events. Patvirtinkite savo el. pašto adresą, kad pradėtumėte kurti ir valdyti įvykius.",
      "textExpires": "žiuotė baigiasi per 24 valandas ir gali būti naudojama tik vieną kartą.",
      "textIgnore": "Jeigu nesukūrėte šios paskyros, galite saugiai ignoruoti šį el. laišką."
    },
    "passwordReset": {
      "subject": "iš naujo nustatykite slaptažodį – SnapUp Events",
      "documentTitle": "iš naujo nustatykite savo SnapUp Events slaptažodį",
      "preheader": "linti šią saugią, vienkartinio naudojimo nuorodą, kad iš naujo nustatytumėte savo SnapUp Events slaptažodį.",
      "headerLabel": "sąskaitos užstatas",
      "eyebrow": "word recovery Sisteminiai Reikalavimai",
      "heading": "Iš naujo nustatykite savo slaptažodį.",
      "introduction": "sulaukėme prašymo sukurti naują jūsų SnapUp Events paskyros slaptažodį.",
      "button": "sukurti naują slaptažodį",
      "secureLabel": "on, saugi, vienkartinio naudojimo nuoroda.",
      "secureText": "Jis baigiasi po 30 minučių. jei šio pakeitimo neprašėte, dabartinis slaptažodis lieka nepakitęs.",
      "textRequest": "gavome prašymą iš naujo nustatyti jūsų SnapUp Events slaptažodį.",
      "textExpires": "kryptis į atstatymą baigiasi per 30 minučių ir gali būti naudojama tik vieną kartą.",
      "textIgnore": "jei neprašėte slaptažodžio nustatymo, galite saugiai ignoruoti šį el. Laišką."
    }
  },
  "lv": {
    "common": {
      "fallbackName": "tur",
      "hello": "Sveiki {{name}},",
      "buttonFallback": "a nestrādā, bet nestrādā? Kopēt un ielīmēt šo adresi savā pārlūkprogrammā:",
      "footerTagline": "katrs viesis. katru mirkli. viens kopīgs albums.",
      "footerSecurity": "Tas ir automatizēts konta drošības e-pasts."
    },
    "verification": {
      "subject": "Pārbaudiet savu e-pastu: SnapUp Events",
      "documentTitle": "Pārbaudiet savu SnapUp Events e-pastu",
      "preheader": "Pārbaudiet savu e-pasta adresi, lai sāktu SnapUp Events notikumu veidošanu.",
      "headerLabel": "a e-pasta pārbaude",
      "eyebrow": "SnapUp laipni lūdzam",
      "heading": "a e-pasta pārbaude",
      "introduction": "ojiet savu e-pasta adresi, lai sāktu veidot notikumus, daloties QR kodos un apkopojot katru viesu brīdi vienā koplietošanas albumā.",
      "button": "ojiet manu e-pastu",
      "secureLabel": "droša saite:",
      "secureText": "Šī saite beidzas 24 stundu laikā, un to var izmantot tikai vienu reizi. ja jūs neveidojāt šo kontu, nekādas darbības nav nepieciešamas.",
      "textWelcome": "SnapUp Events. ojiet savu e-pasta adresi, lai sāktu veidot un pārvaldīt notikumus.",
      "textExpires": "as verifikācijas saites derīguma termiņš beidzas 24 stundu laikā, un to var izmantot tikai vienu reizi.",
      "textIgnore": "ja jūs neveidojāt šo kontu, jūs varat droši ignorēt šo e-pastu."
    },
    "passwordReset": {
      "subject": "Atiestatiet paroli — SnapUp Events",
      "documentTitle": "SnapUp Events paroles atiestatīšana",
      "preheader": "Izmantojiet šo drošo, vienreizējās lietošanas saiti, lai SnapUp Events atiestatītu paroli.",
      "headerLabel": "a konta drošība",
      "eyebrow": "a paroles atgūšana",
      "heading": ".",
      "introduction": "mēs saņēmām pieprasījumu izveidot jaunu paroli jūsu SnapUp Events kontam.",
      "button": "a jaunas paroles izveide",
      "secureLabel": "Droša, vienreiz lietojama saite.",
      "secureText": "am beidzas 30 minūšu laikā. ja jūs nepieprasījāt šīs izmaiņas, pašreizējā parole paliek nemainīga.",
      "textRequest": "Mēs saņēmām pieprasījumu, lai SnapUp Events atiestatītu paroli.",
      "textExpires": "Šī atiestatīšanas saite beidzas 30 minūtēs, un to var izmantot tikai vienu reizi.",
      "textIgnore": "ja neesat pieprasījis paroles atiestatīšanu, varat droši ignorēt šo e-pastu."
    }
  },
  "et": {
    "common": {
      "fallbackName": "seal",
      "hello": "Tere {{name}},",
      "buttonFallback": "Button ei tööta? Kopeerige ja kleepige see aadress oma brauserisse:",
      "footerTagline": "iga külaline. iga hetk. Üks jagatud album.",
      "footerSecurity": "See on automaatne konto turvalisuse e-kiri."
    },
    "verification": {
      "subject": "Kontrollige oma e-posti aadressi - SnapUp Events",
      "documentTitle": "Kontrollige oma SnapUp Events e-posti aadressi",
      "preheader": "kontrollige oma e-posti aadressi, et alustada sündmuste loomist saidil SnapUp Events.",
      "headerLabel": "E-posti kinnitamine",
      "eyebrow": "Tere tulemast aadressile SnapUp",
      "heading": "kinnita oma e-posti aadress",
      "introduction": "kinnitage oma e-posti aadress, et alustada sündmuste loomist, jagada QR koode ja koguda iga külalishetke ühes jagatud albumis.",
      "button": "kinnita minu e-posti aadress",
      "secureLabel": "turvaline link:",
      "secureText": "See link aegub 24 tunni jooksul ja seda saab kasutada ainult üks kord. Kui te seda kontot ei loonud, pole toimingut vaja.",
      "textWelcome": "tere tulemast aadressile SnapUp Events. Kinnitage oma e-posti aadress, et alustada sündmuste loomist ja haldamist.",
      "textExpires": "See kinnituslink aegub 24 tunni pärast ja seda saab kasutada ainult üks kord.",
      "textIgnore": "Kui te seda kontot ei loonud, saate seda e-kirja turvaliselt ignoreerida."
    },
    "passwordReset": {
      "subject": "lähetage oma parool — SnapUp Events",
      "documentTitle": "Taastage oma SnapUp Events parool",
      "preheader": "Kasutage seda turvalist ühekordselt kasutatavat linki oma SnapUp Events parooli lähtestamiseks.",
      "headerLabel": "konto turvalisus",
      "eyebrow": "Parooli taastamine",
      "heading": "Lähtestage oma parool.",
      "introduction": "Saime taotluse luua teie SnapUp Events kontole uus parool.",
      "button": "Uue parooli loomine",
      "secureLabel": "Turvaline, ühekordselt kasutatav link.",
      "secureText": "See aegub 30 minuti pärast. Kui te seda muudatust ei taotlenud, jääb teie praegune parool muutmata.",
      "textRequest": "Saime taotluse teie SnapUp Events parooli lähtestamiseks.",
      "textExpires": "See lähtestamislink aegub 30 minuti pärast ja seda saab kasutada ainult üks kord.",
      "textIgnore": "Kui te ei taotlenud parooli lähtestamist, võite seda e-kirja turvaliselt ignoreerida."
    }
  },
  "sl": {
    "common": {
      "fallbackName": "raj tam je",
      "hello": "OMAKNITE {{name}},",
      "buttonFallback": "gumb, da ne deluje? ta naslov kopirajte in prilepite v brskalnik:",
      "footerTagline": "vsak gost je. vsak trenutek. en skupni album.",
      "footerSecurity": "to je avtomatizirano e-poštno sporočilo o varnosti računa."
    },
    "verification": {
      "subject": "preverite svoj e-poštni naslov - SnapUp Events",
      "documentTitle": "Preverite svojo SnapUp Events e-pošto",
      "preheader": "SnapUp Events preverite svoj e-poštni naslov, da začnete ustvarjati dogodke na spletni strani www.",
      "headerLabel": "preveditev e-pošte",
      "eyebrow": "Dobrodošli na SnapUp",
      "heading": "Preverite svojo e-pošto",
      "introduction": "Potrdite svoj e-poštni naslov, da začnete ustvarjati dogodke, delite QR kode in zberete vsak trenutek gosta v enem albumu v skupni rabi.",
      "button": "Preverite moj e-poštni naslov",
      "secureLabel": "na varna povezava:",
      "secureText": "ta povezava poteče v 24 urah in se lahko uporablja samo enkrat. če tega računa niste ustvarili, ni potrebno nobeno dejanje.",
      "textWelcome": "OSLABITE na SnapUp Events. Preverite svoj e-poštni naslov, da začnete ustvarjati in upravljati dogodke.",
      "textExpires": "a povezava za preverjanje preneha veljati v 24 urah in se lahko uporablja samo enkrat.",
      "textIgnore": "če tega računa niste ustvarili, lahko to e-poštno sporočilo varno prezrete."
    },
    "passwordReset": {
      "subject": "ponastavite svoje geslo - SnapUp Events",
      "documentTitle": "ponastavite svoje SnapUp Events geslo",
      "preheader": "to varno povezavo za enkratno uporabo uporabite za ponastavitev gesla na spletni strani SnapUp Events.",
      "headerLabel": "OMOČANJE v zvezi z varnostjo računa",
      "eyebrow": "ostovanje gesla",
      "heading": "ponastavite svoje geslo.",
      "introduction": "smo prejeli zahtevo za ustvarjanje novega gesla za vaš SnapUp Events račun.",
      "button": "ustvarite novo geslo",
      "secureLabel": "varen, enojni link.",
      "secureText": "a se izteče čez 30 minut. če niste zahtevali te spremembe, vaše trenutno geslo ostaja nespremenjeno.",
      "textRequest": "smo prejeli zahtevo za ponastavitev vašega SnapUp Events gesla.",
      "textExpires": "a povezava za ponastavitev se izteče v 30 minutah in se lahko uporablja samo enkrat.",
      "textIgnore": "če niste zahtevali ponastavitve gesla, lahko to e-poštno sporočilo varno prezrete."
    }
  },
  "ta": {
    "common": {
      "fallbackName": "அங்கு",
      "hello": "வணக்கம் {{name}},",
      "buttonFallback": "பொத்தான் வேலை செய்யவில்லையா? நகலெடுத்து உங்கள் உலாவியில் இந்த முகவரியை ஒட்டவும்:",
      "footerTagline": "ஒவ்வொரு விருந்தினரும். ஒவ்வொரு நொடியும். ஒருவர் ஆல்பத்தை பகிர்ந்து கொண்டார்.",
      "footerSecurity": "இது ஒரு தானியங்கி கணக்கு-பாதுகாப்பு மின்னஞ்சல்."
    },
    "verification": {
      "subject": "உங்கள் மின்னஞ்சலை சரிபார்க்கவும் — SnapUp Events",
      "documentTitle": "உங்கள் SnapUp Events மின்னஞ்சலை சரிபார்க்கவும்",
      "preheader": "SnapUp Events இல் நிகழ்வுகளை உருவாக்கத் தொடங்க உங்கள் மின்னஞ்சல் முகவரியைச் சரிபார்க்கவும்.",
      "headerLabel": "மின்னஞ்சல் சரிபார்ப்பு",
      "eyebrow": "SnapUp க்கு வரவேற்கிறோம்",
      "heading": "உங்கள் மின்னஞ்சலை சரிபார்க்கவும்",
      "introduction": "நிகழ்வுகளை உருவாக்கத் தொடங்கவும், QR குறியீடுகளைப் பகிரவும், ஒவ்வொரு விருந்தினர் தருணத்தையும் ஒரு பகிரப்பட்ட ஆல்பத்தில் சேகரிக்கவும் உங்கள் மின்னஞ்சல் முகவரியை உறுதிப்படுத்தவும்.",
      "button": "எனது மின்னஞ்சலை சரிபார்க்கவும்",
      "secureLabel": "பாதுகாப்பான இணைப்பு:",
      "secureText": "இந்த இணைப்பு 24 மணி நேரத்தில் காலாவதியாகிறது, ஒரு முறை மட்டுமே பயன்படுத்த முடியும். இந்த கணக்கை நீங்கள் உருவாக்கவில்லை என்றால், எந்த நடவடிக்கையும் தேவையில்லை.",
      "textWelcome": "SnapUp Events க்கு வரவேற்கிறோம். நிகழ்வுகளை உருவாக்க மற்றும் நிர்வகிக்கத் தொடங்க உங்கள் மின்னஞ்சல் முகவரியைச் சரிபார்க்கவும்.",
      "textExpires": "சரிபார்ப்பு இணைப்பு 24 மணி நேரத்தில் காலாவதியாகிறது, ஒரு முறை மட்டுமே பயன்படுத்த முடியும்.",
      "textIgnore": "இந்த கணக்கை நீங்கள் உருவாக்கவில்லை என்றால், இந்த மின்னஞ்சலை நீங்கள் பாதுகாப்பாக புறக்கணிக்கலாம்."
    },
    "passwordReset": {
      "subject": "உங்கள் கடவுச்சொல்லை மீட்டமைக்கவும் — SnapUp Events",
      "documentTitle": "உங்கள் SnapUp Events கடவுச்சொல்லை மீட்டமைக்கவும்",
      "preheader": "உங்கள் SnapUp Events கடவுச்சொல்லை மீட்டமைக்க இந்த பாதுகாப்பான, ஒற்றை பயன்பாட்டு இணைப்பைப் பயன்படுத்தவும்.",
      "headerLabel": "கணக்கு பாதுகாப்பு",
      "eyebrow": "கடவுச்சொல் மீட்பு",
      "heading": "உங்கள் கடவுச்சொல்லை மீட்டமைக்கவும்.",
      "introduction": "உங்கள் SnapUp Events கணக்கிற்கான புதிய கடவுச்சொல்லை உருவாக்குவதற்கான கோரிக்கையை நாங்கள் பெற்றோம்.",
      "button": "புதிய கடவுச்சொல்லை உருவாக்கவும்",
      "secureLabel": "பாதுகாப்பான, ஒற்றை பயன்பாட்டு இணைப்பு.",
      "secureText": "அது 30 நிமிடங்களில் காலாவதியாகிறது. இந்த மாற்றத்தை நீங்கள் கோரவில்லை என்றால், உங்கள் தற்போதைய கடவுச்சொல் மாறாமல் இருக்கும்.",
      "textRequest": "உங்கள் SnapUp Events கடவுச்சொல்லை மீட்டமைக்க கோரிக்கை வந்தது.",
      "textExpires": "மீட்டமைக்கும் இணைப்பு 30 நிமிடங்களில் காலாவதியாகிறது, ஒரு முறை மட்டுமே பயன்படுத்த முடியும்.",
      "textIgnore": "கடவுச்சொல் மீட்டமைப்பை நீங்கள் கோரவில்லை என்றால், இந்த மின்னஞ்சலை நீங்கள் பாதுகாப்பாக புறக்கணிக்கலாம்."
    }
  },
  "te": {
    "common": {
      "fallbackName": "అక్కడ",
      "hello": "హలో {{name}},",
      "buttonFallback": "బటన్ పని లేదు? ఈ చిరునామాను మీ బ్రౌజర్లో కాపీ చేసి అతికించండి:",
      "footerTagline": "ప్రతి అతిథి. ప్రతి క్షణం. ఒక ఉమ్మడి ఆల్బమ్.",
      "footerSecurity": "ఇది స్వయంచాలక ఖాతా-భద్రత ఇమెయిల్."
    },
    "verification": {
      "subject": "మీ ఇమెయిల్ను ధృవీకరించండి — SnapUp Events",
      "documentTitle": "మీ SnapUp Events ఇమెయిల్ను ధృవీకరించండి",
      "preheader": "లో SnapUp Events లో ఈవెంట్లను సృష్టించడం ప్రారంభించడానికి మీ ఇమెయిల్ చిరునామాను ధృవీకరించండి.",
      "headerLabel": "ఇమెయిల్ ధృవీకరణ",
      "eyebrow": "స్వాగతం SnapUp కు స్వాగతం",
      "heading": "మీ ఇమెయిల్ను ధృవీకరించండి",
      "introduction": "ఈవెంట్లను సృష్టించడం, భాగస్వామ్యం QR సంకేతాలు, మరియు ఒక భాగస్వామ్య ఆల్బమ్ లో ప్రతి అతిథి క్షణం సేకరించడం ప్రారంభించడానికి మీ ఇమెయిల్ చిరునామా నిర్ధారించండి.",
      "button": "నా ఇమెయిల్ను ధృవీకరించండి",
      "secureLabel": "సురక్షిత లింక్:",
      "secureText": "ఈ లింక్ 24 గంటల్లో ముగుస్తుంది మరియు ఒకసారి మాత్రమే ఉపయోగించబడుతుంది. మీరు ఈ ఖాతాను సృష్టించకపోతే, ఎటువంటి చర్య అవసరం లేదు.",
      "textWelcome": "SnapUp Events కు స్వాగతం. ఈవెంట్లను సృష్టించడం మరియు నిర్వహించడం ప్రారంభించడానికి మీ ఇమెయిల్ చిరునామాను ధృవీకరించండి.",
      "textExpires": "ఈ ధృవీకరణ లింక్ 24 గంటల్లో ముగుస్తుంది మరియు ఒకసారి మాత్రమే ఉపయోగించబడుతుంది.",
      "textIgnore": "మీరు ఈ ఖాతాను సృష్టించకపోతే, మీరు ఈ ఇమెయిల్ను సురక్షితంగా విస్మరించవచ్చు."
    },
    "passwordReset": {
      "subject": "మీ పాస్వర్డ్ను రీసెట్ — SnapUp Events",
      "documentTitle": "మీ SnapUp Events పాస్వర్డ్ను రీసెట్ చేయండి",
      "preheader": "మీ SnapUp Events పాస్వర్డ్ను రీసెట్ చేయడానికి ఈ సురక్షిత, సింగిల్-యూజ్ లింక్ను ఉపయోగించండి.",
      "headerLabel": "ఖాతా భద్రత",
      "eyebrow": "సంకేతపదము రికవరీ",
      "heading": "మీ పాస్వర్డ్ను పునరుద్ధరించండి.",
      "introduction": "మీ SnapUp Events ఖాతా కోసం కొత్త పాస్వర్డ్ను సృష్టించమని మేము ఒక అభ్యర్థనను అందుకున్నాము.",
      "button": "కొత్త సంకేతపదాలను సృష్టించండి",
      "secureLabel": "సురక్షిత, సింగిల్-యూజ్ లింక్.",
      "secureText": "30 నిమిషాల్లోనే అది ముగుస్తుంది. మీరు ఈ మార్పును అభ్యర్థించకపోతే, మీ ప్రస్తుత పాస్వర్డ్ మారదు.",
      "textRequest": "మేము మీ SnapUp Events పాస్వర్డ్ను రీసెట్ చేయడానికి ఒక అభ్యర్థనను అందుకున్నాము.",
      "textExpires": "ఈ రీసెట్ లింక్ 30 నిమిషాల్లో ముగుస్తుంది మరియు ఒకసారి మాత్రమే ఉపయోగించవచ్చు.",
      "textIgnore": "మీరు పాస్వర్డ్ రీసెట్ను అభ్యర్థించకపోతే, మీరు ఈ ఇమెయిల్ను సురక్షితంగా విస్మరించవచ్చు."
    }
  },
  "mr": {
    "common": {
      "fallbackName": "तिथे",
      "hello": "नमस्कार {{name}},",
      "buttonFallback": "बटण काम करत नाही? हा पत्ता तुमच्या ब्राउझरमध्ये कॉपी करून चिकटवाः",
      "footerTagline": "प्रत्येक अतिथी. प्रत्येक क्षण. एक अल्बम सामायिक केला.",
      "footerSecurity": "हा एक स्वयंचलित खाते-सुरक्षा ईमेल आहे."
    },
    "verification": {
      "subject": "तुमचा ईमेल-SnapUp Events तपासा",
      "documentTitle": "तुमचा SnapUp Events ईमेल तपासा",
      "preheader": "SnapUp Events वर कार्यक्रम तयार करण्यास सुरुवात करण्यासाठी तुमचा ईमेल पत्ता तपासा.",
      "headerLabel": "ईमेल पडताळणी",
      "eyebrow": "SnapUp मध्ये आपले स्वागत आहे.",
      "heading": "तुमचा ईमेल तपासा",
      "introduction": "कार्यक्रम तयार करणे, QR कोड सामायिक करणे आणि सामायिक केलेल्या एका अल्बममध्ये प्रत्येक अतिथी क्षण गोळा करणे सुरू करण्यासाठी तुमच्या ईमेल पत्त्याची पुष्टी करा.",
      "button": "माझा ईमेल तपासा",
      "secureLabel": "सुरक्षित दुवाः",
      "secureText": "हा दुवा 24 तासांत संपतो आणि फक्त एकदाच वापरला जाऊ शकतो. जर तुम्ही हे खाते तयार केले नसेल तर कोणत्याही कृतीची आवश्यकता नाही.",
      "textWelcome": "SnapUp Events मध्ये आपले स्वागत आहे. कार्यक्रम तयार करणे आणि व्यवस्थापित करणे सुरू करण्यासाठी तुमचा ईमेल पत्ता तपासा.",
      "textExpires": "या पडताळणी दुव्याची मुदत 24 तासांत संपते आणि तो फक्त एकदाच वापरला जाऊ शकतो.",
      "textIgnore": "तुम्ही हे खाते तयार केले नसेल तर तुम्ही या ईमेलकडे सुरक्षितपणे दुर्लक्ष करू शकता."
    },
    "passwordReset": {
      "subject": "तुमचा संकेतशब्द पुन्हा सेट करा-SnapUp Events",
      "documentTitle": "तुमचा SnapUp Events संकेतशब्द पुन्हा सेट करा",
      "preheader": "तुमचा SnapUp Events संकेतशब्द पुन्हा सेट करण्यासाठी हा सुरक्षित, एक-वापर दुवा वापरा.",
      "headerLabel": "खात्याची सुरक्षा",
      "eyebrow": "संकेतशब्द पुनर्प्राप्ती",
      "heading": "तुमचा संकेतशब्द पुन्हा सेट करा.",
      "introduction": "तुमच्या SnapUp Events खात्यासाठी नवीन संकेतशब्द तयार करण्याची विनंती आम्हाला प्राप्त झाली.",
      "button": "नवीन संकेतशब्द तयार करा",
      "secureLabel": "सुरक्षित, एक-वापर दुवा.",
      "secureText": "30 मिनिटांत त्याची मुदत संपते. तुम्ही या बदलाची विनंती केली नसेल तर तुमचा सध्याचा संकेतशब्द बदललेला नाही.",
      "textRequest": "तुमचा SnapUp Events पासवर्ड रीसेट करण्याची विनंती आम्हाला प्राप्त झाली.",
      "textExpires": "ही रीसेट लिंक 30 मिनिटांत संपते आणि फक्त एकदाच वापरली जाऊ शकते.",
      "textIgnore": "तुम्ही पासवर्ड रीसेट करण्याची विनंती केली नसेल, तर तुम्ही या ईमेलकडे सुरक्षितपणे दुर्लक्ष करू शकता."
    }
  },
  "sw": {
    "common": {
      "fallbackName": "Kuna huko kuna",
      "hello": "Salamu zangu za dhati {{name}},",
      "buttonFallback": "Button kufanya kazi? nakala na kuweka anwani hii katika browser yako:",
      "footerTagline": "Kila mgeni. Kila wakati. Albamu moja ya pamoja.",
      "footerSecurity": "Hii ni barua pepe ya usalama wa akaunti."
    },
    "verification": {
      "subject": "Angalia barua pepe yako - SnapUp Events",
      "documentTitle": "Angalia barua pepe yako ya SnapUp Events",
      "preheader": "Thibitisha anwani yako ya barua pepe ili kuanza kuunda matukio kwenye SnapUp Events.",
      "headerLabel": "Ukaguzi wa Email",
      "eyebrow": "Sifa za SnapUp",
      "heading": "Angalia barua pepe yako",
      "introduction": "Thibitisha anwani yako ya barua pepe kuanza kujenga matukio, kugawana msimbo wa QR, na kukusanya kila wakati wa wageni katika albamu moja iliyoshirikiwa.",
      "button": "Angalia barua pepe yangu",
      "secureLabel": "Mawasiliano ya uhakika:",
      "secureText": "Kiungo hiki kinaisha ndani ya masaa ya 24 na kinaweza kutumika mara moja tu. Ikiwa haukuunda akaunti hii, hakuna hatua inahitajika.",
      "textWelcome": "Karibu na SnapUp Events. Thibitisha anwani yako ya barua pepe ili kuanza kuunda na kusimamia matukio.",
      "textExpires": "Kiungo hiki cha kuthibitisha kinakamilika ndani ya masaa ya 24 na kinaweza kutumika mara moja tu.",
      "textIgnore": "Ikiwa haukuunda akaunti hii, unaweza kupuuza barua pepe hii kwa usalama."
    },
    "passwordReset": {
      "subject": "Badilisha nywila yako - SnapUp Events",
      "documentTitle": "Badilisha nywila yako ya SnapUp Events",
      "preheader": "Tumia kiungo hiki salama, cha kutumia moja ili upya nywila yako ya SnapUp Events.",
      "headerLabel": "Akaunti ya Usalama",
      "eyebrow": "Kufufua Password",
      "heading": "Badilisha password yako.",
      "introduction": "Tulipokea ombi la kuunda nywila mpya kwa akaunti yako ya SnapUp Events.",
      "button": "Kujenga password mpya",
      "secureLabel": "Salama, matumizi ya moja kwa moja.",
      "secureText": "Ikiwa haukuomba mabadiliko haya, nywila yako ya sasa bado haijabadilika.",
      "textRequest": "Tulipokea ombi la kurekebisha nywila yako ya SnapUp Events.",
      "textExpires": "Kiungo hiki cha upya kinakamilika katika dakika ya 30 na kinaweza kutumika mara moja tu.",
      "textIgnore": "Ikiwa haukuomba upya nywila, unaweza kupuuza barua pepe hii kwa usalama."
    }
  }
};

const EMAIL_LANGUAGE_ALIASES = {
  "pt-br": "pt",
  "zh-cn": "zh",
  "zh-hans": "zh",
  "zh-hant": "zh-tw",
  "no": "nb",
  "no-no": "nb",
};

function normalizeEmailLanguage(value) {
  const requested = String(value || "en")
    .toLowerCase()
    .split(",")[0]
    .split(";")[0]
    .trim()
    .replaceAll("_", "-");
  const exact = EMAIL_LANGUAGE_ALIASES[requested] || requested;
  if (Object.prototype.hasOwnProperty.call(EMAIL_COPIES, exact)) return exact;
  const base = requested.split("-")[0];
  return Object.prototype.hasOwnProperty.call(EMAIL_COPIES, base) ? base : "en";
}

function getEmailCopy(value) {
  const language = normalizeEmailLanguage(value);
  return {
    language,
    metadata: EMAIL_LANGUAGE_METADATA[language],
    copy: EMAIL_COPIES[language],
  };
}

module.exports = {
  EMAIL_LANGUAGE_METADATA,
  getEmailCopy,
  normalizeEmailLanguage,
};
