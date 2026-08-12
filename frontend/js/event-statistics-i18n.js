(() => {
  "use strict";

  const packs = {
    tr: {
      "Event Statistics": "Etkinlik İstatistikleri",
      "Used storage": "Kullanılan depolama",
      "Event statistics could not be loaded.":
        "Etkinlik istatistikleri yüklenemedi.",
    },
    ar: {
      "Event Statistics": "إحصائيات الفعالية",
      "Used storage": "مساحة التخزين المستخدمة",
      "Event statistics could not be loaded.":
        "تعذر تحميل إحصائيات الفعالية.",
    },
    de: {
      "Event Statistics": "Veranstaltungsstatistiken",
      "Used storage": "Verwendeter Speicher",
      "Event statistics could not be loaded.":
        "Die Veranstaltungsstatistiken konnten nicht geladen werden.",
    },
    fr: {
      "Event Statistics": "Statistiques de l’événement",
      "Used storage": "Stockage utilisé",
      "Event statistics could not be loaded.":
        "Les statistiques de l’événement n’ont pas pu être chargées.",
    },
    es: {
      "Event Statistics": "Estadísticas del evento",
      "Used storage": "Almacenamiento utilizado",
      "Event statistics could not be loaded.":
        "No se pudieron cargar las estadísticas del evento.",
    },
    it: {
      "Event Statistics": "Statistiche dell’evento",
      "Used storage": "Spazio di archiviazione utilizzato",
      "Event statistics could not be loaded.":
        "Impossibile caricare le statistiche dell’evento.",
    },
    nl: {
      "Event Statistics": "Evenementstatistieken",
      "Used storage": "Gebruikte opslag",
      "Event statistics could not be loaded.":
        "De evenementstatistieken konden niet worden geladen.",
    },
    bg: {
      "Event Statistics": "Статистика за събитието",
      "Used storage": "Използвано хранилище",
      "Event statistics could not be loaded.":
        "Статистиката за събитието не можа да се зареди.",
    },
    ro: {
      "Event Statistics": "Statistici eveniment",
      "Used storage": "Spațiu de stocare utilizat",
      "Event statistics could not be loaded.":
        "Statisticile evenimentului nu au putut fi încărcate.",
    },
    el: {
      "Event Statistics": "Στατιστικά εκδήλωσης",
      "Used storage": "Χρησιμοποιημένος χώρος",
      "Event statistics could not be loaded.":
        "Δεν ήταν δυνατή η φόρτωση των στατιστικών της εκδήλωσης.",
    },
    sr: {
      "Event Statistics": "Статистика догађаја",
      "Used storage": "Искоришћено складиште",
      "Event statistics could not be loaded.":
        "Статистика догађаја није могла да се учита.",
    },
    hr: {
      "Event Statistics": "Statistika događaja",
      "Used storage": "Iskorištena pohrana",
      "Event statistics could not be loaded.":
        "Statistika događaja nije se mogla učitati.",
    },
    bs: {
      "Event Statistics": "Statistika događaja",
      "Used storage": "Iskorištena pohrana",
      "Event statistics could not be loaded.":
        "Statistika događaja se nije mogla učitati.",
    },
    sq: {
      "Event Statistics": "Statistikat e eventit",
      "Used storage": "Hapësira e përdorur",
      "Event statistics could not be loaded.":
        "Statistikat e eventit nuk mund të ngarkoheshin.",
    },
    mk: {
      "Event Statistics": "Статистика на настанот",
      "Used storage": "Искористен простор",
      "Event statistics could not be loaded.":
        "Статистиката на настанот не можеше да се вчита.",
    },
    hi: {
      "Event Statistics": "इवेंट के आँकड़े",
      "Used storage": "उपयोग किया गया स्टोरेज",
      "Event statistics could not be loaded.":
        "इवेंट के आँकड़े लोड नहीं किए जा सके।",
    },
    ur: {
      "Event Statistics": "ایونٹ کے اعداد و شمار",
      "Used storage": "استعمال شدہ اسٹوریج",
      "Event statistics could not be loaded.":
        "ایونٹ کے اعداد و شمار لوڈ نہیں ہو سکے۔",
    },
    fa: {
      "Event Statistics": "آمار رویداد",
      "Used storage": "فضای ذخیره‌سازی استفاده‌شده",
      "Event statistics could not be loaded.": "آمار رویداد بارگیری نشد.",
    },
    ja: {
      "Event Statistics": "イベント統計",
      "Used storage": "使用済みストレージ",
      "Event statistics could not be loaded.":
        "イベント統計を読み込めませんでした。",
    },
    zh: {
      "Event Statistics": "活动统计",
      "Used storage": "已用存储空间",
      "Event statistics could not be loaded.": "无法加载活动统计信息。",
    },
    ko: {
      "Event Statistics": "이벤트 통계",
      "Used storage": "사용한 저장 공간",
      "Event statistics could not be loaded.":
        "이벤트 통계를 불러올 수 없습니다.",
    },
    pt: {
      "Event Statistics": "Estatísticas do evento",
      "Used storage": "Armazenamento utilizado",
      "Event statistics could not be loaded.":
        "Não foi possível carregar as estatísticas do evento.",
    },
    ru: {
      "Event Statistics": "Статистика события",
      "Used storage": "Использовано хранилища",
      "Event statistics could not be loaded.":
        "Не удалось загрузить статистику события.",
    },
    id: {
      "Event Statistics": "Statistik acara",
      "Used storage": "Penyimpanan terpakai",
      "Event statistics could not be loaded.":
        "Statistik acara tidak dapat dimuat.",
    },
    pl: {
      "Event Statistics": "Statystyki wydarzenia",
      "Used storage": "Wykorzystane miejsce",
      "Event statistics could not be loaded.":
        "Nie udało się wczytać statystyk wydarzenia.",
    },
    vi: {
      "Event Statistics": "Thống kê sự kiện",
      "Used storage": "Dung lượng đã sử dụng",
      "Event statistics could not be loaded.":
        "Không thể tải số liệu thống kê sự kiện.",
    },
    uk: {
      "Event Statistics": "Статистика події",
      "Used storage": "Використано сховища",
      "Event statistics could not be loaded.":
        "Не вдалося завантажити статистику події.",
    },
    th: {
      "Event Statistics": "สถิติงาน",
      "Used storage": "พื้นที่เก็บข้อมูลที่ใช้",
      "Event statistics could not be loaded.": "ไม่สามารถโหลดสถิติงานได้",
    },
    cs: {
      "Event Statistics": "Statistiky události",
      "Used storage": "Využité úložiště",
      "Event statistics could not be loaded.":
        "Statistiky události se nepodařilo načíst.",
    },
    he: {
      "Event Statistics": "סטטיסטיקות האירוע",
      "Used storage": "אחסון בשימוש",
      "Event statistics could not be loaded.":
        "לא ניתן היה לטעון את סטטיסטיקות האירוע.",
    },
    hu: {
      "Event Statistics": "Eseménystatisztikák",
      "Used storage": "Felhasznált tárhely",
      "Event statistics could not be loaded.":
        "Az eseménystatisztikák nem tölthetők be.",
    },
    sv: {
      "Event Statistics": "Evenemangsstatistik",
      "Used storage": "Använt lagringsutrymme",
      "Event statistics could not be loaded.":
        "Evenemangsstatistiken kunde inte läsas in.",
    },
    bn: {
      "Event Statistics": "ইভেন্টের পরিসংখ্যান",
      "Used storage": "ব্যবহৃত স্টোরেজ",
      "Event statistics could not be loaded.":
        "ইভেন্টের পরিসংখ্যান লোড করা যায়নি।",
    },
    ms: {
      "Event Statistics": "Statistik acara",
      "Used storage": "Storan digunakan",
      "Event statistics could not be loaded.":
        "Statistik acara tidak dapat dimuatkan.",
    },
    fil: {
      "Event Statistics": "Mga istatistika ng event",
      "Used storage": "Nagamit na storage",
      "Event statistics could not be loaded.":
        "Hindi ma-load ang mga istatistika ng event.",
    },
    "zh-tw": {
      "Event Statistics": "活動統計",
      "Used storage": "已用儲存空間",
      "Event statistics could not be loaded.": "無法載入活動統計資料。",
    },
    "pt-pt": {
      "Event Statistics": "Estatísticas do evento",
      "Used storage": "Armazenamento utilizado",
      "Event statistics could not be loaded.":
        "Não foi possível carregar as estatísticas do evento.",
    },
    da: {
      "Event Statistics": "Begivenhedsstatistik",
      "Used storage": "Brugt lagerplads",
      "Event statistics could not be loaded.":
        "Begivenhedsstatistikken kunne ikke indlæses.",
    },
    fi: {
      "Event Statistics": "Tapahtumatilastot",
      "Used storage": "Käytetty tallennustila",
      "Event statistics could not be loaded.":
        "Tapahtumatilastoja ei voitu ladata.",
    },
    nb: {
      "Event Statistics": "Arrangementsstatistikk",
      "Used storage": "Brukt lagringsplass",
      "Event statistics could not be loaded.":
        "Arrangementsstatistikken kunne ikke lastes inn.",
    },
    sk: {
      "Event Statistics": "Štatistiky udalosti",
      "Used storage": "Využité úložisko",
      "Event statistics could not be loaded.":
        "Štatistiky udalosti sa nepodarilo načítať.",
    },
    lt: {
      "Event Statistics": "Renginio statistika",
      "Used storage": "Panaudota saugykla",
      "Event statistics could not be loaded.":
        "Nepavyko įkelti renginio statistikos.",
    },
    lv: {
      "Event Statistics": "Pasākuma statistika",
      "Used storage": "Izmantotā krātuve",
      "Event statistics could not be loaded.":
        "Neizdevās ielādēt pasākuma statistiku.",
    },
    et: {
      "Event Statistics": "Sündmuse statistika",
      "Used storage": "Kasutatud salvestusruum",
      "Event statistics could not be loaded.":
        "Sündmuse statistikat ei saanud laadida.",
    },
    sl: {
      "Event Statistics": "Statistika dogodka",
      "Used storage": "Porabljen prostor",
      "Event statistics could not be loaded.":
        "Statistike dogodka ni bilo mogoče naložiti.",
    },
    ta: {
      "Event Statistics": "நிகழ்வு புள்ளிவிவரங்கள்",
      "Used storage": "பயன்படுத்திய சேமிப்பிடம்",
      "Event statistics could not be loaded.":
        "நிகழ்வு புள்ளிவிவரங்களை ஏற்ற முடியவில்லை.",
    },
    te: {
      "Event Statistics": "ఈవెంట్ గణాంకాలు",
      "Used storage": "ఉపయోగించిన నిల్వ",
      "Event statistics could not be loaded.":
        "ఈవెంట్ గణాంకాలను లోడ్ చేయడం సాధ్యం కాలేదు.",
    },
    mr: {
      "Event Statistics": "कार्यक्रमाची आकडेवारी",
      "Used storage": "वापरलेले स्टोरेज",
      "Event statistics could not be loaded.":
        "कार्यक्रमाची आकडेवारी लोड करता आली नाही.",
    },
    sw: {
      "Event Statistics": "Takwimu za Tukio",
      "Used storage": "Hifadhi iliyotumika",
      "Event statistics could not be loaded.":
        "Takwimu za tukio hazikuweza kupakiwa.",
    },
  };

  const existing = window.SnapUpPagePhrases || {};

  Object.entries(packs).forEach(([language, translations]) => {
    Object.entries(translations).forEach(([key, translation]) => {
      existing[key] = {
        ...(existing[key] || {}),
        [language]: translation,
      };
    });
  });

  window.SnapUpPagePhrases = existing;
})();
