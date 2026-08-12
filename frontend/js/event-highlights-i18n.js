(() => {
  "use strict";

  const packs = {
    tr: {
      "Event Highlights": "Etkinlik Öne Çıkanları",
      "Event Highlights — SnapUp Events":
        "Etkinlik Öne Çıkanları — SnapUp Events",
      "Most liked photo, top uploader and event summary":
        "En çok beğenilen fotoğraf, en çok yükleyen kişi ve etkinlik özeti",
      "Highlights are ready to share": "Öne çıkanlar paylaşılmaya hazır",
      "Private preview until the event ends":
        "Etkinlik bitene kadar özel önizleme",
      Back: "Geri",
      "Share Highlights": "Öne Çıkanları Paylaş",
      "Preparing Event Highlights...": "Etkinlik öne çıkanları hazırlanıyor...",
      "Collecting the best moments from this event.":
        "Bu etkinliğin en güzel anları bir araya getiriliyor.",
      "Highlights could not be loaded": "Öne çıkanlar yüklenemedi",
      "Please check the link and try again.":
        "Lütfen bağlantıyı kontrol edip tekrar deneyin.",
      "Back to Home": "Ana Sayfaya Dön",
      "PRIVATE PREVIEW": "ÖZEL ÖNİZLEME",
      SHAREABLE: "PAYLAŞILABİLİR",
      "Private owner preview": "Etkinlik sahibine özel önizleme",
      "End the event to make this page shareable with guests.":
        "Bu sayfayı misafirlerle paylaşmak için etkinliği bitirin.",
      "By the numbers": "Rakamlarla",
      "Event Summary": "Etkinlik Özeti",
      Participants: "Katılımcılar",
      Photos: "Fotoğraflar",
      Videos: "Videolar",
      Comments: "Yorumlar",
      "Event winners": "Etkinliğin öne çıkanları",
      "Guest favorite": "Misafirlerin favorisi",
      "Most Liked Photo": "En Çok Beğenilen Fotoğraf",
      "Most liked event photo": "En çok beğenilen etkinlik fotoğrafı",
      "No liked photo yet": "Henüz beğenilen fotoğraf yok",
      "The winner will appear after guests like an approved photo.":
        "Misafirler onaylanmış bir fotoğrafı beğendiğinde kazanan burada görünecek.",
      "Shared by": "Paylaşan",
      "Memory maker": "Anı yaratıcısı",
      "Top Photo Uploader": "En Çok Fotoğraf Yükleyen",
      "Most active photographer": "En aktif fotoğrafçı",
      "No uploader yet": "Henüz yükleyen yok",
      "Approved photo uploads will be counted here.":
        "Onaylanan fotoğraf yüklemeleri burada sayılacak.",
      "Photos uploaded": "Yüklenen fotoğraf",
      "Every guest. Every moment. One shared album.":
        "Her misafir. Her an. Tek bir ortak albüm.",
      "Share after event ends": "Etkinlik bitince paylaş",
      "See the highlights from this event.":
        "Bu etkinliğin öne çıkan anlarını görüntüleyin.",
      "Highlights link copied.": "Öne çıkanlar bağlantısı kopyalandı.",
      "Highlights link could not be copied.":
        "Öne çıkanlar bağlantısı kopyalanamadı.",
      "{name} shared the most approved photos from this event.":
        "{name}, bu etkinlikte en çok onaylanmış fotoğrafı paylaştı.",
      "Date not specified": "Tarih belirtilmedi",
      "A valid Highlights link is required.":
        "Geçerli bir Öne Çıkanlar bağlantısı gereklidir.",
      "Event Highlights could not be loaded.":
        "Etkinlik öne çıkanları yüklenemedi.",
      "Event Highlights becomes shareable after the event is ended.":
        "Etkinlik öne çıkanları, etkinlik bitirildikten sonra paylaşılabilir.",
      "Event not found or you do not have permission.":
        "Etkinlik bulunamadı veya erişim izniniz yok.",
      "Event not found.": "Etkinlik bulunamadı.",
      "Event participants could not be loaded.":
        "Etkinlik katılımcıları yüklenemedi.",
      "Approved event content could not be loaded.":
        "Onaylanmış etkinlik içerikleri yüklenemedi.",
      "Photo likes could not be loaded.": "Fotoğraf beğenileri yüklenemedi.",
    },
    ar: {
      "Event Highlights": "أبرز الأحداث",
      "Event Highlights — SnapUp Events": "أبرز الأحداث - أحداث SnapUp",
      "Most liked photo, top uploader and event summary":
        "الصورة الأكثر إعجابًا، والتحميل الأفضل، وملخص الحدث",
      "Highlights are ready to share": "النقاط البارزة جاهزة للمشاركة",
      "Private preview until the event ends": "معاينة خاصة حتى انتهاء الحدث",
      Back: "العودة",
      "Share Highlights": "مشاركة أبرز الأحداث",
      "Preparing Event Highlights...": "تحضير أبرز الأحداث...",
      "Collecting the best moments from this event.":
        "جمع أفضل اللحظات من هذا الحدث.",
      "Highlights could not be loaded": "تعذر تحميل النقاط البارزة",
      "Please check the link and try again.":
        "يرجى التحقق من الرابط والمحاولة مرة أخرى.",
      "Back to Home": "العودة إلى المنزل",
      "PRIVATE PREVIEW": "معاينة خاصة",
      SHAREABLE: "قابلة للمشاركة",
      "Private owner preview": "معاينة المالك الخاص",
      "End the event to make this page shareable with guests.":
        "قم بإنهاء الحدث لجعل هذه الصفحة قابلة للمشاركة مع الضيوف.",
      "By the numbers": "بالأرقام",
      "Event Summary": "ملخص الحدث",
      Participants: "المشاركون",
      Photos: "صور",
      Videos: "فيديوهات",
      Comments: "التعليقات",
      "Event winners": "الفائزين بالحدث",
      "Guest favorite": "الضيف المفضل",
      "Most Liked Photo": "الصورة الأكثر إعجابا",
      "Most liked event photo": "صورة الحدث الأكثر إعجابًا",
      "No liked photo yet": "لم تعجبك الصورة بعد",
      "The winner will appear after guests like an approved photo.":
        "سيظهر الفائز بعد إعجاب الضيوف بالصورة المعتمدة.",
      "Shared by": "تمت مشاركته بواسطة",
      "Memory maker": "صانع الذاكرة",
      "Top Photo Uploader": "أعلى رافع الصور",
      "Most active photographer": "المصور الأكثر نشاطا",
      "No uploader yet": "لا يوجد رافع حتى الآن",
      "Approved photo uploads will be counted here.":
        "سيتم احتساب تحميلات الصور المعتمدة هنا.",
      "Photos uploaded": "تم تحميل الصور",
      "Every guest. Every moment. One shared album.":
        "كل ضيف. كل لحظة. ألبوم واحد مشترك.",
      "Share after event ends": "شارك بعد انتهاء الحدث",
      "See the highlights from this event.": "شاهد أبرز الأحداث من هذا الحدث.",
      "Highlights link copied.": "تم نسخ الرابط المميز.",
      "Highlights link could not be copied.": "لا يمكن نسخ الرابط المميز.",
      "{name} shared the most approved photos from this event.":
        "شارك {name} الصور الأكثر اعتمادًا من هذا الحدث.",
      "Date not specified": "التاريخ غير محدد",
      "A valid Highlights link is required.": "مطلوب رابط Highlights صالح.",
      "Event Highlights could not be loaded.": "تعذر تحميل الأحداث المميزة.",
      "Event Highlights becomes shareable after the event is ended.":
        "تصبح الأحداث المميزة قابلة للمشاركة بعد انتهاء الحدث.",
      "Event not found or you do not have permission.":
        "لم يتم العثور على الحدث أو ليس لديك إذن.",
      "Event not found.": "لم يتم العثور على الحدث.",
      "Event participants could not be loaded.":
        "تعذر تحميل المشاركين في الحدث.",
      "Approved event content could not be loaded.":
        "تعذر تحميل محتوى الحدث المعتمد.",
      "Photo likes could not be loaded.": "لا يمكن تحميل إعجابات الصور.",
    },
    de: {
      "Event Highlights": "Veranstaltungshighlights",
      "Event Highlights — SnapUp Events":
        "Veranstaltungshighlights – SnapUp-Events",
      "Most liked photo, top uploader and event summary":
        "Foto mit den meisten Likes, Top-Uploader und Veranstaltungszusammenfassung",
      "Highlights are ready to share": "Highlights stehen zum Teilen bereit",
      "Private preview until the event ends":
        "Private Vorschau bis zum Ende der Veranstaltung",
      Back: "Zurück",
      "Share Highlights": "Highlights teilen",
      "Preparing Event Highlights...": "Event-Highlights vorbereiten...",
      "Collecting the best moments from this event.":
        "Sammeln Sie die besten Momente dieser Veranstaltung.",
      "Highlights could not be loaded":
        "Highlights konnten nicht geladen werden",
      "Please check the link and try again.":
        "Bitte überprüfen Sie den Link und versuchen Sie es erneut.",
      "Back to Home": "Zurück nach Hause",
      "PRIVATE PREVIEW": "PRIVATE VORSCHAU",
      SHAREABLE: "TEILBAR",
      "Private owner preview": "Vorschau für Privatbesitzer",
      "End the event to make this page shareable with guests.":
        "Beenden Sie die Veranstaltung, um diese Seite für Gäste zugänglich zu machen.",
      "By the numbers": "Anhand der Zahlen",
      "Event Summary": "Zusammenfassung der Veranstaltung",
      Participants: "Teilnehmer",
      Photos: "Fotos",
      Videos: "Videos",
      Comments: "Kommentare",
      "Event winners": "Gewinner der Veranstaltung",
      "Guest favorite": "Gastfavorit",
      "Most Liked Photo": "Foto mit den meisten Likes",
      "Most liked event photo": "Eventfoto mit den meisten Likes",
      "No liked photo yet": "Noch kein Foto mit „Gefällt mir“ markiert",
      "The winner will appear after guests like an approved photo.":
        "Der Gewinner wird angezeigt, nachdem die Gäste ein genehmigtes Foto erhalten haben.",
      "Shared by": "Geteilt von",
      "Memory maker": "Erinnerungsmacher",
      "Top Photo Uploader": "Top-Foto-Uploader",
      "Most active photographer": "Aktivster Fotograf",
      "No uploader yet": "Noch kein Uploader",
      "Approved photo uploads will be counted here.":
        "Genehmigte Foto-Uploads werden hier gezählt.",
      "Photos uploaded": "Fotos hochgeladen",
      "Every guest. Every moment. One shared album.":
        "Jeder Gast. Jeden Moment. Ein gemeinsames Album.",
      "Share after event ends": "Nach Ende der Veranstaltung teilen",
      "See the highlights from this event.":
        "Sehen Sie sich die Highlights dieser Veranstaltung an.",
      "Highlights link copied.": "Highlights-Link kopiert.",
      "Highlights link could not be copied.":
        "Der Highlights-Link konnte nicht kopiert werden.",
      "{name} shared the most approved photos from this event.":
        "{name} hat die am häufigsten genehmigten Fotos dieser Veranstaltung geteilt.",
      "Date not specified": "Datum nicht angegeben",
      "A valid Highlights link is required.":
        "Ein gültiger Highlights-Link ist erforderlich.",
      "Event Highlights could not be loaded.":
        "Event-Highlights konnten nicht geladen werden.",
      "Event Highlights becomes shareable after the event is ended.":
        "Event-Highlights können geteilt werden, nachdem die Veranstaltung beendet ist.",
      "Event not found or you do not have permission.":
        "Veranstaltung nicht gefunden oder Sie haben keine Berechtigung.",
      "Event not found.": "Veranstaltung nicht gefunden.",
      "Event participants could not be loaded.":
        "Veranstaltungsteilnehmer konnten nicht geladen werden.",
      "Approved event content could not be loaded.":
        "Genehmigte Veranstaltungsinhalte konnten nicht geladen werden.",
      "Photo likes could not be loaded.":
        "Foto-Likes konnten nicht geladen werden.",
    },
    fr: {
      "Event Highlights": "Faits saillants de l'événement",
      "Event Highlights — SnapUp Events":
        "Faits saillants de l'événement — Événements SnapUp",
      "Most liked photo, top uploader and event summary":
        "Photo la plus appréciée, meilleure téléchargeuse et résumé de l'événement",
      "Highlights are ready to share":
        "Les moments forts sont prêts à être partagés",
      "Private preview until the event ends":
        "Aperçu privé jusqu'à la fin de l'événement",
      Back: "Retour",
      "Share Highlights": "Partager les faits saillants",
      "Preparing Event Highlights...":
        "Préparation des temps forts de l'événement...",
      "Collecting the best moments from this event.":
        "Recueillir les meilleurs moments de cet événement.",
      "Highlights could not be loaded":
        "Les faits saillants n'ont pas pu être chargés",
      "Please check the link and try again.":
        "Veuillez vérifier le lien et réessayer.",
      "Back to Home": "Retour à la maison",
      "PRIVATE PREVIEW": "APERÇU PRIVÉ",
      SHAREABLE: "PARTAGEABLE",
      "Private owner preview": "Aperçu du propriétaire privé",
      "End the event to make this page shareable with guests.":
        "Terminez l'événement pour rendre cette page partageable avec les invités.",
      "By the numbers": "En chiffres",
      "Event Summary": "Résumé de l'événement",
      Participants: "Participants",
      Photos: "Photos",
      Videos: "Vidéos",
      Comments: "Commentaires",
      "Event winners": "Gagnants de l'événement",
      "Guest favorite": "Coup de cœur des invités",
      "Most Liked Photo": "Photo la plus appréciée",
      "Most liked event photo": "Photo de l'événement la plus appréciée",
      "No liked photo yet": "Aucune photo aimée pour l'instant",
      "The winner will appear after guests like an approved photo.":
        "Le gagnant apparaîtra après les invités comme une photo approuvée.",
      "Shared by": "Partagé par",
      "Memory maker": "Créateur de mémoire",
      "Top Photo Uploader": "Meilleur téléchargeur de photos",
      "Most active photographer": "Photographe le plus actif",
      "No uploader yet": "Pas encore de téléchargeur",
      "Approved photo uploads will be counted here.":
        "Les téléchargements de photos approuvés seront comptabilisés ici.",
      "Photos uploaded": "Photos téléchargées",
      "Every guest. Every moment. One shared album.":
        "Chaque invité. Chaque instant. Un album partagé.",
      "Share after event ends": "Partager après la fin de l'événement",
      "See the highlights from this event.":
        "Découvrez les moments forts de cet événement.",
      "Highlights link copied.": "Lien des faits saillants copié.",
      "Highlights link could not be copied.":
        "Le lien des faits saillants n’a pas pu être copié.",
      "{name} shared the most approved photos from this event.":
        "{name} a partagé les photos les plus approuvées de cet événement.",
      "Date not specified": "Date non précisée",
      "A valid Highlights link is required.":
        "Un lien Faits saillants valide est requis.",
      "Event Highlights could not be loaded.":
        "Les faits saillants de l'événement n'ont pas pu être chargés.",
      "Event Highlights becomes shareable after the event is ended.":
        "Les faits saillants de l'événement deviennent partageables une fois l'événement terminé.",
      "Event not found or you do not have permission.":
        "Événement introuvable ou vous n'avez pas l'autorisation.",
      "Event not found.": "Événement introuvable.",
      "Event participants could not be loaded.":
        "Les participants à l'événement n'ont pas pu être chargés.",
      "Approved event content could not be loaded.":
        "Le contenu de l'événement approuvé n'a pas pu être chargé.",
      "Photo likes could not be loaded.":
        "Les photos J'aime n'ont pas pu être chargées.",
    },
    es: {
      "Event Highlights": "Aspectos destacados del evento",
      "Event Highlights — SnapUp Events":
        "Aspectos destacados del evento: eventos SnapUp",
      "Most liked photo, top uploader and event summary":
        "Foto que más me gustó, quien más subió y resumen del evento",
      "Highlights are ready to share":
        "Los aspectos más destacados están listos para compartir",
      "Private preview until the event ends":
        "Vista previa privada hasta que finalice el evento.",
      Back: "Atrás",
      "Share Highlights": "Compartir aspectos destacados",
      "Preparing Event Highlights...":
        "Preparando lo más destacado del evento...",
      "Collecting the best moments from this event.":
        "Recopilando los mejores momentos de este evento.",
      "Highlights could not be loaded":
        "No se pudieron cargar los aspectos más destacados",
      "Please check the link and try again.":
        "Por favor revisa el enlace y vuelve a intentarlo.",
      "Back to Home": "Volver a Inicio",
      "PRIVATE PREVIEW": "VISTA PREVIA PRIVADA",
      SHAREABLE: "COMPARTIBLE",
      "Private owner preview": "Vista previa del propietario privado",
      "End the event to make this page shareable with guests.":
        "Finalice el evento para que esta página se pueda compartir con los invitados.",
      "By the numbers": "Por los números",
      "Event Summary": "Resumen del evento",
      Participants: "Participantes",
      Photos: "Fotos",
      Videos: "Vídeos",
      Comments: "Comentarios",
      "Event winners": "Ganadores del evento",
      "Guest favorite": "Favorito de los invitados",
      "Most Liked Photo": "Foto que más me gustó",
      "Most liked event photo": "Foto del evento que más me gustó",
      "No liked photo yet": "Aún no hay foto que me guste",
      "The winner will appear after guests like an approved photo.":
        "El ganador aparecerá después de los invitados como una foto aprobada.",
      "Shared by": "Compartido por",
      "Memory maker": "fabricante de memoria",
      "Top Photo Uploader": "Cargador de fotos superior",
      "Most active photographer": "Fotógrafo más activo",
      "No uploader yet": "Aún no lo has subido",
      "Approved photo uploads will be counted here.":
        "Las cargas de fotografías aprobadas se contarán aquí.",
      "Photos uploaded": "Fotos subidas",
      "Every guest. Every moment. One shared album.":
        "Cada invitado. Cada momento. Un álbum compartido.",
      "Share after event ends": "Compartir después de que finalice el evento",
      "See the highlights from this event.":
        "Vea lo más destacado de este evento.",
      "Highlights link copied.": "Enlace de aspectos destacados copiado.",
      "Highlights link could not be copied.":
        "El enlace de destacados no se pudo copiar.",
      "{name} shared the most approved photos from this event.":
        "{name} compartió las fotos más aprobadas de este evento.",
      "Date not specified": "Fecha no especificada",
      "A valid Highlights link is required.":
        "Se requiere un enlace de Destacados válido.",
      "Event Highlights could not be loaded.":
        "No se pudieron cargar los aspectos más destacados del evento.",
      "Event Highlights becomes shareable after the event is ended.":
        "Los aspectos destacados del evento se pueden compartir una vez finalizado el evento.",
      "Event not found or you do not have permission.":
        "Evento no encontrado o no tienes permiso.",
      "Event not found.": "Evento no encontrado.",
      "Event participants could not be loaded.":
        "No se pudieron cargar los participantes del evento.",
      "Approved event content could not be loaded.":
        "No se pudo cargar el contenido del evento aprobado.",
      "Photo likes could not be loaded.":
        "No se pudieron cargar los Me gusta de las fotos.",
    },
    it: {
      "Event Highlights": "Punti salienti dell'evento",
      "Event Highlights — SnapUp Events":
        "Punti salienti degli eventi: eventi SnapUp",
      "Most liked photo, top uploader and event summary":
        "Foto con più mi piace, uploader principale e riepilogo dell'evento",
      "Highlights are ready to share":
        "I punti salienti sono pronti per essere condivisi",
      "Private preview until the event ends":
        "Anteprima privata fino alla fine dell'evento",
      Back: "Indietro",
      "Share Highlights": "Condividi i punti salienti",
      "Preparing Event Highlights...":
        "Preparazione dei momenti salienti dell'evento...",
      "Collecting the best moments from this event.":
        "Raccogliere i momenti più belli di questo evento.",
      "Highlights could not be loaded":
        "Impossibile caricare i momenti salienti",
      "Please check the link and try again.":
        "Controlla il collegamento e riprova.",
      "Back to Home": "Ritorno a casa",
      "PRIVATE PREVIEW": "ANTEPRIMA PRIVATA",
      SHAREABLE: "CONDIVISIBILE",
      "Private owner preview": "Anteprima del proprietario privato",
      "End the event to make this page shareable with guests.":
        "Termina l'evento per rendere questa pagina condivisibile con gli ospiti.",
      "By the numbers": "Dai numeri",
      "Event Summary": "Riepilogo dell'evento",
      Participants: "Partecipanti",
      Photos: "Foto",
      Videos: "Video",
      Comments: "Commenti",
      "Event winners": "Vincitori dell'evento",
      "Guest favorite": "Il preferito dagli ospiti",
      "Most Liked Photo": "Foto con più mi piace",
      "Most liked event photo": "Foto dell'evento con più mi piace",
      "No liked photo yet": "Nessuna foto ancora piaciuta",
      "The winner will appear after guests like an approved photo.":
        "Il vincitore apparirà dopo gli ospiti come una foto approvata.",
      "Shared by": "Condiviso da",
      "Memory maker": "Creatore di memoria",
      "Top Photo Uploader": "Caricatore di foto migliore",
      "Most active photographer": "Fotografo più attivo",
      "No uploader yet": "Nessun caricatore ancora",
      "Approved photo uploads will be counted here.":
        "I caricamenti di foto approvati verranno conteggiati qui.",
      "Photos uploaded": "Foto caricate",
      "Every guest. Every moment. One shared album.":
        "Ogni ospite. Ogni momento. Un album condiviso.",
      "Share after event ends": "Condividi al termine dell'evento",
      "See the highlights from this event.":
        "Guarda i momenti salienti di questo evento.",
      "Highlights link copied.": "Link in evidenza copiato.",
      "Highlights link could not be copied.":
        "Impossibile copiare il collegamento alle evidenziazioni.",
      "{name} shared the most approved photos from this event.":
        "{name} ha condiviso le foto più approvate di questo evento.",
      "Date not specified": "Data non specificata",
      "A valid Highlights link is required.":
        "È richiesto un collegamento In evidenza valido.",
      "Event Highlights could not be loaded.":
        "Impossibile caricare i momenti salienti dell'evento.",
      "Event Highlights becomes shareable after the event is ended.":
        "I momenti salienti dell'evento diventano condivisibili al termine dell'evento.",
      "Event not found or you do not have permission.":
        "Evento non trovato o non disponi dell'autorizzazione.",
      "Event not found.": "Evento non trovato.",
      "Event participants could not be loaded.":
        "Impossibile caricare i partecipanti all'evento.",
      "Approved event content could not be loaded.":
        "Impossibile caricare il contenuto dell'evento approvato.",
      "Photo likes could not be loaded.":
        "Impossibile caricare i Mi piace per le foto.",
    },
    nl: {
      "Event Highlights": "Hoogtepunten van evenementen",
      "Event Highlights — SnapUp Events":
        "Hoogtepunten van evenementen — SnapUp-evenementen",
      "Most liked photo, top uploader and event summary":
        "Foto met de meeste likes, beste uploader en samenvatting van het evenement",
      "Highlights are ready to share": "Hoogtepunten zijn klaar om te delen",
      "Private preview until the event ends":
        "Privévoorbeeld tot het evenement eindigt",
      Back: "Terug",
      "Share Highlights": "Hoogtepunten delen",
      "Preparing Event Highlights...":
        "Hoogtepunten van evenementen voorbereiden...",
      "Collecting the best moments from this event.":
        "Ik verzamel de beste momenten van dit evenement.",
      "Highlights could not be loaded":
        "Hoogtepunten konden niet worden geladen",
      "Please check the link and try again.":
        "Controleer de link en probeer het opnieuw.",
      "Back to Home": "Terug naar Thuis",
      "PRIVATE PREVIEW": "PRIVÉ VOORBEELD",
      SHAREABLE: "DEELBAAR",
      "Private owner preview": "Voorbeeld van een particuliere eigenaar",
      "End the event to make this page shareable with guests.":
        "Beëindig het evenement om deze pagina deelbaar te maken met gasten.",
      "By the numbers": "Door de cijfers",
      "Event Summary": "Samenvatting van het evenement",
      Participants: "Deelnemers",
      Photos: "Foto's",
      Videos: "Video's",
      Comments: "Opmerkingen",
      "Event winners": "Winnaars van evenementen",
      "Guest favorite": "Favoriet van gasten",
      "Most Liked Photo": "Meest gelikete foto",
      "Most liked event photo": "Meest gelikete evenementfoto",
      "No liked photo yet": "Nog geen gelikete foto",
      "The winner will appear after guests like an approved photo.":
        "De winnaar verschijnt nadat gasten een goedgekeurde foto leuk vinden.",
      "Shared by": "Gedeeld door",
      "Memory maker": "Geheugen maker",
      "Top Photo Uploader": "Topfoto-uploader",
      "Most active photographer": "Meest actieve fotograaf",
      "No uploader yet": "Nog geen uploader",
      "Approved photo uploads will be counted here.":
        "Goedgekeurde foto-uploads worden hier geteld.",
      "Photos uploaded": "Foto's geüpload",
      "Every guest. Every moment. One shared album.":
        "Elke gast. Elk moment. Eén gedeeld album.",
      "Share after event ends": "Deel nadat het evenement is afgelopen",
      "See the highlights from this event.":
        "Bekijk de hoogtepunten van dit evenement.",
      "Highlights link copied.": "Link naar hoogtepunten gekopieerd.",
      "Highlights link could not be copied.":
        "Link naar hoogtepunten kan niet worden gekopieerd.",
      "{name} shared the most approved photos from this event.":
        "{name} heeft de meest goedgekeurde foto's van dit evenement gedeeld.",
      "Date not specified": "Datum niet gespecificeerd",
      "A valid Highlights link is required.":
        "Er is een geldige Hoogtepunten-link vereist.",
      "Event Highlights could not be loaded.":
        "Hoogtepunten van evenement kunnen niet worden geladen.",
      "Event Highlights becomes shareable after the event is ended.":
        "Evenementhoogtepunten worden deelbaar nadat het evenement is beëindigd.",
      "Event not found or you do not have permission.":
        "Evenement niet gevonden of u heeft geen toestemming.",
      "Event not found.": "Evenement niet gevonden.",
      "Event participants could not be loaded.":
        "Deelnemers aan het evenement konden niet worden geladen.",
      "Approved event content could not be loaded.":
        "Goedgekeurde evenementinhoud kan niet worden geladen.",
      "Photo likes could not be loaded.":
        "Foto-likes kunnen niet worden geladen.",
    },
    bg: {
      "Event Highlights": "Акценти от събитието",
      "Event Highlights — SnapUp Events": "Акценти от събития — SnapUp събития",
      "Most liked photo, top uploader and event summary":
        "Най-харесвана снимка, най-популярно качване и резюме на събитието",
      "Highlights are ready to share": "Акцентите са готови за споделяне",
      "Private preview until the event ends":
        "Частен преглед до края на събитието",
      Back: "Назад",
      "Share Highlights": "Споделяне на акценти",
      "Preparing Event Highlights...": "Акценти от събитието се подготвят...",
      "Collecting the best moments from this event.":
        "Събираме най-добрите моменти от това събитие.",
      "Highlights could not be loaded": "Акцентите не можаха да бъдат заредени",
      "Please check the link and try again.":
        "Моля, проверете връзката и опитайте отново.",
      "Back to Home": "Обратно към дома",
      "PRIVATE PREVIEW": "ЧАСТЕН ПРЕГЛЕД",
      SHAREABLE: "СПОДЕЛЯЕМ",
      "Private owner preview": "Преглед на частен собственик",
      "End the event to make this page shareable with guests.":
        "Прекратете събитието, за да направите тази страница споделена с гостите.",
      "By the numbers": "По числата",
      "Event Summary": "Резюме на събитието",
      Participants: "Участници",
      Photos: "Снимки",
      Videos: "Видеоклипове",
      Comments: "Коментари",
      "Event winners": "Победители на събитието",
      "Guest favorite": "Любимец на гостите",
      "Most Liked Photo": "Най-харесвана снимка",
      "Most liked event photo": "Най-харесвана снимка от събитието",
      "No liked photo yet": "Все още няма харесана снимка",
      "The winner will appear after guests like an approved photo.":
        "Победителят ще се появи, след като гостите харесат одобрена снимка.",
      "Shared by": "Споделено от",
      "Memory maker": "Създател на памет",
      "Top Photo Uploader": "Топ програма за качване на снимки",
      "Most active photographer": "Най-активният фотограф",
      "No uploader yet": "Все още няма програма за качване",
      "Approved photo uploads will be counted here.":
        "Одобрените качвания на снимки ще бъдат отчетени тук.",
      "Photos uploaded": "Снимките са качени",
      "Every guest. Every moment. One shared album.":
        "Всеки гост. Всеки момент. Един споделен албум.",
      "Share after event ends": "Споделете след края на събитието",
      "See the highlights from this event.": "Вижте акцентите от това събитие.",
      "Highlights link copied.": "Връзката към акцентите е копирана.",
      "Highlights link could not be copied.":
        "Връзката към акцентите не можа да бъде копирана.",
      "{name} shared the most approved photos from this event.":
        "{name} сподели най-одобрените снимки от това събитие.",
      "Date not specified": "Датата не е посочена",
      "A valid Highlights link is required.":
        "Изисква се валидна връзка към Акценти.",
      "Event Highlights could not be loaded.":
        "Акцентите на събитието не можаха да бъдат заредени.",
      "Event Highlights becomes shareable after the event is ended.":
        "Акцентите на събитието могат да се споделят след края на събитието.",
      "Event not found or you do not have permission.":
        "Събитието не е намерено или нямате разрешение.",
      "Event not found.": "Събитието не е намерено.",
      "Event participants could not be loaded.":
        "Участниците в събитието не можаха да бъдат заредени.",
      "Approved event content could not be loaded.":
        "Одобреното съдържание на събитието не можа да бъде заредено.",
      "Photo likes could not be loaded.":
        "Харесванията на снимки не можаха да бъдат заредени.",
    },
    ro: {
      "Event Highlights": "Repere eveniment",
      "Event Highlights — SnapUp Events":
        "Repere evenimente — Evenimente SnapUp",
      "Most liked photo, top uploader and event summary":
        "Cele mai apreciate fotografii, cele mai apreciate persoane de încărcare și rezumatul evenimentului",
      "Highlights are ready to share":
        "Cele mai importante momente sunt gata pentru a fi distribuite",
      "Private preview until the event ends":
        "Previzualizare privată până la încheierea evenimentului",
      Back: "Înapoi",
      "Share Highlights": "Distribuiți Repere",
      "Preparing Event Highlights...":
        "Se pregătesc momentele importante ale evenimentului...",
      "Collecting the best moments from this event.":
        "Colectarea celor mai bune momente de la acest eveniment.",
      "Highlights could not be loaded":
        "Evidențierile nu au putut fi încărcate",
      "Please check the link and try again.":
        "Verificați linkul și încercați din nou.",
      "Back to Home": "Înapoi la Acasă",
      "PRIVATE PREVIEW": "PREVIEW PRIVATE",
      SHAREABLE: "DISTRIBUIBILĂ",
      "Private owner preview": "Previzualizare proprietar privat",
      "End the event to make this page shareable with guests.":
        "Încheiați evenimentul pentru ca această pagină să poată fi partajată cu invitații.",
      "By the numbers": "După cifre",
      "Event Summary": "Rezumatul evenimentului",
      Participants: "Participanții",
      Photos: "Fotografii",
      Videos: "Videoclipuri",
      Comments: "Comentarii",
      "Event winners": "Câștigătorii evenimentului",
      "Guest favorite": "Favoritul oaspeților",
      "Most Liked Photo": "Poza cea mai apreciată",
      "Most liked event photo": "Cea mai apreciată fotografie a evenimentului",
      "No liked photo yet": "Nicio fotografie apreciată încă",
      "The winner will appear after guests like an approved photo.":
        "Câștigătorul va apărea după ce oaspeților le-a apreciat o fotografie aprobată.",
      "Shared by": "Partajat de",
      "Memory maker": "Creator de memorie",
      "Top Photo Uploader": "Top Photo Uploader",
      "Most active photographer": "Cel mai activ fotograf",
      "No uploader yet": "Încă nu există încărcător",
      "Approved photo uploads will be counted here.":
        "Încărcările de fotografii aprobate vor fi numărate aici.",
      "Photos uploaded": "Fotografii încărcate",
      "Every guest. Every moment. One shared album.":
        "Fiecare oaspete. În fiecare moment. Un album partajat.",
      "Share after event ends": "Distribuie după încheierea evenimentului",
      "See the highlights from this event.":
        "Vedeți cele mai importante momente de la acest eveniment.",
      "Highlights link copied.": "Linkul Evidențieri a fost copiat.",
      "Highlights link could not be copied.":
        "Linkul Highlights nu a putut fi copiat.",
      "{name} shared the most approved photos from this event.":
        "{name} a distribuit cele mai aprobate fotografii de la acest eveniment.",
      "Date not specified": "Data nu este specificată",
      "A valid Highlights link is required.":
        "Este necesar un link valid pentru Evidențieri.",
      "Event Highlights could not be loaded.":
        "Repere evenimente nu au putut fi încărcate.",
      "Event Highlights becomes shareable after the event is ended.":
        "Evenimentul Highlights poate fi partajat după încheierea evenimentului.",
      "Event not found or you do not have permission.":
        "Evenimentul nu a fost găsit sau nu aveți permisiunea.",
      "Event not found.": "Evenimentul nu a fost găsit.",
      "Event participants could not be loaded.":
        "Participanții la eveniment nu au putut fi încărcați.",
      "Approved event content could not be loaded.":
        "Conținutul evenimentului aprobat nu a putut fi încărcat.",
      "Photo likes could not be loaded.":
        "Like-urile fotografiilor nu au putut fi încărcate.",
    },
    el: {
      "Event Highlights": "Τα κυριότερα σημεία της εκδήλωσης",
      "Event Highlights — SnapUp Events":
        "Σημαντικά γεγονότα — Εκδηλώσεις SnapUp",
      "Most liked photo, top uploader and event summary":
        "Φωτογραφία με τις περισσότερες συμπάθειες, κορυφαίο πρόγραμμα μεταφόρτωσης και σύνοψη εκδήλωσης",
      "Highlights are ready to share":
        "Τα highlights είναι έτοιμα για κοινή χρήση",
      "Private preview until the event ends":
        "Ιδιωτική προεπισκόπηση μέχρι τη λήξη της εκδήλωσης",
      Back: "Πίσω",
      "Share Highlights": "Μοιραστείτε τα κυριότερα σημεία",
      "Preparing Event Highlights...": "Προετοιμασία σημείων εκδήλωσης...",
      "Collecting the best moments from this event.":
        "Συλλέγοντας τις καλύτερες στιγμές από αυτή την εκδήλωση.",
      "Highlights could not be loaded":
        "Δεν ήταν δυνατή η φόρτωση των επισημάνσεων",
      "Please check the link and try again.":
        "Ελέγξτε τον σύνδεσμο και δοκιμάστε ξανά.",
      "Back to Home": "Επιστροφή στο σπίτι",
      "PRIVATE PREVIEW": "ΙΔΙΩΤΙΚΗ ΠΡΟΕΠΙΣΚΟΠΗΣΗ",
      SHAREABLE: "ΚΟΙΝΟΠΟΙΗσιμο",
      "Private owner preview": "Προεπισκόπηση ιδιωτικού ιδιοκτήτη",
      "End the event to make this page shareable with guests.":
        "Τερματίστε την εκδήλωση για να γίνει κοινή χρήση αυτής της σελίδας με τους επισκέπτες.",
      "By the numbers": "Με τους αριθμούς",
      "Event Summary": "Περίληψη εκδήλωσης",
      Participants: "Συμμετέχοντες",
      Photos: "Φωτογραφίες",
      Videos: "Βίντεο",
      Comments: "Σχόλια",
      "Event winners": "Νικητές της εκδήλωσης",
      "Guest favorite": "Αγαπημένο επισκέπτη",
      "Most Liked Photo": "Φωτογραφία με τα περισσότερα likes",
      "Most liked event photo": "Φωτογραφία εκδήλωσης με τα περισσότερα likes",
      "No liked photo yet": "Δεν υπάρχει φωτογραφία που μου αρέσει ακόμα",
      "The winner will appear after guests like an approved photo.":
        "Ο νικητής θα εμφανιστεί μετά τους καλεσμένους σαν μια εγκεκριμένη φωτογραφία.",
      "Shared by": "Κοινή χρήση από",
      "Memory maker": "Κατασκευαστής μνήμης",
      "Top Photo Uploader": "Κορυφαίο πρόγραμμα μεταφόρτωσης φωτογραφιών",
      "Most active photographer": "Ο πιο δραστήριος φωτογράφος",
      "No uploader yet": "Δεν υπάρχει ακόμη πρόγραμμα μεταφόρτωσης",
      "Approved photo uploads will be counted here.":
        "Οι εγκεκριμένες μεταφορτώσεις φωτογραφιών θα υπολογίζονται εδώ.",
      "Photos uploaded": "Οι φωτογραφίες ανέβηκαν",
      "Every guest. Every moment. One shared album.":
        "Κάθε καλεσμένος. Κάθε στιγμή. Ένα κοινό άλμπουμ.",
      "Share after event ends": "Κοινοποίηση μετά τη λήξη της εκδήλωσης",
      "See the highlights from this event.":
        "Δείτε τα highlights από αυτή την εκδήλωση.",
      "Highlights link copied.":
        "Ο σύνδεσμος με τις καλύτερες στιγμές αντιγράφηκε.",
      "Highlights link could not be copied.":
        "Δεν ήταν δυνατή η αντιγραφή του συνδέσμου με τις καλύτερες στιγμές.",
      "{name} shared the most approved photos from this event.":
        "Το {name} μοιράστηκε τις πιο εγκεκριμένες φωτογραφίες από αυτήν την εκδήλωση.",
      "Date not specified": "Ημερομηνία δεν προσδιορίζεται",
      "A valid Highlights link is required.":
        "Απαιτείται έγκυρος σύνδεσμος Highlights.",
      "Event Highlights could not be loaded.":
        "Δεν ήταν δυνατή η φόρτωση των επισημάνσεων συμβάντος.",
      "Event Highlights becomes shareable after the event is ended.":
        "Τα Highlights συμβάντος μπορούν να κοινοποιηθούν μετά το τέλος του συμβάντος.",
      "Event not found or you do not have permission.":
        "Το συμβάν δεν βρέθηκε ή δεν έχετε άδεια.",
      "Event not found.": "Το συμβάν δεν βρέθηκε.",
      "Event participants could not be loaded.":
        "Δεν ήταν δυνατή η φόρτωση των συμμετεχόντων στην εκδήλωση.",
      "Approved event content could not be loaded.":
        "Δεν ήταν δυνατή η φόρτωση του εγκεκριμένου περιεχομένου συμβάντος.",
      "Photo likes could not be loaded.":
        'Δεν ήταν δυνατή η φόρτωση των επισημάνσεων "μου αρέσει".',
    },
    sr: {
      "Event Highlights": "Најважнији догађаји",
      "Event Highlights — SnapUp Events":
        "Најважнији догађаји — СнапУп догађаји",
      "Most liked photo, top uploader and event summary":
        "Највише волела фотографија, најбољи отпремалац и резиме догађаја",
      "Highlights are ready to share":
        "Истакнути садржаји су спремни за дељење",
      "Private preview until the event ends":
        "Приватни преглед док се догађај не заврши",
      Back: "Назад",
      "Share Highlights": "Схаре Хигхлигхтс",
      "Preparing Event Highlights...": "Припрема најважнијих догађаја...",
      "Collecting the best moments from this event.":
        "Прикупљамо најбоље тренутке са овог догађаја.",
      "Highlights could not be loaded": "Није могуће учитати истакнуте ставке",
      "Please check the link and try again.":
        "Проверите везу и покушајте поново.",
      "Back to Home": "Повратак кући",
      "PRIVATE PREVIEW": "ПРИВАТЕ ПРЕВИЕВ",
      SHAREABLE: "СХАРЕАБЛЕ",
      "Private owner preview": "Преглед приватног власника",
      "End the event to make this page shareable with guests.":
        "Завршите догађај да бисте ову страницу могли делити са гостима.",
      "By the numbers": "По бројевима",
      "Event Summary": "Резиме догађаја",
      Participants: "Учесници",
      Photos: "Фотографије",
      Videos: "Видеос",
      Comments: "Коментари",
      "Event winners": "Победници догађаја",
      "Guest favorite": "Омиљени гости",
      "Most Liked Photo": "Највише свиђана фотографија",
      "Most liked event photo": "Највише волела фотографија догађаја",
      "No liked photo yet": "Још нема слике која се свиђа",
      "The winner will appear after guests like an approved photo.":
        "Победник ће се појавити након што гости лајкују одобрену фотографију.",
      "Shared by": "Дели",
      "Memory maker": "Мемори макер",
      "Top Photo Uploader": "Топ Пхото Уплоадер",
      "Most active photographer": "Најактивнији фотограф",
      "No uploader yet": "Још нема отпремача",
      "Approved photo uploads will be counted here.":
        "Одобрена отпремања фотографија ће се овде рачунати.",
      "Photos uploaded": "Фотографије су отпремљене",
      "Every guest. Every moment. One shared album.":
        "Сваки гост. Сваки тренутак. Један заједнички албум.",
      "Share after event ends": "Делите након завршетка догађаја",
      "See the highlights from this event.":
        "Погледајте најзанимљивије делове овог догађаја.",
      "Highlights link copied.": "Веза са истакнутим деловима је копирана.",
      "Highlights link could not be copied.":
        "Није могуће копирати везу са истакнутим деловима.",
      "{name} shared the most approved photos from this event.":
        "{name} дели највише одобрених фотографија са овог догађаја.",
      "Date not specified": "Датум није наведен",
      "A valid Highlights link is required.":
        "Потребан је важећи линк Најважније.",
      "Event Highlights could not be loaded.":
        "Није могуће учитати истакнуте догађаје.",
      "Event Highlights becomes shareable after the event is ended.":
        "Истакнути догађаји постају дељиви након што се догађај заврши.",
      "Event not found or you do not have permission.":
        "Догађај није пронађен или немате дозволу.",
      "Event not found.": "Догађај није пронађен.",
      "Event participants could not be loaded.":
        "Учесници догађаја нису могли да се учитају.",
      "Approved event content could not be loaded.":
        "Није могуће учитати одобрени садржај догађаја.",
      "Photo likes could not be loaded.":
        "Није могуће учитати свиђања фотографија.",
    },
    hr: {
      "Event Highlights": "Istaknuti događaji",
      "Event Highlights — SnapUp Events":
        "Istaknuti događaji — SnapUp događaji",
      "Most liked photo, top uploader and event summary":
        "Najviše lajkana fotografija, najveći učitavač i sažetak događaja",
      "Highlights are ready to share": "Istaknuto je spremno za dijeljenje",
      "Private preview until the event ends":
        "Privatni pregled do završetka događaja",
      Back: "natrag",
      "Share Highlights": "Podijelite istaknuto",
      "Preparing Event Highlights...": "Priprema istaknutih događaja...",
      "Collecting the best moments from this event.":
        "Sakupljanje najboljih trenutaka s ovog događaja.",
      "Highlights could not be loaded": "Nije moguće učitati istaknute stavke",
      "Please check the link and try again.":
        "Provjerite vezu i pokušajte ponovno.",
      "Back to Home": "Povratak kući",
      "PRIVATE PREVIEW": "PRIVATNI PREGLED",
      SHAREABLE: "DIJELJIVO",
      "Private owner preview": "Pregled privatnog vlasnika",
      "End the event to make this page shareable with guests.":
        "Završite događaj kako biste ovu stranicu mogli dijeliti s gostima.",
      "By the numbers": "Po brojkama",
      "Event Summary": "Sažetak događaja",
      Participants: "Sudionici",
      Photos: "Fotografije",
      Videos: "Video zapisi",
      Comments: "Komentari",
      "Event winners": "Pobjednici događaja",
      "Guest favorite": "Favorit gostiju",
      "Most Liked Photo": "Fotografija koja se najviše sviđa",
      "Most liked event photo": "Najlajkanija fotografija događaja",
      "No liked photo yet": "Još nema lajkane fotografije",
      "The winner will appear after guests like an approved photo.":
        "Pobjednik će se pojaviti nakon što gosti lajkaju odobrenu fotografiju.",
      "Shared by": "Podijelio/la",
      "Memory maker": "Tvorac sjećanja",
      "Top Photo Uploader": "Najbolji učitavač fotografija",
      "Most active photographer": "Najaktivniji fotograf",
      "No uploader yet": "Još nema učitavača",
      "Approved photo uploads will be counted here.":
        "Ovdje će se računati odobreni prijenosi fotografija.",
      "Photos uploaded": "Fotografije su učitane",
      "Every guest. Every moment. One shared album.":
        "Svaki gost. Svaki trenutak. Jedan zajednički album.",
      "Share after event ends": "Podijelite nakon završetka događaja",
      "See the highlights from this event.":
        "Pogledajte najzanimljivije dijelove ovog događaja.",
      "Highlights link copied.": "Veza za istaknute stavke kopirana je.",
      "Highlights link could not be copied.":
        "Veza za istaknute stavke nije se mogla kopirati.",
      "{name} shared the most approved photos from this event.":
        "{name} je podijelio najviše odobrenih fotografija s ovog događaja.",
      "Date not specified": "Datum nije naveden",
      "A valid Highlights link is required.":
        "Potrebna je valjana poveznica Highlights.",
      "Event Highlights could not be loaded.":
        "Nije moguće učitati istaknute događaje.",
      "Event Highlights becomes shareable after the event is ended.":
        "Istaknuti događaji mogu se dijeliti nakon završetka događaja.",
      "Event not found or you do not have permission.":
        "Događaj nije pronađen ili nemate dozvolu.",
      "Event not found.": "Događaj nije pronađen.",
      "Event participants could not be loaded.":
        "Nije moguće učitati sudionike događaja.",
      "Approved event content could not be loaded.":
        "Odobreni sadržaj događaja nije se mogao učitati.",
      "Photo likes could not be loaded.":
        'Nije moguće učitati oznake "sviđa mi se" za fotografije.',
    },
    bs: {
      "Event Highlights": "Izdvajamo događaje",
      "Event Highlights — SnapUp Events":
        "Istaknuti događaji — SnapUp događaji",
      "Most liked photo, top uploader and event summary":
        "Najviše svidjela fotografija, top uploader i sažetak događaja",
      "Highlights are ready to share":
        "Istaknuti sadržaji su spremni za dijeljenje",
      "Private preview until the event ends":
        "Privatni pregled do kraja događaja",
      Back: "Nazad",
      "Share Highlights": "Share Highlights",
      "Preparing Event Highlights...": "Priprema najvažnijih događaja...",
      "Collecting the best moments from this event.":
        "Sakupljamo najbolje trenutke sa ovog događaja.",
      "Highlights could not be loaded": "Nije moguće učitati istaknute stavke",
      "Please check the link and try again.":
        "Molimo provjerite vezu i pokušajte ponovo.",
      "Back to Home": "Povratak kući",
      "PRIVATE PREVIEW": "PRIVATE PREVIEW",
      SHAREABLE: "DIJELI",
      "Private owner preview": "Pregled privatnog vlasnika",
      "End the event to make this page shareable with guests.":
        "Završite događaj kako biste ovu stranicu mogli dijeliti s gostima.",
      "By the numbers": "Po brojevima",
      "Event Summary": "Sažetak događaja",
      Participants: "Učesnici",
      Photos: "Fotografije",
      Videos: "Videos",
      Comments: "Komentari",
      "Event winners": "Pobjednici događaja",
      "Guest favorite": "Omiljeni gosti",
      "Most Liked Photo": "Najviše voljena fotografija",
      "Most liked event photo": "Najviše se sviđa fotografija sa događaja",
      "No liked photo yet": "Još nema lajkovane fotografije",
      "The winner will appear after guests like an approved photo.":
        "Pobjednik će se pojaviti nakon što gosti lajkuju odobrenu fotografiju.",
      "Shared by": "Shared by",
      "Memory maker": "Memory maker",
      "Top Photo Uploader": "Top Photo Uploader",
      "Most active photographer": "Najaktivniji fotograf",
      "No uploader yet": "Još nema uploadera",
      "Approved photo uploads will be counted here.":
        "Odobrena otpremanja fotografija će se ovdje računati.",
      "Photos uploaded": "Fotografije su otpremljene",
      "Every guest. Every moment. One shared album.":
        "Svaki gost. Svaki trenutak. Jedan zajednički album.",
      "Share after event ends": "Podijelite nakon završetka događaja",
      "See the highlights from this event.":
        "Pogledajte najzanimljivije detalje sa ovog događaja.",
      "Highlights link copied.": "Link za istaknute stavke je kopiran.",
      "Highlights link could not be copied.":
        "Nije moguće kopirati link za istaknute stavke.",
      "{name} shared the most approved photos from this event.":
        "{name} je podijelio najviše odobrenih fotografija sa ovog događaja.",
      "Date not specified": "Datum nije naveden",
      "A valid Highlights link is required.":
        "Potreban je važeći link Najvažnije.",
      "Event Highlights could not be loaded.":
        "Istaknuti događaji se ne mogu učitati.",
      "Event Highlights becomes shareable after the event is ended.":
        "Istaknuti događaji se mogu dijeliti nakon što se događaj završi.",
      "Event not found or you do not have permission.":
        "Događaj nije pronađen ili nemate dozvolu.",
      "Event not found.": "Događaj nije pronađen.",
      "Event participants could not be loaded.":
        "Učesnici događaja nisu mogli biti učitani.",
      "Approved event content could not be loaded.":
        "Nije moguće učitati odobreni sadržaj događaja.",
      "Photo likes could not be loaded.":
        "Nije moguće učitati lajkove za fotografije.",
    },
    sq: {
      "Event Highlights": "Pikat kryesore të ngjarjes",
      "Event Highlights — SnapUp Events":
        "Pikat kryesore të ngjarjes - Ngjarje SnapUp",
      "Most liked photo, top uploader and event summary":
        "Fotografia më e pëlqyer, ngarkuesi kryesor dhe përmbledhja e ngjarjes",
      "Highlights are ready to share": "Pikat kryesore janë gati për t'u ndarë",
      "Private preview until the event ends":
        "Vështrim paraprak privat deri në përfundimin e ngjarjes",
      Back: "Mbrapa",
      "Share Highlights": "Ndani pikat kryesore",
      "Preparing Event Highlights...": "Përgatitja kryesore e ngjarjes...",
      "Collecting the best moments from this event.":
        "Duke mbledhur momentet më të mira nga ky event.",
      "Highlights could not be loaded":
        "Pikat kryesore nuk mund të ngarkoheshin",
      "Please check the link and try again.":
        "Ju lutemi kontrolloni lidhjen dhe provoni përsëri.",
      "Back to Home": "Kthehu në shtëpi",
      "PRIVATE PREVIEW": "PARAPRAKE PRIVATE",
      SHAREABLE: "TË NDËRQUESHME",
      "Private owner preview": "Pamja paraprake e pronarit privat",
      "End the event to make this page shareable with guests.":
        "Përfundoni ngjarjen për ta bërë këtë faqe të ndashme me të ftuarit.",
      "By the numbers": "Nga numrat",
      "Event Summary": "Përmbledhja e ngjarjes",
      Participants: "Pjesëmarrësit",
      Photos: "Fotot",
      Videos: "Videot",
      Comments: "Komentet",
      "Event winners": "Fituesit e ngjarjeve",
      "Guest favorite": "E preferuara e mysafirëve",
      "Most Liked Photo": "Fotoja më e pëlqyer",
      "Most liked event photo": "Fotoja më e pëlqyer e ngjarjes",
      "No liked photo yet": "Asnjë foto e pëlqyer ende",
      "The winner will appear after guests like an approved photo.":
        "Fituesi do të shfaqet pas të ftuarve si një foto e miratuar.",
      "Shared by": "Shpërndarë nga",
      "Memory maker": "Krijues i memories",
      "Top Photo Uploader": "Ngarkuesi kryesor i fotografive",
      "Most active photographer": "Fotografi më aktiv",
      "No uploader yet": "Nuk ka ende ngarkues",
      "Approved photo uploads will be counted here.":
        "Ngarkimet e miratuara të fotografive do të numërohen këtu.",
      "Photos uploaded": "Fotot e ngarkuara",
      "Every guest. Every moment. One shared album.":
        "Çdo mysafir. Çdo moment. Një album i përbashkët.",
      "Share after event ends": "Shpërndaje pas përfundimit të ngjarjes",
      "See the highlights from this event.":
        "Shikoni momentet kryesore nga kjo ngjarje.",
      "Highlights link copied.": "Lidhja e pikave kryesore u kopjua.",
      "Highlights link could not be copied.":
        "Lidhja e pikave kryesore nuk mund të kopjohej.",
      "{name} shared the most approved photos from this event.":
        "{name} ndau fotot më të miratuara nga kjo ngjarje.",
      "Date not specified": "Data nuk është specifikuar",
      "A valid Highlights link is required.":
        'Kërkohet një lidhje e vlefshme "Theksimet".',
      "Event Highlights could not be loaded.":
        "Pikat kryesore të ngjarjes nuk mund të ngarkoheshin.",
      "Event Highlights becomes shareable after the event is ended.":
        "Pikat kryesore të ngjarjes bëhen të ndashme pas përfundimit të ngjarjes.",
      "Event not found or you do not have permission.":
        "Ngjarja nuk u gjet ose nuk keni leje.",
      "Event not found.": "Ngjarja nuk u gjet.",
      "Event participants could not be loaded.":
        "Pjesëmarrësit e ngjarjes nuk mund të ngarkoheshin.",
      "Approved event content could not be loaded.":
        "Përmbajtja e miratuar e ngjarjes nuk mund të ngarkohej.",
      "Photo likes could not be loaded.":
        "Pëlqimet e fotografive nuk mund të ngarkoheshin.",
    },
    mk: {
      "Event Highlights": "Определување на настани",
      "Event Highlights — SnapUp Events":
        "Определување настани - SnapUp настани",
      "Most liked photo, top uploader and event summary":
        "Најдопадна фотографија, врвен прикачувач и резиме на настанот",
      "Highlights are ready to share":
        "Најдобрите моменти се подготвени за споделување",
      "Private preview until the event ends":
        "Приватен преглед до завршување на настанот",
      Back: "Назад",
      "Share Highlights": "Сподели Определување",
      "Preparing Event Highlights...":
        "Подготовка на најважните моменти од настанот...",
      "Collecting the best moments from this event.":
        "Собирање на најдобрите моменти од овој настан.",
      "Highlights could not be loaded":
        "Најдобрите моменти не може да се вчитаат",
      "Please check the link and try again.":
        "Проверете ја врската и обидете се повторно.",
      "Back to Home": "Назад кон дома",
      "PRIVATE PREVIEW": "ПРИВАТЕН ПРЕГЛЕД",
      SHAREABLE: "СПОДЕЛИ",
      "Private owner preview": "Преглед на приватен сопственик",
      "End the event to make this page shareable with guests.":
        "Завршете го настанот за да ја споделите оваа страница со гостите.",
      "By the numbers": "Според бројките",
      "Event Summary": "Резиме на настанот",
      Participants: "Учесници",
      Photos: "Фотографии",
      Videos: "Видеа",
      Comments: "Коментари",
      "Event winners": "Победници на настанот",
      "Guest favorite": "Омилен на гостите",
      "Most Liked Photo": "Најлајкувана фотографија",
      "Most liked event photo": "Фотографија од настанот со најмногу лајкови",
      "No liked photo yet": "Сè уште нема омилена фотографија",
      "The winner will appear after guests like an approved photo.":
        "Победникот ќе се појави по гостите како одобрена фотографија.",
      "Shared by": "Споделено од",
      "Memory maker": "Креатор на меморија",
      "Top Photo Uploader": "Врвен прикачувач на фотографии",
      "Most active photographer": "Најактивен фотограф",
      "No uploader yet": "Сè уште нема поставувач",
      "Approved photo uploads will be counted here.":
        "Овде ќе се бројат одобрените прикачувања на фотографии.",
      "Photos uploaded": "Поставени фотографии",
      "Every guest. Every moment. One shared album.":
        "Секој гостин. Секој момент. Еден заеднички албум.",
      "Share after event ends": "Споделете по завршувањето на настанот",
      "See the highlights from this event.":
        "Погледнете ги главните моменти од овој настан.",
      "Highlights link copied.": "Врската за нагласување е копирана.",
      "Highlights link could not be copied.":
        "Врската за нагласување не може да се копира.",
      "{name} shared the most approved photos from this event.":
        "{name} ги сподели најмногу одобрените фотографии од овој настан.",
      "Date not specified": "Датумот не е наведен",
      "A valid Highlights link is required.":
        "Потребна е валидна врска за Определување.",
      "Event Highlights could not be loaded.":
        "Нагласените настани не може да се вчитаат.",
      "Event Highlights becomes shareable after the event is ended.":
        "Определувањето на настаните може да се сподели по завршувањето на настанот.",
      "Event not found or you do not have permission.":
        "Настанот не е пронајден или немате дозвола.",
      "Event not found.": "Настанот не е пронајден.",
      "Event participants could not be loaded.":
        "Учесниците на настанот не можеа да се вчитаат.",
      "Approved event content could not be loaded.":
        "Содржината на одобрениот настан не може да се вчита.",
      "Photo likes could not be loaded.":
        "Не можеше да се вчитаат допаѓања на фотографии.",
    },
    hi: {
      "Event Highlights": "घटना की मुख्य बातें",
      "Event Highlights — SnapUp Events":
        "इवेंट की मुख्य विशेषताएं - स्नैपअप इवेंट",
      "Most liked photo, top uploader and event summary":
        "सर्वाधिक पसंद किया गया फ़ोटो, शीर्ष अपलोडर और ईवेंट सारांश",
      "Highlights are ready to share": "हाइलाइट्स साझा करने के लिए तैयार हैं",
      "Private preview until the event ends":
        "ईवेंट समाप्त होने तक निजी पूर्वावलोकन",
      Back: "वापस",
      "Share Highlights": "हाइलाइट्स साझा करें",
      "Preparing Event Highlights...":
        "इवेंट की मुख्य बातें तैयार की जा रही हैं...",
      "Collecting the best moments from this event.":
        "इस आयोजन से सर्वोत्तम क्षण एकत्रित कर रहा हूँ।",
      "Highlights could not be loaded": "हाइलाइट्स लोड नहीं किए जा सके",
      "Please check the link and try again.":
        "कृपया लिंक की जाँच करें और पुनः प्रयास करें।",
      "Back to Home": "घर वापस",
      "PRIVATE PREVIEW": "निजी पूर्वावलोकन",
      SHAREABLE: "साझा करने योग्य",
      "Private owner preview": "निजी स्वामी पूर्वावलोकन",
      "End the event to make this page shareable with guests.":
        "इस पेज को मेहमानों के साथ साझा करने योग्य बनाने के लिए ईवेंट समाप्त करें।",
      "By the numbers": "संख्याओं द्वारा",
      "Event Summary": "घटना सारांश",
      Participants: "प्रतिभागियों",
      Photos: "तस्वीरें",
      Videos: "वीडियो",
      Comments: "टिप्पणियाँ",
      "Event winners": "इवेंट विजेता",
      "Guest favorite": "अतिथि पसंदीदा",
      "Most Liked Photo": "सर्वाधिक पसंद किया गया फोटो",
      "Most liked event photo": "सर्वाधिक पसंद किया गया इवेंट फ़ोटो",
      "No liked photo yet": "अभी तक कोई फोटो पसंद नहीं आया",
      "The winner will appear after guests like an approved photo.":
        "विजेता एक अनुमोदित फोटो की तरह मेहमानों के बाद दिखाई देगा।",
      "Shared by": "द्वारा साझा किया गया",
      "Memory maker": "स्मृति निर्माता",
      "Top Photo Uploader": "शीर्ष फ़ोटो अपलोडर",
      "Most active photographer": "सबसे सक्रिय फ़ोटोग्राफ़र",
      "No uploader yet": "अभी तक कोई अपलोडर नहीं",
      "Approved photo uploads will be counted here.":
        "स्वीकृत फोटो अपलोड की गणना यहां की जाएगी।",
      "Photos uploaded": "तस्वीरें अपलोड की गईं",
      "Every guest. Every moment. One shared album.":
        "हर मेहमान. हर क्षण। एक साझा एल्बम.",
      "Share after event ends": "ईवेंट समाप्त होने के बाद साझा करें",
      "See the highlights from this event.": "देखें इस इवेंट की मुख्य बातें.",
      "Highlights link copied.": "हाइलाइट लिंक कॉपी किया गया.",
      "Highlights link could not be copied.":
        "हाइलाइट लिंक कॉपी नहीं किया जा सका.",
      "{name} shared the most approved photos from this event.":
        "{name} ने इस इवेंट से सर्वाधिक स्वीकृत तस्वीरें साझा कीं।",
      "Date not specified": "तिथि निर्दिष्ट नहीं है",
      "A valid Highlights link is required.":
        "एक वैध हाइलाइट्स लिंक आवश्यक है.",
      "Event Highlights could not be loaded.":
        "इवेंट हाइलाइट्स लोड नहीं किए जा सके.",
      "Event Highlights becomes shareable after the event is ended.":
        "इवेंट समाप्त होने के बाद इवेंट हाइलाइट्स साझा करने योग्य हो जाते हैं।",
      "Event not found or you do not have permission.":
        "ईवेंट नहीं मिला या आपके पास अनुमति नहीं है.",
      "Event not found.": "इवेंट नहीं मिला.",
      "Event participants could not be loaded.":
        "इवेंट प्रतिभागियों को लोड नहीं किया जा सका.",
      "Approved event content could not be loaded.":
        "स्वीकृत ईवेंट सामग्री लोड नहीं की जा सकी.",
      "Photo likes could not be loaded.": "फ़ोटो लाइक लोड नहीं किए जा सके.",
    },
    ur: {
      "Event Highlights": "واقعہ کی جھلکیاں",
      "Event Highlights — SnapUp Events": "ایونٹ کی جھلکیاں — سنیپ اپ ایونٹس",
      "Most liked photo, top uploader and event summary":
        "سب سے زیادہ پسند کی گئی تصویر، ٹاپ اپ لوڈر اور ایونٹ کا خلاصہ",
      "Highlights are ready to share": "جھلکیاں اشتراک کے لیے تیار ہیں۔",
      "Private preview until the event ends": "ایونٹ ختم ہونے تک نجی پیش نظارہ",
      Back: "پیچھے",
      "Share Highlights": "جھلکیاں شیئر کریں۔",
      "Preparing Event Highlights...": "ایونٹ کی جھلکیاں تیار ہو رہی ہیں...",
      "Collecting the best moments from this event.":
        "اس ایونٹ سے بہترین لمحات جمع کرنا۔",
      "Highlights could not be loaded": "ہائی لائٹس کو لوڈ نہیں کیا جا سکا",
      "Please check the link and try again.":
        "براہ کرم لنک چیک کریں اور دوبارہ کوشش کریں۔",
      "Back to Home": "واپس گھر پر",
      "PRIVATE PREVIEW": "پرائیویٹ پیش نظارہ",
      SHAREABLE: "قابل اشتراک",
      "Private owner preview": "نجی مالک کا پیش نظارہ",
      "End the event to make this page shareable with guests.":
        "اس صفحہ کو مہمانوں کے ساتھ شیئر کرنے کے قابل بنانے کے لیے ایونٹ کا اختتام کریں۔",
      "By the numbers": "نمبروں سے",
      "Event Summary": "واقعہ کا خلاصہ",
      Participants: "شرکاء",
      Photos: "تصاویر",
      Videos: "ویڈیوز",
      Comments: "تبصرے",
      "Event winners": "ایونٹ کے فاتحین",
      "Guest favorite": "مہمان کا پسندیدہ",
      "Most Liked Photo": "سب سے زیادہ پسند کی جانے والی تصویر",
      "Most liked event photo": "سب سے زیادہ پسند کی جانے والی تقریب کی تصویر",
      "No liked photo yet": "ابھی تک کوئی پسند نہیں کی گئی تصویر",
      "The winner will appear after guests like an approved photo.":
        "فاتح ایک منظور شدہ تصویر کی طرح مہمانوں کے بعد ظاہر ہوگا۔",
      "Shared by": "کے ذریعے اشتراک کیا گیا۔",
      "Memory maker": "میموری بنانے والا",
      "Top Photo Uploader": "ٹاپ فوٹو اپ لوڈر",
      "Most active photographer": "سب سے زیادہ متحرک فوٹوگرافر",
      "No uploader yet": "ابھی تک کوئی اپ لوڈر نہیں ہے۔",
      "Approved photo uploads will be counted here.":
        "منظور شدہ تصویر اپ لوڈز کو یہاں شمار کیا جائے گا۔",
      "Photos uploaded": "تصاویر اپ لوڈ ہو گئیں۔",
      "Every guest. Every moment. One shared album.":
        "ہر مہمان۔ ہر لمحہ۔ ایک مشترکہ البم۔",
      "Share after event ends": "واقعہ ختم ہونے کے بعد شئیر کریں۔",
      "See the highlights from this event.": "اس تقریب کی جھلکیاں دیکھیں۔",
      "Highlights link copied.": "ہائی لائٹس کا لنک کاپی ہو گیا۔",
      "Highlights link could not be copied.":
        "ہائی لائٹس کا لنک کاپی نہیں کیا جا سکا۔",
      "{name} shared the most approved photos from this event.":
        "{name} نے اس ایونٹ کی سب سے زیادہ منظور شدہ تصاویر کا اشتراک کیا۔",
      "Date not specified": "تاریخ متعین نہیں ہے۔",
      "A valid Highlights link is required.":
        "ایک درست ہائی لائٹس کا لنک درکار ہے۔",
      "Event Highlights could not be loaded.":
        "ایونٹ کی جھلکیاں لوڈ نہیں ہو سکیں۔",
      "Event Highlights becomes shareable after the event is ended.":
        "ایونٹ ختم ہونے کے بعد ایونٹ کی جھلکیاں قابل اشتراک ہو جاتی ہیں۔",
      "Event not found or you do not have permission.":
        "واقعہ نہیں ملا یا آپ کو اجازت نہیں ہے۔",
      "Event not found.": "واقعہ نہیں ملا۔",
      "Event participants could not be loaded.":
        "ایونٹ کے شرکاء کو لوڈ نہیں کیا جا سکا۔",
      "Approved event content could not be loaded.":
        "منظور شدہ ایونٹ کا مواد لوڈ نہیں کیا جا سکا۔",
      "Photo likes could not be loaded.":
        "تصویر کی پسندیدگیوں کو لوڈ نہیں کیا جا سکا۔",
    },
    fa: {
      "Event Highlights": "نکات برجسته رویداد",
      "Event Highlights — SnapUp Events": "رویدادهای برجسته - رویدادهای SnapUp",
      "Most liked photo, top uploader and event summary":
        "عکس، آپلودکننده برتر و خلاصه رویداد",
      "Highlights are ready to share": "نکات برجسته آماده اشتراک گذاری است",
      "Private preview until the event ends": "پیش نمایش خصوصی تا پایان رویداد",
      Back: "برگشت",
      "Share Highlights": "نکات برجسته را به اشتراک بگذارید",
      "Preparing Event Highlights...": "در حال آماده سازی رویدادهای برجسته...",
      "Collecting the best moments from this event.":
        "جمع آوری بهترین لحظات از این رویداد.",
      "Highlights could not be loaded": "موارد برجسته بارگیری نشد",
      "Please check the link and try again.":
        "لطفا پیوند را بررسی کنید و دوباره امتحان کنید.",
      "Back to Home": "بازگشت به خانه",
      "PRIVATE PREVIEW": "پیش نمایش خصوصی",
      SHAREABLE: "قابل اشتراک گذاری",
      "Private owner preview": "پیش نمایش مالک خصوصی",
      "End the event to make this page shareable with guests.":
        "رویداد را پایان دهید تا این صفحه با مهمانان قابل اشتراک‌گذاری شود.",
      "By the numbers": "با اعداد",
      "Event Summary": "خلاصه رویداد",
      Participants: "شرکت کنندگان",
      Photos: "عکس ها",
      Videos: "ویدیوها",
      Comments: "نظرات",
      "Event winners": "برندگان رویداد",
      "Guest favorite": "مورد علاقه مهمان",
      "Most Liked Photo": "عکس با بیشترین لایک",
      "Most liked event photo": "عکس رویداد بیشترین پسندیده شده",
      "No liked photo yet": "هنوز عکس پسندیده ای وجود ندارد",
      "The winner will appear after guests like an approved photo.":
        "برنده پس از مهمانان مانند یک عکس تایید شده ظاهر می شود.",
      "Shared by": "به اشتراک گذاشته شده توسط",
      "Memory maker": "حافظه ساز",
      "Top Photo Uploader": "آپلود کننده عکس برتر",
      "Most active photographer": "فعال ترین عکاس",
      "No uploader yet": "هنوز آپلود کننده ای وجود ندارد",
      "Approved photo uploads will be counted here.":
        "آپلود عکس های تایید شده در اینجا شمارش می شود.",
      "Photos uploaded": "عکس ها آپلود شد",
      "Every guest. Every moment. One shared album.":
        "هر مهمان هر لحظه یک آلبوم مشترک",
      "Share after event ends": "اشتراک گذاری پس از پایان رویداد",
      "See the highlights from this event.": "نکات مهم این رویداد را ببینید.",
      "Highlights link copied.": "پیوندهای برجسته کپی شد.",
      "Highlights link could not be copied.": "پیوند نکات برجسته کپی نشد.",
      "{name} shared the most approved photos from this event.":
        "{name} بیشترین عکس های مورد تایید را از این رویداد به اشتراک گذاشت.",
      "Date not specified": "تاریخ مشخص نشده است",
      "A valid Highlights link is required.":
        "یک پیوند برجسته معتبر مورد نیاز است.",
      "Event Highlights could not be loaded.":
        "موارد برجسته رویداد بارگیری نشد.",
      "Event Highlights becomes shareable after the event is ended.":
        "رویدادهای برجسته پس از پایان رویداد قابل اشتراک‌گذاری می‌شوند.",
      "Event not found or you do not have permission.":
        "رویداد یافت نشد یا مجوز ندارید.",
      "Event not found.": "رویداد یافت نشد",
      "Event participants could not be loaded.":
        "شرکت‌کنندگان رویداد بارگیری نشدند.",
      "Approved event content could not be loaded.":
        "محتوای رویداد تأیید شده بارگیری نشد.",
      "Photo likes could not be loaded.": "لایک های عکس بارگیری نشد.",
    },
    ja: {
      "Event Highlights": "イベントのハイライト",
      "Event Highlights — SnapUp Events":
        "イベントのハイライト — SnapUp イベント",
      "Most liked photo, top uploader and event summary":
        "最も高く評価された写真、トップアップローダー、イベント概要",
      "Highlights are ready to share": "ハイライトを共有する準備ができました",
      "Private preview until the event ends":
        "イベント終了までプライベートプレビュー",
      Back: "戻る",
      "Share Highlights": "ハイライトを共有する",
      "Preparing Event Highlights...":
        "イベントのハイライトを準備しています...",
      "Collecting the best moments from this event.":
        "このイベントの最高の瞬間を集めました。",
      "Highlights could not be loaded": "ハイライトを読み込めませんでした",
      "Please check the link and try again.":
        "リンクを確認して、もう一度お試しください。",
      "Back to Home": "ホームに戻る",
      "PRIVATE PREVIEW": "プライベートプレビュー",
      SHAREABLE: "共有可能",
      "Private owner preview": "個人所有者のプレビュー",
      "End the event to make this page shareable with guests.":
        "イベントを終了すると、このページがゲストと共有できるようになります。",
      "By the numbers": "数字で見ると",
      "Event Summary": "イベント概要",
      Participants: "参加者",
      Photos: "写真",
      Videos: "動画",
      Comments: "コメント",
      "Event winners": "イベントの優勝者",
      "Guest favorite": "ゲストのお気に入り",
      "Most Liked Photo": "最も気に入った写真",
      "Most liked event photo": "最も「いいね！」が多かったイベントの写真",
      "No liked photo yet": "「いいね！」の写真はまだありません",
      "The winner will appear after guests like an approved photo.":
        "ゲストが承認された写真にいいねをした後、勝者が表示されます。",
      "Shared by": "共有者",
      "Memory maker": "メモリーメーカー",
      "Top Photo Uploader": "トップ写真アップローダー",
      "Most active photographer": "最も活躍する写真家",
      "No uploader yet": "まだアップローダーがありません",
      "Approved photo uploads will be counted here.":
        "承認された写真のアップロードはここでカウントされます。",
      "Photos uploaded": "アップロードされた写真",
      "Every guest. Every moment. One shared album.":
        "ゲスト全員。あらゆる瞬間。 1 つの共有アルバム。",
      "Share after event ends": "イベント終了後にシェアする",
      "See the highlights from this event.":
        "このイベントのハイライトをご覧ください。",
      "Highlights link copied.": "コピーされたリンクを強調表示します。",
      "Highlights link could not be copied.":
        "ハイライトのリンクをコピーできませんでした。",
      "{name} shared the most approved photos from this event.":
        "{name} は、このイベントで最も承認された写真を共有しました。",
      "Date not specified": "日付は指定されていません",
      "A valid Highlights link is required.":
        "有効なハイライト リンクが必要です。",
      "Event Highlights could not be loaded.":
        "イベント ハイライトを読み込めませんでした。",
      "Event Highlights becomes shareable after the event is ended.":
        "イベントハイライトはイベント終了後に共有可能になります。",
      "Event not found or you do not have permission.":
        "イベントが見つからないか、権限がありません。",
      "Event not found.": "イベントが見つかりません。",
      "Event participants could not be loaded.":
        "イベント参加者をロードできませんでした。",
      "Approved event content could not be loaded.":
        "承認されたイベント コンテンツを読み込むことができませんでした。",
      "Photo likes could not be loaded.":
        "写真の「いいね！」を読み込めませんでした。",
    },
    zh: {
      "Event Highlights": "活动亮点",
      "Event Highlights — SnapUp Events": "活动亮点 — SnapUp 活动",
      "Most liked photo, top uploader and event summary":
        "最喜欢的照片、热门上传者和活动摘要",
      "Highlights are ready to share": "亮点已准备好分享",
      "Private preview until the event ends": "私人预览直至活动结束",
      Back: "返回",
      "Share Highlights": "分享亮点",
      "Preparing Event Highlights...": "准备活动亮点...",
      "Collecting the best moments from this event.":
        "收集本次活动的最美好的瞬间。",
      "Highlights could not be loaded": "无法加载精彩集锦",
      "Please check the link and try again.": "请检查链接并重试。",
      "Back to Home": "返回首页",
      "PRIVATE PREVIEW": "私人预览",
      SHAREABLE: "可分享",
      "Private owner preview": "私人业主预览",
      "End the event to make this page shareable with guests.":
        "结束活动以使此页面可与来宾共享。",
      "By the numbers": "从数字来看",
      "Event Summary": "活动概要",
      Participants: "参加者",
      Photos: "照片",
      Videos: "视频",
      Comments: "评论",
      "Event winners": "活动获奖者",
      "Guest favorite": "客人最爱",
      "Most Liked Photo": "最喜欢的照片",
      "Most liked event photo": "最喜欢的活动照片",
      "No liked photo yet": "还没有喜欢的照片",
      "The winner will appear after guests like an approved photo.":
        "获奖者将在客人对批准的照片点赞后出现。",
      "Shared by": "分享者",
      "Memory maker": "内存制造商",
      "Top Photo Uploader": "顶级照片上传者",
      "Most active photographer": "最活跃的摄影师",
      "No uploader yet": "还没有上传者",
      "Approved photo uploads will be counted here.":
        "已批准的照片上传将计入此处。",
      "Photos uploaded": "照片已上传",
      "Every guest. Every moment. One shared album.":
        "每位客人。每一刻。一张共享专辑。",
      "Share after event ends": "活动结束后分享",
      "See the highlights from this event.": "查看本次活动的亮点。",
      "Highlights link copied.": "已复制突出显示链接。",
      "Highlights link could not be copied.": "无法复制亮点链接。",
      "{name} shared the most approved photos from this event.":
        "{name} 分享了本次活动中最受欢迎的照片。",
      "Date not specified": "未指定日期",
      "A valid Highlights link is required.": "需要有效的亮点链接。",
      "Event Highlights could not be loaded.": "无法加载活动亮点。",
      "Event Highlights becomes shareable after the event is ended.":
        "活动结束后，活动亮点即可共享。",
      "Event not found or you do not have permission.":
        "未找到活动或您没有权限。",
      "Event not found.": "未找到事件。",
      "Event participants could not be loaded.": "无法加载活动参与者。",
      "Approved event content could not be loaded.":
        "无法加载已批准的活动内容。",
      "Photo likes could not be loaded.": "无法加载喜欢的照片。",
    },
    ko: {
      "Event Highlights": "이벤트 하이라이트",
      "Event Highlights — SnapUp Events": "이벤트 하이라이트 — SnapUp 이벤트",
      "Most liked photo, top uploader and event summary":
        "가장 좋아요를 많이 받은 사진, 상위 업로더, 이벤트 요약",
      "Highlights are ready to share": "하이라이트를 공유할 준비가 되었습니다.",
      "Private preview until the event ends": "이벤트 종료까지 비공개 미리보기",
      Back: "뒤로",
      "Share Highlights": "하이라이트 공유",
      "Preparing Event Highlights...": "이벤트 하이라이트 준비 중...",
      "Collecting the best moments from this event.":
        "이번 행사의 최고의 순간을 모아봤습니다.",
      "Highlights could not be loaded": "하이라이트를 로드할 수 없습니다.",
      "Please check the link and try again.":
        "링크를 확인하신 후 다시 시도해 주세요.",
      "Back to Home": "홈으로 돌아가기",
      "PRIVATE PREVIEW": "비공개 미리보기",
      SHAREABLE: "공유 가능",
      "Private owner preview": "개인 소유자 미리보기",
      "End the event to make this page shareable with guests.":
        "이 페이지를 게스트와 공유할 수 있도록 이벤트를 종료하세요.",
      "By the numbers": "숫자로",
      "Event Summary": "이벤트 요약",
      Participants: "참가자",
      Photos: "사진",
      Videos: "비디오",
      Comments: "댓글",
      "Event winners": "이벤트 당첨자",
      "Guest favorite": "손님이 가장 좋아하는",
      "Most Liked Photo": "가장 좋아하는 사진",
      "Most liked event photo": "가장 좋아요가 많은 이벤트 사진",
      "No liked photo yet": "아직 좋아요 표시한 사진이 없습니다.",
      "The winner will appear after guests like an approved photo.":
        "당첨자는 승인된 사진처럼 게스트 이후에 나타납니다.",
      "Shared by": "공유자:",
      "Memory maker": "메모리메이커",
      "Top Photo Uploader": "최고의 사진 업로더",
      "Most active photographer": "가장 활동적인 사진작가",
      "No uploader yet": "아직 업로더가 없습니다.",
      "Approved photo uploads will be counted here.":
        "승인된 사진 업로드가 여기에 계산됩니다.",
      "Photos uploaded": "업로드된 사진",
      "Every guest. Every moment. One shared album.":
        "모든 손님. 매 순간. 공유 앨범 1개",
      "Share after event ends": "이벤트 종료 후 공유",
      "See the highlights from this event.":
        "이번 행사의 주요 내용을 확인하세요.",
      "Highlights link copied.": "하이라이트 링크가 복사되었습니다.",
      "Highlights link could not be copied.":
        "하이라이트 링크를 복사할 수 없습니다.",
      "{name} shared the most approved photos from this event.":
        "{name}는 이 이벤트에서 가장 많이 승인된 사진을 공유했습니다.",
      "Date not specified": "날짜가 지정되지 않았습니다.",
      "A valid Highlights link is required.":
        "유효한 하이라이트 링크가 필요합니다.",
      "Event Highlights could not be loaded.":
        "이벤트 하이라이트를 로드할 수 없습니다.",
      "Event Highlights becomes shareable after the event is ended.":
        "이벤트 하이라이트는 이벤트가 종료된 후에 공유할 수 있습니다.",
      "Event not found or you do not have permission.":
        "이벤트를 찾을 수 없거나 권한이 없습니다.",
      "Event not found.": "이벤트를 찾을 수 없습니다.",
      "Event participants could not be loaded.":
        "이벤트 참가자를 로드할 수 없습니다.",
      "Approved event content could not be loaded.":
        "승인된 이벤트 콘텐츠를 로드할 수 없습니다.",
      "Photo likes could not be loaded.":
        "좋아요를 누른 사진을 로드할 수 없습니다.",
    },
    pt: {
      "Event Highlights": "Destaques do evento",
      "Event Highlights — SnapUp Events":
        "Destaques do evento – Eventos SnapUp",
      "Most liked photo, top uploader and event summary":
        "Foto mais curtida, principal uploader e resumo do evento",
      "Highlights are ready to share":
        "Os destaques estão prontos para serem compartilhados",
      "Private preview until the event ends":
        "Visualização privada até o final do evento",
      Back: "Voltar",
      "Share Highlights": "Compartilhar destaques",
      "Preparing Event Highlights...": "Preparando destaques do evento...",
      "Collecting the best moments from this event.":
        "Coletando os melhores momentos deste evento.",
      "Highlights could not be loaded":
        "Não foi possível carregar os destaques",
      "Please check the link and try again.":
        "Verifique o link e tente novamente.",
      "Back to Home": "De volta para casa",
      "PRIVATE PREVIEW": "PRÉVIA PRIVADA",
      SHAREABLE: "COMPARTILHÁVEL",
      "Private owner preview": "Visualização privada do proprietário",
      "End the event to make this page shareable with guests.":
        "Encerre o evento para tornar esta página compartilhável com os convidados.",
      "By the numbers": "Pelos números",
      "Event Summary": "Resumo do Evento",
      Participants: "Participantes",
      Photos: "Fotos",
      Videos: "Vídeos",
      Comments: "Comentários",
      "Event winners": "Vencedores do evento",
      "Guest favorite": "Favorito dos convidados",
      "Most Liked Photo": "Foto mais curtida",
      "Most liked event photo": "Foto do evento mais curtida",
      "No liked photo yet": "Nenhuma foto curtida ainda",
      "The winner will appear after guests like an approved photo.":
        "O vencedor aparecerá após os convidados curtirem uma foto aprovada.",
      "Shared by": "Compartilhado por",
      "Memory maker": "Criador de memória",
      "Top Photo Uploader": "Melhor carregador de fotos",
      "Most active photographer": "Fotógrafo mais ativo",
      "No uploader yet": "Nenhum uploader ainda",
      "Approved photo uploads will be counted here.":
        "Os uploads de fotos aprovados serão contados aqui.",
      "Photos uploaded": "Fotos enviadas",
      "Every guest. Every moment. One shared album.":
        "Cada convidado. Cada momento. Um álbum compartilhado.",
      "Share after event ends": "Compartilhe após o término do evento",
      "See the highlights from this event.": "Veja os destaques deste evento.",
      "Highlights link copied.": "Link de destaques copiado.",
      "Highlights link could not be copied.":
        "O link dos destaques não pôde ser copiado.",
      "{name} shared the most approved photos from this event.":
        "{name} compartilhou as fotos mais aprovadas deste evento.",
      "Date not specified": "Data não especificada",
      "A valid Highlights link is required.":
        "É necessário um link de destaques válido.",
      "Event Highlights could not be loaded.":
        "Não foi possível carregar os destaques do evento.",
      "Event Highlights becomes shareable after the event is ended.":
        "Os destaques do evento tornam-se compartilháveis ​​após o término do evento.",
      "Event not found or you do not have permission.":
        "Evento não encontrado ou você não tem permissão.",
      "Event not found.": "Evento não encontrado.",
      "Event participants could not be loaded.":
        "Não foi possível carregar os participantes do evento.",
      "Approved event content could not be loaded.":
        "Não foi possível carregar o conteúdo do evento aprovado.",
      "Photo likes could not be loaded.":
        "Não foi possível carregar as curtidas de fotos.",
    },
    ru: {
      "Event Highlights": "Основные моменты мероприятия",
      "Event Highlights — SnapUp Events":
        "Основные моменты событий — SnapUp Events",
      "Most liked photo, top uploader and event summary":
        "Самая популярная фотография, список пользователей, загрузивших больше всего, и сводка событий",
      "Highlights are ready to share": "Основные моменты готовы поделиться",
      "Private preview until the event ends":
        "Частный предварительный просмотр до окончания мероприятия",
      Back: "Назад",
      "Share Highlights": "Поделиться",
      "Preparing Event Highlights...":
        "Подготовка основных моментов мероприятия...",
      "Collecting the best moments from this event.":
        "Собираем лучшие моменты с этого мероприятия.",
      "Highlights could not be loaded": "Не удалось загрузить основные моменты",
      "Please check the link and try again.":
        "Пожалуйста, проверьте ссылку и повторите попытку.",
      "Back to Home": "Вернуться домой",
      "PRIVATE PREVIEW": "ЧАСТНЫЙ ПРОСМОТР",
      SHAREABLE: "РАЗДЕЛЯЕМЫЙ",
      "Private owner preview": "Предварительный просмотр частного владельца",
      "End the event to make this page shareable with guests.":
        "Завершите мероприятие, чтобы сделать эту страницу доступной для гостей.",
      "By the numbers": "По цифрам",
      "Event Summary": "Сводка событий",
      Participants: "Участники",
      Photos: "Фотографии",
      Videos: "Видео",
      Comments: "Комментарии",
      "Event winners": "Победители мероприятия",
      "Guest favorite": "Гость избранный",
      "Most Liked Photo": "Самая популярная фотография",
      "Most liked event photo": "Самая популярная фотография с мероприятия",
      "No liked photo yet": "Еще нет понравившейся фотографии",
      "The winner will appear after guests like an approved photo.":
        "Победитель появится после гостей как одобренная фотография.",
      "Shared by": "Поделились",
      "Memory maker": "Создатель памяти",
      "Top Photo Uploader": "Лучший загрузчик фотографий",
      "Most active photographer": "Самый активный фотограф",
      "No uploader yet": "Пока нет загрузчика",
      "Approved photo uploads will be counted here.":
        "Здесь будут учитываться одобренные загрузки фотографий.",
      "Photos uploaded": "Фотографии загружены",
      "Every guest. Every moment. One shared album.":
        "Каждый гость. Каждый момент. Один общий альбом.",
      "Share after event ends": "Поделиться после окончания мероприятия",
      "See the highlights from this event.":
        "Посмотрите основные моменты этого мероприятия.",
      "Highlights link copied.": "Ссылка на основные моменты скопирована.",
      "Highlights link could not be copied.":
        "Не удалось скопировать ссылку «Основные моменты».",
      "{name} shared the most approved photos from this event.":
        "{name} поделился наиболее одобренными фотографиями с этого мероприятия.",
      "Date not specified": "Дата не указана",
      "A valid Highlights link is required.":
        "Требуется действительная ссылка на основные моменты.",
      "Event Highlights could not be loaded.":
        "Не удалось загрузить основные моменты событий.",
      "Event Highlights becomes shareable after the event is ended.":
        "«Основные моменты событий» становятся доступными после завершения мероприятия.",
      "Event not found or you do not have permission.":
        "Событие не найдено или у вас нет разрешения.",
      "Event not found.": "Событие не найдено.",
      "Event participants could not be loaded.":
        "Не удалось загрузить участников мероприятия.",
      "Approved event content could not be loaded.":
        "Не удалось загрузить утвержденный контент мероприятия.",
      "Photo likes could not be loaded.": "Не удалось загрузить фото лайков.",
    },
    id: {
      "Event Highlights": "Sorotan Acara",
      "Event Highlights — SnapUp Events": "Sorotan Acara — Acara SnapUp",
      "Most liked photo, top uploader and event summary":
        "Foto yang paling disukai, pengunggah teratas, dan ringkasan acara",
      "Highlights are ready to share": "Sorotan siap dibagikan",
      "Private preview until the event ends":
        "Pratinjau pribadi hingga acara berakhir",
      Back: "Kembali",
      "Share Highlights": "Bagikan Sorotan",
      "Preparing Event Highlights...": "Mempersiapkan Sorotan Acara...",
      "Collecting the best moments from this event.":
        "Mengumpulkan momen-momen terbaik dari acara ini.",
      "Highlights could not be loaded": "Sorotan tidak dapat dimuat",
      "Please check the link and try again.":
        "Silakan periksa tautannya dan coba lagi.",
      "Back to Home": "Kembali ke Rumah",
      "PRIVATE PREVIEW": "PREVIEW PRIBADI",
      SHAREABLE: "DAPAT DIBAGIKAN",
      "Private owner preview": "Pratinjau pemilik pribadi",
      "End the event to make this page shareable with guests.":
        "Akhiri acara agar halaman ini dapat dibagikan kepada tamu.",
      "By the numbers": "Berdasarkan angka",
      "Event Summary": "Ringkasan Acara",
      Participants: "Peserta",
      Photos: "Foto",
      Videos: "Video",
      Comments: "Komentar",
      "Event winners": "Pemenang acara",
      "Guest favorite": "Favorit tamu",
      "Most Liked Photo": "Foto Paling Banyak Disukai",
      "Most liked event photo": "Foto acara yang paling disukai",
      "No liked photo yet": "Belum ada foto yang disukai",
      "The winner will appear after guests like an approved photo.":
        "Pemenang akan muncul setelah tamu menyukai foto yang disetujui.",
      "Shared by": "Dibagikan oleh",
      "Memory maker": "Pembuat memori",
      "Top Photo Uploader": "Pengunggah Foto Teratas",
      "Most active photographer": "Fotografer paling aktif",
      "No uploader yet": "Belum ada pengunggah",
      "Approved photo uploads will be counted here.":
        "Upload foto yang disetujui akan dihitung di sini.",
      "Photos uploaded": "Foto diunggah",
      "Every guest. Every moment. One shared album.":
        "Setiap tamu. Setiap saat. Satu album bersama.",
      "Share after event ends": "Bagikan setelah acara berakhir",
      "See the highlights from this event.": "Lihat highlight dari acara ini.",
      "Highlights link copied.": "Tautan sorotan disalin.",
      "Highlights link could not be copied.":
        "Tautan sorotan tidak dapat disalin.",
      "{name} shared the most approved photos from this event.":
        "{name} membagikan foto yang paling disetujui dari acara ini.",
      "Date not specified": "Tanggal tidak ditentukan",
      "A valid Highlights link is required.":
        "Tautan Sorotan yang valid diperlukan.",
      "Event Highlights could not be loaded.":
        "Sorotan Acara tidak dapat dimuat.",
      "Event Highlights becomes shareable after the event is ended.":
        "Sorotan Acara dapat dibagikan setelah acara berakhir.",
      "Event not found or you do not have permission.":
        "Acara tidak ditemukan atau Anda tidak memiliki izin.",
      "Event not found.": "Acara tidak ditemukan.",
      "Event participants could not be loaded.":
        "Peserta acara tidak dapat dimuat.",
      "Approved event content could not be loaded.":
        "Konten acara yang disetujui tidak dapat dimuat.",
      "Photo likes could not be loaded.": "Suka foto tidak dapat dimuat.",
    },
    pl: {
      "Event Highlights": "Najważniejsze wydarzenia",
      "Event Highlights — SnapUp Events":
        "Najważniejsze wydarzenia — wydarzenia SnapUp",
      "Most liked photo, top uploader and event summary":
        "Najbardziej lubiane zdjęcie, najczęściej przesyłający i podsumowanie wydarzenia",
      "Highlights are ready to share":
        "Najciekawsze momenty są gotowe do udostępnienia",
      "Private preview until the event ends":
        "Prywatny podgląd do zakończenia wydarzenia",
      Back: "Powrót",
      "Share Highlights": "Udostępnij najważniejsze informacje",
      "Preparing Event Highlights...":
        "Przygotowywanie najważniejszych wydarzeń...",
      "Collecting the best moments from this event.":
        "Kolekcjonujemy najlepsze momenty z tego wydarzenia.",
      "Highlights could not be loaded":
        "Nie udało się załadować najciekawszych momentów",
      "Please check the link and try again.":
        "Sprawdź link i spróbuj ponownie.",
      "Back to Home": "Powrót do domu",
      "PRIVATE PREVIEW": "PODGLĄD PRYWATNY",
      SHAREABLE: "UDOSTĘPNIANE",
      "Private owner preview": "Podgląd prywatnego właściciela",
      "End the event to make this page shareable with guests.":
        "Zakończ wydarzenie, aby udostępnić tę stronę gościom.",
      "By the numbers": "Według liczb",
      "Event Summary": "Podsumowanie wydarzenia",
      Participants: "Uczestnicy",
      Photos: "Zdjęcia",
      Videos: "Filmy",
      Comments: "Komentarze",
      "Event winners": "Zwycięzcy wydarzenia",
      "Guest favorite": "Ulubiony gość",
      "Most Liked Photo": "Najbardziej lubiane zdjęcie",
      "Most liked event photo": "Najbardziej lubiane zdjęcie z wydarzenia",
      "No liked photo yet": "Nie ma jeszcze polubionego zdjęcia",
      "The winner will appear after guests like an approved photo.":
        "Zwycięzca pojawi się po polubieniu przez gości zatwierdzonego zdjęcia.",
      "Shared by": "Udostępnione przez",
      "Memory maker": "Twórca pamięci",
      "Top Photo Uploader": "Najlepszy program do przesyłania zdjęć",
      "Most active photographer": "Najbardziej aktywny fotograf",
      "No uploader yet": "Nie ma jeszcze osoby przesyłającej",
      "Approved photo uploads will be counted here.":
        "Tutaj będą liczone zatwierdzone przesłane zdjęcia.",
      "Photos uploaded": "Zdjęcia przesłane",
      "Every guest. Every moment. One shared album.":
        "Każdy gość. W każdej chwili. Jeden udostępniony album.",
      "Share after event ends": "Udostępnij po zakończeniu wydarzenia",
      "See the highlights from this event.":
        "Zobacz najciekawsze momenty z tego wydarzenia.",
      "Highlights link copied.":
        "Link do najważniejszych informacji został skopiowany.",
      "Highlights link could not be copied.":
        "Nie można skopiować linku do najważniejszych momentów.",
      "{name} shared the most approved photos from this event.":
        "{name} udostępnił najbardziej akceptowane zdjęcia z tego wydarzenia.",
      "Date not specified": "Data nieokreślona",
      "A valid Highlights link is required.":
        "Wymagany jest prawidłowy link do najważniejszych wydarzeń.",
      "Event Highlights could not be loaded.":
        "Nie udało się wczytać skrótów wydarzeń.",
      "Event Highlights becomes shareable after the event is ended.":
        "Najciekawsze wydarzenia można udostępniać po zakończeniu wydarzenia.",
      "Event not found or you do not have permission.":
        "Nie znaleziono wydarzenia lub nie masz uprawnień.",
      "Event not found.": "Nie znaleziono wydarzenia.",
      "Event participants could not be loaded.":
        "Nie udało się wczytać uczestników wydarzenia.",
      "Approved event content could not be loaded.":
        "Nie można wczytać zatwierdzonej treści wydarzenia.",
      "Photo likes could not be loaded.":
        "Nie udało się wczytać polubień zdjęcia.",
    },
    vi: {
      "Event Highlights": "Sự kiện nổi bật",
      "Event Highlights — SnapUp Events": "Sự kiện nổi bật — Sự kiện SnapUp",
      "Most liked photo, top uploader and event summary":
        "Ảnh được yêu thích nhất, ảnh được tải lên hàng đầu và tóm tắt sự kiện",
      "Highlights are ready to share":
        "Những điểm nổi bật đã sẵn sàng để chia sẻ",
      "Private preview until the event ends":
        "Xem trước riêng tư cho đến khi sự kiện kết thúc",
      Back: "Quay lại",
      "Share Highlights": "Chia sẻ điểm nổi bật",
      "Preparing Event Highlights...": "Đang chuẩn bị sự kiện nổi bật...",
      "Collecting the best moments from this event.":
        "Tổng hợp những khoảnh khắc đẹp nhất của sự kiện này.",
      "Highlights could not be loaded": "Không thể tải nội dung nổi bật",
      "Please check the link and try again.":
        "Vui lòng kiểm tra liên kết và thử lại.",
      "Back to Home": "Quay lại trang chủ",
      "PRIVATE PREVIEW": "XEM TRƯỚC RIÊNG",
      SHAREABLE: "CÓ THỂ CHIA SẺ",
      "Private owner preview": "Bản xem trước của chủ sở hữu tư nhân",
      "End the event to make this page shareable with guests.":
        "Kết thúc sự kiện để trang này có thể chia sẻ được với khách.",
      "By the numbers": "Bằng những con số",
      "Event Summary": "Tóm tắt sự kiện",
      Participants: "Người tham gia",
      Photos: "Ảnh",
      Videos: "Video",
      Comments: "Bình luận",
      "Event winners": "Người chiến thắng sự kiện",
      "Guest favorite": "Khách yêu thích",
      "Most Liked Photo": "Ảnh được thích nhất",
      "Most liked event photo": "Ảnh sự kiện được yêu thích nhất",
      "No liked photo yet": "Chưa có ảnh nào thích",
      "The winner will appear after guests like an approved photo.":
        "Người chiến thắng sẽ xuất hiện sau khi khách thích một bức ảnh được phê duyệt.",
      "Shared by": "Được chia sẻ bởi",
      "Memory maker": "Nhà sản xuất bộ nhớ",
      "Top Photo Uploader": "Trình tải ảnh lên hàng đầu",
      "Most active photographer": "Nhiếp ảnh gia năng động nhất",
      "No uploader yet": "Chưa có người tải lên",
      "Approved photo uploads will be counted here.":
        "Tải lên ảnh được phê duyệt sẽ được tính ở đây.",
      "Photos uploaded": "Ảnh đã tải lên",
      "Every guest. Every moment. One shared album.":
        "Mỗi vị khách. Mọi khoảnh khắc. Một album được chia sẻ.",
      "Share after event ends": "Chia sẻ sau khi sự kiện kết thúc",
      "See the highlights from this event.":
        "Xem những điểm nổi bật từ sự kiện này.",
      "Highlights link copied.": "Đã sao chép liên kết nổi bật.",
      "Highlights link could not be copied.":
        "Không thể sao chép liên kết nổi bật.",
      "{name} shared the most approved photos from this event.":
        "{name} đã chia sẻ những bức ảnh được phê duyệt nhiều nhất từ ​​sự kiện này.",
      "Date not specified": "Ngày không được chỉ định",
      "A valid Highlights link is required.":
        "Cần có liên kết Mục nổi bật hợp lệ.",
      "Event Highlights could not be loaded.":
        "Không thể tải Điểm nổi bật của sự kiện.",
      "Event Highlights becomes shareable after the event is ended.":
        "Điểm nổi bật của sự kiện sẽ có thể chia sẻ được sau khi sự kiện kết thúc.",
      "Event not found or you do not have permission.":
        "Không tìm thấy sự kiện hoặc bạn không có quyền.",
      "Event not found.": "Không tìm thấy sự kiện.",
      "Event participants could not be loaded.":
        "Không thể tải người tham gia sự kiện.",
      "Approved event content could not be loaded.":
        "Không thể tải nội dung sự kiện đã được phê duyệt.",
      "Photo likes could not be loaded.": "Không thể tải lượt thích ảnh.",
    },
    uk: {
      "Event Highlights": "Основні події",
      "Event Highlights — SnapUp Events": "Основні події — події SnapUp",
      "Most liked photo, top uploader and event summary":
        "Фотографія, яка найбільше подобається, найкраще завантажує та підсумок події",
      "Highlights are ready to share": "Найцікавіші моменти готові поділитися",
      "Private preview until the event ends":
        "Приватний попередній перегляд до кінця події",
      Back: "Назад",
      "Share Highlights": "Поділіться найкращими моментами",
      "Preparing Event Highlights...": "Підготовка найважливіших подій...",
      "Collecting the best moments from this event.":
        "Збираємо найкращі моменти з цієї події.",
      "Highlights could not be loaded":
        "Не вдалося завантажити основні моменти",
      "Please check the link and try again.":
        "Перевірте посилання та повторіть спробу.",
      "Back to Home": "Назад додому",
      "PRIVATE PREVIEW": "ПРИВАТНИЙ ПОПЕРЕДНИЙ ПЕРЕГЛЯД",
      SHAREABLE: "ДЛЯ ДІЛУ",
      "Private owner preview": "Попередній перегляд приватного власника",
      "End the event to make this page shareable with guests.":
        "Завершіть подію, щоб гості могли поділитися цією сторінкою.",
      "By the numbers": "За цифрами",
      "Event Summary": "Підсумок події",
      Participants: "Учасники",
      Photos: "Фотографії",
      Videos: "Відео",
      Comments: "Коментарі",
      "Event winners": "Переможці заходу",
      "Guest favorite": "Улюблений гість",
      "Most Liked Photo": "Фото, яке найбільше подобається",
      "Most liked event photo": "Фото події, яке найбільше подобається",
      "No liked photo yet": "Ще немає фото, які сподобалися",
      "The winner will appear after guests like an approved photo.":
        "Переможець з'явиться після того, як гості вподобають схвалене фото.",
      "Shared by": "Поділився",
      "Memory maker": "Творець пам'яті",
      "Top Photo Uploader": "Кращий завантажувач фотографій",
      "Most active photographer": "Найактивніший фотограф",
      "No uploader yet": "Ще немає завантажувача",
      "Approved photo uploads will be counted here.":
        "Тут буде зараховано схвалені завантаження фотографій.",
      "Photos uploaded": "Фотографії завантажено",
      "Every guest. Every moment. One shared album.":
        "Кожен гість. Кожну мить. Один спільний альбом.",
      "Share after event ends": "Поділіться після завершення події",
      "See the highlights from this event.":
        "Дивіться найцікавіші моменти цієї події.",
      "Highlights link copied.": "Посилання на основні моменти скопійовано.",
      "Highlights link could not be copied.":
        "Не вдалося скопіювати посилання на основні моменти.",
      "{name} shared the most approved photos from this event.":
        "{name} поділився найбільш схваленими фотографіями з цієї події.",
      "Date not specified": "Дата не вказана",
      "A valid Highlights link is required.":
        "Потрібне дійсне посилання на основні моменти.",
      "Event Highlights could not be loaded.":
        "Не вдалося завантажити основні моменти події.",
      "Event Highlights becomes shareable after the event is ended.":
        "Основні моменти події можна поділитися після завершення події.",
      "Event not found or you do not have permission.":
        "Подію не знайдено або у вас немає дозволу.",
      "Event not found.": "Подія не знайдена.",
      "Event participants could not be loaded.":
        "Не вдалося завантажити учасників події.",
      "Approved event content could not be loaded.":
        "Не вдалося завантажити схвалений вміст події.",
      "Photo likes could not be loaded.":
        'Не вдалося завантажити оцінки "подобається" фото.',
    },
    th: {
      "Event Highlights": "ไฮไลท์ของงาน",
      "Event Highlights — SnapUp Events": "ไฮไลท์ของกิจกรรม — กิจกรรม SnapUp",
      "Most liked photo, top uploader and event summary":
        "รูปภาพที่มีคนชอบมากที่สุด ผู้อัปโหลดยอดนิยม และข้อมูลสรุปกิจกรรม",
      "Highlights are ready to share": "ไฮไลท์พร้อมแชร์",
      "Private preview until the event ends":
        "ดูตัวอย่างแบบส่วนตัวจนกว่ากิจกรรมจะสิ้นสุด",
      Back: "กลับ",
      "Share Highlights": "แบ่งปันไฮไลท์",
      "Preparing Event Highlights...": "กำลังเตรียมไฮไลท์กิจกรรม...",
      "Collecting the best moments from this event.":
        "รวบรวมช่วงเวลาที่ดีที่สุดจากงานนี้",
      "Highlights could not be loaded": "ไม่สามารถโหลดไฮไลต์ได้",
      "Please check the link and try again.": "โปรดตรวจสอบลิงก์แล้วลองอีกครั้ง",
      "Back to Home": "กลับไปที่บ้าน",
      "PRIVATE PREVIEW": "ดูตัวอย่างแบบส่วนตัว",
      SHAREABLE: "แชร์ได้",
      "Private owner preview": "ดูตัวอย่างเจ้าของส่วนตัว",
      "End the event to make this page shareable with guests.":
        "สิ้นสุดกิจกรรมเพื่อให้เพจนี้สามารถแชร์กับแขกได้",
      "By the numbers": "โดยตัวเลข",
      "Event Summary": "สรุปเหตุการณ์",
      Participants: "ผู้เข้าร่วม",
      Photos: "ภาพถ่าย",
      Videos: "วิดีโอ",
      Comments: "ความคิดเห็น",
      "Event winners": "ผู้ชนะกิจกรรม",
      "Guest favorite": "ของโปรดของแขก",
      "Most Liked Photo": "ภาพถ่ายที่ชอบมากที่สุด",
      "Most liked event photo": "ภาพกิจกรรมที่ชอบมากที่สุด",
      "No liked photo yet": "ยังไม่มีภาพที่ถูกใจ",
      "The winner will appear after guests like an approved photo.":
        "ผู้ชนะจะปรากฏต่อจากแขกที่ชอบภาพถ่ายที่ได้รับอนุมัติ",
      "Shared by": "แบ่งปันโดย",
      "Memory maker": "เครื่องทำหน่วยความจำ",
      "Top Photo Uploader": "เครื่องมืออัปโหลดรูปภาพยอดนิยม",
      "Most active photographer": "ช่างภาพที่กระตือรือร้นที่สุด",
      "No uploader yet": "ยังไม่มีผู้อัพโหลด",
      "Approved photo uploads will be counted here.":
        "การอัปโหลดรูปภาพที่ได้รับอนุมัติจะถูกนับที่นี่",
      "Photos uploaded": "อัปโหลดรูปภาพแล้ว",
      "Every guest. Every moment. One shared album.":
        "แขกทุกท่าน. ทุกช่วงเวลา หนึ่งอัลบั้มที่แชร์",
      "Share after event ends": "แชร์หลังจบกิจกรรม",
      "See the highlights from this event.": "ชมไฮไลท์จากงานนี้",
      "Highlights link copied.": "คัดลอกลิงก์ไฮไลต์แล้ว",
      "Highlights link could not be copied.": "ไม่สามารถคัดลอกลิงก์ไฮไลต์ได้",
      "{name} shared the most approved photos from this event.":
        "{name} แบ่งปันรูปภาพที่ได้รับอนุมัติมากที่สุดจากกิจกรรมนี้",
      "Date not specified": "ไม่ได้ระบุวันที่",
      "A valid Highlights link is required.":
        "จำเป็นต้องมีลิงก์ไฮไลต์ที่ถูกต้อง",
      "Event Highlights could not be loaded.": "ไม่สามารถโหลดไฮไลท์กิจกรรมได้",
      "Event Highlights becomes shareable after the event is ended.":
        "ไฮไลท์ของกิจกรรมจะสามารถแชร์ได้หลังจากกิจกรรมสิ้นสุดลง",
      "Event not found or you do not have permission.":
        "ไม่พบกิจกรรมหรือคุณไม่มีสิทธิ์",
      "Event not found.": "ไม่พบกิจกรรม",
      "Event participants could not be loaded.":
        "ไม่สามารถโหลดผู้เข้าร่วมกิจกรรมได้",
      "Approved event content could not be loaded.":
        "ไม่สามารถโหลดเนื้อหากิจกรรมที่ได้รับอนุมัติได้",
      "Photo likes could not be loaded.": "ไม่สามารถโหลดการชอบรูปภาพได้",
    },
    cs: {
      "Event Highlights": "Nejdůležitější události",
      "Event Highlights — SnapUp Events":
        "Nejdůležitější události — SnapUp události",
      "Most liked photo, top uploader and event summary":
        "Nejoblíbenější fotka, nejlepší nahrávající a shrnutí události",
      "Highlights are ready to share": "Hlavní body jsou připraveny ke sdílení",
      "Private preview until the event ends":
        "Soukromý náhled do konce události",
      Back: "Zpět",
      "Share Highlights": "Sdílejte to nejdůležitější",
      "Preparing Event Highlights...": "Příprava nejdůležitějších událostí...",
      "Collecting the best moments from this event.":
        "Sbíráme ty nejlepší momenty z této akce.",
      "Highlights could not be loaded": "Zvýraznění se nepodařilo načíst",
      "Please check the link and try again.":
        "Zkontrolujte prosím odkaz a zkuste to znovu.",
      "Back to Home": "Zpět na domovskou stránku",
      "PRIVATE PREVIEW": "SOUKROMÝ NÁHLED",
      SHAREABLE: "SDÍLENÉ",
      "Private owner preview": "Náhled soukromého vlastníka",
      "End the event to make this page shareable with guests.":
        "Ukončete událost, aby bylo možné tuto stránku sdílet s hosty.",
      "By the numbers": "Podle čísel",
      "Event Summary": "Shrnutí události",
      Participants: "Účastníci",
      Photos: "Fotografie",
      Videos: "videa",
      Comments: "Komentáře",
      "Event winners": "Vítězové akce",
      "Guest favorite": "Oblíbený host",
      "Most Liked Photo": "Nejoblíbenější fotka",
      "Most liked event photo": "Nejoblíbenější fotografie události",
      "No liked photo yet": "Zatím žádná oblíbená fotka",
      "The winner will appear after guests like an approved photo.":
        "Vítěz se objeví poté, co se hostům líbí schválená fotografie.",
      "Shared by": "Sdíleno uživatelem",
      "Memory maker": "Tvůrce paměti",
      "Top Photo Uploader": "Top Photo Uploader",
      "Most active photographer": "Nejaktivnější fotograf",
      "No uploader yet": "Zatím bez nahrávání",
      "Approved photo uploads will be counted here.":
        "Zde se započítávají schválené nahrání fotografií.",
      "Photos uploaded": "Fotografie byly nahrány",
      "Every guest. Every moment. One shared album.":
        "Každý host. Každou chvíli. Jedno sdílené album.",
      "Share after event ends": "Sdílejte po skončení akce",
      "See the highlights from this event.":
        "Podívejte se na to nejlepší z této akce.",
      "Highlights link copied.": "Odkaz na zvýraznění zkopírován.",
      "Highlights link could not be copied.":
        "Odkaz na zvýraznění se nepodařilo zkopírovat.",
      "{name} shared the most approved photos from this event.":
        "{name} sdílel nejvíce schválených fotek z této události.",
      "Date not specified": "Datum neuvedeno",
      "A valid Highlights link is required.":
        "Je vyžadován platný odkaz Highlights.",
      "Event Highlights could not be loaded.":
        "Nejdůležitější události nelze načíst.",
      "Event Highlights becomes shareable after the event is ended.":
        "Po skončení události lze zvýraznění události sdílet.",
      "Event not found or you do not have permission.":
        "Událost nenalezena nebo nemáte oprávnění.",
      "Event not found.": "Událost nenalezena.",
      "Event participants could not be loaded.":
        "Účastníky události se nepodařilo načíst.",
      "Approved event content could not be loaded.":
        "Obsah schválené události nelze načíst.",
      "Photo likes could not be loaded.":
        "Fotky, které se mi líbí, se nepodařilo načíst.",
    },
    he: {
      "Event Highlights": "דגשים באירוע",
      "Event Highlights — SnapUp Events": "אירועי הדגשה - אירועי SnapUp",
      "Most liked photo, top uploader and event summary":
        "התמונה האהובה ביותר, העלאה המובילה וסיכום האירוע",
      "Highlights are ready to share": "הדגשים מוכנים לשיתוף",
      "Private preview until the event ends":
        "תצוגה מקדימה פרטית עד לסיום האירוע",
      Back: "חזרה",
      "Share Highlights": "שתף דגשים",
      "Preparing Event Highlights...": "מכין את נקודות השיא של האירוע...",
      "Collecting the best moments from this event.":
        "אוסף את הרגעים הטובים ביותר מהאירוע הזה.",
      "Highlights could not be loaded": "לא ניתן היה לטעון את ההדגשות",
      "Please check the link and try again.": "אנא בדוק את הקישור ונסה שוב.",
      "Back to Home": "חזרה לבית",
      "PRIVATE PREVIEW": "תצוגה מקדימה פרטית",
      SHAREABLE: "ניתן לשיתוף",
      "Private owner preview": "תצוגה מקדימה של בעלים פרטיים",
      "End the event to make this page shareable with guests.":
        "סיים את האירוע כדי להפוך את הדף הזה לניתן לשיתוף עם אורחים.",
      "By the numbers": "לפי המספרים",
      "Event Summary": "סיכום האירוע",
      Participants: "משתתפים",
      Photos: "תמונות",
      Videos: "סרטונים",
      Comments: "הערות",
      "Event winners": "זוכי האירוע",
      "Guest favorite": "אורח מועדף",
      "Most Liked Photo": "התמונה הכי אהובה",
      "Most liked event photo": "תמונת האירוע האהובה ביותר",
      "No liked photo yet": "עדיין אין תמונה שאוהבת",
      "The winner will appear after guests like an approved photo.":
        "הזוכה יופיע לאחר שהאורחים יעשו לייק לתמונה מאושרת.",
      "Shared by": "משותף על ידי",
      "Memory maker": "יצרנית זיכרון",
      "Top Photo Uploader": "מעלה תמונות מובילות",
      "Most active photographer": "צלם פעיל ביותר",
      "No uploader yet": "עדיין אין מעלה",
      "Approved photo uploads will be counted here.":
        "העלאות תמונות שאושרו ייספרו כאן.",
      "Photos uploaded": "הועלו תמונות",
      "Every guest. Every moment. One shared album.":
        "כל אורח. כל רגע. אלבום אחד משותף.",
      "Share after event ends": "שתפו לאחר סיום האירוע",
      "See the highlights from this event.": "ראה את נקודות השיא מהאירוע הזה.",
      "Highlights link copied.": "קישור ההדגשות הועתק.",
      "Highlights link could not be copied.":
        "לא ניתן היה להעתיק את הקישור להדגשות.",
      "{name} shared the most approved photos from this event.":
        "{name} שיתף את התמונות המאושרות ביותר מהאירוע הזה.",
      "Date not specified": "תאריך לא צוין",
      "A valid Highlights link is required.": "נדרש קישור תקף להדגשות.",
      "Event Highlights could not be loaded.":
        "לא ניתן היה לטעון את הדגשות האירועים.",
      "Event Highlights becomes shareable after the event is ended.":
        "אירועי הדגשה הופכים לניתנים לשיתוף לאחר סיום האירוע.",
      "Event not found or you do not have permission.":
        "האירוע לא נמצא או שאין לך הרשאה.",
      "Event not found.": "האירוע לא נמצא.",
      "Event participants could not be loaded.":
        "לא ניתן היה לטעון את המשתתפים באירוע.",
      "Approved event content could not be loaded.":
        "לא ניתן היה לטעון תוכן אירוע מאושר.",
      "Photo likes could not be loaded.": "לא ניתן היה לטעון לייקים לתמונות.",
    },
    hu: {
      "Event Highlights": "Esemény kiemelései",
      "Event Highlights — SnapUp Events":
        "Kiemelt események – SnapUp események",
      "Most liked photo, top uploader and event summary":
        "A legtöbbet kedvelt fotó, a legjobb feltöltő és az esemény összefoglalója",
      "Highlights are ready to share":
        "A kiemelések készen állnak a megosztásra",
      "Private preview until the event ends":
        "Privát előzetes az esemény végéig",
      Back: "Vissza",
      "Share Highlights": "Share Highlights",
      "Preparing Event Highlights...":
        "Az esemény kiemelt eseményeinek előkészítése...",
      "Collecting the best moments from this event.":
        "Az esemény legjobb pillanatainak összegyűjtése.",
      "Highlights could not be loaded": "A kiemeléseket nem sikerült betölteni",
      "Please check the link and try again.":
        "Kérjük, ellenőrizze a linket, és próbálja újra.",
      "Back to Home": "Vissza a Kezdőlapra",
      "PRIVATE PREVIEW": "PRIVÁT ELŐNÉZET",
      SHAREABLE: "MEGOSZTHATÓ",
      "Private owner preview": "Magántulajdonos előnézete",
      "End the event to make this page shareable with guests.":
        "Fejezze be az eseményt, hogy ez az oldal megosztható legyen a vendégekkel.",
      "By the numbers": "A számok alapján",
      "Event Summary": "Esemény összefoglaló",
      Participants: "Résztvevők",
      Photos: "Fényképek",
      Videos: "Videók",
      Comments: "Megjegyzések",
      "Event winners": "Az esemény nyertesei",
      "Guest favorite": "Vendégek kedvence",
      "Most Liked Photo": "Legkedveltebb Fotó",
      "Most liked event photo": "A legtöbbet kedvelt eseményfotó",
      "No liked photo yet": "Még nincs kedvelt fotó",
      "The winner will appear after guests like an approved photo.":
        "A nyertes akkor jelenik meg, ha a vendégek kedvelik a jóváhagyott fotót.",
      "Shared by": "Megosztotta",
      "Memory maker": "Memória készítő",
      "Top Photo Uploader": "Legjobb fotófeltöltő",
      "Most active photographer": "A legaktívabb fotós",
      "No uploader yet": "Még nincs feltöltő",
      "Approved photo uploads will be counted here.":
        "A jóváhagyott fotófeltöltéseket itt számoljuk.",
      "Photos uploaded": "Fényképek feltöltve",
      "Every guest. Every moment. One shared album.":
        "Minden vendég. Minden pillanatban. Egy megosztott album.",
      "Share after event ends": "Megosztás az esemény befejezése után",
      "See the highlights from this event.":
        "Tekintse meg az esemény legfontosabb eseményeit.",
      "Highlights link copied.": "A kiemelések linkje kimásolva.",
      "Highlights link could not be copied.":
        "A kiemelések linkjét nem sikerült átmásolni.",
      "{name} shared the most approved photos from this event.":
        "A {name} megosztotta a legtöbbet jóváhagyott fotókat erről az eseményről.",
      "Date not specified": "Dátum nincs megadva",
      "A valid Highlights link is required.":
        "Érvényes Kiemelések link szükséges.",
      "Event Highlights could not be loaded.":
        "A kiemelt eseményeket nem sikerült betölteni.",
      "Event Highlights becomes shareable after the event is ended.":
        "Az Esemény Kiemelt elemei az esemény befejezése után megoszthatóvá válnak.",
      "Event not found or you do not have permission.":
        "Az esemény nem található, vagy nincs engedélye.",
      "Event not found.": "Esemény nem található.",
      "Event participants could not be loaded.":
        "Az esemény résztvevőit nem sikerült betölteni.",
      "Approved event content could not be loaded.":
        "Az esemény jóváhagyott tartalma nem tölthető be.",
      "Photo likes could not be loaded.":
        "Nem sikerült betölteni a kedveléseket.",
    },
    sv: {
      "Event Highlights": "Höjdpunkter i händelsen",
      "Event Highlights — SnapUp Events":
        "Händelsehöjdpunkter — SnapUp-händelser",
      "Most liked photo, top uploader and event summary":
        "Mest gillade foto, toppuppladdare och händelsesammanfattning",
      "Highlights are ready to share": "Höjdpunkter är redo att delas",
      "Private preview until the event ends":
        "Privat förhandsvisning tills evenemanget slutar",
      Back: "Tillbaka",
      "Share Highlights": "Dela höjdpunkter",
      "Preparing Event Highlights...": "Förbereder händelsehöjdpunkter...",
      "Collecting the best moments from this event.":
        "Samlar de bästa ögonblicken från denna händelse.",
      "Highlights could not be loaded": "Höjdpunkter kunde inte laddas",
      "Please check the link and try again.":
        "Kontrollera länken och försök igen.",
      "Back to Home": "Tillbaka till hemmet",
      "PRIVATE PREVIEW": "PRIVAT FÖRHÅNDGIVNING",
      SHAREABLE: "DELNINGSBAR",
      "Private owner preview": "Förhandsvisning av privat ägare",
      "End the event to make this page shareable with guests.":
        "Avsluta eventet för att göra den här sidan delbar med gäster.",
      "By the numbers": "Med siffrorna",
      "Event Summary": "Sammanfattning av händelsen",
      Participants: "Deltagare",
      Photos: "Foton",
      Videos: "Videor",
      Comments: "Kommentarer",
      "Event winners": "Vinnare av evenemanget",
      "Guest favorite": "Gästfavorit",
      "Most Liked Photo": "Mest gillade foto",
      "Most liked event photo": "Mest gillade händelsefoto",
      "No liked photo yet": "Inget gillat foto ännu",
      "The winner will appear after guests like an approved photo.":
        "Vinnaren kommer att visas efter att gästerna gillat ett godkänt foto.",
      "Shared by": "Delas av",
      "Memory maker": "Minnestillverkare",
      "Top Photo Uploader": "Bästa fotouppladdaren",
      "Most active photographer": "Mest aktiva fotografen",
      "No uploader yet": "Ingen uppladdare ännu",
      "Approved photo uploads will be counted here.":
        "Godkända fotouppladdningar räknas här.",
      "Photos uploaded": "Foton laddade upp",
      "Every guest. Every moment. One shared album.":
        "Varje gäst. Varje ögonblick. Ett delat album.",
      "Share after event ends": "Dela efter evenemangets slut",
      "See the highlights from this event.":
        "Se höjdpunkterna från detta evenemang.",
      "Highlights link copied.": "Höjdpunkter-länken har kopierats.",
      "Highlights link could not be copied.":
        "Länken för höjdpunkter kunde inte kopieras.",
      "{name} shared the most approved photos from this event.":
        "{name} delade de mest godkända bilderna från detta evenemang.",
      "Date not specified": "Datum ej angivet",
      "A valid Highlights link is required.": "En giltig höjdpunktslänk krävs.",
      "Event Highlights could not be loaded.":
        "Händelsehöjdpunkter kunde inte laddas.",
      "Event Highlights becomes shareable after the event is ended.":
        "Event Highlights blir delbara efter att eventet är avslutat.",
      "Event not found or you do not have permission.":
        "Händelsen hittades inte eller så har du inte behörighet.",
      "Event not found.": "Händelsen hittades inte.",
      "Event participants could not be loaded.":
        "Eventdeltagare kunde inte laddas.",
      "Approved event content could not be loaded.":
        "Godkänd händelseinnehåll kunde inte laddas.",
      "Photo likes could not be loaded.": "Fotogilla kunde inte laddas.",
    },
    bn: {
      "Event Highlights": "ইভেন্ট হাইলাইট",
      "Event Highlights — SnapUp Events": "ইভেন্ট হাইলাইটস — স্ন্যাপআপ ইভেন্ট",
      "Most liked photo, top uploader and event summary":
        "সর্বাধিক পছন্দ করা ফটো, শীর্ষ আপলোডার এবং ইভেন্টের সারাংশ",
      "Highlights are ready to share": "হাইলাইট শেয়ার করার জন্য প্রস্তুত",
      "Private preview until the event ends":
        "ইভেন্ট শেষ না হওয়া পর্যন্ত ব্যক্তিগত পূর্বরূপ",
      Back: "ফিরে",
      "Share Highlights": "হাইলাইট শেয়ার করুন",
      "Preparing Event Highlights...": "ইভেন্ট হাইলাইট প্রস্তুত করা হচ্ছে...",
      "Collecting the best moments from this event.":
        "এই ইভেন্ট থেকে সেরা মুহূর্ত সংগ্রহ.",
      "Highlights could not be loaded": "হাইলাইটগুলি লোড করা যায়নি৷",
      "Please check the link and try again.":
        "অনুগ্রহ করে লিঙ্কটি পরীক্ষা করে আবার চেষ্টা করুন।",
      "Back to Home": "হোমে ফিরে যান",
      "PRIVATE PREVIEW": "ব্যক্তিগত পূর্বরূপ",
      SHAREABLE: "ভাগ করা যায়",
      "Private owner preview": "ব্যক্তিগত মালিকের পূর্বরূপ",
      "End the event to make this page shareable with guests.":
        "অতিথিদের সাথে এই পৃষ্ঠাটি শেয়ার করার যোগ্য করতে ইভেন্টটি শেষ করুন।",
      "By the numbers": "সংখ্যা দ্বারা",
      "Event Summary": "ইভেন্ট সারাংশ",
      Participants: "অংশগ্রহণকারীরা",
      Photos: "ফটো",
      Videos: "ভিডিও",
      Comments: "মন্তব্য",
      "Event winners": "ইভেন্ট বিজয়ীরা",
      "Guest favorite": "অতিথি প্রিয়",
      "Most Liked Photo": "সর্বাধিক পছন্দ করা ছবি",
      "Most liked event photo": "সবচেয়ে পছন্দের ইভেন্টের ছবি",
      "No liked photo yet": "এখনও কোন লাইক করা ছবি",
      "The winner will appear after guests like an approved photo.":
        "বিজয়ী অতিথিদের পরে একটি অনুমোদিত ছবির মত দেখাবে।",
      "Shared by": "দ্বারা ভাগ করা",
      "Memory maker": "স্মৃতি নির্মাতা",
      "Top Photo Uploader": "শীর্ষ ফটো আপলোডার",
      "Most active photographer": "সবচেয়ে সক্রিয় ফটোগ্রাফার",
      "No uploader yet": "এখনো কোনো আপলোডার নেই",
      "Approved photo uploads will be counted here.":
        "অনুমোদিত ফটো আপলোড এখানে গণনা করা হবে.",
      "Photos uploaded": "ছবি আপলোড করা হয়েছে",
      "Every guest. Every moment. One shared album.":
        "প্রত্যেক অতিথি। প্রতি মুহূর্তে। একটি শেয়ার করা অ্যালবাম।",
      "Share after event ends": "ইভেন্ট শেষ হওয়ার পরে শেয়ার করুন",
      "See the highlights from this event.": "এই ইভেন্ট থেকে হাইলাইট দেখুন.",
      "Highlights link copied.": "হাইলাইট লিঙ্ক কপি করা হয়েছে.",
      "Highlights link could not be copied.": "হাইলাইট লিঙ্ক কপি করা যাবে না.",
      "{name} shared the most approved photos from this event.":
        "{name} এই ইভেন্ট থেকে সর্বাধিক অনুমোদিত ফটোগুলি ভাগ করেছে৷",
      "Date not specified": "তারিখ উল্লেখ করা হয়নি",
      "A valid Highlights link is required.":
        "একটি বৈধ হাইলাইট লিঙ্ক প্রয়োজন.",
      "Event Highlights could not be loaded.":
        "ইভেন্ট হাইলাইট লোড করা যাবে না.",
      "Event Highlights becomes shareable after the event is ended.":
        "ইভেন্ট শেষ হওয়ার পর ইভেন্ট হাইলাইট শেয়ার করা যায়।",
      "Event not found or you do not have permission.":
        "ইভেন্ট পাওয়া যায়নি বা আপনার অনুমতি নেই.",
      "Event not found.": "ইভেন্ট পাওয়া যায়নি.",
      "Event participants could not be loaded.":
        "ইভেন্ট অংশগ্রহণকারীদের লোড করা যাবে না.",
      "Approved event content could not be loaded.":
        "অনুমোদিত ইভেন্ট বিষয়বস্তু লোড করা যাবে না.",
      "Photo likes could not be loaded.": "ফটো লাইক লোড করা যায়নি.",
    },
    ms: {
      "Event Highlights": "Sorotan Acara",
      "Event Highlights — SnapUp Events": "Sorotan Acara — Acara SnapUp",
      "Most liked photo, top uploader and event summary":
        "Foto paling disukai, pemuat naik teratas dan ringkasan acara",
      "Highlights are ready to share": "Sorotan sedia untuk dikongsi",
      "Private preview until the event ends":
        "Pratonton peribadi sehingga acara tamat",
      Back: "belakang",
      "Share Highlights": "Kongsi Sorotan",
      "Preparing Event Highlights...": "Menyediakan Sorotan Acara...",
      "Collecting the best moments from this event.":
        "Mengumpul momen terbaik dari acara ini.",
      "Highlights could not be loaded": "Sorotan tidak dapat dimuatkan",
      "Please check the link and try again.":
        "Sila semak pautan dan cuba lagi.",
      "Back to Home": "Kembali ke Rumah",
      "PRIVATE PREVIEW": "PREVIEW PERSENDIRIAN",
      SHAREABLE: "BOLEH DIKONGSI",
      "Private owner preview": "Pratonton pemilik persendirian",
      "End the event to make this page shareable with guests.":
        "Tamatkan acara untuk menjadikan halaman ini boleh dikongsi dengan tetamu.",
      "By the numbers": "Dengan nombor",
      "Event Summary": "Ringkasan Peristiwa",
      Participants: "Peserta",
      Photos: "Foto",
      Videos: "Video",
      Comments: "Komen",
      "Event winners": "Pemenang acara",
      "Guest favorite": "Kegemaran tetamu",
      "Most Liked Photo": "Foto Paling Disukai",
      "Most liked event photo": "Foto acara paling disukai",
      "No liked photo yet": "Belum ada foto yang disukai",
      "The winner will appear after guests like an approved photo.":
        "Pemenang akan muncul selepas tetamu menyukai foto yang diluluskan.",
      "Shared by": "Dikongsi oleh",
      "Memory maker": "Pembuat ingatan",
      "Top Photo Uploader": "Pemuat Naik Foto Teratas",
      "Most active photographer": "Jurugambar paling aktif",
      "No uploader yet": "Belum ada pemuat naik",
      "Approved photo uploads will be counted here.":
        "Muat naik foto yang diluluskan akan dikira di sini.",
      "Photos uploaded": "Foto dimuat naik",
      "Every guest. Every moment. One shared album.":
        "Setiap tetamu. Setiap saat. Satu album kongsi.",
      "Share after event ends": "Kongsi selepas acara tamat",
      "See the highlights from this event.":
        "Lihat sorotan daripada acara ini.",
      "Highlights link copied.": "Pautan sorotan disalin.",
      "Highlights link could not be copied.":
        "Pautan sorotan tidak dapat disalin.",
      "{name} shared the most approved photos from this event.":
        "{name} berkongsi foto yang paling diluluskan daripada acara ini.",
      "Date not specified": "Tarikh tidak dinyatakan",
      "A valid Highlights link is required.":
        "Pautan Sorotan yang sah diperlukan.",
      "Event Highlights could not be loaded.":
        "Sorotan Acara tidak dapat dimuatkan.",
      "Event Highlights becomes shareable after the event is ended.":
        "Sorotan Acara boleh dikongsi selepas acara tamat.",
      "Event not found or you do not have permission.":
        "Acara tidak ditemui atau anda tidak mempunyai kebenaran.",
      "Event not found.": "Acara tidak ditemui.",
      "Event participants could not be loaded.":
        "Peserta acara tidak dapat dimuatkan.",
      "Approved event content could not be loaded.":
        "Kandungan acara yang diluluskan tidak dapat dimuatkan.",
      "Photo likes could not be loaded.": "Suka foto tidak dapat dimuatkan.",
    },
    fil: {
      "Event Highlights": "Mga Highlight ng Kaganapan",
      "Event Highlights — SnapUp Events":
        "Mga Highlight ng Kaganapan — Mga Kaganapang SnapUp",
      "Most liked photo, top uploader and event summary":
        "Pinakagustong larawan, nangungunang uploader at buod ng kaganapan",
      "Highlights are ready to share": "Handang ibahagi ang mga highlight",
      "Private preview until the event ends":
        "Pribadong preview hanggang sa matapos ang event",
      Back: "Bumalik",
      "Share Highlights": "Ibahagi ang Mga Highlight",
      "Preparing Event Highlights...":
        "Inihahanda ang Mga Highlight ng Kaganapan...",
      "Collecting the best moments from this event.":
        "Kinokolekta ang pinakamagandang sandali mula sa kaganapang ito.",
      "Highlights could not be loaded": "Hindi ma-load ang mga highlight",
      "Please check the link and try again.":
        "Pakisuri ang link at subukang muli.",
      "Back to Home": "Bumalik sa Bahay",
      "PRIVATE PREVIEW": "PRIBADONG PREVIEW",
      SHAREABLE: "NABAHAGI",
      "Private owner preview": "Preview ng pribadong may-ari",
      "End the event to make this page shareable with guests.":
        "Tapusin ang kaganapan upang gawing maibabahagi ang page na ito sa mga bisita.",
      "By the numbers": "Sa pamamagitan ng mga numero",
      "Event Summary": "Buod ng Kaganapan",
      Participants: "Mga kalahok",
      Photos: "Mga larawan",
      Videos: "Mga video",
      Comments: "Mga komento",
      "Event winners": "Mga nanalo sa kaganapan",
      "Guest favorite": "Paborito ng panauhin",
      "Most Liked Photo": "Pinakagustong Larawan",
      "Most liked event photo": "Pinakagustong larawan ng kaganapan",
      "No liked photo yet": "Wala pang ni-like na larawan",
      "The winner will appear after guests like an approved photo.":
        "Ang nagwagi ay lilitaw pagkatapos ng mga bisita tulad ng isang aprubadong larawan.",
      "Shared by": "Ibinahagi ni",
      "Memory maker": "Tagagawa ng memorya",
      "Top Photo Uploader": "Nangungunang Photo Uploader",
      "Most active photographer": "Pinaka aktibong photographer",
      "No uploader yet": "Wala pang uploader",
      "Approved photo uploads will be counted here.":
        "Ang mga inaprubahang pag-upload ng larawan ay mabibilang dito.",
      "Photos uploaded": "Mga larawang na-upload",
      "Every guest. Every moment. One shared album.":
        "Bawat bisita. Bawat sandali. Isang nakabahaging album.",
      "Share after event ends": "Ibahagi pagkatapos ng kaganapan",
      "See the highlights from this event.":
        "Tingnan ang mga highlight mula sa kaganapang ito.",
      "Highlights link copied.": "Nakopya ang link ng mga highlight.",
      "Highlights link could not be copied.":
        "Hindi makopya ang link ng mga highlight.",
      "{name} shared the most approved photos from this event.":
        "Ibinahagi ni {name} ang mga pinakanaaprubahang larawan mula sa kaganapang ito.",
      "Date not specified": "Hindi tinukoy ang petsa",
      "A valid Highlights link is required.":
        "Kinakailangan ang isang wastong link ng Mga Highlight.",
      "Event Highlights could not be loaded.":
        "Hindi ma-load ang Mga Highlight ng Kaganapan.",
      "Event Highlights becomes shareable after the event is ended.":
        "Ang Mga Highlight ng Kaganapan ay nagiging maibabahagi pagkatapos ng kaganapan.",
      "Event not found or you do not have permission.":
        "Hindi nahanap ang kaganapan o wala kang pahintulot.",
      "Event not found.": "Hindi nahanap ang kaganapan.",
      "Event participants could not be loaded.":
        "Hindi ma-load ang mga kalahok sa kaganapan.",
      "Approved event content could not be loaded.":
        "Hindi ma-load ang naaprubahang nilalaman ng kaganapan.",
      "Photo likes could not be loaded.":
        "Hindi ma-load ang mga like sa larawan.",
    },
    "zh-tw": {
      "Event Highlights": "活動亮點",
      "Event Highlights — SnapUp Events": "活動亮點 — SnapUp 活動",
      "Most liked photo, top uploader and event summary":
        "最喜歡的照片、熱門上傳者和活動摘要",
      "Highlights are ready to share": "亮點已準備好分享",
      "Private preview until the event ends": "私人預覽至活動結束",
      Back: "返回",
      "Share Highlights": "分享亮點",
      "Preparing Event Highlights...": "準備活動亮點...",
      "Collecting the best moments from this event.":
        "收集本次活動的最美好的瞬間。",
      "Highlights could not be loaded": "無法加載精彩集錦",
      "Please check the link and try again.": "請檢查連結並重試。",
      "Back to Home": "回首頁",
      "PRIVATE PREVIEW": "私人預覽",
      SHAREABLE: "可分享",
      "Private owner preview": "私人業主預覽",
      "End the event to make this page shareable with guests.":
        "結束活動以使此頁面可與來賓分享。",
      "By the numbers": "從數字來看",
      "Event Summary": "活動摘要",
      Participants: "參加者",
      Photos: "照片",
      Videos: "影片",
      Comments: "評論",
      "Event winners": "活動獲獎者",
      "Guest favorite": "客人最愛",
      "Most Liked Photo": "最喜歡的照片",
      "Most liked event photo": "最喜歡的活動照片",
      "No liked photo yet": "還沒喜歡的照片",
      "The winner will appear after guests like an approved photo.":
        "獲獎者將在客人對批准的照片點讚後出現。",
      "Shared by": "分享者",
      "Memory maker": "記憶體製造商",
      "Top Photo Uploader": "頂級照片上傳者",
      "Most active photographer": "最活躍的攝影師",
      "No uploader yet": "還沒上傳者",
      "Approved photo uploads will be counted here.":
        "已批准的照片上傳將計入此處。",
      "Photos uploaded": "照片已上傳",
      "Every guest. Every moment. One shared album.":
        "每位客人。每一刻。一張共享專輯。",
      "Share after event ends": "活動結束後分享",
      "See the highlights from this event.": "查看本次活动的亮点。",
      "Highlights link copied.": "已复制突出显示链接。",
      "Highlights link could not be copied.": "无法复制亮点链接。",
      "{name} shared the most approved photos from this event.":
        "{name} 分享了本次活動中最受歡迎的照片。",
      "Date not specified": "未指定日期",
      "A valid Highlights link is required.": "需要有效的亮点链接。",
      "Event Highlights could not be loaded.": "无法加载活动亮点。",
      "Event Highlights becomes shareable after the event is ended.":
        "活动结束后，活动亮点即可共享。",
      "Event not found or you do not have permission.":
        "未找到活动或您没有权限。",
      "Event not found.": "未找到事件。",
      "Event participants could not be loaded.": "无法加载活动参与者。",
      "Approved event content could not be loaded.":
        "无法加载已批准的活动内容。",
      "Photo likes could not be loaded.": "无法加载喜欢的照片。",
    },
    "pt-pt": {
      "Event Highlights": "Destaques do evento",
      "Event Highlights — SnapUp Events":
        "Destaques do evento – Eventos SnapUp",
      "Most liked photo, top uploader and event summary":
        "Foto mais popular, principal uploader e resumo do evento",
      "Highlights are ready to share":
        "Os destaques estão prontos para serem partilhados",
      "Private preview until the event ends":
        "Visualização privada até ao final do evento",
      Back: "Voltar",
      "Share Highlights": "Partilhar destaques",
      "Preparing Event Highlights...": "Preparação de destaques do evento...",
      "Collecting the best moments from this event.":
        "Recolhendo os melhores momentos deste evento.",
      "Highlights could not be loaded":
        "Não foi possível carregar os destaques",
      "Please check the link and try again.":
        "Verifique o link e tente novamente.",
      "Back to Home": "De regresso a casa",
      "PRIVATE PREVIEW": "PRÉVIA PRIVADA",
      SHAREABLE: "COMPARTILHÁVEL",
      "Private owner preview": "Visualização privada do proprietário",
      "End the event to make this page shareable with guests.":
        "Encerre o evento para tornar esta página partilhável com os convidados.",
      "By the numbers": "Pelos números",
      "Event Summary": "Resumo do Evento",
      Participants: "Participantes",
      Photos: "Fotos",
      Videos: "Vídeos",
      Comments: "Comentários",
      "Event winners": "Vencedores do evento",
      "Guest favorite": "Favorito dos convidados",
      "Most Liked Photo": "Foto mais curtida",
      "Most liked event photo": "Foto do evento mais popular",
      "No liked photo yet": "Nenhuma foto curtida ainda",
      "The winner will appear after guests like an approved photo.":
        "O vencedor aparecerá após os convidados gostarem de uma foto aprovada.",
      "Shared by": "Partilhado por",
      "Memory maker": "Criador de memória",
      "Top Photo Uploader": "Melhor carregador de fotos",
      "Most active photographer": "Fotógrafo mais ativo",
      "No uploader yet": "Nenhum uploader ainda",
      "Approved photo uploads will be counted here.":
        "Os uploads de fotos aprovados serão contabilizados aqui.",
      "Photos uploaded": "Fotos enviadas",
      "Every guest. Every moment. One shared album.":
        "Cada convidado. Cada momento. Um álbum partilhado.",
      "Share after event ends": "Partilhar após o término do evento",
      "See the highlights from this event.": "Veja os destaques deste evento.",
      "Highlights link copied.": "Link de destaques copiado.",
      "Highlights link could not be copied.":
        "O link dos destaques não pôde ser copiado.",
      "{name} shared the most approved photos from this event.":
        "{name} partilhou as fotos mais aprovadas deste evento.",
      "Date not specified": "Data não especificada",
      "A valid Highlights link is required.":
        "É necessário um link de destaques válido.",
      "Event Highlights could not be loaded.":
        "Não foi possível carregar os destaques do evento.",
      "Event Highlights becomes shareable after the event is ended.":
        "Os destaques do evento tornam-se partilháveis ​​após o término do evento.",
      "Event not found or you do not have permission.":
        "Evento não encontrado ou não tem permissão.",
      "Event not found.": "Evento não encontrado.",
      "Event participants could not be loaded.":
        "Não foi possível carregar os participantes do evento.",
      "Approved event content could not be loaded.":
        "Não foi possível carregar o conteúdo do evento aprovado.",
      "Photo likes could not be loaded.":
        "Não foi possível carregar os gostos das fotos.",
    },
    da: {
      "Event Highlights": "Begivenhedens højdepunkter",
      "Event Highlights — SnapUp Events":
        "Begivenhedshøjdepunkter — SnapUp-begivenheder",
      "Most liked photo, top uploader and event summary":
        "Mest like foto, topuploader og begivenhedsoversigt",
      "Highlights are ready to share": "Højdepunkter er klar til at dele",
      "Private preview until the event ends":
        "Privat forhåndsvisning indtil begivenheden slutter",
      Back: "Tilbage",
      "Share Highlights": "Del højdepunkter",
      "Preparing Event Highlights...":
        "Forbereder begivenhedens højdepunkter...",
      "Collecting the best moments from this event.":
        "Samler de bedste øjeblikke fra denne begivenhed.",
      "Highlights could not be loaded": "Højdepunkter kunne ikke indlæses",
      "Please check the link and try again.":
        "Tjek venligst linket og prøv igen.",
      "Back to Home": "Tilbage til Hjemmet",
      "PRIVATE PREVIEW": "PRIVAT FORBINDELSE",
      SHAREABLE: "DELES",
      "Private owner preview": "Forhåndsvisning af privat ejer",
      "End the event to make this page shareable with guests.":
        "Afslut begivenheden for at gøre denne side delbar med gæster.",
      "By the numbers": "Ved tallene",
      "Event Summary": "Begivenhedsoversigt",
      Participants: "Deltagere",
      Photos: "Fotos",
      Videos: "Videoer",
      Comments: "Kommentarer",
      "Event winners": "Begivenhedsvindere",
      "Guest favorite": "Gæstefavorit",
      "Most Liked Photo": "Mest kunne lide billede",
      "Most liked event photo": "Mest liked begivenhedsbillede",
      "No liked photo yet": "Intet billede kan lide endnu",
      "The winner will appear after guests like an approved photo.":
        "Vinderen vises efter gæster synes godt om et godkendt billede.",
      "Shared by": "Delt af",
      "Memory maker": "Hukommelse maker",
      "Top Photo Uploader": "Top foto uploader",
      "Most active photographer": "Mest aktive fotograf",
      "No uploader yet": "Ingen uploader endnu",
      "Approved photo uploads will be counted here.":
        "Godkendte fotouploads tælles her.",
      "Photos uploaded": "Fotos uploadet",
      "Every guest. Every moment. One shared album.":
        "Hver gæst. Hvert øjeblik. Et delt album.",
      "Share after event ends": "Del efter begivenheden slutter",
      "See the highlights from this event.":
        "Se højdepunkterne fra denne begivenhed.",
      "Highlights link copied.": "Højdepunkter-linket er kopieret.",
      "Highlights link could not be copied.":
        "Højdepunkter-linket kunne ikke kopieres.",
      "{name} shared the most approved photos from this event.":
        "{name} delte de mest godkendte billeder fra denne begivenhed.",
      "Date not specified": "Dato ikke angivet",
      "A valid Highlights link is required.":
        "Et gyldigt højdepunkter-link er påkrævet.",
      "Event Highlights could not be loaded.":
        "Begivenhedshøjdepunkter kunne ikke indlæses.",
      "Event Highlights becomes shareable after the event is ended.":
        "Begivenhedshøjdepunkter bliver delbare, når begivenheden er afsluttet.",
      "Event not found or you do not have permission.":
        "Begivenheden blev ikke fundet, eller du har ikke tilladelse.",
      "Event not found.": "Begivenheden blev ikke fundet.",
      "Event participants could not be loaded.":
        "Begivenhedsdeltagere kunne ikke indlæses.",
      "Approved event content could not be loaded.":
        "Godkendt begivenhedsindhold kunne ikke indlæses.",
      "Photo likes could not be loaded.": "Fotolikes kunne ikke indlæses.",
    },
    fi: {
      "Event Highlights": "Tapahtuman kohokohdat",
      "Event Highlights — SnapUp Events":
        "Tapahtuman kohokohdat – SnapUp-tapahtumat",
      "Most liked photo, top uploader and event summary":
        "Eniten pidetty kuva, suosituin lataaja ja tapahtuman yhteenveto",
      "Highlights are ready to share": "Kohokohdat ovat valmiita jaettavaksi",
      "Private preview until the event ends":
        "Yksityinen esikatselu tapahtuman loppuun asti",
      Back: "Takaisin",
      "Share Highlights": "Jaa kohokohdat",
      "Preparing Event Highlights...": "Valmistellaan tapahtuman kohokohtia...",
      "Collecting the best moments from this event.":
        "Kerätään parhaita hetkiä tästä tapahtumasta.",
      "Highlights could not be loaded": "Kohokohtia ei voitu ladata",
      "Please check the link and try again.":
        "Tarkista linkki ja yritä uudelleen.",
      "Back to Home": "Takaisin etusivulle",
      "PRIVATE PREVIEW": "yksityinen ESITTELY",
      SHAREABLE: "JAETTAVA",
      "Private owner preview": "Yksityisen omistajan esikatselu",
      "End the event to make this page shareable with guests.":
        "Lopeta tapahtuma, jotta tämä sivu voidaan jakaa vieraiden kanssa.",
      "By the numbers": "Numeroiden mukaan",
      "Event Summary": "Tapahtuman yhteenveto",
      Participants: "Osallistujat",
      Photos: "Valokuvat",
      Videos: "Videot",
      Comments: "Kommentit",
      "Event winners": "Tapahtuman voittajat",
      "Guest favorite": "Vieraiden suosikki",
      "Most Liked Photo": "Tykätyin valokuva",
      "Most liked event photo": "Suosituin tapahtumakuva",
      "No liked photo yet": "Ei vielä tykättyä kuvaa",
      "The winner will appear after guests like an approved photo.":
        "Voittaja ilmestyy, kun vieraat ovat tykänneet hyväksytystä kuvasta.",
      "Shared by": "Jakanut",
      "Memory maker": "Muistin luoja",
      "Top Photo Uploader": "Suosituin valokuvien latausohjelma",
      "Most active photographer": "Aktiivisin valokuvaaja",
      "No uploader yet": "Ei lataajaa vielä",
      "Approved photo uploads will be counted here.":
        "Hyväksytyt valokuvalataukset lasketaan tähän.",
      "Photos uploaded": "Valokuvat ladattu",
      "Every guest. Every moment. One shared album.":
        "Jokainen vieras. Joka hetki. Yksi jaettu albumi.",
      "Share after event ends": "Jaa tapahtuman päätyttyä",
      "See the highlights from this event.":
        "Katso tämän tapahtuman kohokohdat.",
      "Highlights link copied.": "Kohokohtien linkki kopioitu.",
      "Highlights link could not be copied.":
        "Kohokohtien linkkiä ei voitu kopioida.",
      "{name} shared the most approved photos from this event.":
        "{name} jakoi tämän tapahtuman hyväksytyimmät kuvat.",
      "Date not specified": "Päivämäärää ei ole määritetty",
      "A valid Highlights link is required.":
        "Kelvollinen Highlights-linkki vaaditaan.",
      "Event Highlights could not be loaded.":
        "Tapahtuman kohokohtia ei voitu ladata.",
      "Event Highlights becomes shareable after the event is ended.":
        "Tapahtuman kohokohdat tulevat jaettavaksi tapahtuman päätyttyä.",
      "Event not found or you do not have permission.":
        "Tapahtumaa ei löydy tai sinulla ei ole lupaa.",
      "Event not found.": "Tapahtumaa ei löydy.",
      "Event participants could not be loaded.":
        "Tapahtuman osallistujia ei voitu ladata.",
      "Approved event content could not be loaded.":
        "Hyväksytyn tapahtuman sisältöä ei voitu ladata.",
      "Photo likes could not be loaded.": "Kuvien tykkäyksiä ei voitu ladata.",
    },
    nb: {
      "Event Highlights": "Høydepunkter fra arrangementet",
      "Event Highlights — SnapUp Events":
        "Begivenhetshøydepunkter — SnapUp-hendelser",
      "Most liked photo, top uploader and event summary":
        "Mest likte bilde, toppopplaster og hendelsessammendrag",
      "Highlights are ready to share": "Høydepunkter er klare til å dele",
      "Private preview until the event ends":
        "Privat forhåndsvisning frem til arrangementet avsluttes",
      Back: "Tilbake",
      "Share Highlights": "Del høydepunkter",
      "Preparing Event Highlights...": "Forbereder begivenhetshøydepunkter...",
      "Collecting the best moments from this event.":
        "Samler de beste øyeblikkene fra denne begivenheten.",
      "Highlights could not be loaded": "Høydepunkter kunne ikke lastes inn",
      "Please check the link and try again.":
        "Vennligst sjekk linken og prøv igjen.",
      "Back to Home": "Tilbake til Hjemmet",
      "PRIVATE PREVIEW": "PRIVAT FORHÅNDSVISNING",
      SHAREABLE: "DELES",
      "Private owner preview": "Forhåndsvisning av privat eier",
      "End the event to make this page shareable with guests.":
        "Avslutt arrangementet for å gjøre denne siden delbar med gjester.",
      "By the numbers": "Etter tallene",
      "Event Summary": "Sammendrag av hendelsen",
      Participants: "Deltakere",
      Photos: "Bilder",
      Videos: "Videoer",
      Comments: "Kommentarer",
      "Event winners": "Vinnere av arrangementet",
      "Guest favorite": "Gjestefavoritt",
      "Most Liked Photo": "Mest likte bilde",
      "Most liked event photo": "Mest likte arrangementsbilde",
      "No liked photo yet": "Ingen likte bilder ennå",
      "The winner will appear after guests like an approved photo.":
        "Vinneren vises etter at gjestene liker et godkjent bilde.",
      "Shared by": "Delt av",
      "Memory maker": "Minne maker",
      "Top Photo Uploader": "Topp fotoopplasting",
      "Most active photographer": "Mest aktive fotograf",
      "No uploader yet": "Ingen opplaster ennå",
      "Approved photo uploads will be counted here.":
        "Godkjente bildeopplastinger telles her.",
      "Photos uploaded": "Bilder lastet opp",
      "Every guest. Every moment. One shared album.":
        "Hver gjest. Hvert øyeblikk. Ett delt album.",
      "Share after event ends": "Del etter at arrangementet er avsluttet",
      "See the highlights from this event.":
        "Se høydepunktene fra dette arrangementet.",
      "Highlights link copied.": "Høydepunkter-lenken er kopiert.",
      "Highlights link could not be copied.":
        "Høydepunkter-lenken kunne ikke kopieres.",
      "{name} shared the most approved photos from this event.":
        "{name} delte de mest godkjente bildene fra dette arrangementet.",
      "Date not specified": "Dato ikke spesifisert",
      "A valid Highlights link is required.":
        "En gyldig Høydepunkter-lenke kreves.",
      "Event Highlights could not be loaded.":
        "Begivenhetshøydepunkter kunne ikke lastes inn.",
      "Event Highlights becomes shareable after the event is ended.":
        "Event Highlights blir delbare etter at arrangementet er avsluttet.",
      "Event not found or you do not have permission.":
        "Arrangementet ble ikke funnet eller du har ikke tillatelse.",
      "Event not found.": "Arrangementet ble ikke funnet.",
      "Event participants could not be loaded.":
        "Eventdeltakere kunne ikke lastes inn.",
      "Approved event content could not be loaded.":
        "Godkjent hendelsesinnhold kunne ikke lastes inn.",
      "Photo likes could not be loaded.": "Bildeliker kunne ikke lastes inn.",
    },
    sk: {
      "Event Highlights": "Najdôležitejšie udalosti",
      "Event Highlights — SnapUp Events":
        "Najdôležitejšie udalosti — SnapUp udalosti",
      "Most liked photo, top uploader and event summary":
        "Najobľúbenejšia fotografia, najlepší nahrávač a súhrn udalosti",
      "Highlights are ready to share":
        "Najdôležitejšie momenty sú pripravené na zdieľanie",
      "Private preview until the event ends":
        "Súkromná ukážka až do konca udalosti",
      Back: "Späť",
      "Share Highlights": "Zdieľať výber",
      "Preparing Event Highlights...":
        "Pripravujú sa najdôležitejšie udalosti...",
      "Collecting the best moments from this event.":
        "Zbierajte najlepšie momenty z tohto podujatia.",
      "Highlights could not be loaded": "Zvýraznenia sa nepodarilo načítať",
      "Please check the link and try again.":
        "Skontrolujte odkaz a skúste to znova.",
      "Back to Home": "Späť na Domov",
      "PRIVATE PREVIEW": "SÚKROMNÁ NÁHĽAD",
      SHAREABLE: "DELITEĽNÝ",
      "Private owner preview": "Ukážka súkromného vlastníka",
      "End the event to make this page shareable with guests.":
        "Ukončite udalosť, aby bolo možné túto stránku zdieľať s hosťami.",
      "By the numbers": "Podľa čísel",
      "Event Summary": "Zhrnutie udalosti",
      Participants: "Účastníci",
      Photos: "Fotografie",
      Videos: "Videá",
      Comments: "Komentáre",
      "Event winners": "Víťazi podujatia",
      "Guest favorite": "Obľúbený hosť",
      "Most Liked Photo": "Najobľúbenejšia fotka",
      "Most liked event photo": "Najobľúbenejšia fotografia udalosti",
      "No liked photo yet": "Zatiaľ žiadna fotka, ktorá sa vám páči",
      "The winner will appear after guests like an approved photo.":
        "Víťaz sa objaví, keď sa hosťom páči schválená fotografia.",
      "Shared by": "Zdieľané používateľom",
      "Memory maker": "Tvorca pamäte",
      "Top Photo Uploader": "Najlepší nástroj na odovzdávanie fotografií",
      "Most active photographer": "Najaktívnejší fotograf",
      "No uploader yet": "Zatiaľ bez nahrávania",
      "Approved photo uploads will be counted here.":
        "Tu sa započítajú schválené odovzdania fotografií.",
      "Photos uploaded": "Fotografie boli odovzdané",
      "Every guest. Every moment. One shared album.":
        "Každý hosť. Každú chvíľu. Jeden zdieľaný album.",
      "Share after event ends": "Zdieľajte po skončení udalosti",
      "See the highlights from this event.":
        "Pozrite si to najdôležitejšie z tohto podujatia.",
      "Highlights link copied.": "Odkaz na zvýraznenie bol skopírovaný.",
      "Highlights link could not be copied.":
        "Odkaz na zvýraznenie sa nepodarilo skopírovať.",
      "{name} shared the most approved photos from this event.":
        "{name} zdieľa najviac schválených fotografií z tejto udalosti.",
      "Date not specified": "Dátum neuvedený",
      "A valid Highlights link is required.":
        "Vyžaduje sa platný odkaz Highlights.",
      "Event Highlights could not be loaded.":
        "Najdôležitejšie udalosti sa nepodarilo načítať.",
      "Event Highlights becomes shareable after the event is ended.":
        "Po skončení udalosti je možné zdieľať najdôležitejšie udalosti.",
      "Event not found or you do not have permission.":
        "Udalosť sa nenašla alebo nemáte povolenie.",
      "Event not found.": "Udalosť sa nenašla.",
      "Event participants could not be loaded.":
        "Účastníkov udalosti nebolo možné načítať.",
      "Approved event content could not be loaded.":
        "Obsah schváleného podujatia sa nepodarilo načítať.",
      "Photo likes could not be loaded.":
        "Nepodarilo sa načítať fotky, ktoré sa vám páčia.",
    },
    lt: {
      "Event Highlights": "Įvykio akcentai",
      "Event Highlights — SnapUp Events":
        "Svarbiausi renginiai – „SnapUp“ įvykiai",
      "Most liked photo, top uploader and event summary":
        "Labiausiai patikusi nuotrauka, populiariausias įkėlėjas ir įvykio santrauka",
      "Highlights are ready to share": "Svarbiausi dalykai paruošti bendrinti",
      "Private preview until the event ends":
        "Privati peržiūra iki renginio pabaigos",
      Back: "Atgal",
      "Share Highlights": "Dalintis svarbiausiomis akimirkomis",
      "Preparing Event Highlights...": "Ruošiamasi svarbiausių įvykių...",
      "Collecting the best moments from this event.":
        "Renkamos geriausios šio renginio akimirkos.",
      "Highlights could not be loaded": "Nepavyko įkelti svarbiausių elementų",
      "Please check the link and try again.":
        "Patikrinkite nuorodą ir bandykite dar kartą.",
      "Back to Home": "Grįžti į pagrindinį puslapį",
      "PRIVATE PREVIEW": "PRIVATI PERŽIŪRA",
      SHAREABLE: "DALINTIS",
      "Private owner preview": "Privataus savininko peržiūra",
      "End the event to make this page shareable with guests.":
        "Užbaikite įvykį, kad šį puslapį būtų galima bendrinti su svečiais.",
      "By the numbers": "Pagal skaičius",
      "Event Summary": "Renginio santrauka",
      Participants: "Dalyviai",
      Photos: "Nuotraukos",
      Videos: "Vaizdo įrašai",
      Comments: "Komentarai",
      "Event winners": "Renginio nugalėtojai",
      "Guest favorite": "Svečių mėgstamiausia",
      "Most Liked Photo": "Labiausiai patikusi nuotrauka",
      "Most liked event photo": "Labiausiai patikusi renginio nuotrauka",
      "No liked photo yet": "Patinka dar nėra nuotraukos",
      "The winner will appear after guests like an approved photo.":
        "Laimėtojas pasirodys po to, kai svečiai pažymės patvirtintą nuotrauką.",
      "Shared by": "Bendrino",
      "Memory maker": "Atminties kūrėjas",
      "Top Photo Uploader": "Populiariausia nuotraukų įkėlimo programa",
      "Most active photographer": "Aktyviausias fotografas",
      "No uploader yet": "Dar nėra įkėlimo programos",
      "Approved photo uploads will be counted here.":
        "Patvirtintų nuotraukų įkėlimas bus skaičiuojamas čia.",
      "Photos uploaded": "Nuotraukos įkeltos",
      "Every guest. Every moment. One shared album.":
        "Kiekvienas svečias. Kiekvieną akimirką. Vienas bendras albumas.",
      "Share after event ends": "Pasidalinkite renginiui pasibaigus",
      "See the highlights from this event.":
        "Peržiūrėkite svarbiausius šio renginio momentus.",
      "Highlights link copied.": "Svarbiausia nuoroda nukopijuota.",
      "Highlights link could not be copied.":
        "Nepavyko nukopijuoti svarbiausių elementų nuorodos.",
      "{name} shared the most approved photos from this event.":
        "{name} pasidalino labiausiai patvirtintomis šio renginio nuotraukomis.",
      "Date not specified": "Data nenurodyta",
      "A valid Highlights link is required.":
        "Būtina pateikti galiojančią svarbiausių vietų nuorodą.",
      "Event Highlights could not be loaded.":
        "Nepavyko įkelti svarbiausių įvykių.",
      "Event Highlights becomes shareable after the event is ended.":
        "Įvykio akcentai tampa bendrinami įvykiui pasibaigus.",
      "Event not found or you do not have permission.":
        "Įvykis nerastas arba jūs neturite leidimo.",
      "Event not found.": "Įvykis nerastas.",
      "Event participants could not be loaded.":
        "Renginio dalyvių nepavyko įkelti.",
      "Approved event content could not be loaded.":
        "Nepavyko įkelti patvirtinto įvykio turinio.",
      "Photo likes could not be loaded.":
        "Nepavyko įkelti nuotraukų, kad patinka.",
    },
    lv: {
      "Event Highlights": "Notikuma svarīgākie punkti",
      "Event Highlights — SnapUp Events":
        "Svarīgākie notikumi — SnapUp notikumi",
      "Most liked photo, top uploader and event summary":
        "Visvairāk patika fotoattēls, populārākais augšupielādētājs un pasākuma kopsavilkums",
      "Highlights are ready to share":
        "Svarīgākie punkti ir gatavi kopīgošanai",
      "Private preview until the event ends":
        "Privāts priekšskatījums līdz pasākuma beigām",
      Back: "Atpakaļ",
      "Share Highlights": "Kopīgojiet izcēlumus",
      "Preparing Event Highlights...":
        "Notiek notikuma svarīgāko notikumu sagatavošana...",
      "Collecting the best moments from this event.":
        "Apkopojot labākos mirkļus no šī pasākuma.",
      "Highlights could not be loaded": "Izcēlumus nevarēja ielādēt",
      "Please check the link and try again.":
        "Lūdzu, pārbaudiet saiti un mēģiniet vēlreiz.",
      "Back to Home": "Atpakaļ uz sākumlapu",
      "PRIVATE PREVIEW": "PRIVĀTS PRIEKŠSKATĪJUMS",
      SHAREABLE: "DALĪGAS",
      "Private owner preview": "Privātā īpašnieka priekšskatījums",
      "End the event to make this page shareable with guests.":
        "Pabeidziet pasākumu, lai šo lapu varētu kopīgot ar viesiem.",
      "By the numbers": "Pēc skaitļiem",
      "Event Summary": "Pasākuma kopsavilkums",
      Participants: "Dalībnieki",
      Photos: "Fotogrāfijas",
      Videos: "Videoklipi",
      Comments: "komentāri",
      "Event winners": "Pasākuma uzvarētāji",
      "Guest favorite": "Viesu iecienītākais",
      "Most Liked Photo": "Visvairāk patika fotogrāfija",
      "Most liked event photo": "Visvairāk patika pasākuma foto",
      "No liked photo yet": "Vēl nav neviena fotoattēla, kas atzīmēts ar Patīk",
      "The winner will appear after guests like an approved photo.":
        "Uzvarētājs tiks parādīts pēc tam, kad viesi atzīmēs apstiprinātu fotoattēlu.",
      "Shared by": "Kopīgoja",
      "Memory maker": "Atmiņu veidotājs",
      "Top Photo Uploader": "Labākais fotoattēlu augšupielādētājs",
      "Most active photographer": "Aktīvākais fotogrāfs",
      "No uploader yet": "Vēl nav augšupielādētāja",
      "Approved photo uploads will be counted here.":
        "Šeit tiks ieskaitītas apstiprinātās fotoattēlu augšupielādes.",
      "Photos uploaded": "Fotogrāfijas augšupielādētas",
      "Every guest. Every moment. One shared album.":
        "Katrs viesis. Katru mirkli. Viens koplietots albums.",
      "Share after event ends": "Kopīgojiet pēc pasākuma beigām",
      "See the highlights from this event.":
        "Skatiet šī pasākuma svarīgākos notikumus.",
      "Highlights link copied.": "Izcēlumu saite ir nokopēta.",
      "Highlights link could not be copied.":
        "Izcēlumu saiti nevarēja nokopēt.",
      "{name} shared the most approved photos from this event.":
        "{name} kopīgoja visvairāk apstiprinātos fotoattēlus no šī notikuma.",
      "Date not specified": "Datums nav norādīts",
      "A valid Highlights link is required.":
        "Nepieciešama derīga saite Izcelt.",
      "Event Highlights could not be loaded.":
        "Nevarēja ielādēt svarīgākos notikumus.",
      "Event Highlights becomes shareable after the event is ended.":
        "Notikuma svarīgākie elementi kļūst kopīgojami pēc pasākuma beigām.",
      "Event not found or you do not have permission.":
        "Pasākums nav atrasts vai jums nav atļaujas.",
      "Event not found.": "Pasākums nav atrasts.",
      "Event participants could not be loaded.":
        "Pasākuma dalībniekus nevarēja ielādēt.",
      "Approved event content could not be loaded.":
        "Nevarēja ielādēt apstiprinātā pasākuma saturu.",
      "Photo likes could not be loaded.":
        "Fotoattēlu atzīmes Patīk nevarēja ielādēt.",
    },
    et: {
      "Event Highlights": "Sündmuse tipphetked",
      "Event Highlights — SnapUp Events":
        "Sündmuse esiletõstmised – SnapUpi sündmused",
      "Most liked photo, top uploader and event summary":
        "Enim meeldinud foto, parim üleslaadija ja sündmuse kokkuvõte",
      "Highlights are ready to share": "Tipphetked on jagamiseks valmis",
      "Private preview until the event ends":
        "Privaatne eelvaade kuni sündmuse lõpuni",
      Back: "Tagasi",
      "Share Highlights": "Jaga esiletõstmisi",
      "Preparing Event Highlights...":
        "Sündmuse tipphetkede ettevalmistamine...",
      "Collecting the best moments from this event.":
        "Kogume selle sündmuse parimaid hetki.",
      "Highlights could not be loaded": "Esiletõsteid ei saanud laadida",
      "Please check the link and try again.":
        "Kontrollige linki ja proovige uuesti.",
      "Back to Home": "Tagasi avalehele",
      "PRIVATE PREVIEW": "PRIVAATNE EELVAATE",
      SHAREABLE: "JAGATAV",
      "Private owner preview": "Eraomaniku eelvaade",
      "End the event to make this page shareable with guests.":
        "Lõpetage sündmus, et muuta see leht külalistega jagatavaks.",
      "By the numbers": "Numbrite järgi",
      "Event Summary": "Sündmuse kokkuvõte",
      Participants: "Osalejad",
      Photos: "Fotod",
      Videos: "Videod",
      Comments: "Kommentaarid",
      "Event winners": "Ürituse võitjad",
      "Guest favorite": "Külaliste lemmik",
      "Most Liked Photo": "Enim meeldinud foto",
      "Most liked event photo": "Sündmuse enim meeldinud foto",
      "No liked photo yet": "Meeldinud fotot pole veel",
      "The winner will appear after guests like an approved photo.":
        "Võitja selgub pärast seda, kui külalistele meeldib heakskiidetud foto.",
      "Shared by": "Jaganud",
      "Memory maker": "Mälu tegija",
      "Top Photo Uploader": "Parim foto üleslaadija",
      "Most active photographer": "Kõige aktiivsem fotograaf",
      "No uploader yet": "Üleslaadijat pole veel",
      "Approved photo uploads will be counted here.":
        "Siin arvestatakse heakskiidetud fotode üleslaadimisi.",
      "Photos uploaded": "Fotod üles laaditud",
      "Every guest. Every moment. One shared album.":
        "Iga külaline. Iga hetk. Üks jagatud album.",
      "Share after event ends": "Jagage pärast sündmuse lõppu",
      "See the highlights from this event.":
        "Vaadake selle sündmuse tipphetki.",
      "Highlights link copied.": "Esiletõstete link on kopeeritud.",
      "Highlights link could not be copied.":
        "Esiletõstetud linki ei saanud kopeerida.",
      "{name} shared the most approved photos from this event.":
        "{name} jagas sellelt sündmuselt kõige enam heakskiidetud fotosid.",
      "Date not specified": "Kuupäev pole määratud",
      "A valid Highlights link is required.":
        "Nõutav on kehtiv esiletõstetud link.",
      "Event Highlights could not be loaded.":
        "Sündmuse tipphetki ei saanud laadida.",
      "Event Highlights becomes shareable after the event is ended.":
        "Sündmuse esiletõstmised muutuvad pärast sündmuse lõppu jagatavaks.",
      "Event not found or you do not have permission.":
        "Sündmust ei leitud või teil pole luba.",
      "Event not found.": "Sündmust ei leitud.",
      "Event participants could not be loaded.":
        "Sündmuse osalejaid ei saanud laadida.",
      "Approved event content could not be loaded.":
        "Kinnitatud sündmuse sisu ei saanud laadida.",
      "Photo likes could not be loaded.":
        "Fotode meeldimisi ei saanud laadida.",
    },
    sl: {
      "Event Highlights": "Vrhunci dogodka",
      "Event Highlights — SnapUp Events": "Vrhunci dogodkov — dogodki SnapUp",
      "Most liked photo, top uploader and event summary":
        "Najbolj všečna fotografija, najbolj priljubljena oseba, ki je naložila, in povzetek dogodka",
      "Highlights are ready to share":
        "Poudarki so pripravljeni za skupno rabo",
      "Private preview until the event ends":
        "Zasebni predogled do konca dogodka",
      Back: "Nazaj",
      "Share Highlights": "Delite poudarke",
      "Preparing Event Highlights...": "Priprava utrinkov dogodka ...",
      "Collecting the best moments from this event.":
        "Zbiranje najboljših trenutkov s tega dogodka.",
      "Highlights could not be loaded": "Poudarkov ni bilo mogoče naložiti",
      "Please check the link and try again.":
        "Preverite povezavo in poskusite znova.",
      "Back to Home": "Nazaj na dom",
      "PRIVATE PREVIEW": "ZASEBNI PREDOGLED",
      SHAREABLE: "DELLJIVA",
      "Private owner preview": "Predogled zasebnega lastnika",
      "End the event to make this page shareable with guests.":
        "Končajte dogodek, da omogočite skupno rabo te strani z gosti.",
      "By the numbers": "Po številkah",
      "Event Summary": "Povzetek dogodka",
      Participants: "Udeleženci",
      Photos: "Fotografije",
      Videos: "Videoposnetki",
      Comments: "Komentarji",
      "Event winners": "Zmagovalci dogodka",
      "Guest favorite": "Najljubši gost",
      "Most Liked Photo": "Najbolj všečna fotografija",
      "Most liked event photo": "Najbolj všečkana fotografija dogodka",
      "No liked photo yet": "Ni še všečkane fotografije",
      "The winner will appear after guests like an approved photo.":
        "Zmagovalec bo prikazan, ko bodo gostje všečkali odobreno fotografijo.",
      "Shared by": "Delil z",
      "Memory maker": "Izdelovalec spomina",
      "Top Photo Uploader": "Najboljši program za nalaganje fotografij",
      "Most active photographer": "Najbolj aktiven fotograf",
      "No uploader yet": "Nalagalnika še ni",
      "Approved photo uploads will be counted here.":
        "Tukaj se bodo štela odobrena nalaganja fotografij.",
      "Photos uploaded": "Fotografije so naložene",
      "Every guest. Every moment. One shared album.":
        "Vsak gost. Vsak trenutek. En album v skupni rabi.",
      "Share after event ends": "Delite po koncu dogodka",
      "See the highlights from this event.":
        "Oglejte si utrinke s tega dogodka.",
      "Highlights link copied.": "Povezava do poudarkov je kopirana.",
      "Highlights link could not be copied.":
        "Povezave do poudarkov ni bilo mogoče kopirati.",
      "{name} shared the most approved photos from this event.":
        "{name} je delil največ odobrenih fotografij s tega dogodka.",
      "Date not specified": "Datum ni določen",
      "A valid Highlights link is required.":
        "Zahtevana je veljavna povezava do poudarkov.",
      "Event Highlights could not be loaded.":
        "Poudarkov dogodka ni bilo mogoče naložiti.",
      "Event Highlights becomes shareable after the event is ended.":
        "Poudarke dogodka lahko po koncu dogodka delite z drugimi.",
      "Event not found or you do not have permission.":
        "Dogodka ni mogoče najti ali pa nimate dovoljenja.",
      "Event not found.": "Dogodka ni mogoče najti.",
      "Event participants could not be loaded.":
        "Udeležencev dogodka ni bilo mogoče naložiti.",
      "Approved event content could not be loaded.":
        "Vsebine odobrenega dogodka ni bilo mogoče naložiti.",
      "Photo likes could not be loaded.":
        "Všečkov fotografij ni bilo mogoče naložiti.",
    },
    ta: {
      "Event Highlights": "நிகழ்வின் சிறப்பம்சங்கள்",
      "Event Highlights — SnapUp Events":
        "நிகழ்வு சிறப்பம்சங்கள் - SnapUp நிகழ்வுகள்",
      "Most liked photo, top uploader and event summary":
        "மிகவும் விரும்பப்பட்ட புகைப்படம், சிறந்த பதிவேற்றி மற்றும் நிகழ்வு சுருக்கம்",
      "Highlights are ready to share": "சிறப்பம்சங்கள் பகிர தயாராக உள்ளன",
      "Private preview until the event ends":
        "நிகழ்வு முடியும் வரை தனிப்பட்ட மாதிரிக்காட்சி",
      Back: "மீண்டும்",
      "Share Highlights": "சிறப்பம்சங்களைப் பகிரவும்",
      "Preparing Event Highlights...":
        "நிகழ்வின் சிறப்பம்சங்களைத் தயாரிக்கிறது...",
      "Collecting the best moments from this event.":
        "இந்த நிகழ்விலிருந்து சிறந்த தருணங்களை சேகரிக்கிறது.",
      "Highlights could not be loaded": "சிறப்பம்சங்களை ஏற்ற முடியவில்லை",
      "Please check the link and try again.":
        "இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
      "Back to Home": "முகப்புக்குத் திரும்பு",
      "PRIVATE PREVIEW": "தனியார் முன்னோட்டம்",
      SHAREABLE: "பகிரக்கூடியது",
      "Private owner preview": "தனியார் உரிமையாளர் முன்னோட்டம்",
      "End the event to make this page shareable with guests.":
        "விருந்தினர்களுடன் இந்தப் பக்கத்தைப் பகிரக்கூடியதாக மாற்ற நிகழ்வை முடிக்கவும்.",
      "By the numbers": "எண்கள் மூலம்",
      "Event Summary": "நிகழ்வு சுருக்கம்",
      Participants: "பங்கேற்பாளர்கள்",
      Photos: "புகைப்படங்கள்",
      Videos: "வீடியோக்கள்",
      Comments: "கருத்துகள்",
      "Event winners": "நிகழ்வு வெற்றியாளர்கள்",
      "Guest favorite": "விருந்தினர் பிடித்தது",
      "Most Liked Photo": "அதிகம் விரும்பப்பட்ட புகைப்படம்",
      "Most liked event photo": "மிகவும் விரும்பப்பட்ட நிகழ்வு புகைப்படம்",
      "No liked photo yet": "இன்னும் புகைப்படம் பிடிக்கவில்லை",
      "The winner will appear after guests like an approved photo.":
        "அங்கீகரிக்கப்பட்ட புகைப்படம் போன்று விருந்தினர்களுக்குப் பிறகு வெற்றியாளர் தோன்றுவார்.",
      "Shared by": "மூலம் பகிரப்பட்டது",
      "Memory maker": "நினைவகத்தை உருவாக்குபவர்",
      "Top Photo Uploader": "சிறந்த புகைப்பட பதிவேற்றி",
      "Most active photographer": "மிகவும் சுறுசுறுப்பான புகைப்படக்காரர்",
      "No uploader yet": "இதுவரை பதிவேற்றுபவர் இல்லை",
      "Approved photo uploads will be counted here.":
        "அங்கீகரிக்கப்பட்ட புகைப்படப் பதிவேற்றங்கள் இங்கே கணக்கிடப்படும்.",
      "Photos uploaded": "புகைப்படங்கள் பதிவேற்றப்பட்டன",
      "Every guest. Every moment. One shared album.":
        "ஒவ்வொரு விருந்தினர். ஒவ்வொரு கணமும். ஒருவர் பகிரப்பட்ட ஆல்பம்.",
      "Share after event ends": "நிகழ்வு முடிந்ததும் பகிரவும்",
      "See the highlights from this event.":
        "இந்த நிகழ்வின் சிறப்பம்சங்களைப் பாருங்கள்.",
      "Highlights link copied.": "ஹைலைட்ஸ் இணைப்பு நகலெடுக்கப்பட்டது.",
      "Highlights link could not be copied.":
        "சிறப்பம்சங்கள் இணைப்பை நகலெடுக்க முடியவில்லை.",
      "{name} shared the most approved photos from this event.":
        "{name} இந்த நிகழ்வின் மிகவும் அங்கீகரிக்கப்பட்ட புகைப்படங்களைப் பகிர்ந்துள்ளது.",
      "Date not specified": "தேதி குறிப்பிடப்படவில்லை",
      "A valid Highlights link is required.": "சரியான ஹைலைட்ஸ் இணைப்பு தேவை.",
      "Event Highlights could not be loaded.":
        "நிகழ்வின் சிறப்பம்சங்களை ஏற்ற முடியவில்லை.",
      "Event Highlights becomes shareable after the event is ended.":
        "நிகழ்வு முடிந்ததும், நிகழ்வின் சிறப்பம்சங்கள் பகிரப்படும்.",
      "Event not found or you do not have permission.":
        "நிகழ்வு கிடைக்கவில்லை அல்லது உங்களுக்கு அனுமதி இல்லை.",
      "Event not found.": "நிகழ்வு கிடைக்கவில்லை.",
      "Event participants could not be loaded.":
        "நிகழ்வில் பங்கேற்பாளர்களை ஏற்ற முடியவில்லை.",
      "Approved event content could not be loaded.":
        "அங்கீகரிக்கப்பட்ட நிகழ்வு உள்ளடக்கத்தை ஏற்ற முடியவில்லை.",
      "Photo likes could not be loaded.":
        "புகைப்பட விருப்பங்களை ஏற்ற முடியவில்லை.",
    },
    te: {
      "Event Highlights": "ఈవెంట్ హైలైట్స్",
      "Event Highlights — SnapUp Events":
        "ఈవెంట్ ముఖ్యాంశాలు — SnapUp ఈవెంట్‌లు",
      "Most liked photo, top uploader and event summary":
        "ఎక్కువగా ఇష్టపడిన ఫోటో, టాప్ అప్‌లోడర్ మరియు ఈవెంట్ సారాంశం",
      "Highlights are ready to share":
        "ముఖ్యాంశాలు భాగస్వామ్యం చేయడానికి సిద్ధంగా ఉన్నాయి",
      "Private preview until the event ends":
        "ఈవెంట్ ముగిసే వరకు ప్రైవేట్ ప్రివ్యూ",
      Back: "వెనుకకు",
      "Share Highlights": "ముఖ్యాంశాలను భాగస్వామ్యం చేయండి",
      "Preparing Event Highlights...": "ఈవెంట్ హైలైట్‌లను సిద్ధం చేస్తోంది...",
      "Collecting the best moments from this event.":
        "ఈ ఈవెంట్ నుండి ఉత్తమ క్షణాలను సేకరిస్తోంది.",
      "Highlights could not be loaded": "హైలైట్‌లను లోడ్ చేయడం సాధ్యపడలేదు",
      "Please check the link and try again.":
        "దయచేసి లింక్‌ని తనిఖీ చేసి, మళ్లీ ప్రయత్నించండి.",
      "Back to Home": "ఇంటికి తిరిగి వెళ్ళు",
      "PRIVATE PREVIEW": "ప్రైవేట్ ప్రివ్యూ",
      SHAREABLE: "పంచుకోదగినది",
      "Private owner preview": "ప్రైవేట్ యజమాని ప్రివ్యూ",
      "End the event to make this page shareable with guests.":
        "ఈ పేజీని అతిథులతో భాగస్వామ్యం చేయగలిగేలా చేయడానికి ఈవెంట్‌ను ముగించండి.",
      "By the numbers": "సంఖ్యల ద్వారా",
      "Event Summary": "ఈవెంట్ సారాంశం",
      Participants: "పాల్గొనేవారు",
      Photos: "ఫోటోలు",
      Videos: "వీడియోలు",
      Comments: "వ్యాఖ్యలు",
      "Event winners": "ఈవెంట్ విజేతలు",
      "Guest favorite": "అతిథి ఇష్టమైనది",
      "Most Liked Photo": "ఎక్కువగా ఇష్టపడిన ఫోటో",
      "Most liked event photo": "ఈవెంట్ ఫోటో ఎక్కువగా లైక్ చేయబడింది",
      "No liked photo yet": "ఇంకా లైక్ చేసిన ఫోటో లేదు",
      "The winner will appear after guests like an approved photo.":
        "ఆమోదించబడిన ఫోటో వంటి అతిథుల తర్వాత విజేత కనిపిస్తుంది.",
      "Shared by": "ద్వారా భాగస్వామ్యం చేయబడింది",
      "Memory maker": "మెమరీ మేకర్",
      "Top Photo Uploader": "టాప్ ఫోటో అప్‌లోడర్",
      "Most active photographer": "అత్యంత చురుకైన ఫోటోగ్రాఫర్",
      "No uploader yet": "ఇంకా అప్‌లోడర్ లేదు",
      "Approved photo uploads will be counted here.":
        "ఆమోదించబడిన ఫోటో అప్‌లోడ్‌లు ఇక్కడ లెక్కించబడతాయి.",
      "Photos uploaded": "ఫోటోలు అప్‌లోడ్ చేయబడ్డాయి",
      "Every guest. Every moment. One shared album.":
        "ప్రతి అతిథి. ప్రతి క్షణం. ఒకరు ఆల్బమ్‌ని భాగస్వామ్యం చేసారు.",
      "Share after event ends": "ఈవెంట్ ముగిసిన తర్వాత షేర్ చేయండి",
      "See the highlights from this event.":
        "ఈ ఈవెంట్‌లోని ముఖ్యాంశాలను చూడండి.",
      "Highlights link copied.": "హైలైట్‌ల లింక్ కాపీ చేయబడింది.",
      "Highlights link could not be copied.":
        "హైలైట్‌ల లింక్‌ని కాపీ చేయడం సాధ్యపడలేదు.",
      "{name} shared the most approved photos from this event.":
        "{name} ఈ ఈవెంట్ నుండి అత్యంత ఆమోదించబడిన ఫోటోలను భాగస్వామ్యం చేసారు.",
      "Date not specified": "తేదీ పేర్కొనబడలేదు",
      "A valid Highlights link is required.":
        "చెల్లుబాటు అయ్యే హైలైట్‌ల లింక్ అవసరం.",
      "Event Highlights could not be loaded.":
        "ఈవెంట్ హైలైట్‌లను లోడ్ చేయడం సాధ్యపడలేదు.",
      "Event Highlights becomes shareable after the event is ended.":
        "ఈవెంట్ ముగిసిన తర్వాత ఈవెంట్ ముఖ్యాంశాలు భాగస్వామ్యం చేయబడతాయి.",
      "Event not found or you do not have permission.":
        "ఈవెంట్ కనుగొనబడలేదు లేదా మీకు అనుమతి లేదు.",
      "Event not found.": "ఈవెంట్ కనుగొనబడలేదు.",
      "Event participants could not be loaded.":
        "ఈవెంట్ పార్టిసిపెంట్‌లను లోడ్ చేయడం సాధ్యపడలేదు.",
      "Approved event content could not be loaded.":
        "ఆమోదించబడిన ఈవెంట్ కంటెంట్‌ను లోడ్ చేయడం సాధ్యపడలేదు.",
      "Photo likes could not be loaded.":
        "ఫోటో లైక్‌లను లోడ్ చేయడం సాధ్యపడలేదు.",
    },
    mr: {
      "Event Highlights": "इव्हेंट हायलाइट्स",
      "Event Highlights — SnapUp Events":
        "इव्हेंट हायलाइट्स - स्नॅपअप इव्हेंट्स",
      "Most liked photo, top uploader and event summary":
        "सर्वाधिक आवडलेला फोटो, टॉप अपलोडर आणि इव्हेंटचा सारांश",
      "Highlights are ready to share": "हायलाइट शेअर करण्यासाठी तयार आहेत",
      "Private preview until the event ends":
        "कार्यक्रम संपेपर्यंत खाजगी पूर्वावलोकन",
      Back: "मागे",
      "Share Highlights": "हायलाइट शेअर करा",
      "Preparing Event Highlights...": "इव्हेंट हायलाइट्स तयार करत आहे...",
      "Collecting the best moments from this event.":
        "या कार्यक्रमातील सर्वोत्तम क्षण गोळा करत आहे.",
      "Highlights could not be loaded": "हायलाइट लोड करणे शक्य झाले नाही",
      "Please check the link and try again.":
        "कृपया लिंक तपासा आणि पुन्हा प्रयत्न करा.",
      "Back to Home": "घरी परत",
      "PRIVATE PREVIEW": "खाजगी पूर्वावलोकन",
      SHAREABLE: "शेअर करण्यायोग्य",
      "Private owner preview": "खाजगी मालकाचे पूर्वावलोकन",
      "End the event to make this page shareable with guests.":
        "हे पृष्ठ अतिथींसह सामायिक करण्यायोग्य बनवण्यासाठी इव्हेंट समाप्त करा.",
      "By the numbers": "संख्यांनुसार",
      "Event Summary": "कार्यक्रमाचा सारांश",
      Participants: "सहभागी",
      Photos: "फोटो",
      Videos: "व्हिडिओ",
      Comments: "टिप्पण्या",
      "Event winners": "कार्यक्रम विजेते",
      "Guest favorite": "पाहुणे आवडते",
      "Most Liked Photo": "सर्वाधिक आवडलेला फोटो",
      "Most liked event photo": "सर्वाधिक आवडलेला कार्यक्रम फोटो",
      "No liked photo yet": "अजून एकही लाईक केलेला फोटो नाही",
      "The winner will appear after guests like an approved photo.":
        "अतिथींनी मंजूर केलेल्या फोटोप्रमाणे विजेता दिसून येईल.",
      "Shared by": "द्वारे सामायिक केले",
      "Memory maker": "मेमरी मेकर",
      "Top Photo Uploader": "शीर्ष फोटो अपलोडर",
      "Most active photographer": "सर्वात सक्रिय छायाचित्रकार",
      "No uploader yet": "अद्याप अपलोडर नाही",
      "Approved photo uploads will be counted here.":
        "मंजूर फोटो अपलोड येथे मोजले जातील.",
      "Photos uploaded": "फोटो अपलोड केले",
      "Every guest. Every moment. One shared album.":
        "प्रत्येक अतिथी. प्रत्येक क्षण. एक शेअर केलेला अल्बम.",
      "Share after event ends": "कार्यक्रम संपल्यानंतर शेअर करा",
      "See the highlights from this event.": "या कार्यक्रमातील क्षणचित्रे पहा.",
      "Highlights link copied.": "हायलाइट लिंक कॉपी केली.",
      "Highlights link could not be copied.":
        "हायलाइट लिंक कॉपी करता आली नाही.",
      "{name} shared the most approved photos from this event.":
        "{name} ने या कार्यक्रमातील सर्वाधिक मंजूर फोटो शेअर केले आहेत.",
      "Date not specified": "तारीख नमूद नाही",
      "A valid Highlights link is required.": "एक वैध हायलाइट लिंक आवश्यक आहे.",
      "Event Highlights could not be loaded.":
        "इव्हेंट हायलाइट लोड करणे शक्य नाही.",
      "Event Highlights becomes shareable after the event is ended.":
        "इव्हेंट संपल्यानंतर इव्हेंट हायलाइट शेअर करण्यायोग्य बनतात.",
      "Event not found or you do not have permission.":
        "कार्यक्रम सापडला नाही किंवा तुम्हाला परवानगी नाही.",
      "Event not found.": "कार्यक्रम सापडला नाही.",
      "Event participants could not be loaded.":
        "इव्हेंट सहभागी लोड करणे शक्य झाले नाही.",
      "Approved event content could not be loaded.":
        "मंजूर इव्हेंट सामग्री लोड करणे शक्य नाही.",
      "Photo likes could not be loaded.": "फोटो लाइक लोड करता आले नाहीत.",
    },
    sw: {
      "Event Highlights": "Vivutio vya Tukio",
      "Event Highlights — SnapUp Events":
        "Vivutio vya Tukio - Matukio ya SnapUp",
      "Most liked photo, top uploader and event summary":
        "Picha inayopendwa zaidi, kipakiaji bora na muhtasari wa tukio",
      "Highlights are ready to share": "Vivutio viko tayari kushirikiwa",
      "Private preview until the event ends":
        "Onyesho la kuchungulia la faragha hadi tukio kuisha",
      Back: "Nyuma",
      "Share Highlights": "Shiriki Vivutio",
      "Preparing Event Highlights...": "Inatayarisha Vivutio vya Tukio...",
      "Collecting the best moments from this event.":
        "Kukusanya matukio bora kutoka kwa tukio hili.",
      "Highlights could not be loaded": "Vivutio havikuweza kupakiwa",
      "Please check the link and try again.":
        "Tafadhali angalia kiungo na ujaribu tena.",
      "Back to Home": "Rudi Nyumbani",
      "PRIVATE PREVIEW": "UHAKIKI WA BINAFSI",
      SHAREABLE: "INAWEZEKANA",
      "Private owner preview": "Onyesho la kukagua mmiliki wa kibinafsi",
      "End the event to make this page shareable with guests.":
        "Maliza tukio ili kufanya ukurasa huu kushirikiwa na wageni.",
      "By the numbers": "Kwa nambari",
      "Event Summary": "Muhtasari wa Tukio",
      Participants: "Washiriki",
      Photos: "Picha",
      Videos: "Video",
      Comments: "Maoni",
      "Event winners": "Washindi wa hafla",
      "Guest favorite": "Mgeni anayependwa",
      "Most Liked Photo": "Picha Inayopendwa Zaidi",
      "Most liked event photo": "Picha ya tukio inayopendwa zaidi",
      "No liked photo yet": "Bado hakuna picha uliyoipenda",
      "The winner will appear after guests like an approved photo.":
        "Mshindi ataonekana baada ya wageni kama picha iliyoidhinishwa.",
      "Shared by": "Imeshirikiwa na",
      "Memory maker": "Mtengeneza kumbukumbu",
      "Top Photo Uploader": "Kipakiaji cha Juu cha Picha",
      "Most active photographer": "Mpiga picha anayefanya kazi zaidi",
      "No uploader yet": "Bado hakuna kipakiaji",
      "Approved photo uploads will be counted here.":
        "Upakiaji wa picha ulioidhinishwa utahesabiwa hapa.",
      "Photos uploaded": "Picha zimepakiwa",
      "Every guest. Every moment. One shared album.":
        "Kila mgeni. Kila dakika. Albamu moja iliyoshirikiwa.",
      "Share after event ends": "Shiriki baada ya tukio kuisha",
      "See the highlights from this event.":
        "Tazama mambo muhimu kutoka kwa tukio hili.",
      "Highlights link copied.": "Kiungo cha kuangazia kimenakiliwa.",
      "Highlights link could not be copied.":
        "Kiungo cha kuangazia hakikuweza kunakiliwa.",
      "{name} shared the most approved photos from this event.":
        "{name} alishiriki picha zilizoidhinishwa zaidi kutoka kwa tukio hili.",
      "Date not specified": "Tarehe haijabainishwa",
      "A valid Highlights link is required.":
        "Kiungo halali cha Muhimu kinahitajika.",
      "Event Highlights could not be loaded.":
        "Vivutio vya Tukio havikuweza kupakiwa.",
      "Event Highlights becomes shareable after the event is ended.":
        "Vivutio vya Tukio vinaweza kushirikiwa baada ya tukio kukamilika.",
      "Event not found or you do not have permission.":
        "Tukio halijapatikana au huna ruhusa.",
      "Event not found.": "Tukio halijapatikana.",
      "Event participants could not be loaded.":
        "Washiriki wa tukio hawakuweza kupakiwa.",
      "Approved event content could not be loaded.":
        "Maudhui ya tukio yaliyoidhinishwa hayakuweza kupakiwa.",
      "Photo likes could not be loaded.":
        "Picha za kupendwa hazikuweza kupakiwa.",
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
