(() => {
  "use strict";

  const keys = [
    "Security verification",
    "Please complete the security verification.",
    "Security verification could not be completed. Please try again.",
  ];
  const translations = {
    tr: [
      "Güvenlik doğrulaması",
      "Lütfen güvenlik doğrulamasını tamamlayın.",
      "Güvenlik doğrulaması tamamlanamadı. Lütfen tekrar deneyin.",
    ],
    ar: [
      "التحقق الأمني",
      "يرجى إكمال التحقق الأمني.",
      "تعذر إكمال التحقق الأمني. يرجى المحاولة مرة أخرى.",
    ],
    de: [
      "Sicherheitsüberprüfung",
      "Bitte schließen Sie die Sicherheitsüberprüfung ab.",
      "Die Sicherheitsüberprüfung konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.",
    ],
    fr: [
      "Vérification de sécurité",
      "Veuillez terminer la vérification de sécurité.",
      "La vérification de sécurité n’a pas pu être effectuée. Veuillez réessayer.",
    ],
    es: [
      "Verificación de seguridad",
      "Completa la verificación de seguridad.",
      "No se pudo completar la verificación de seguridad. Inténtalo de nuevo.",
    ],
    it: [
      "Verifica di sicurezza",
      "Completa la verifica di sicurezza.",
      "Impossibile completare la verifica di sicurezza. Riprova.",
    ],
    nl: [
      "Beveiligingscontrole",
      "Voltooi de beveiligingscontrole.",
      "De beveiligingscontrole kon niet worden voltooid. Probeer het opnieuw.",
    ],
    bg: [
      "Проверка за сигурност",
      "Моля, завършете проверката за сигурност.",
      "Проверката за сигурност не можа да бъде завършена. Опитайте отново.",
    ],
    ro: [
      "Verificare de securitate",
      "Finalizează verificarea de securitate.",
      "Verificarea de securitate nu a putut fi finalizată. Încearcă din nou.",
    ],
    el: [
      "Επαλήθευση ασφαλείας",
      "Ολοκληρώστε την επαλήθευση ασφαλείας.",
      "Η επαλήθευση ασφαλείας δεν ολοκληρώθηκε. Δοκιμάστε ξανά.",
    ],
    sr: [
      "Bezbednosna provera",
      "Završite bezbednosnu proveru.",
      "Bezbednosna provera nije mogla da se završi. Pokušajte ponovo.",
    ],
    hr: [
      "Sigurnosna provjera",
      "Dovršite sigurnosnu provjeru.",
      "Sigurnosna provjera nije se mogla dovršiti. Pokušajte ponovno.",
    ],
    bs: [
      "Sigurnosna provjera",
      "Dovršite sigurnosnu provjeru.",
      "Sigurnosna provjera nije mogla biti dovršena. Pokušajte ponovo.",
    ],
    sq: [
      "Verifikimi i sigurisë",
      "Përfundo verifikimin e sigurisë.",
      "Verifikimi i sigurisë nuk u përfundua. Provo përsëri.",
    ],
    mk: [
      "Безбедносна проверка",
      "Завршете ја безбедносната проверка.",
      "Безбедносната проверка не можеше да се заврши. Обидете се повторно.",
    ],
    hi: [
      "सुरक्षा सत्यापन",
      "कृपया सुरक्षा सत्यापन पूरा करें।",
      "सुरक्षा सत्यापन पूरा नहीं हो सका। कृपया फिर से प्रयास करें।",
    ],
    ur: [
      "سیکیورٹی کی توثیق",
      "براہ کرم سیکیورٹی کی توثیق مکمل کریں۔",
      "سیکیورٹی کی توثیق مکمل نہیں ہو سکی۔ براہ کرم دوبارہ کوشش کریں۔",
    ],
    fa: [
      "تأیید امنیتی",
      "لطفاً تأیید امنیتی را کامل کنید.",
      "تأیید امنیتی کامل نشد. لطفاً دوباره تلاش کنید.",
    ],
    ja: [
      "セキュリティ確認",
      "セキュリティ確認を完了してください。",
      "セキュリティ確認を完了できませんでした。もう一度お試しください。",
    ],
    zh: [
      "安全验证",
      "请完成安全验证。",
      "无法完成安全验证。请重试。",
    ],
    ko: [
      "보안 확인",
      "보안 확인을 완료해 주세요.",
      "보안 확인을 완료하지 못했습니다. 다시 시도해 주세요.",
    ],
    pt: [
      "Verificação de segurança",
      "Conclua a verificação de segurança.",
      "Não foi possível concluir a verificação de segurança. Tente novamente.",
    ],
    ru: [
      "Проверка безопасности",
      "Пройдите проверку безопасности.",
      "Не удалось завершить проверку безопасности. Попробуйте ещё раз.",
    ],
    id: [
      "Verifikasi keamanan",
      "Selesaikan verifikasi keamanan.",
      "Verifikasi keamanan tidak dapat diselesaikan. Silakan coba lagi.",
    ],
    pl: [
      "Weryfikacja bezpieczeństwa",
      "Ukończ weryfikację bezpieczeństwa.",
      "Nie udało się ukończyć weryfikacji bezpieczeństwa. Spróbuj ponownie.",
    ],
    vi: [
      "Xác minh bảo mật",
      "Vui lòng hoàn tất xác minh bảo mật.",
      "Không thể hoàn tất xác minh bảo mật. Vui lòng thử lại.",
    ],
    uk: [
      "Перевірка безпеки",
      "Завершіть перевірку безпеки.",
      "Не вдалося завершити перевірку безпеки. Спробуйте ще раз.",
    ],
    th: [
      "การตรวจสอบความปลอดภัย",
      "โปรดดำเนินการตรวจสอบความปลอดภัยให้เสร็จสิ้น",
      "ไม่สามารถดำเนินการตรวจสอบความปลอดภัยให้เสร็จสิ้นได้ โปรดลองอีกครั้ง",
    ],
    cs: [
      "Bezpečnostní ověření",
      "Dokončete bezpečnostní ověření.",
      "Bezpečnostní ověření se nepodařilo dokončit. Zkuste to znovu.",
    ],
    he: [
      "אימות אבטחה",
      "יש להשלים את אימות האבטחה.",
      "לא ניתן להשלים את אימות האבטחה. נסו שוב.",
    ],
    hu: [
      "Biztonsági ellenőrzés",
      "Végezze el a biztonsági ellenőrzést.",
      "A biztonsági ellenőrzés nem fejeződött be. Próbálja újra.",
    ],
    sv: [
      "Säkerhetsverifiering",
      "Slutför säkerhetsverifieringen.",
      "Säkerhetsverifieringen kunde inte slutföras. Försök igen.",
    ],
    bn: [
      "নিরাপত্তা যাচাইকরণ",
      "অনুগ্রহ করে নিরাপত্তা যাচাইকরণ সম্পন্ন করুন।",
      "নিরাপত্তা যাচাইকরণ সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।",
    ],
    ms: [
      "Pengesahan keselamatan",
      "Sila lengkapkan pengesahan keselamatan.",
      "Pengesahan keselamatan tidak dapat diselesaikan. Sila cuba lagi.",
    ],
    fil: [
      "Pagberipika sa seguridad",
      "Pakikumpleto ang pagberipika sa seguridad.",
      "Hindi makumpleto ang pagberipika sa seguridad. Pakisubukan muli.",
    ],
    "zh-tw": [
      "安全驗證",
      "請完成安全驗證。",
      "無法完成安全驗證。請再試一次。",
    ],
    "pt-pt": [
      "Verificação de segurança",
      "Conclua a verificação de segurança.",
      "Não foi possível concluir a verificação de segurança. Tente novamente.",
    ],
    da: [
      "Sikkerhedsbekræftelse",
      "Gennemfør sikkerhedsbekræftelsen.",
      "Sikkerhedsbekræftelsen kunne ikke gennemføres. Prøv igen.",
    ],
    fi: [
      "Turvallisuusvahvistus",
      "Suorita turvallisuusvahvistus loppuun.",
      "Turvallisuusvahvistusta ei voitu suorittaa. Yritä uudelleen.",
    ],
    nb: [
      "Sikkerhetsbekreftelse",
      "Fullfør sikkerhetsbekreftelsen.",
      "Sikkerhetsbekreftelsen kunne ikke fullføres. Prøv igjen.",
    ],
    sk: [
      "Bezpečnostné overenie",
      "Dokončite bezpečnostné overenie.",
      "Bezpečnostné overenie sa nepodarilo dokončiť. Skúste to znova.",
    ],
    lt: [
      "Saugumo patvirtinimas",
      "Užbaikite saugumo patvirtinimą.",
      "Nepavyko užbaigti saugumo patvirtinimo. Bandykite dar kartą.",
    ],
    lv: [
      "Drošības pārbaude",
      "Pabeidziet drošības pārbaudi.",
      "Drošības pārbaudi neizdevās pabeigt. Mēģiniet vēlreiz.",
    ],
    et: [
      "Turvakontroll",
      "Lõpetage turvakontroll.",
      "Turvakontrolli ei saanud lõpule viia. Proovige uuesti.",
    ],
    sl: [
      "Varnostno preverjanje",
      "Dokončajte varnostno preverjanje.",
      "Varnostnega preverjanja ni bilo mogoče dokončati. Poskusite znova.",
    ],
    ta: [
      "பாதுகாப்புச் சரிபார்ப்பு",
      "பாதுகாப்புச் சரிபார்ப்பை நிறைவு செய்யவும்.",
      "பாதுகாப்புச் சரிபார்ப்பை நிறைவு செய்ய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    ],
    te: [
      "భద్రతా ధృవీకరణ",
      "దయచేసి భద్రతా ధృవీకరణను పూర్తి చేయండి.",
      "భద్రతా ధృవీకరణను పూర్తి చేయలేకపోయాము. దయచేసి మళ్లీ ప్రయత్నించండి.",
    ],
    mr: [
      "सुरक्षा पडताळणी",
      "कृपया सुरक्षा पडताळणी पूर्ण करा.",
      "सुरक्षा पडताळणी पूर्ण होऊ शकली नाही. कृपया पुन्हा प्रयत्न करा.",
    ],
    sw: [
      "Uthibitishaji wa usalama",
      "Tafadhali kamilisha uthibitishaji wa usalama.",
      "Uthibitishaji wa usalama haukukamilika. Tafadhali jaribu tena.",
    ],
  };

  const existing = window.SnapUpPagePhrases || {};

  Object.entries(translations).forEach(([language, values]) => {
    keys.forEach((key, index) => {
      existing[key] = {
        ...(existing[key] || {}),
        [language]: values[index],
      };
    });
  });

  window.SnapUpPagePhrases = existing;
})();
