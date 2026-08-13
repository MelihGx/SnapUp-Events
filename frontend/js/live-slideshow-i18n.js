(() => {
  "use strict";

  const modeTranslations = {
    tr: ["Canlı Slayt Gösterisi", "En yeni fotoğraf", "Rastgele fotoğraflar", "Seçilen fotoğraf"],
    ar: ["عرض شرائح مباشر", "أحدث صورة", "صور عشوائية", "الصورة المحددة"],
    de: ["Live-Diashow", "Neuestes Foto", "Zufällige Fotos", "Ausgewähltes Foto"],
    fr: ["Diaporama en direct", "Photo la plus récente", "Photos aléatoires", "Photo sélectionnée"],
    es: ["Presentación en vivo", "Foto más reciente", "Fotos aleatorias", "Foto seleccionada"],
    it: ["Presentazione live", "Foto più recente", "Foto casuali", "Foto selezionata"],
    nl: ["Live-diavoorstelling", "Nieuwste foto", "Willekeurige foto's", "Geselecteerde foto"],
    bg: ["Слайдшоу на живо", "Най-нова снимка", "Случайни снимки", "Избрана снимка"],
    ro: ["Prezentare live", "Cea mai nouă fotografie", "Fotografii aleatorii", "Fotografie selectată"],
    el: ["Ζωντανή παρουσίαση", "Νεότερη φωτογραφία", "Τυχαίες φωτογραφίες", "Επιλεγμένη φωτογραφία"],
    sr: ["Slajd-šou uživo", "Najnovija fotografija", "Nasumične fotografije", "Izabrana fotografija"],
    hr: ["Slajd-šou uživo", "Najnovija fotografija", "Nasumične fotografije", "Odabrana fotografija"],
    bs: ["Slajd-šou uživo", "Najnovija fotografija", "Nasumične fotografije", "Odabrana fotografija"],
    sq: ["Prezantim i drejtpërdrejtë", "Fotoja më e re", "Foto të rastësishme", "Fotoja e zgjedhur"],
    mk: ["Слајдшоу во живо", "Најнова фотографија", "Случајни фотографии", "Избрана фотографија"],
    hi: ["लाइव स्लाइड शो", "नवीनतम फ़ोटो", "रैंडम फ़ोटो", "चयनित फ़ोटो"],
    ur: ["لائیو سلائیڈ شو", "تازہ ترین تصویر", "بے ترتیب تصاویر", "منتخب تصویر"],
    fa: ["نمایش اسلاید زنده", "جدیدترین عکس", "عکس‌های تصادفی", "عکس انتخاب‌شده"],
    ja: ["ライブスライドショー", "最新の写真", "ランダムな写真", "選択した写真"],
    zh: ["实时幻灯片", "最新照片", "随机照片", "所选照片"],
    ko: ["라이브 슬라이드쇼", "최신 사진", "무작위 사진", "선택한 사진"],
    pt: ["Apresentação ao vivo", "Foto mais recente", "Fotos aleatórias", "Foto selecionada"],
    ru: ["Слайд-шоу в реальном времени", "Новейшая фотография", "Случайные фотографии", "Выбранная фотография"],
    id: ["Tayangan slide langsung", "Foto terbaru", "Foto acak", "Foto yang dipilih"],
    pl: ["Pokaz slajdów na żywo", "Najnowsze zdjęcie", "Losowe zdjęcia", "Wybrane zdjęcie"],
    vi: ["Trình chiếu trực tiếp", "Ảnh mới nhất", "Ảnh ngẫu nhiên", "Ảnh đã chọn"],
    uk: ["Слайд-шоу наживо", "Найновіша фотографія", "Випадкові фотографії", "Вибрана фотографія"],
    th: ["สไลด์โชว์สด", "รูปภาพล่าสุด", "รูปภาพแบบสุ่ม", "รูปภาพที่เลือก"],
    cs: ["Živá prezentace", "Nejnovější fotografie", "Náhodné fotografie", "Vybraná fotografie"],
    he: ["מצגת חיה", "התמונה החדשה ביותר", "תמונות אקראיות", "תמונה נבחרת"],
    hu: ["Élő diavetítés", "Legújabb fénykép", "Véletlenszerű fényképek", "Kiválasztott fénykép"],
    sv: ["Livebildspel", "Nyaste fotot", "Slumpmässiga foton", "Valt foto"],
    bn: ["লাইভ স্লাইডশো", "সর্বশেষ ছবি", "এলোমেলো ছবি", "নির্বাচিত ছবি"],
    ms: ["Tayangan slaid langsung", "Foto terkini", "Foto rawak", "Foto dipilih"],
    fil: ["Live slideshow", "Pinakabagong larawan", "Mga random na larawan", "Napiling larawan"],
    "zh-tw": ["即時投影片播放", "最新照片", "隨機照片", "已選照片"],
    "pt-pt": ["Apresentação ao vivo", "Fotografia mais recente", "Fotografias aleatórias", "Fotografia selecionada"],
    da: ["Live-diasshow", "Nyeste billede", "Tilfældige billeder", "Valgt billede"],
    fi: ["Live-diaesitys", "Uusin kuva", "Satunnaiset kuvat", "Valittu kuva"],
    nb: ["Direkte lysbildefremvisning", "Nyeste bilde", "Tilfeldige bilder", "Valgt bilde"],
    sk: ["Živá prezentácia", "Najnovšia fotografia", "Náhodné fotografie", "Vybraná fotografia"],
    lt: ["Tiesioginė skaidrių demonstracija", "Naujausia nuotrauka", "Atsitiktinės nuotraukos", "Pasirinkta nuotrauka"],
    lv: ["Tiešraides slaidrāde", "Jaunākais fotoattēls", "Nejauši fotoattēli", "Atlasītais fotoattēls"],
    et: ["Reaalajas slaidiseanss", "Uusim foto", "Juhuslikud fotod", "Valitud foto"],
    sl: ["Diaprojekcija v živo", "Najnovejša fotografija", "Naključne fotografije", "Izbrana fotografija"],
    ta: ["நேரலை ஸ்லைடுஷோ", "சமீபத்திய படம்", "சீரற்ற படங்கள்", "தேர்ந்தெடுத்த படம்"],
    te: ["ప్రత్యక్ష స్లైడ్‌షో", "తాజా ఫోటో", "యాదృచ్ఛిక ఫోటోలు", "ఎంచుకున్న ఫోటో"],
    mr: ["थेट स्लाइडशो", "नवीनतम फोटो", "यादृच्छिक फोटो", "निवडलेला फोटो"],
    sw: ["Onyesho la moja kwa moja", "Picha mpya zaidi", "Picha nasibu", "Picha iliyochaguliwa"],
  };

  const existing = window.SnapUpPagePhrases || {};

  function mergePhrase(key, translations) {
    existing[key] = {
      ...(existing[key] || {}),
      ...translations,
    };
  }

  const titleTranslations = Object.fromEntries(
    Object.entries(modeTranslations).map(([language, values]) => [language, values[0]]),
  );
  const latestTranslations = Object.fromEntries(
    Object.entries(modeTranslations).map(([language, values]) => [language, values[1]]),
  );
  const randomTranslations = Object.fromEntries(
    Object.entries(modeTranslations).map(([language, values]) => [language, values[2]]),
  );
  const selectedTranslations = Object.fromEntries(
    Object.entries(modeTranslations).map(([language, values]) => [language, values[3]]),
  );

  mergePhrase("Live Slideshow", titleTranslations);
  mergePhrase("Open Live Slideshow", titleTranslations);
  mergePhrase("Start Show", titleTranslations);
  mergePhrase("Slideshow mode", titleTranslations);
  mergePhrase("Live Slideshow — SnapUp Events", Object.fromEntries(
    Object.entries(titleTranslations).map(([language, value]) => [language, `${value} — SnapUp Events`]),
  ));
  mergePhrase("Newest photo", latestTranslations);
  mergePhrase("Random photos", randomTranslations);
  mergePhrase("Selected photo", selectedTranslations);

  const aliases = {
    "Preparing live slideshow...": "Preparing...",
    "Approved photos are loading.": "Loading...",
    "Connecting...": "Loading...",
    Controls: "Settings",
    "DISPLAY CONTROL": "Event settings",
    "Choose a photo": "Choose photo",
    "Approved photos will appear here when they are ready.":
      "No approved photos yet. Photos will appear here after admin approval.",
    "New approved photos will appear here automatically.":
      "No approved photos yet. Photos will appear here after admin approval.",
    "Photo selected": "Selected photo preview",
    Guest: "Unknown Guest",
    "Approved event photo": "Image",
    "Save and Apply": "Save Settings",
    "Slideshow settings saved.": "Settings updated successfully.",
    "Settings could not be saved.": "Settings could not be updated.",
  };

  Object.entries(aliases).forEach(([target, source]) => {
    if (existing[source]) {
      mergePhrase(target, existing[source]);
    }
  });

  const turkish = {
    "Display approved photos on the event screen":
      "Onaylı fotoğrafları etkinlik ekranında göster",
    "Start Full Screen": "Tam Ekranı Başlat",
    "Back to Event": "Etkinliğe Dön",
    "Choose how approved photos appear on the event screen.":
      "Onaylı fotoğrafların etkinlik ekranında nasıl görüneceğini seç.",
    "Show newly approved photos in arrival order.":
      "Yeni onaylanan fotoğrafları geliş sırasıyla göster.",
    "Rotate through approved photos automatically.":
      "Onaylı fotoğraflar arasında otomatik olarak geçiş yap.",
    "Keep one admin-selected photo on screen.":
      "Adminin seçtiği tek bir fotoğrafı ekranda tut.",
    "Minimum time on screen": "Ekranda minimum kalma süresi",
    "Each new photo remains visible for at least this long.":
      "Her yeni fotoğraf en az bu süre boyunca görünür kalır.",
    seconds: "saniye",
    "Photo change interval": "Fotoğraf değiştirme aralığı",
    "Choose how often a random photo changes.":
      "Rastgele fotoğrafın ne sıklıkta değişeceğini seç.",
    "No photo selected": "Fotoğraf seçilmedi",
    "Start Show": "Gösteriyi Başlat",
    "Then press F11": "Ardından F11'e bas",
    "Show or hide controls": "Kontrolleri göster veya gizle",
    "Browser full screen": "Tarayıcı tam ekranı",
    "Return to controls": "Kontrollere dön",
    "Updated now": "Şimdi güncellendi",
    "Connection lost": "Bağlantı kesildi",
    "Selected photo is unavailable": "Seçilen fotoğraf kullanılamıyor",
    "Open the controls and choose an approved photo.":
      "Kontrolleri aç ve onaylı bir fotoğraf seç.",
    "Choose an approved photo before saving.":
      "Kaydetmeden önce onaylı bir fotoğraf seç.",
    "Press F11 to enter browser full screen.":
      "Tarayıcıda tam ekrana geçmek için F11'e bas.",
    "Event ID was not found": "Etkinlik kimliği bulunamadı",
    "Return to Event Detail and open the live slideshow again.":
      "Etkinlik Detayı'na dön ve canlı gösteriyi yeniden aç.",
    "Live slideshow could not be loaded": "Canlı gösteri yüklenemedi",
    "Live slideshow could not be loaded.": "Canlı gösteri yüklenemedi.",
    "This photo could not be displayed.": "Bu fotoğraf gösterilemedi.",
    "Your session has expired. Please log in again.":
      "Oturumunun süresi doldu. Lütfen yeniden giriş yap.",
    "{count} approved photos": "{count} onaylı fotoğraf",
    "Select approved photo {number}": "{number}. onaylı fotoğrafı seç",
    "Photo uploaded by {name}": "{name} tarafından yüklenen fotoğraf",
    "Press H to show controls · F11 for browser full screen":
      "Kontroller için H · Tarayıcı tam ekranı için F11",
  };

  Object.entries(turkish).forEach(([key, value]) => {
    mergePhrase(key, { tr: value });
  });

  window.SnapUpPagePhrases = existing;
})();
