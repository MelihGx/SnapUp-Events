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

  // The slideshow control panel was added after the global 50-language
  // catalogue.  Keep its copy in one ordered page-specific pack so every
  // language gets the complete panel instead of a translated heading with
  // English helper text underneath it.
  const panelKeys = [
    "DISPLAY CONTROL",
    "Choose how approved photos appear on the event screen.",
    "Slideshow mode",
    "Show newly approved photos in arrival order.",
    "Rotate through approved photos automatically.",
    "Keep one admin-selected photo on screen.",
    "Minimum time on screen",
    "Each new photo remains visible for at least this long.",
    "seconds",
    "Photo change interval",
    "Choose how often a random photo changes.",
    "Choose a photo",
    "No photo selected",
    "Save and Apply",
    "Start Show",
    "Then press F11",
    "Show or hide controls",
    "Browser full screen",
    "Return to controls",
    "Start Full Screen",
    "Back to Event",
    "Hide controls",
    "Slideshow controls",
    "Press H to show controls · F11 for browser full screen",
  ];

  const panelTranslations = {
    tr: [
      "GÖRÜNTÜ KONTROLÜ", "Onaylı fotoğrafların etkinlik ekranında nasıl görüneceğini seç.", "Slayt gösterisi modu",
      "Yeni onaylanan fotoğrafları geliş sırasıyla göster.", "Onaylı fotoğraflar arasında otomatik olarak geçiş yap.", "Adminin seçtiği tek bir fotoğrafı ekranda tut.",
      "Ekranda minimum kalma süresi", "Her yeni fotoğraf en az bu süre boyunca görünür kalır.", "saniye",
      "Fotoğraf değiştirme aralığı", "Rastgele fotoğrafın ne sıklıkta değişeceğini seç.", "Bir fotoğraf seç",
      "Fotoğraf seçilmedi", "Kaydet ve Uygula", "Gösteriyi Başlat", "Ardından F11'e bas",
      "Kontrolleri göster veya gizle", "Tarayıcı tam ekranı", "Kontrollere dön", "Tam Ekranı Başlat",
      "Etkinliğe Dön", "Kontrolleri gizle", "Slayt gösterisi kontrolleri", "Kontroller için H · Tarayıcı tam ekranı için F11",
    ],
    ar: [
      "التحكم في العرض", "اختر كيفية ظهور الصور المعتمدة على شاشة الفعالية.", "وضع عرض الشرائح",
      "اعرض الصور المعتمدة حديثًا حسب ترتيب وصولها.", "تنقّل تلقائيًا بين الصور المعتمدة.", "أبقِ صورة واحدة اختارها المشرف على الشاشة.",
      "الحد الأدنى لمدة العرض", "تبقى كل صورة جديدة ظاهرة لهذه المدة على الأقل.", "ثوانٍ",
      "الفاصل الزمني لتغيير الصورة", "اختر عدد مرات تغيير الصورة العشوائية.", "اختر صورة",
      "لم يتم اختيار صورة", "حفظ وتطبيق", "بدء العرض", "ثم اضغط F11",
      "إظهار عناصر التحكم أو إخفاؤها", "ملء شاشة المتصفح", "العودة إلى عناصر التحكم", "بدء ملء الشاشة",
      "العودة إلى الفعالية", "إخفاء عناصر التحكم", "عناصر التحكم في عرض الشرائح", "اضغط H لإظهار عناصر التحكم · وF11 لملء شاشة المتصفح",
    ],
    de: [
      "ANZEIGESTEUERUNG", "Wähle, wie freigegebene Fotos auf dem Veranstaltungsbildschirm erscheinen.", "Diashow-Modus",
      "Zeige neu freigegebene Fotos in der Reihenfolge ihres Eingangs.", "Wechsle automatisch durch die freigegebenen Fotos.", "Lasse ein vom Admin ausgewähltes Foto auf dem Bildschirm.",
      "Mindestanzeigedauer", "Jedes neue Foto bleibt mindestens so lange sichtbar.", "Sekunden",
      "Foto-Wechselintervall", "Lege fest, wie oft ein zufälliges Foto wechselt.", "Foto auswählen",
      "Kein Foto ausgewählt", "Speichern und anwenden", "Show starten", "Drücke anschließend F11",
      "Steuerung ein- oder ausblenden", "Browser-Vollbild", "Zurück zur Steuerung", "Vollbild starten",
      "Zurück zur Veranstaltung", "Steuerung ausblenden", "Diashow-Steuerung", "H für Steuerung · F11 für Browser-Vollbild",
    ],
    fr: [
      "CONTRÔLE DE L’AFFICHAGE", "Choisissez comment les photos approuvées apparaissent sur l’écran de l’événement.", "Mode du diaporama",
      "Affichez les nouvelles photos approuvées dans leur ordre d’arrivée.", "Faites défiler automatiquement les photos approuvées.", "Conservez à l’écran une photo choisie par l’administrateur.",
      "Durée minimale à l’écran", "Chaque nouvelle photo reste visible au moins pendant cette durée.", "secondes",
      "Intervalle de changement", "Choisissez la fréquence de changement des photos aléatoires.", "Choisir une photo",
      "Aucune photo sélectionnée", "Enregistrer et appliquer", "Démarrer le diaporama", "Appuyez ensuite sur F11",
      "Afficher ou masquer les commandes", "Plein écran du navigateur", "Retour aux commandes", "Passer en plein écran",
      "Retour à l’événement", "Masquer les commandes", "Commandes du diaporama", "H pour les commandes · F11 pour le plein écran du navigateur",
    ],
    es: [
      "CONTROL DE PANTALLA", "Elige cómo aparecen las fotos aprobadas en la pantalla del evento.", "Modo de presentación",
      "Muestra las fotos recién aprobadas en orden de llegada.", "Recorre automáticamente las fotos aprobadas.", "Mantén en pantalla una foto elegida por el administrador.",
      "Tiempo mínimo en pantalla", "Cada foto nueva permanece visible al menos durante este tiempo.", "segundos",
      "Intervalo de cambio de foto", "Elige cada cuánto cambia una foto aleatoria.", "Elegir una foto",
      "Ninguna foto seleccionada", "Guardar y aplicar", "Iniciar presentación", "Después pulsa F11",
      "Mostrar u ocultar controles", "Pantalla completa del navegador", "Volver a los controles", "Iniciar pantalla completa",
      "Volver al evento", "Ocultar controles", "Controles de presentación", "H para los controles · F11 para pantalla completa",
    ],
    it: [
      "CONTROLLO SCHERMO", "Scegli come mostrare le foto approvate sullo schermo dell’evento.", "Modalità presentazione",
      "Mostra le foto appena approvate in ordine di arrivo.", "Scorri automaticamente le foto approvate.", "Mantieni sullo schermo una foto scelta dall’amministratore.",
      "Tempo minimo sullo schermo", "Ogni nuova foto resta visibile almeno per questo tempo.", "secondi",
      "Intervallo cambio foto", "Scegli ogni quanto cambia una foto casuale.", "Scegli una foto",
      "Nessuna foto selezionata", "Salva e applica", "Avvia presentazione", "Poi premi F11",
      "Mostra o nascondi i controlli", "Schermo intero del browser", "Torna ai controlli", "Avvia schermo intero",
      "Torna all’evento", "Nascondi controlli", "Controlli presentazione", "H per i controlli · F11 per lo schermo intero",
    ],
    nl: [
      "WEERGAVEBEDIENING", "Kies hoe goedgekeurde foto's op het evenementenscherm verschijnen.", "Diavoorstellingsmodus",
      "Toon nieuw goedgekeurde foto's in volgorde van binnenkomst.", "Doorloop goedgekeurde foto's automatisch.", "Houd één door de beheerder gekozen foto op het scherm.",
      "Minimale tijd op het scherm", "Elke nieuwe foto blijft minstens zo lang zichtbaar.", "seconden",
      "Interval voor fotowissel", "Kies hoe vaak een willekeurige foto verandert.", "Kies een foto",
      "Geen foto geselecteerd", "Opslaan en toepassen", "Voorstelling starten", "Druk daarna op F11",
      "Bediening tonen of verbergen", "Volledig scherm in browser", "Terug naar bediening", "Volledig scherm starten",
      "Terug naar evenement", "Bediening verbergen", "Diavoorstellingsbediening", "H voor bediening · F11 voor volledig scherm",
    ],
    bg: [
      "УПРАВЛЕНИЕ НА ЕКРАНА", "Изберете как одобрените снимки да се показват на екрана на събитието.", "Режим на слайдшоу",
      "Показвайте новоодобрените снимки по реда на получаването им.", "Превъртайте автоматично одобрените снимки.", "Задръжте на екрана една снимка, избрана от администратора.",
      "Минимално време на екрана", "Всяка нова снимка остава видима поне толкова време.", "секунди",
      "Интервал за смяна на снимка", "Изберете колко често да се сменя случайна снимка.", "Изберете снимка",
      "Няма избрана снимка", "Запази и приложи", "Стартирай шоуто", "След това натиснете F11",
      "Покажи или скрий контролите", "Цял екран на браузъра", "Обратно към контролите", "Стартирай цял екран",
      "Обратно към събитието", "Скрий контролите", "Контроли на слайдшоуто", "H за контролите · F11 за цял екран",
    ],
    ro: [
      "CONTROLUL AFIȘAJULUI", "Alege cum apar fotografiile aprobate pe ecranul evenimentului.", "Mod prezentare",
      "Afișează fotografiile nou aprobate în ordinea sosirii.", "Parcurge automat fotografiile aprobate.", "Păstrează pe ecran o fotografie aleasă de administrator.",
      "Timp minim pe ecran", "Fiecare fotografie nouă rămâne vizibilă cel puțin atât timp.", "secunde",
      "Interval de schimbare", "Alege cât de des se schimbă o fotografie aleatorie.", "Alege o fotografie",
      "Nicio fotografie selectată", "Salvează și aplică", "Pornește prezentarea", "Apoi apasă F11",
      "Arată sau ascunde comenzile", "Ecran complet în browser", "Înapoi la comenzi", "Pornește ecranul complet",
      "Înapoi la eveniment", "Ascunde comenzile", "Comenzi prezentare", "H pentru comenzi · F11 pentru ecran complet",
    ],
    el: [
      "ΕΛΕΓΧΟΣ ΠΡΟΒΟΛΗΣ", "Επιλέξτε πώς θα εμφανίζονται οι εγκεκριμένες φωτογραφίες στην οθόνη της εκδήλωσης.", "Λειτουργία παρουσίασης",
      "Εμφάνιση νέων εγκεκριμένων φωτογραφιών με σειρά άφιξης.", "Αυτόματη εναλλαγή των εγκεκριμένων φωτογραφιών.", "Διατήρηση μίας φωτογραφίας που επέλεξε ο διαχειριστής στην οθόνη.",
      "Ελάχιστος χρόνος στην οθόνη", "Κάθε νέα φωτογραφία παραμένει ορατή τουλάχιστον για αυτό το διάστημα.", "δευτερόλεπτα",
      "Διάστημα αλλαγής φωτογραφίας", "Επιλέξτε πόσο συχνά αλλάζει μια τυχαία φωτογραφία.", "Επιλέξτε φωτογραφία",
      "Δεν επιλέχθηκε φωτογραφία", "Αποθήκευση και εφαρμογή", "Έναρξη παρουσίασης", "Έπειτα πατήστε F11",
      "Εμφάνιση ή απόκρυψη στοιχείων ελέγχου", "Πλήρης οθόνη προγράμματος περιήγησης", "Επιστροφή στα στοιχεία ελέγχου", "Έναρξη πλήρους οθόνης",
      "Επιστροφή στην εκδήλωση", "Απόκρυψη στοιχείων ελέγχου", "Στοιχεία ελέγχου παρουσίασης", "H για στοιχεία ελέγχου · F11 για πλήρη οθόνη",
    ],
    sr: [
      "KONTROLA PRIKAZA", "Izaberite kako će se odobrene fotografije prikazivati na ekranu događaja.", "Režim slajd-šoua",
      "Prikažite nove odobrene fotografije redosledom pristizanja.", "Automatski menjajte odobrene fotografije.", "Zadržite jednu fotografiju koju je izabrao administrator na ekranu.",
      "Najkraće vreme na ekranu", "Svaka nova fotografija ostaje vidljiva najmanje ovoliko dugo.", "sekundi",
      "Interval promene fotografije", "Izaberite koliko često se menja nasumična fotografija.", "Izaberite fotografiju",
      "Nije izabrana fotografija", "Sačuvaj i primeni", "Pokreni prikaz", "Zatim pritisnite F11",
      "Prikaži ili sakrij kontrole", "Ceo ekran pregledača", "Nazad na kontrole", "Pokreni ceo ekran",
      "Nazad na događaj", "Sakrij kontrole", "Kontrole slajd-šoua", "H za kontrole · F11 za ceo ekran",
    ],
    hr: [
      "UPRAVLJANJE PRIKAZOM", "Odaberite kako će se odobrene fotografije prikazivati na zaslonu događaja.", "Način dijaprojekcije",
      "Prikažite nove odobrene fotografije redoslijedom dolaska.", "Automatski izmjenjujte odobrene fotografije.", "Zadržite jednu fotografiju koju je odabrao administrator na zaslonu.",
      "Najkraće vrijeme na zaslonu", "Svaka nova fotografija ostaje vidljiva barem ovoliko dugo.", "sekundi",
      "Interval promjene fotografije", "Odaberite koliko često se mijenja nasumična fotografija.", "Odaberite fotografiju",
      "Nije odabrana fotografija", "Spremi i primijeni", "Pokreni prikaz", "Zatim pritisnite F11",
      "Prikaži ili sakrij kontrole", "Cijeli zaslon preglednika", "Natrag na kontrole", "Pokreni cijeli zaslon",
      "Natrag na događaj", "Sakrij kontrole", "Kontrole dijaprojekcije", "H za kontrole · F11 za cijeli zaslon",
    ],
    bs: [
      "UPRAVLJANJE PRIKAZOM", "Odaberite kako će se odobrene fotografije prikazivati na ekranu događaja.", "Način slajd-šoua",
      "Prikažite nove odobrene fotografije redoslijedom dolaska.", "Automatski mijenjajte odobrene fotografije.", "Zadržite jednu fotografiju koju je odabrao administrator na ekranu.",
      "Najkraće vrijeme na ekranu", "Svaka nova fotografija ostaje vidljiva barem ovoliko dugo.", "sekundi",
      "Interval promjene fotografije", "Odaberite koliko često se mijenja nasumična fotografija.", "Odaberite fotografiju",
      "Nije odabrana fotografija", "Sačuvaj i primijeni", "Pokreni prikaz", "Zatim pritisnite F11",
      "Prikaži ili sakrij kontrole", "Cijeli ekran preglednika", "Nazad na kontrole", "Pokreni cijeli ekran",
      "Nazad na događaj", "Sakrij kontrole", "Kontrole slajd-šoua", "H za kontrole · F11 za cijeli ekran",
    ],
    sq: [
      "KONTROLLI I EKRANIT", "Zgjidhni si shfaqen fotografitë e miratuara në ekranin e eventit.", "Mënyra e prezantimit",
      "Shfaq fotografitë e sapomiratuara sipas radhës së mbërritjes.", "Kalo automatikisht nëpër fotografitë e miratuara.", "Mbaj në ekran një fotografi të zgjedhur nga administratori.",
      "Koha minimale në ekran", "Çdo fotografi e re mbetet e dukshme të paktën kaq gjatë.", "sekonda",
      "Intervali i ndryshimit", "Zgjidh sa shpesh ndryshon një fotografi e rastësishme.", "Zgjidh një fotografi",
      "Nuk është zgjedhur fotografi", "Ruaj dhe zbato", "Fillo prezantimin", "Më pas shtyp F11",
      "Shfaq ose fshih kontrollet", "Ekrani i plotë i shfletuesit", "Kthehu te kontrollet", "Fillo ekranin e plotë",
      "Kthehu te eventi", "Fshih kontrollet", "Kontrollet e prezantimit", "H për kontrollet · F11 për ekran të plotë",
    ],
    mk: [
      "КОНТРОЛА НА ПРИКАЗОТ", "Изберете како одобрените фотографии ќе се прикажуваат на екранот на настанот.", "Режим на слајдшоу",
      "Прикажи ги новоодобрените фотографии по редослед на пристигнување.", "Автоматски менувај ги одобрените фотографии.", "Задржи една фотографија избрана од администраторот на екранот.",
      "Минимално време на екранот", "Секоја нова фотографија останува видлива најмалку толку време.", "секунди",
      "Интервал за промена на фотографија", "Изберете колку често се менува случајна фотографија.", "Изберете фотографија",
      "Нема избрана фотографија", "Зачувај и примени", "Стартувај го приказот", "Потоа притиснете F11",
      "Прикажи или скриј ги контролите", "Цел екран на прелистувачот", "Назад кон контролите", "Стартувај цел екран",
      "Назад кон настанот", "Скриј ги контролите", "Контроли на слајдшоуто", "H за контроли · F11 за цел екран",
    ],
    hi: [
      "डिस्प्ले नियंत्रण", "चुनें कि स्वीकृत फ़ोटो इवेंट स्क्रीन पर कैसे दिखाई दें।", "स्लाइडशो मोड",
      "नई स्वीकृत फ़ोटो को आने के क्रम में दिखाएँ।", "स्वीकृत फ़ोटो को अपने-आप बदलते रहें।", "एडमिन द्वारा चुनी गई एक फ़ोटो स्क्रीन पर रखें।",
      "स्क्रीन पर न्यूनतम समय", "हर नई फ़ोटो कम से कम इतनी देर दिखाई देती है।", "सेकंड",
      "फ़ोटो बदलने का अंतराल", "चुनें कि कोई रैंडम फ़ोटो कितनी बार बदले।", "फ़ोटो चुनें",
      "कोई फ़ोटो नहीं चुनी गई", "सहेजें और लागू करें", "शो शुरू करें", "फिर F11 दबाएँ",
      "नियंत्रण दिखाएँ या छिपाएँ", "ब्राउज़र पूर्ण स्क्रीन", "नियंत्रणों पर लौटें", "पूर्ण स्क्रीन शुरू करें",
      "इवेंट पर लौटें", "नियंत्रण छिपाएँ", "स्लाइडशो नियंत्रण", "नियंत्रण के लिए H · पूर्ण स्क्रीन के लिए F11",
    ],
    ur: [
      "ڈسپلے کنٹرول", "منتخب کریں کہ منظور شدہ تصاویر ایونٹ اسکرین پر کیسے نظر آئیں۔", "سلائیڈ شو موڈ",
      "نئی منظور شدہ تصاویر کو آمد کی ترتیب سے دکھائیں۔", "منظور شدہ تصاویر خودکار طور پر بدلتے رہیں۔", "ایڈمن کی منتخب کردہ ایک تصویر اسکرین پر رکھیں۔",
      "اسکرین پر کم از کم وقت", "ہر نئی تصویر کم از کم اتنی دیر نظر آتی ہے۔", "سیکنڈ",
      "تصویر بدلنے کا وقفہ", "منتخب کریں کہ بے ترتیب تصویر کتنی بار بدلے۔", "تصویر منتخب کریں",
      "کوئی تصویر منتخب نہیں", "محفوظ کریں اور لاگو کریں", "شو شروع کریں", "پھر F11 دبائیں",
      "کنٹرولز دکھائیں یا چھپائیں", "براؤزر فل اسکرین", "کنٹرولز پر واپس جائیں", "فل اسکرین شروع کریں",
      "ایونٹ پر واپس جائیں", "کنٹرولز چھپائیں", "سلائیڈ شو کنٹرولز", "کنٹرولز کے لیے H · فل اسکرین کے لیے F11",
    ],
    fa: [
      "کنترل نمایش", "نحوه نمایش عکس‌های تأییدشده در صفحه رویداد را انتخاب کنید.", "حالت نمایش اسلاید",
      "عکس‌های تازه تأییدشده را به ترتیب ورود نمایش دهید.", "عکس‌های تأییدشده را به‌طور خودکار جابه‌جا کنید.", "یک عکس انتخاب‌شده توسط مدیر را روی صفحه نگه دارید.",
      "حداقل زمان روی صفحه", "هر عکس جدید دست‌کم به این مدت نمایش داده می‌شود.", "ثانیه",
      "فاصله تغییر عکس", "انتخاب کنید عکس تصادفی هر چند وقت تغییر کند.", "انتخاب عکس",
      "عکسی انتخاب نشده", "ذخیره و اعمال", "شروع نمایش", "سپس F11 را فشار دهید",
      "نمایش یا پنهان کردن کنترل‌ها", "تمام‌صفحه مرورگر", "بازگشت به کنترل‌ها", "شروع تمام‌صفحه",
      "بازگشت به رویداد", "پنهان کردن کنترل‌ها", "کنترل‌های نمایش اسلاید", "H برای کنترل‌ها · F11 برای تمام‌صفحه مرورگر",
    ],
    ja: [
      "表示コントロール", "承認済み写真をイベント画面に表示する方法を選択します。", "スライドショーモード",
      "新しく承認された写真を到着順に表示します。", "承認済み写真を自動的に切り替えます。", "管理者が選択した1枚の写真を画面に表示し続けます。",
      "画面に表示する最短時間", "新しい写真は少なくともこの時間表示されます。", "秒",
      "写真の切り替え間隔", "ランダム写真を切り替える頻度を選択します。", "写真を選択",
      "写真が選択されていません", "保存して適用", "ショーを開始", "次にF11を押してください",
      "コントロールの表示・非表示", "ブラウザーの全画面表示", "コントロールに戻る", "全画面表示を開始",
      "イベントに戻る", "コントロールを非表示", "スライドショーのコントロール", "Hでコントロール表示 · F11で全画面表示",
    ],
    zh: [
      "显示控制", "选择已批准照片在活动屏幕上的显示方式。", "幻灯片模式",
      "按到达顺序显示新批准的照片。", "自动轮播已批准的照片。", "在屏幕上保留一张管理员选择的照片。",
      "最短显示时间", "每张新照片至少显示这么长时间。", "秒",
      "照片切换间隔", "选择随机照片的切换频率。", "选择照片",
      "未选择照片", "保存并应用", "开始播放", "然后按 F11",
      "显示或隐藏控件", "浏览器全屏", "返回控件", "开始全屏",
      "返回活动", "隐藏控件", "幻灯片控件", "按 H 显示控件 · 按 F11 浏览器全屏",
    ],
    ko: [
      "화면 제어", "승인된 사진이 이벤트 화면에 표시되는 방식을 선택하세요.", "슬라이드쇼 모드",
      "새로 승인된 사진을 도착 순서대로 표시합니다.", "승인된 사진을 자동으로 전환합니다.", "관리자가 선택한 사진 한 장을 화면에 유지합니다.",
      "최소 화면 표시 시간", "새 사진은 최소한 이 시간 동안 표시됩니다.", "초",
      "사진 전환 간격", "무작위 사진이 바뀌는 빈도를 선택하세요.", "사진 선택",
      "선택된 사진 없음", "저장 및 적용", "쇼 시작", "그런 다음 F11을 누르세요",
      "컨트롤 표시 또는 숨기기", "브라우저 전체 화면", "컨트롤로 돌아가기", "전체 화면 시작",
      "이벤트로 돌아가기", "컨트롤 숨기기", "슬라이드쇼 컨트롤", "H: 컨트롤 표시 · F11: 브라우저 전체 화면",
    ],
    pt: [
      "CONTROLO DO ECRÃ", "Escolha como as fotos aprovadas aparecem no ecrã do evento.", "Modo de apresentação",
      "Mostre as fotos recém-aprovadas pela ordem de chegada.", "Percorra automaticamente as fotos aprovadas.", "Mantenha no ecrã uma foto escolhida pelo administrador.",
      "Tempo mínimo no ecrã", "Cada nova foto permanece visível pelo menos durante este tempo.", "segundos",
      "Intervalo de mudança", "Escolha com que frequência muda uma foto aleatória.", "Escolher uma foto",
      "Nenhuma foto selecionada", "Guardar e aplicar", "Iniciar apresentação", "Depois prima F11",
      "Mostrar ou ocultar controlos", "Ecrã inteiro do navegador", "Voltar aos controlos", "Iniciar ecrã inteiro",
      "Voltar ao evento", "Ocultar controlos", "Controlos da apresentação", "H para controlos · F11 para ecrã inteiro",
    ],
    ru: [
      "УПРАВЛЕНИЕ ЭКРАНОМ", "Выберите, как одобренные фотографии будут появляться на экране мероприятия.", "Режим слайд-шоу",
      "Показывать новые одобренные фотографии в порядке поступления.", "Автоматически переключать одобренные фотографии.", "Оставить на экране одну фотографию, выбранную администратором.",
      "Минимальное время на экране", "Каждая новая фотография остаётся видимой не меньше этого времени.", "секунд",
      "Интервал смены фото", "Выберите, как часто будет меняться случайная фотография.", "Выбрать фотографию",
      "Фотография не выбрана", "Сохранить и применить", "Запустить показ", "Затем нажмите F11",
      "Показать или скрыть элементы управления", "Полный экран браузера", "Вернуться к управлению", "Перейти в полноэкранный режим",
      "Вернуться к мероприятию", "Скрыть элементы управления", "Управление слайд-шоу", "H — управление · F11 — полный экран",
    ],
    id: [
      "KONTROL TAMPILAN", "Pilih cara foto yang disetujui tampil di layar acara.", "Mode tayangan slide",
      "Tampilkan foto yang baru disetujui sesuai urutan kedatangan.", "Putar foto yang disetujui secara otomatis.", "Pertahankan satu foto pilihan admin di layar.",
      "Waktu minimum di layar", "Setiap foto baru tetap terlihat setidaknya selama ini.", "detik",
      "Interval pergantian foto", "Pilih seberapa sering foto acak berganti.", "Pilih foto",
      "Tidak ada foto yang dipilih", "Simpan dan terapkan", "Mulai tayangan", "Lalu tekan F11",
      "Tampilkan atau sembunyikan kontrol", "Layar penuh browser", "Kembali ke kontrol", "Mulai layar penuh",
      "Kembali ke acara", "Sembunyikan kontrol", "Kontrol tayangan slide", "H untuk kontrol · F11 untuk layar penuh",
    ],
    pl: [
      "STEROWANIE EKRANEM", "Wybierz, jak zatwierdzone zdjęcia mają pojawiać się na ekranie wydarzenia.", "Tryb pokazu slajdów",
      "Pokazuj nowo zatwierdzone zdjęcia w kolejności ich nadejścia.", "Automatycznie przechodź między zatwierdzonymi zdjęciami.", "Pozostaw na ekranie jedno zdjęcie wybrane przez administratora.",
      "Minimalny czas na ekranie", "Każde nowe zdjęcie pozostaje widoczne co najmniej przez ten czas.", "sekundy",
      "Interwał zmiany zdjęcia", "Wybierz, jak często ma się zmieniać losowe zdjęcie.", "Wybierz zdjęcie",
      "Nie wybrano zdjęcia", "Zapisz i zastosuj", "Rozpocznij pokaz", "Następnie naciśnij F11",
      "Pokaż lub ukryj elementy sterowania", "Pełny ekran przeglądarki", "Wróć do sterowania", "Uruchom pełny ekran",
      "Wróć do wydarzenia", "Ukryj elementy sterowania", "Sterowanie pokazem slajdów", "H — sterowanie · F11 — pełny ekran",
    ],
    vi: [
      "ĐIỀU KHIỂN HIỂN THỊ", "Chọn cách ảnh đã duyệt xuất hiện trên màn hình sự kiện.", "Chế độ trình chiếu",
      "Hiển thị ảnh mới được duyệt theo thứ tự xuất hiện.", "Tự động luân phiên các ảnh đã duyệt.", "Giữ một ảnh do quản trị viên chọn trên màn hình.",
      "Thời gian tối thiểu trên màn hình", "Mỗi ảnh mới hiển thị ít nhất trong khoảng thời gian này.", "giây",
      "Khoảng thời gian đổi ảnh", "Chọn tần suất thay đổi ảnh ngẫu nhiên.", "Chọn ảnh",
      "Chưa chọn ảnh", "Lưu và áp dụng", "Bắt đầu trình chiếu", "Sau đó nhấn F11",
      "Hiện hoặc ẩn điều khiển", "Toàn màn hình trình duyệt", "Quay lại điều khiển", "Bắt đầu toàn màn hình",
      "Quay lại sự kiện", "Ẩn điều khiển", "Điều khiển trình chiếu", "H để hiện điều khiển · F11 để toàn màn hình",
    ],
    uk: [
      "КЕРУВАННЯ ЕКРАНОМ", "Виберіть, як схвалені фотографії з’являтимуться на екрані події.", "Режим слайд-шоу",
      "Показувати нові схвалені фотографії в порядку надходження.", "Автоматично перемикати схвалені фотографії.", "Залишити на екрані одну фотографію, вибрану адміністратором.",
      "Мінімальний час на екрані", "Кожна нова фотографія залишається видимою щонайменше цей час.", "секунд",
      "Інтервал зміни фото", "Виберіть, як часто змінюватиметься випадкова фотографія.", "Вибрати фотографію",
      "Фотографію не вибрано", "Зберегти й застосувати", "Почати показ", "Потім натисніть F11",
      "Показати або приховати елементи керування", "Повний екран браузера", "Повернутися до керування", "Увімкнути повний екран",
      "Повернутися до події", "Приховати елементи керування", "Керування слайд-шоу", "H — керування · F11 — повний екран",
    ],
    th: [
      "การควบคุมการแสดงผล", "เลือกวิธีแสดงรูปภาพที่อนุมัติบนหน้าจอกิจกรรม", "โหมดสไลด์โชว์",
      "แสดงรูปภาพที่เพิ่งอนุมัติตามลำดับที่เข้ามา", "หมุนเวียนรูปภาพที่อนุมัติโดยอัตโนมัติ", "คงรูปภาพหนึ่งรูปที่ผู้ดูแลเลือกไว้บนหน้าจอ",
      "เวลาขั้นต่ำบนหน้าจอ", "รูปภาพใหม่แต่ละรูปจะแสดงอย่างน้อยตามเวลานี้", "วินาที",
      "ช่วงเวลาเปลี่ยนรูป", "เลือกความถี่ในการเปลี่ยนรูปแบบสุ่ม", "เลือกรูปภาพ",
      "ยังไม่ได้เลือกรูปภาพ", "บันทึกและใช้", "เริ่มการแสดง", "จากนั้นกด F11",
      "แสดงหรือซ่อนตัวควบคุม", "เต็มหน้าจอเบราว์เซอร์", "กลับไปยังตัวควบคุม", "เริ่มเต็มหน้าจอ",
      "กลับไปยังกิจกรรม", "ซ่อนตัวควบคุม", "ตัวควบคุมสไลด์โชว์", "H สำหรับตัวควบคุม · F11 สำหรับเต็มหน้าจอ",
    ],
    cs: [
      "OVLÁDÁNÍ ZOBRAZENÍ", "Zvolte, jak se schválené fotografie zobrazí na obrazovce události.", "Režim prezentace",
      "Zobrazujte nově schválené fotografie v pořadí příchodu.", "Automaticky procházejte schválené fotografie.", "Ponechte na obrazovce jednu fotografii vybranou správcem.",
      "Minimální čas na obrazovce", "Každá nová fotografie zůstane viditelná alespoň po tuto dobu.", "sekund",
      "Interval změny fotografie", "Zvolte, jak často se má náhodná fotografie změnit.", "Vybrat fotografii",
      "Není vybrána žádná fotografie", "Uložit a použít", "Spustit prezentaci", "Poté stiskněte F11",
      "Zobrazit nebo skrýt ovládání", "Celá obrazovka prohlížeče", "Zpět k ovládání", "Spustit celou obrazovku",
      "Zpět k události", "Skrýt ovládání", "Ovládání prezentace", "H pro ovládání · F11 pro celou obrazovku",
    ],
    he: [
      "בקרת תצוגה", "בחרו כיצד התמונות המאושרות יופיעו במסך האירוע.", "מצב מצגת",
      "הציגו תמונות שאושרו לאחרונה לפי סדר הגעתן.", "עברו אוטומטית בין התמונות המאושרות.", "השאירו על המסך תמונה אחת שנבחרה בידי מנהל.",
      "זמן מינימלי על המסך", "כל תמונה חדשה נשארת גלויה לפחות למשך זמן זה.", "שניות",
      "מרווח החלפת תמונה", "בחרו באיזו תדירות תתחלף תמונה אקראית.", "בחרו תמונה",
      "לא נבחרה תמונה", "שמירה והחלה", "התחלת המצגת", "לאחר מכן לחצו F11",
      "הצגה או הסתרה של הפקדים", "מסך מלא בדפדפן", "חזרה לפקדים", "התחלת מסך מלא",
      "חזרה לאירוע", "הסתרת הפקדים", "פקדי מצגת", "H לפקדים · F11 למסך מלא",
    ],
    hu: [
      "KIJELZŐVEZÉRLÉS", "Válaszd ki, hogyan jelenjenek meg a jóváhagyott fényképek az esemény képernyőjén.", "Diavetítés módja",
      "Az újonnan jóváhagyott fényképek megjelenítése érkezési sorrendben.", "A jóváhagyott fényképek automatikus váltása.", "Egy admin által kiválasztott fénykép megtartása a képernyőn.",
      "Minimális képernyőidő", "Minden új fénykép legalább ennyi ideig látható.", "másodperc",
      "Fényképváltás időköze", "Válaszd ki, milyen gyakran változzon a véletlenszerű fénykép.", "Fénykép kiválasztása",
      "Nincs kiválasztott fénykép", "Mentés és alkalmazás", "Vetítés indítása", "Ezután nyomd meg az F11-et",
      "Vezérlők megjelenítése vagy elrejtése", "Böngésző teljes képernyő", "Vissza a vezérlőkhöz", "Teljes képernyő indítása",
      "Vissza az eseményhez", "Vezérlők elrejtése", "Diavetítés vezérlői", "H a vezérlőkhöz · F11 a teljes képernyőhöz",
    ],
    sv: [
      "VISNINGSKONTROLL", "Välj hur godkända foton visas på evenemangsskärmen.", "Bildspelsläge",
      "Visa nyligen godkända foton i ankomstordning.", "Växla automatiskt mellan godkända foton.", "Behåll ett foto som administratören valt på skärmen.",
      "Minsta tid på skärmen", "Varje nytt foto visas minst så här länge.", "sekunder",
      "Intervall för fotobyte", "Välj hur ofta ett slumpmässigt foto byts.", "Välj ett foto",
      "Inget foto valt", "Spara och använd", "Starta bildspelet", "Tryck sedan på F11",
      "Visa eller dölj kontroller", "Webbläsarens helskärm", "Tillbaka till kontroller", "Starta helskärm",
      "Tillbaka till evenemanget", "Dölj kontroller", "Bildspelskontroller", "H för kontroller · F11 för helskärm",
    ],
    bn: [
      "ডিসপ্লে নিয়ন্ত্রণ", "অনুমোদিত ছবিগুলো ইভেন্ট স্ক্রিনে কীভাবে দেখাবে তা বেছে নিন।", "স্লাইডশো মোড",
      "নতুন অনুমোদিত ছবিগুলো আসার ক্রমে দেখান।", "অনুমোদিত ছবিগুলো স্বয়ংক্রিয়ভাবে ঘুরিয়ে দেখান।", "অ্যাডমিনের বেছে নেওয়া একটি ছবি স্ক্রিনে রাখুন।",
      "স্ক্রিনে ন্যূনতম সময়", "প্রতিটি নতুন ছবি অন্তত এই সময় পর্যন্ত দৃশ্যমান থাকে।", "সেকেন্ড",
      "ছবি বদলের বিরতি", "এলোমেলো ছবি কত ঘন ঘন বদলাবে তা বেছে নিন।", "ছবি বেছে নিন",
      "কোনো ছবি বেছে নেওয়া হয়নি", "সংরক্ষণ ও প্রয়োগ", "শো শুরু করুন", "তারপর F11 চাপুন",
      "নিয়ন্ত্রণ দেখান বা লুকান", "ব্রাউজার পূর্ণ পর্দা", "নিয়ন্ত্রণে ফিরুন", "পূর্ণ পর্দা শুরু করুন",
      "ইভেন্টে ফিরুন", "নিয়ন্ত্রণ লুকান", "স্লাইডশো নিয়ন্ত্রণ", "নিয়ন্ত্রণের জন্য H · পূর্ণ পর্দার জন্য F11",
    ],
    ms: [
      "KAWALAN PAPARAN", "Pilih cara foto yang diluluskan dipaparkan pada skrin acara.", "Mod tayangan slaid",
      "Paparkan foto yang baru diluluskan mengikut turutan ketibaan.", "Putar foto yang diluluskan secara automatik.", "Kekalkan satu foto pilihan pentadbir pada skrin.",
      "Masa minimum pada skrin", "Setiap foto baharu kekal kelihatan sekurang-kurangnya selama ini.", "saat",
      "Selang pertukaran foto", "Pilih kekerapan foto rawak bertukar.", "Pilih foto",
      "Tiada foto dipilih", "Simpan dan gunakan", "Mulakan tayangan", "Kemudian tekan F11",
      "Tunjukkan atau sembunyikan kawalan", "Skrin penuh pelayar", "Kembali ke kawalan", "Mulakan skrin penuh",
      "Kembali ke acara", "Sembunyikan kawalan", "Kawalan tayangan slaid", "H untuk kawalan · F11 untuk skrin penuh",
    ],
    fil: [
      "KONTROL SA DISPLAY", "Piliin kung paano lalabas ang mga aprubadong larawan sa screen ng event.", "Mode ng slideshow",
      "Ipakita ang mga bagong aprubadong larawan ayon sa pagkakasunod ng dating.", "Awtomatikong paikutin ang mga aprubadong larawan.", "Panatilihin sa screen ang isang larawang pinili ng admin.",
      "Pinakamaikling oras sa screen", "Mananatiling nakikita ang bawat bagong larawan nang hindi bababa sa ganitong katagal.", "segundo",
      "Agwat ng pagpapalit ng larawan", "Piliin kung gaano kadalas magpapalit ang random na larawan.", "Pumili ng larawan",
      "Walang napiling larawan", "I-save at ilapat", "Simulan ang show", "Pagkatapos ay pindutin ang F11",
      "Ipakita o itago ang mga kontrol", "Buong screen ng browser", "Bumalik sa mga kontrol", "Simulan ang buong screen",
      "Bumalik sa event", "Itago ang mga kontrol", "Mga kontrol ng slideshow", "H para sa mga kontrol · F11 para sa buong screen",
    ],
    "zh-tw": [
      "顯示控制", "選擇已核准照片在活動螢幕上的顯示方式。", "投影片播放模式",
      "依抵達順序顯示新核准的照片。", "自動輪播已核准的照片。", "在螢幕上保留一張管理員選取的照片。",
      "最短顯示時間", "每張新照片至少顯示這段時間。", "秒",
      "照片切換間隔", "選擇隨機照片的切換頻率。", "選擇照片",
      "尚未選擇照片", "儲存並套用", "開始播放", "然後按 F11",
      "顯示或隱藏控制項", "瀏覽器全螢幕", "返回控制項", "開始全螢幕",
      "返回活動", "隱藏控制項", "投影片播放控制項", "按 H 顯示控制項 · 按 F11 瀏覽器全螢幕",
    ],
    "pt-pt": [
      "CONTROLO DO ECRÃ", "Escolha como as fotografias aprovadas aparecem no ecrã do evento.", "Modo de apresentação",
      "Mostre as fotografias recém-aprovadas pela ordem de chegada.", "Percorra automaticamente as fotografias aprovadas.", "Mantenha no ecrã uma fotografia escolhida pelo administrador.",
      "Tempo mínimo no ecrã", "Cada nova fotografia permanece visível pelo menos durante este tempo.", "segundos",
      "Intervalo de mudança", "Escolha com que frequência muda uma fotografia aleatória.", "Escolher uma fotografia",
      "Nenhuma fotografia selecionada", "Guardar e aplicar", "Iniciar apresentação", "Depois prima F11",
      "Mostrar ou ocultar controlos", "Ecrã inteiro do navegador", "Voltar aos controlos", "Iniciar ecrã inteiro",
      "Voltar ao evento", "Ocultar controlos", "Controlos da apresentação", "H para controlos · F11 para ecrã inteiro",
    ],
    da: [
      "VISNINGSSTYRING", "Vælg, hvordan godkendte billeder vises på begivenhedsskærmen.", "Diasshowtilstand",
      "Vis nyligt godkendte billeder i ankomstrækkefølge.", "Skift automatisk mellem godkendte billeder.", "Behold ét billede valgt af administratoren på skærmen.",
      "Mindste tid på skærmen", "Hvert nyt billede vises mindst så længe.", "sekunder",
      "Interval for billedskift", "Vælg, hvor ofte et tilfældigt billede skifter.", "Vælg et billede",
      "Intet billede valgt", "Gem og anvend", "Start visning", "Tryk derefter på F11",
      "Vis eller skjul kontroller", "Browser i fuld skærm", "Tilbage til kontroller", "Start fuld skærm",
      "Tilbage til begivenheden", "Skjul kontroller", "Diasshowkontroller", "H for kontroller · F11 for fuld skærm",
    ],
    fi: [
      "NÄYTÖN HALLINTA", "Valitse, miten hyväksytyt kuvat näkyvät tapahtuman näytöllä.", "Diaesitystila",
      "Näytä uudet hyväksytyt kuvat saapumisjärjestyksessä.", "Vaihda hyväksyttyjä kuvia automaattisesti.", "Pidä yksi ylläpitäjän valitsema kuva näytöllä.",
      "Vähimmäisaika näytöllä", "Jokainen uusi kuva näkyy vähintään näin kauan.", "sekuntia",
      "Kuvan vaihtoväli", "Valitse, kuinka usein satunnainen kuva vaihtuu.", "Valitse kuva",
      "Kuvaa ei ole valittu", "Tallenna ja ota käyttöön", "Aloita esitys", "Paina sitten F11",
      "Näytä tai piilota säätimet", "Selaimen koko näyttö", "Palaa säätimiin", "Käynnistä koko näyttö",
      "Palaa tapahtumaan", "Piilota säätimet", "Diaesityksen säätimet", "H säätimille · F11 koko näytölle",
    ],
    nb: [
      "VISNINGSKONTROLL", "Velg hvordan godkjente bilder vises på arrangementsskjermen.", "Lysbildefremvisningsmodus",
      "Vis nylig godkjente bilder i ankomstrekkefølge.", "Bytt automatisk mellom godkjente bilder.", "Behold ett bilde valgt av administratoren på skjermen.",
      "Minste tid på skjermen", "Hvert nytt bilde vises minst så lenge.", "sekunder",
      "Intervall for bildebytte", "Velg hvor ofte et tilfeldig bilde byttes.", "Velg et bilde",
      "Ingen bilder valgt", "Lagre og bruk", "Start fremvisning", "Trykk deretter F11",
      "Vis eller skjul kontroller", "Fullskjerm i nettleser", "Tilbake til kontroller", "Start fullskjerm",
      "Tilbake til arrangementet", "Skjul kontroller", "Kontroller for lysbildefremvisning", "H for kontroller · F11 for fullskjerm",
    ],
    sk: [
      "OVLÁDANIE ZOBRAZENIA", "Vyberte, ako sa schválené fotografie zobrazia na obrazovke udalosti.", "Režim prezentácie",
      "Zobrazujte novo schválené fotografie v poradí príchodu.", "Automaticky prechádzajte schválené fotografie.", "Ponechajte na obrazovke jednu fotografiu vybranú správcom.",
      "Minimálny čas na obrazovke", "Každá nová fotografia zostane viditeľná aspoň tento čas.", "sekúnd",
      "Interval zmeny fotografie", "Vyberte, ako často sa má náhodná fotografia zmeniť.", "Vybrať fotografiu",
      "Nie je vybraná žiadna fotografia", "Uložiť a použiť", "Spustiť prezentáciu", "Potom stlačte F11",
      "Zobraziť alebo skryť ovládanie", "Celá obrazovka prehliadača", "Späť na ovládanie", "Spustiť celú obrazovku",
      "Späť na udalosť", "Skryť ovládanie", "Ovládanie prezentácie", "H pre ovládanie · F11 pre celú obrazovku",
    ],
    lt: [
      "EKRANO VALDYMAS", "Pasirinkite, kaip patvirtintos nuotraukos bus rodomos renginio ekrane.", "Skaidrių demonstravimo režimas",
      "Rodykite naujai patvirtintas nuotraukas jų gavimo tvarka.", "Automatiškai keiskite patvirtintas nuotraukas.", "Ekrane palikite vieną administratoriaus pasirinktą nuotrauką.",
      "Mažiausias laikas ekrane", "Kiekviena nauja nuotrauka rodoma bent tiek laiko.", "sekundės",
      "Nuotraukų keitimo intervalas", "Pasirinkite, kaip dažnai keisis atsitiktinė nuotrauka.", "Pasirinkti nuotrauką",
      "Nuotrauka nepasirinkta", "Išsaugoti ir taikyti", "Pradėti demonstravimą", "Tada paspauskite F11",
      "Rodyti arba slėpti valdiklius", "Naršyklės visas ekranas", "Grįžti prie valdiklių", "Įjungti visą ekraną",
      "Grįžti į renginį", "Slėpti valdiklius", "Skaidrių demonstravimo valdikliai", "H – valdikliai · F11 – visas ekranas",
    ],
    lv: [
      "EKRĀNA VADĪBA", "Izvēlieties, kā apstiprinātie fotoattēli tiks rādīti pasākuma ekrānā.", "Slaidrādes režīms",
      "Rādiet tikko apstiprinātos fotoattēlus saņemšanas secībā.", "Automātiski mainiet apstiprinātos fotoattēlus.", "Ekrānā paturiet vienu administratora izvēlētu fotoattēlu.",
      "Minimālais laiks ekrānā", "Katrs jauns fotoattēls ir redzams vismaz tik ilgi.", "sekundes",
      "Fotoattēlu maiņas intervāls", "Izvēlieties, cik bieži mainās nejaušs fotoattēls.", "Izvēlēties fotoattēlu",
      "Fotoattēls nav izvēlēts", "Saglabāt un lietot", "Sākt demonstrēšanu", "Pēc tam nospiediet F11",
      "Rādīt vai slēpt vadīklas", "Pārlūka pilnekrāns", "Atgriezties pie vadīklām", "Ieslēgt pilnekrānu",
      "Atgriezties pasākumā", "Slēpt vadīklas", "Slaidrādes vadīklas", "H – vadīklas · F11 – pilnekrāns",
    ],
    et: [
      "EKRAANI JUHTIMINE", "Valige, kuidas kinnitatud fotod sündmuse ekraanil kuvatakse.", "Slaidiseansi režiim",
      "Kuva uued kinnitatud fotod saabumise järjekorras.", "Vaheta kinnitatud fotosid automaatselt.", "Hoia ekraanil üht administraatori valitud fotot.",
      "Vähim aeg ekraanil", "Iga uus foto jääb nähtavaks vähemalt nii kauaks.", "sekundit",
      "Foto vahetamise intervall", "Valige, kui tihti juhuslik foto vahetub.", "Vali foto",
      "Fotot pole valitud", "Salvesta ja rakenda", "Käivita seanss", "Seejärel vajutage F11",
      "Näita või peida juhtnupud", "Brauseri täisekraan", "Tagasi juhtnuppude juurde", "Käivita täisekraan",
      "Tagasi sündmusele", "Peida juhtnupud", "Slaidiseansi juhtnupud", "H juhtnuppude jaoks · F11 täisekraani jaoks",
    ],
    sl: [
      "UPRAVLJANJE PRIKAZA", "Izberite, kako se odobrene fotografije prikažejo na zaslonu dogodka.", "Način diaprojekcije",
      "Prikažite novo odobrene fotografije po vrstnem redu prihoda.", "Samodejno izmenjujte odobrene fotografije.", "Na zaslonu ohranite eno fotografijo, ki jo je izbral skrbnik.",
      "Najkrajši čas na zaslonu", "Vsaka nova fotografija ostane vidna vsaj toliko časa.", "sekund",
      "Interval menjave fotografije", "Izberite, kako pogosto se zamenja naključna fotografija.", "Izberite fotografijo",
      "Fotografija ni izbrana", "Shrani in uporabi", "Začni prikaz", "Nato pritisnite F11",
      "Prikaži ali skrij kontrolnike", "Celozaslonski način brskalnika", "Nazaj na kontrolnike", "Začni celozaslonski način",
      "Nazaj na dogodek", "Skrij kontrolnike", "Kontrolniki diaprojekcije", "H za kontrolnike · F11 za celozaslonski način",
    ],
    ta: [
      "காட்சிக் கட்டுப்பாடு", "அங்கீகரிக்கப்பட்ட படங்கள் நிகழ்வு திரையில் எவ்வாறு தோன்ற வேண்டும் என்பதைத் தேர்ந்தெடுக்கவும்.", "ஸ்லைடுஷோ பயன்முறை",
      "புதிதாக அங்கீகரிக்கப்பட்ட படங்களை வந்த வரிசையில் காட்டவும்.", "அங்கீகரிக்கப்பட்ட படங்களைத் தானாக சுழற்றவும்.", "நிர்வாகி தேர்ந்தெடுத்த ஒரு படத்தைத் திரையில் வைத்திருக்கவும்.",
      "திரையில் குறைந்தபட்ச நேரம்", "ஒவ்வொரு புதிய படமும் குறைந்தது இந்த நேரம் வரை தெரியும்.", "வினாடிகள்",
      "படம் மாறும் இடைவெளி", "சீரற்ற படம் எவ்வளவு அடிக்கடி மாற வேண்டும் என்பதைத் தேர்ந்தெடுக்கவும்.", "ஒரு படத்தைத் தேர்ந்தெடுக்கவும்",
      "படம் தேர்ந்தெடுக்கப்படவில்லை", "சேமித்து பயன்படுத்தவும்", "காட்சியைத் தொடங்கவும்", "பின்னர் F11 ஐ அழுத்தவும்",
      "கட்டுப்பாடுகளைக் காட்டவும் அல்லது மறைக்கவும்", "உலாவி முழுத்திரை", "கட்டுப்பாடுகளுக்குத் திரும்பவும்", "முழுத்திரையைத் தொடங்கவும்",
      "நிகழ்வுக்குத் திரும்பவும்", "கட்டுப்பாடுகளை மறைக்கவும்", "ஸ்லைடுஷோ கட்டுப்பாடுகள்", "கட்டுப்பாடுகளுக்கு H · முழுத்திரைக்கு F11",
    ],
    te: [
      "ప్రదర్శన నియంత్రణ", "ఆమోదించిన ఫోటోలు ఈవెంట్ స్క్రీన్‌పై ఎలా కనిపించాలో ఎంచుకోండి.", "స్లైడ్‌షో మోడ్",
      "కొత్తగా ఆమోదించిన ఫోటోలను వచ్చిన క్రమంలో చూపించండి.", "ఆమోదించిన ఫోటోలను స్వయంచాలకంగా మార్చండి.", "అడ్మిన్ ఎంచుకున్న ఒక ఫోటోను స్క్రీన్‌పై ఉంచండి.",
      "స్క్రీన్‌పై కనీస సమయం", "ప్రతి కొత్త ఫోటో కనీసం ఇంతసేపు కనిపిస్తుంది.", "సెకన్లు",
      "ఫోటో మార్పు విరామం", "యాదృచ్ఛిక ఫోటో ఎంత తరచుగా మారాలో ఎంచుకోండి.", "ఫోటోను ఎంచుకోండి",
      "ఫోటో ఎంచుకోలేదు", "సేవ్ చేసి వర్తింపజేయండి", "ప్రదర్శనను ప్రారంభించండి", "తర్వాత F11 నొక్కండి",
      "నియంత్రణలను చూపండి లేదా దాచండి", "బ్రౌజర్ పూర్తి స్క్రీన్", "నియంత్రణలకు తిరిగి వెళ్ళండి", "పూర్తి స్క్రీన్ ప్రారంభించండి",
      "ఈవెంట్‌కు తిరిగి వెళ్ళండి", "నియంత్రణలను దాచండి", "స్లైడ్‌షో నియంత్రణలు", "నియంత్రణలకు H · పూర్తి స్క్రీన్‌కు F11",
    ],
    mr: [
      "प्रदर्शन नियंत्रण", "मंजूर फोटो इव्हेंट स्क्रीनवर कसे दिसतील ते निवडा.", "स्लाइडशो मोड",
      "नव्याने मंजूर फोटो आलेल्या क्रमाने दाखवा.", "मंजूर फोटो आपोआप बदलत राहा.", "अॅडमिनने निवडलेला एक फोटो स्क्रीनवर ठेवा.",
      "स्क्रीनवरील किमान वेळ", "प्रत्येक नवीन फोटो किमान इतका वेळ दिसतो.", "सेकंद",
      "फोटो बदलण्याचे अंतर", "यादृच्छिक फोटो किती वेळाने बदलावा ते निवडा.", "फोटो निवडा",
      "कोणताही फोटो निवडलेला नाही", "जतन करा आणि लागू करा", "शो सुरू करा", "नंतर F11 दाबा",
      "नियंत्रणे दाखवा किंवा लपवा", "ब्राउझर पूर्ण स्क्रीन", "नियंत्रणांकडे परत जा", "पूर्ण स्क्रीन सुरू करा",
      "इव्हेंटकडे परत जा", "नियंत्रणे लपवा", "स्लाइडशो नियंत्रणे", "नियंत्रणांसाठी H · पूर्ण स्क्रीनसाठी F11",
    ],
    sw: [
      "UDHIBITI WA ONYESHO", "Chagua jinsi picha zilizoidhinishwa zinavyoonekana kwenye skrini ya tukio.", "Hali ya onyesho la slaidi",
      "Onyesha picha mpya zilizoidhinishwa kwa mpangilio wa kuwasili.", "Zungusha picha zilizoidhinishwa kiotomatiki.", "Weka picha moja iliyochaguliwa na msimamizi kwenye skrini.",
      "Muda wa chini kwenye skrini", "Kila picha mpya hubaki kuonekana angalau kwa muda huu.", "sekunde",
      "Kipindi cha kubadilisha picha", "Chagua mara ngapi picha ya nasibu inabadilika.", "Chagua picha",
      "Hakuna picha iliyochaguliwa", "Hifadhi na tumia", "Anza onyesho", "Kisha bonyeza F11",
      "Onyesha au ficha vidhibiti", "Skrini nzima ya kivinjari", "Rudi kwenye vidhibiti", "Anza skrini nzima",
      "Rudi kwenye tukio", "Ficha vidhibiti", "Vidhibiti vya onyesho la slaidi", "H kwa vidhibiti · F11 kwa skrini nzima",
    ],
  };

  Object.entries(panelTranslations).forEach(([language, translations]) => {
    if (translations.length !== panelKeys.length) {
      console.warn(
        `Slideshow panel translations for ${language} are incomplete (${translations.length}/${panelKeys.length}).`,
      );
      return;
    }

    panelKeys.forEach((key, index) => {
      mergePhrase(key, { [language]: translations[index] });
    });
  });

  mergePhrase("Photo selected", selectedTranslations);

  mergePhrase("{count} approved photos", {
    tr: "{count} onaylı fotoğraf", ar: "{count} صورة معتمدة", de: "{count} freigegebene Fotos",
    fr: "{count} photos approuvées", es: "{count} fotos aprobadas", it: "{count} foto approvate",
    nl: "{count} goedgekeurde foto's", bg: "{count} одобрени снимки", ro: "{count} fotografii aprobate",
    el: "{count} εγκεκριμένες φωτογραφίες", sr: "{count} odobrenih fotografija", hr: "{count} odobrenih fotografija",
    bs: "{count} odobrenih fotografija", sq: "{count} fotografi të miratuara", mk: "{count} одобрени фотографии",
    hi: "{count} स्वीकृत फ़ोटो", ur: "{count} منظور شدہ تصاویر", fa: "{count} عکس تأییدشده",
    ja: "承認済み写真 {count} 枚", zh: "{count} 张已批准照片", ko: "승인된 사진 {count}장",
    pt: "{count} fotos aprovadas", ru: "{count} одобренных фотографий", id: "{count} foto disetujui",
    pl: "{count} zatwierdzonych zdjęć", vi: "{count} ảnh đã duyệt", uk: "{count} схвалених фотографій",
    th: "รูปภาพที่อนุมัติ {count} รูป", cs: "{count} schválených fotografií", he: "{count} תמונות מאושרות",
    hu: "{count} jóváhagyott fénykép", sv: "{count} godkända foton", bn: "{count}টি অনুমোদিত ছবি",
    ms: "{count} foto diluluskan", fil: "{count} aprubadong larawan", "zh-tw": "{count} 張已核准照片",
    "pt-pt": "{count} fotografias aprovadas", da: "{count} godkendte billeder", fi: "{count} hyväksyttyä kuvaa",
    nb: "{count} godkjente bilder", sk: "{count} schválených fotografií", lt: "{count} patvirtintos nuotraukos",
    lv: "{count} apstiprināti fotoattēli", et: "{count} kinnitatud fotot", sl: "{count} odobrenih fotografij",
    ta: "{count} அங்கீகரிக்கப்பட்ட படங்கள்", te: "{count} ఆమోదించిన ఫోటోలు", mr: "{count} मंजूर फोटो",
    sw: "picha {count} zilizoidhinishwa",
  });

  const arabicRuntimeTranslations = {
    "Approved photos are loading.": "جارٍ تحميل الصور المعتمدة.",
    "Connecting...": "جارٍ الاتصال...",
    "Waiting for approved photos": "في انتظار الصور المعتمدة",
    "New approved photos will appear here automatically.":
      "ستظهر الصور الجديدة المعتمدة هنا تلقائيًا.",
    "Approved photos will appear here when they are ready.":
      "ستظهر الصور المعتمدة هنا عندما تصبح جاهزة.",
    "EVENT CODE": "رمز الفعالية",
    "Updated now": "تم التحديث الآن",
    "Connection lost": "انقطع الاتصال",
    "Selected photo is unavailable": "الصورة المحددة غير متاحة",
    "Open the controls and choose an approved photo.":
      "افتح عناصر التحكم واختر صورة معتمدة.",
    "Choose an approved photo before saving.":
      "اختر صورة معتمدة قبل الحفظ.",
    "Select approved photo {number}": "اختر الصورة المعتمدة رقم {number}",
    "Photo uploaded by {name}": "صورة رفعها {name}",
    "Press F11 to enter browser full screen.":
      "اضغط F11 للانتقال إلى ملء شاشة المتصفح.",
    "Event ID was not found": "لم يتم العثور على معرّف الفعالية",
    "Return to Event Detail and open the live slideshow again.":
      "عُد إلى تفاصيل الفعالية وافتح عرض الشرائح المباشر مرة أخرى.",
    "Live slideshow could not be loaded": "تعذر تحميل عرض الشرائح المباشر",
    "Live slideshow could not be loaded.": "تعذر تحميل عرض الشرائح المباشر.",
    "This photo could not be displayed.": "تعذر عرض هذه الصورة.",
    "Your session has expired. Please log in again.":
      "انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.",
  };

  Object.entries(arabicRuntimeTranslations).forEach(([key, value]) => {
    mergePhrase(key, { ar: value });
  });

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
