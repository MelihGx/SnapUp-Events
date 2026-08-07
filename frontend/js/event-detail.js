import { API_URL } from "./config.js?v=runtime-api-2";
import { createMemoryBookPdf } from "./memory-book-pdf.js?v=location-details-1";
import { setInvitationStudioEvent } from "./invitation-studio.js?v=location-details-1";
import {
  buildEventMapUrl,
  createLocationMapPicker,
} from "./location-map-picker.js?v=location-map-2";

const token = localStorage.getItem("snapup_token");
const API_BASE_URL = API_URL;

const localeByLanguage = {
  en: "en-US",
  tr: "tr-TR",
  ar: "ar",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  it: "it-IT",
  nl: "nl-NL",
  bg: "bg-BG",
  ro: "ro-RO",
  el: "el-GR",
  sr: "sr-RS",
  hr: "hr-HR",
  bs: "bs-BA",
  sq: "sq-AL",
  mk: "mk-MK",
};

function t(value, replacements = {}) {
  const translated = window.SnapUpI18n?.t?.(value) || value;

  return Object.entries(replacements).reduce(
    (result, [key, replacement]) =>
      result.replaceAll(`{${key}}`, String(replacement)),
    translated,
  );
}

function getCurrentLocale() {
  const language = window.SnapUpI18n?.language || "en";
  return localeByLanguage[language] || "en-US";
}

const detailLoading = document.getElementById("detailLoading");
const detailError = document.getElementById("detailError");
const detailErrorText = document.getElementById("detailErrorText");
const detailContent = document.getElementById("detailContent");

const eventCover = document.getElementById("eventCover");
const eventCoverChangeButton = document.getElementById(
  "eventCoverChangeButton",
);
const eventCoverChangeLabel = document.getElementById(
  "eventCoverChangeLabel",
);
const eventCoverChangeInput = document.getElementById(
  "eventCoverChangeInput",
);
const eventCoverRemoveButton = document.getElementById(
  "eventCoverRemoveButton",
);
const eventCoverRemoveModal = document.getElementById(
  "eventCoverRemoveModal",
);
const eventCoverRemoveClose = document.getElementById(
  "eventCoverRemoveClose",
);
const eventCoverRemoveCancel = document.getElementById(
  "eventCoverRemoveCancel",
);
const eventCoverRemoveConfirm = document.getElementById(
  "eventCoverRemoveConfirm",
);
const eventCoverRemoveEventName = document.getElementById(
  "eventCoverRemoveEventName",
);
const eventCoverRemoveStatus = document.getElementById(
  "eventCoverRemoveStatus",
);
const eventCoverEditor = document.getElementById("eventCoverEditor");
const eventCoverEditorClose = document.getElementById(
  "eventCoverEditorClose",
);
const eventCoverEditorCancel = document.getElementById(
  "eventCoverEditorCancel",
);
const eventCoverEditorStage = document.getElementById(
  "eventCoverEditorStage",
);
const eventCoverEditorImage = document.getElementById(
  "eventCoverEditorImage",
);
const eventCoverEditorZoom = document.getElementById(
  "eventCoverEditorZoom",
);
const eventCoverEditorReset = document.getElementById(
  "eventCoverEditorReset",
);
const eventCoverEditorSave = document.getElementById(
  "eventCoverEditorSave",
);
const eventCoverEditorStatus = document.getElementById(
  "eventCoverEditorStatus",
);
const eventCoverToast = document.getElementById("eventCoverToast");
const eventTitle = document.getElementById("eventTitle");
const eventDescription = document.getElementById("eventDescription");
const eventCode = document.getElementById("eventCode");
const qrBox = document.getElementById("qrBox");

const eventLocation = document.getElementById("eventLocation");
const eventAddress = document.getElementById("eventAddress");
const eventMapLink = document.getElementById("eventMapLink");
const eventLocationEditButton = document.getElementById(
  "eventLocationEditButton",
);
const locationEditorModal = document.getElementById("locationEditorModal");
const locationEditorClose = document.getElementById("locationEditorClose");
const locationEditorCancel = document.getElementById(
  "locationEditorCancel",
);
const locationEditorForm = document.getElementById("locationEditorForm");
const locationEditorVenue = document.getElementById("locationEditorVenue");
const locationEditorAddress = document.getElementById(
  "locationEditorAddress",
);
const locationEditorMap = document.getElementById("locationEditorMap");
const locationEditorMapStatus = document.getElementById(
  "locationEditorMapStatus",
);
const locationEditorMapClear = document.getElementById(
  "locationEditorMapClear",
);
const locationEditorLatitude = document.getElementById(
  "locationEditorLatitude",
);
const locationEditorLongitude = document.getElementById(
  "locationEditorLongitude",
);
const locationEditorResult = document.getElementById(
  "locationEditorResult",
);
const locationEditorSave = document.getElementById("locationEditorSave");
const eventDate = document.getElementById("eventDate");
const eventTime = document.getElementById("eventTime");
const eventCreatedAt = document.getElementById("eventCreatedAt");
const eventStatus = document.getElementById("eventStatus");
const eventPrivacy = document.getElementById("eventPrivacy");

const settingsList = document.getElementById("settingsList");
const mediaGallery = document.getElementById("mediaGallery");

const guestList = document.getElementById("guestList");
const guestSearchInput = document.getElementById("guestSearchInput");
const guestResultCount = document.getElementById("guestResultCount");
const guestTotalBadge = document.getElementById("guestTotalBadge");

const galleryLightbox = document.getElementById("galleryLightbox");
const galleryLightboxBackdrop = document.getElementById(
  "galleryLightboxBackdrop",
);
const galleryLightboxClose = document.getElementById("galleryLightboxClose");
const galleryLightboxPrev = document.getElementById("galleryLightboxPrev");
const galleryLightboxNext = document.getElementById("galleryLightboxNext");
const galleryLightboxImage = document.getElementById("galleryLightboxImage");
const galleryLightboxTitle = document.getElementById("galleryLightboxTitle");
const galleryLightboxMeta = document.getElementById("galleryLightboxMeta");

const copyCodeButton = document.getElementById("copyCodeButton");
const copyJoinLinkButton = document.getElementById("copyJoinLinkButton");
const downloadQrButton = document.getElementById("downloadQrButton");
const memoryBookOpen = document.getElementById("memoryBookOpen");
const memoryBookButtonMeta = document.getElementById("memoryBookButtonMeta");
const memoryBookModal = document.getElementById("memoryBookModal");
const memoryBookModalBackdrop = document.getElementById(
  "memoryBookModalBackdrop",
);
const memoryBookClose = document.getElementById("memoryBookClose");
const memoryBookCancel = document.getElementById("memoryBookCancel");
const memoryBookDownload = document.getElementById("memoryBookDownload");
const memoryBookStatus = document.getElementById("memoryBookStatus");
const memoryBookPhotoCount = document.getElementById("memoryBookPhotoCount");
const memoryBookPageCount = document.getElementById("memoryBookPageCount");
const memoryBookPreviewCover = document.getElementById(
  "memoryBookPreviewCover",
);
const memoryBookPreviewTitle = document.getElementById(
  "memoryBookPreviewTitle",
);
const memoryBookPreviewMeta = document.getElementById("memoryBookPreviewMeta");
const approveAllImagesButton = document.getElementById(
  "approveAllImagesButton",
);
const mobileDetailNav = document.querySelector(".mobile-detail-nav");
const mobileDetailNavLinks = Array.from(
  mobileDetailNav?.querySelectorAll('a[href^="#"]') || [],
);

const openSettingsButton = document.getElementById("openSettingsButton");
const settingsModal = document.getElementById("settingsModal");
const settingsModalClose = document.getElementById("settingsModalClose");
const settingsForm = document.getElementById("settingsForm");
const settingsSaveButton = document.getElementById("settingsSaveButton");
const settingsResult = document.getElementById("settingsResult");
const deleteEventButton = document.getElementById("deleteEventButton");
const eventDeleteSuccessModal = document.getElementById(
  "eventDeleteSuccessModal",
);
const eventDeleteSuccessButton = document.getElementById(
  "eventDeleteSuccessButton",
);

const settingEventActive = document.getElementById("settingEventActive");
const settingAllowUpload = document.getElementById("settingAllowUpload");
const settingOnlyUsers = document.getElementById("settingOnlyUsers");
const settingAllowComments = document.getElementById("settingAllowComments");
const settingAllowLikes = document.getElementById("settingAllowLikes");
const settingRequireApproval = document.getElementById(
  "settingRequireApproval",
);
const settingAllowGalleryView = document.getElementById(
  "settingAllowGalleryView",
);
const settingMaxStorage = document.getElementById("settingMaxStorage");
const settingMaxUpload = document.getElementById("settingMaxUpload");

const guestNameInput = document.getElementById("guestName");
const uploadTypeButtons = Array.from(
  document.querySelectorAll("[data-upload-type]"),
);
const uploadTypePanels = Array.from(
  document.querySelectorAll("[data-upload-panel]"),
);
const photoInput = document.getElementById("photoInput");
const videoInput = document.getElementById("videoInput");
const memoryMessageInput = document.getElementById("memoryMessageInput");
const memoryMessageCount = document.getElementById("memoryMessageCount");
const uploadMediaBtn = document.getElementById("uploadMediaBtn");
const uploadMessage = document.getElementById("uploadMessage");
const photoPreviewBox = document.getElementById("photoPreviewBox");
const photoPreviewList = document.getElementById("photoPreviewList");
const videoPreviewBox = document.getElementById("videoPreviewBox");
const videoPreviewList = document.getElementById("videoPreviewList");
const uploadSuccessPopup = document.getElementById("uploadSuccessPopup");
const uploadSuccessBackdrop = document.getElementById("uploadSuccessBackdrop");
const uploadSuccessTitle = document.getElementById("uploadSuccessTitle");
const uploadSuccessText = document.getElementById("uploadSuccessText");
const uploadSuccessClose = document.getElementById("uploadSuccessClose");

const params = new URLSearchParams(window.location.search);
const eventId = params.get("event_id");

let currentEvent = null;
let currentSettings = null;
let currentRenderedMediaList = [];
let approvedMemoryBookPhotos = [];
let memoryBookReturnTarget = null;
let memoryBookScrollY = 0;
let eventCoverEditorSourceFile = null;
let eventCoverEditorObjectUrl = null;
let eventCoverEditorImageWidth = 0;
let eventCoverEditorImageHeight = 0;
let eventCoverEditorLoadToken = 0;
let eventCoverEditorLastFocusedElement = null;
let eventCoverEditorDrag = null;
let eventCoverEditorCrop = { focalX: 0.5, focalY: 0.5, zoom: 1 };
let eventCoverRemoveLastFocusedElement = null;
let locationEditorPicker = null;
let locationEditorLastFocusedElement = null;

let galleryLightboxItems = [];
let activeGalleryIndex = 0;

let allMediaItems = [];
let activeMediaFilter = "all";

let allGuests = [];
let guestSearchTerm = "";
let activeUploadType = "photo";
let queuedPhotoFiles = [];
let queuedVideoFiles = [];
let photoPreviewObjectUrls = [];
let videoPreviewObjectUrls = [];
let uploadSuccessLastFocusedElement = null;

const MEDIA_UPLOAD_MAX_SIZE = 50 * 1024 * 1024;
const MEDIA_UPLOAD_MAX_FILES = 15;
const MEDIA_UPLOAD_MAX_TOTAL_SIZE = 200 * 1024 * 1024;
const PHOTO_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_UPLOAD_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const EVENT_COVER_MAX_SIZE = 8 * 1024 * 1024;
const EVENT_COVER_TYPES = ["image/jpeg", "image/png", "image/webp"];
const EVENT_COVER_OUTPUT_WIDTH = 1296;
const EVENT_COVER_OUTPUT_HEIGHT = 1032;

if (!token) {
  window.location.href = "login.html";
}

if (!eventId) {
  showError("Event ID was not found. Return from the Account page.");
}

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function logout() {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, { method: "POST" });
  } catch (_error) {
    // Clear local state even when the backend cannot be reached.
  } finally {
    localStorage.removeItem("snapup_token");
    localStorage.removeItem("snapup_user");
    window.location.href = "login.html";
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setActiveMobileSection(sectionId) {
  mobileDetailNavLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${sectionId}`;

    if (isActive) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function setupMobileSectionNavigation() {
  if (!mobileDetailNav || !mobileDetailNavLinks.length) {
    return;
  }

  mobileDetailNavLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const sectionId = link.getAttribute("href")?.slice(1);

      if (sectionId) {
        setActiveMobileSection(sectionId);
      }
    });
  });

  if (!("IntersectionObserver" in window)) {
    return;
  }

  const observedSections = mobileDetailNavLinks
    .map((link) => {
      const sectionId = link.getAttribute("href")?.slice(1);
      return sectionId ? document.getElementById(sectionId) : null;
    })
    .filter(Boolean);

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visibleSection = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

      if (visibleSection?.target?.id) {
        setActiveMobileSection(visibleSection.target.id);
      }
    },
    {
      rootMargin: "-18% 0px -57% 0px",
      threshold: [0, 0.15, 0.35],
    },
  );

  observedSections.forEach((section) => sectionObserver.observe(section));
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "-";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return new Intl.DateTimeFormat(getCurrentLocale(), {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(`${dateValue}T12:00:00`));
  }

  return new Intl.DateTimeFormat(getCurrentLocale(), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

function formatDateTime(dateValue) {
  if (!dateValue) {
    return "-";
  }

  return new Date(dateValue).toLocaleString(getCurrentLocale(), {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatTime(timeValue) {
  if (!timeValue) {
    return null;
  }

  return String(timeValue).slice(0, 5);
}

function getEventTimeText(event) {
  const start = formatTime(event.event_start_time);
  const finish = formatTime(event.event_finish_time);

  if (start && finish) {
    return `${start} - ${finish}`;
  }

  if (start) {
    return start;
  }

  return "-";
}

function getEventLocationParts(event) {
  return {
    venue: String(event?.event_location || "").trim(),
    address: String(event?.event_address || "").trim(),
  };
}

function getEventLocationText(event) {
  const { venue, address } = getEventLocationParts(event);
  return [venue, address].filter(Boolean).join(", ");
}

function getEventMapUrl(event) {
  return buildEventMapUrl(event);
}

function getJoinUrl(event) {
  if (!event?.event_code) {
    return "";
  }

  const joinUrl = new URL("index.html", window.location.href);
  joinUrl.searchParams.set("code", event.event_code);

  return joinUrl.toString();
}

function getQrImageUrl(event) {
  const joinUrl = getJoinUrl(event);

  if (!joinUrl) {
    return "";
  }

  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
    joinUrl,
  )}`;
}

async function copyTextToClipboard(value) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const temporaryInput = document.createElement("textarea");
  temporaryInput.value = value;
  temporaryInput.setAttribute("readonly", "");
  temporaryInput.style.position = "fixed";
  temporaryInput.style.opacity = "0";
  temporaryInput.style.pointerEvents = "none";

  document.body.appendChild(temporaryInput);
  temporaryInput.select();
  temporaryInput.setSelectionRange(0, temporaryInput.value.length);

  const copied = document.execCommand("copy");
  temporaryInput.remove();

  if (!copied) {
    throw new Error("Copy failed.");
  }
}

function showEventCodeCopiedFeedback() {
  if (!eventCode) {
    return;
  }

  eventCode.dataset.copyFeedback = t("Copied!");
  eventCode.classList.remove("is-copied");
  void eventCode.offsetWidth;
  eventCode.classList.add("is-copied");

  window.clearTimeout(showEventCodeCopiedFeedback.timeoutId);
  showEventCodeCopiedFeedback.timeoutId = window.setTimeout(() => {
    eventCode.classList.remove("is-copied");
  }, 1300);
}

async function copyCurrentEventCode() {
  if (!currentEvent?.event_code) {
    return;
  }

  await copyTextToClipboard(currentEvent.event_code);
  showEventCodeCopiedFeedback();
}

function showError(message) {
  detailLoading.hidden = true;
  detailContent.hidden = true;
  detailError.hidden = false;
  detailErrorText.textContent = t(message);
}

function showContent() {
  detailLoading.hidden = true;
  detailError.hidden = true;
  detailContent.hidden = false;
}

function setEventCoverBackground(coverUrl) {
  const hasCover = Boolean(coverUrl);

  eventCover.classList.toggle("has-image", hasCover);

  if (hasCover) {
    eventCover.style.backgroundImage = `url(${JSON.stringify(coverUrl)})`;
  } else {
    eventCover.style.removeProperty("background-image");
  }

  if (eventCoverChangeLabel) {
    eventCoverChangeLabel.textContent = t(
      hasCover ? "Change Photo" : "Add Photo",
    );
  }

  if (eventCoverRemoveButton) {
    eventCoverRemoveButton.hidden = !hasCover;
  }
}

function setEventCoverRemoveStatus(message = "") {
  if (eventCoverRemoveStatus) {
    eventCoverRemoveStatus.textContent = message;
  }
}

function openEventCoverRemoveDialog() {
  if (!currentEvent?.event_cover_url || !eventCoverRemoveModal) {
    return;
  }

  eventCoverRemoveLastFocusedElement = document.activeElement;
  setEventCoverRemoveStatus("");

  if (eventCoverRemoveEventName) {
    eventCoverRemoveEventName.textContent =
      currentEvent.event_name || t("Untitled Event");
  }

  eventCoverRemoveModal.classList.add("active");
  eventCoverRemoveModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("event-cover-remove-open");
  eventCoverRemoveCancel?.focus();
}

function closeEventCoverRemoveDialog({ restoreFocus = true } = {}) {
  eventCoverRemoveModal?.classList.remove("active");
  eventCoverRemoveModal?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("event-cover-remove-open");
  setEventCoverRemoveStatus("");

  if (restoreFocus && eventCoverRemoveLastFocusedElement?.focus) {
    eventCoverRemoveLastFocusedElement.focus();
  }
}

function showEventCoverToast(message, type = "success") {
  if (!eventCoverToast) {
    return;
  }

  eventCoverToast.textContent = message;
  eventCoverToast.classList.toggle("is-error", type === "error");
  eventCoverToast.hidden = false;

  window.clearTimeout(showEventCoverToast.timeoutId);
  showEventCoverToast.timeoutId = window.setTimeout(() => {
    eventCoverToast.hidden = true;
  }, 3200);
}

function setEventCoverEditorStatus(message = "") {
  if (eventCoverEditorStatus) {
    eventCoverEditorStatus.textContent = message;
  }
}

function clampEventCoverValue(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function releaseEventCoverEditorObjectUrl() {
  if (eventCoverEditorObjectUrl) {
    URL.revokeObjectURL(eventCoverEditorObjectUrl);
    eventCoverEditorObjectUrl = null;
  }
}

function getEventCoverEditorMetrics() {
  if (
    !eventCoverEditorStage ||
    !eventCoverEditorImageWidth ||
    !eventCoverEditorImageHeight
  ) {
    return null;
  }

  const stageWidth = eventCoverEditorStage.clientWidth;
  const stageHeight = eventCoverEditorStage.clientHeight;

  if (!stageWidth || !stageHeight) {
    return null;
  }

  const baseScale = Math.max(
    stageWidth / eventCoverEditorImageWidth,
    stageHeight / eventCoverEditorImageHeight,
  );
  const scale = baseScale * eventCoverEditorCrop.zoom;
  const width = eventCoverEditorImageWidth * scale;
  const height = eventCoverEditorImageHeight * scale;
  const unclampedLeft =
    stageWidth / 2 - eventCoverEditorCrop.focalX * width;
  const unclampedTop =
    stageHeight / 2 - eventCoverEditorCrop.focalY * height;
  const left = clampEventCoverValue(
    unclampedLeft,
    stageWidth - width,
    0,
  );
  const top = clampEventCoverValue(
    unclampedTop,
    stageHeight - height,
    0,
  );

  eventCoverEditorCrop.focalX = clampEventCoverValue(
    (stageWidth / 2 - left) / width,
    0,
    1,
  );
  eventCoverEditorCrop.focalY = clampEventCoverValue(
    (stageHeight / 2 - top) / height,
    0,
    1,
  );

  return {
    stageWidth,
    stageHeight,
    scale,
    width,
    height,
    left,
    top,
  };
}

function renderEventCoverEditor() {
  const metrics = getEventCoverEditorMetrics();

  if (!metrics || !eventCoverEditorImage) {
    return;
  }

  eventCoverEditorImage.style.width = `${metrics.width}px`;
  eventCoverEditorImage.style.height = `${metrics.height}px`;
  eventCoverEditorImage.style.left = `${metrics.left}px`;
  eventCoverEditorImage.style.top = `${metrics.top}px`;
}

function closeEventCoverEditor({ restoreFocus = true } = {}) {
  eventCoverEditorLoadToken += 1;
  eventCoverEditorDrag = null;
  eventCoverEditorStage?.classList.remove("is-dragging");
  eventCoverEditor?.classList.remove("active");
  eventCoverEditor?.setAttribute("aria-hidden", "true");
  eventCoverEditorImage?.removeAttribute("src");
  document.body.classList.remove("event-cover-editor-open");
  releaseEventCoverEditorObjectUrl();
  eventCoverEditorSourceFile = null;
  eventCoverEditorImageWidth = 0;
  eventCoverEditorImageHeight = 0;
  setEventCoverEditorStatus("");

  if (eventCoverChangeInput) {
    eventCoverChangeInput.value = "";
  }

  if (restoreFocus && eventCoverEditorLastFocusedElement?.focus) {
    eventCoverEditorLastFocusedElement.focus();
  }
}

function openEventCoverEditor(file) {
  if (
    !file ||
    !eventCoverEditor ||
    !eventCoverEditorImage ||
    !eventCoverEditorStage ||
    !eventCoverEditorZoom ||
    !eventCoverEditorSave
  ) {
    return;
  }

  releaseEventCoverEditorObjectUrl();
  eventCoverEditorSourceFile = file;
  eventCoverEditorImageWidth = 0;
  eventCoverEditorImageHeight = 0;
  eventCoverEditorCrop = { focalX: 0.5, focalY: 0.5, zoom: 1 };
  eventCoverEditorZoom.value = "1";
  eventCoverEditorLastFocusedElement =
    document.activeElement === eventCoverChangeInput
      ? eventCoverChangeButton
      : document.activeElement;
  eventCoverEditorSave.disabled = true;
  eventCoverEditorImage.style.opacity = "0";
  setEventCoverEditorStatus("");

  eventCoverEditor.classList.add("active");
  eventCoverEditor.setAttribute("aria-hidden", "false");
  document.body.classList.add("event-cover-editor-open");

  const currentLoadToken = ++eventCoverEditorLoadToken;
  eventCoverEditorObjectUrl = URL.createObjectURL(file);

  eventCoverEditorImage.onload = () => {
    if (currentLoadToken !== eventCoverEditorLoadToken) {
      return;
    }

    eventCoverEditorImageWidth = eventCoverEditorImage.naturalWidth;
    eventCoverEditorImageHeight = eventCoverEditorImage.naturalHeight;

    if (!eventCoverEditorImageWidth || !eventCoverEditorImageHeight) {
      closeEventCoverEditor();
      showEventCoverToast(
        t("Photo could not be prepared. Please choose another image."),
        "error",
      );
      return;
    }

    eventCoverEditorImage.style.opacity = "1";
    eventCoverEditorSave.disabled = false;
    requestAnimationFrame(() => {
      renderEventCoverEditor();
      eventCoverEditorStage.focus();
    });
  };

  eventCoverEditorImage.onerror = () => {
    if (currentLoadToken !== eventCoverEditorLoadToken) {
      return;
    }

    closeEventCoverEditor();
    showEventCoverToast(
      t("Photo could not be prepared. Please choose another image."),
      "error",
    );
  };

  eventCoverEditorImage.src = eventCoverEditorObjectUrl;
}

function createCroppedEventCover() {
  const metrics = getEventCoverEditorMetrics();

  if (!metrics || !eventCoverEditorSourceFile || !eventCoverEditorImage) {
    return Promise.reject(new Error("Crop image is not ready."));
  }

  const canvas = document.createElement("canvas");
  canvas.width = EVENT_COVER_OUTPUT_WIDTH;
  canvas.height = EVENT_COVER_OUTPUT_HEIGHT;

  const context = canvas.getContext("2d", { alpha: false });

  if (!context) {
    return Promise.reject(new Error("Canvas is not supported."));
  }

  const sourceX = -metrics.left / metrics.scale;
  const sourceY = -metrics.top / metrics.scale;
  const sourceWidth = metrics.stageWidth / metrics.scale;
  const sourceHeight = metrics.stageHeight / metrics.scale;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    eventCoverEditorImage,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Cropped image could not be created."));
          return;
        }

        const sourceName =
          eventCoverEditorSourceFile.name.replace(/\.[^.]+$/, "") ||
          "event-photo";
        resolve(
          new File([blob], `${sourceName}-cover.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          }),
        );
      },
      "image/jpeg",
      0.92,
    );
  });
}

async function uploadChangedEventCover(file) {
  const formData = new FormData();
  formData.append("event_cover", file);

  const response = await fetch(
    `${API_BASE_URL}/api/events/detail/${eventId}/cover`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  );
  const data = await response.json();

  if (response.status === 401) {
    logout();
    return null;
  }

  if (!response.ok || !data.success || !data.event?.event_cover_url) {
    const error = new Error("Event photo could not be updated.");
    error.serverMessage = data.error || data.message || "";
    throw error;
  }

  return data.event;
}

async function removeCurrentEventCover() {
  const response = await fetch(
    `${API_BASE_URL}/api/events/detail/${eventId}/cover`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    logout();
    return null;
  }

  if (!response.ok || !data.success || !data.event) {
    const error = new Error("Event photo could not be removed.");
    error.serverMessage = data.error || data.message || "";
    throw error;
  }

  return data.event;
}

function renderEventInfo(event) {
  currentEvent = event;

  eventTitle.textContent = event.event_name || t("Untitled Event");
  eventDescription.textContent =
    event.description || t("No description added for this event.");

  eventCode.textContent = event.event_code || "------";
  eventCode.title = t("Copy Code");
  eventCode.setAttribute("aria-label", t("Copy Code"));

  const { venue, address } = getEventLocationParts(event);
  const mapUrl = getEventMapUrl(event);

  eventLocation.textContent = venue || address || "-";
  eventAddress.textContent = venue && address ? address : "";
  eventAddress.hidden = !(venue && address);
  eventMapLink.hidden = !mapUrl;

  if (mapUrl) {
    eventMapLink.href = mapUrl;
    eventMapLink.title = t("Open event location in Maps");
    eventMapLink.setAttribute(
      "aria-label",
      t("Open event location in Maps"),
    );
  } else {
    eventMapLink.removeAttribute("href");
    eventMapLink.removeAttribute("title");
    eventMapLink.removeAttribute("aria-label");
  }

  eventDate.textContent = formatDate(event.event_date);
  eventTime.textContent = getEventTimeText(event);
  eventCreatedAt.textContent = formatDateTime(event.event_created_at);
  eventStatus.textContent = t(event.is_event_active ? "Active" : "Passive");
  eventPrivacy.textContent = t(event.is_event_private ? "Private" : "Public");

  setEventCoverBackground(event.event_cover_url);

  const joinUrl = getJoinUrl(event);
  const qrImageUrl = getQrImageUrl(event);

  if (qrImageUrl) {
    qrBox.innerHTML = `
      <a
        href="${escapeHtml(joinUrl)}"
        class="qr-click-link"
        target="_blank"
        rel="noopener"
        title="${escapeHtml(t("Open guest upload page"))}"
      >
        <img
          src="${escapeHtml(qrImageUrl)}"
          alt="${escapeHtml(t("Event QR code"))}"
        />
      </a>
      <small class="qr-helper-text">${escapeHtml(
        t("Scan or click to join this event"),
      )}</small>
    `;
  } else {
    qrBox.innerHTML = `
      <span>${escapeHtml(t("QR code not found."))}</span>
    `;
  }

  setInvitationStudioEvent(event, joinUrl);
  updateMemoryBookPreview();
}

function updateMemoryBookPreview() {
  if (!currentEvent) {
    return;
  }

  const metaParts = [
    getEventLocationText(currentEvent),
    formatDate(currentEvent.event_date),
    currentEvent.event_code || "",
  ].filter(Boolean);

  if (memoryBookPreviewTitle) {
    memoryBookPreviewTitle.textContent =
      currentEvent.event_name || t("Untitled Event");
  }

  if (memoryBookPreviewMeta) {
    memoryBookPreviewMeta.textContent = metaParts.join(" · ");
  }

  const previewImageUrl =
    currentEvent.event_cover_url ||
    getMediaUrl(approvedMemoryBookPhotos[0] || {});

  if (memoryBookPreviewCover && previewImageUrl) {
    memoryBookPreviewCover.style.backgroundImage = `linear-gradient(
      180deg,
      rgba(12, 7, 25, 0.16),
      rgba(12, 7, 25, 0.92)
    ), url(${JSON.stringify(previewImageUrl)})`;
  } else if (memoryBookPreviewCover) {
    memoryBookPreviewCover.style.removeProperty("background-image");
  }
}

function fillSettingsForm(settings) {
  if (
    !settingAllowUpload ||
    !settingOnlyUsers ||
    !settingAllowComments ||
    !settingAllowLikes ||
    !settingRequireApproval ||
    !settingAllowGalleryView ||
    !settingMaxStorage ||
    !settingMaxUpload
  ) {
    return;
  }

  if (!settings) {
    settingEventActive.checked = true;
    settingAllowUpload.checked = true;
    settingOnlyUsers.checked = false;
    settingAllowComments.checked = true;
    settingAllowLikes.checked = true;
    settingRequireApproval.checked = false;
    settingAllowGalleryView.checked = true;
    settingMaxStorage.value = 500;
    settingMaxUpload.value = 20;
    return;
  }

  settingEventActive.checked = settings.is_event_active !== false;
  settingAllowUpload.checked = Boolean(settings.allow_upload);
  settingOnlyUsers.checked = Boolean(settings.only_users);
  settingAllowComments.checked = Boolean(settings.allow_comments);
  settingAllowLikes.checked = Boolean(settings.allow_likes);
  settingRequireApproval.checked = Boolean(settings.require_approval);
  settingAllowGalleryView.checked = settings.allow_gallery_view !== false;
  settingMaxStorage.value = settings.max_storage_per_guest || 500;
  settingMaxUpload.value = settings.max_upload_per_guest || 20;
}

function renderSettings(settings) {
  currentSettings = settings;
  fillSettingsForm(settings);

  if (!settings) {
    settingsList.innerHTML = `
      <div class="setting-row">
        <strong>${escapeHtml(t("No settings found"))}</strong>
        <span class="off">${escapeHtml(t("Empty"))}</span>
      </div>
    `;
    return;
  }

  const settingItems = [
    {
      label: "Event Active",
      value: settings.is_event_active !== false,
    },
    {
      label: "Allow Upload",
      value: settings.allow_upload,
    },
    {
      label: "Only Registered Users",
      value: settings.only_users,
    },
    {
      label: "Allow Comments",
      value: settings.allow_comments,
    },
    {
      label: "Allow Likes",
      value: settings.allow_likes,
    },
    {
      label: "Require Approval",
      value: settings.require_approval,
    },
    {
      label: "Public Gallery",
      value: settings.allow_gallery_view !== false,
    },
    {
      label: "Max Storage / Guest",
      customValue: `${settings.max_storage_per_guest || 0} MB`,
    },
    {
      label: "Max Upload / Guest",
      customValue: `${settings.max_upload_per_guest || 0}`,
    },
  ];

  settingsList.innerHTML = settingItems
    .map((item) => {
      if (item.customValue) {
        return `
          <div class="setting-row">
            <strong>${escapeHtml(t(item.label))}</strong>
            <span class="on">${escapeHtml(item.customValue)}</span>
          </div>
        `;
      }

      return `
        <div class="setting-row">
          <strong>${escapeHtml(t(item.label))}</strong>
          <span class="${item.value ? "on" : "off"}">
            ${escapeHtml(t(item.value ? "On" : "Off"))}
          </span>
        </div>
      `;
    })
    .join("");
}

function getMediaUrl(media) {
  return media.media_url || media.url || media.file_url || "";
}

function getMediaType(media) {
  return String(
    media.media_type || media.type || media.media_type_name || "",
  ).toLowerCase();
}

function getMediaStatus(media) {
  return String(media.media_status || media.status || "approved").toLowerCase();
}

function isImageMedia(media) {
  const mediaType = getMediaType(media);
  const mediaUrl = getMediaUrl(media);

  return Boolean(mediaUrl) && mediaType.includes("image");
}

function shouldShowApproveAllImagesButton(mediaList) {
  if (!approveAllImagesButton) {
    return false;
  }

  if (activeMediaFilter !== "pending") {
    return false;
  }

  if (!mediaList || mediaList.length === 0) {
    return false;
  }

  return mediaList.some(
    (media) => getMediaStatus(media) === "pending" && isImageMedia(media),
  );
}

function updateApproveAllImagesButtonVisibility(mediaList) {
  if (!approveAllImagesButton) {
    return;
  }

  approveAllImagesButton.hidden = !shouldShowApproveAllImagesButton(mediaList);
}

function getMediaKind(media) {
  const mediaType = getMediaType(media);
  const mediaUrl = getMediaUrl(media);

  if (mediaType.includes("video")) {
    return "video";
  }

  if (mediaType.includes("image")) {
    return "image";
  }

  if (mediaType.includes("message") || mediaType.includes("text")) {
    return "message";
  }

  if (mediaUrl) {
    return "image";
  }

  return "message";
}

function getFilteredMediaList() {
  if (activeMediaFilter === "all") {
    return allMediaItems;
  }

  if (activeMediaFilter === "pending") {
    return allMediaItems.filter((media) => getMediaStatus(media) === "pending");
  }

  return allMediaItems.filter(
    (media) => getMediaKind(media) === activeMediaFilter,
  );
}

function getFilterCount(filterKey) {
  if (filterKey === "all") {
    return allMediaItems.length;
  }

  if (filterKey === "pending") {
    return allMediaItems.filter((media) => getMediaStatus(media) === "pending")
      .length;
  }

  return allMediaItems.filter((media) => getMediaKind(media) === filterKey)
    .length;
}

function ensureMediaFilterBar() {
  if (!mediaGallery || !mediaGallery.parentElement) {
    return null;
  }

  let filterBar = document.getElementById("mediaFilterBar");

  if (!filterBar) {
    filterBar = document.createElement("div");
    filterBar.id = "mediaFilterBar";
    filterBar.className = "media-filter-bar";
    mediaGallery.parentElement.insertBefore(filterBar, mediaGallery);
  }

  return filterBar;
}

function renderMediaFilters() {
  const filterBar = ensureMediaFilterBar();

  if (!filterBar) {
    return;
  }

  const filters = [
    { key: "all", label: "All" },
    { key: "image", label: "Images" },
    { key: "video", label: "Videos" },
    { key: "message", label: "Messages" },
    { key: "pending", label: "Pending" },
  ];

  filterBar.innerHTML = filters
    .map((filter) => {
      const count = getFilterCount(filter.key);

      return `
        <button
          type="button"
          class="${activeMediaFilter === filter.key ? "active" : ""}"
          data-media-filter="${filter.key}"
        >
          ${escapeHtml(t(filter.label))}
          <span>${count}</span>
        </button>
      `;
    })
    .join("");

  filterBar.querySelectorAll("[data-media-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeMediaFilter = button.dataset.mediaFilter || "all";
      renderMediaFilters();
      renderMediaCards();
    });
  });
}

function getStatusLabel(status) {
  if (status === "pending") {
    return t("Pending");
  }

  if (status === "rejected") {
    return t("Rejected");
  }

  return t("Approved");
}

function getTypeLabel(type) {
  if (type === "image") {
    return t("Image");
  }

  if (type === "video") {
    return t("Video");
  }

  return t("Message");
}

function renderAdminActions(mediaId, status) {
  const approveButton =
    status !== "approved"
      ? `
        <button
          type="button"
          class="media-admin-btn approve"
          data-media-action="approve"
          data-media-id="${escapeHtml(mediaId)}"
        >
          ${escapeHtml(t("Approve"))}
        </button>
      `
      : "";

  const rejectButton =
    status !== "rejected"
      ? `
        <button
          type="button"
          class="media-admin-btn reject"
          data-media-action="reject"
          data-media-id="${escapeHtml(mediaId)}"
        >
          ${escapeHtml(t("Reject"))}
        </button>
      `
      : "";

  return `
    <div class="media-admin-actions">
      ${approveButton}
      ${rejectButton}
      <button
        type="button"
        class="media-admin-btn delete"
        data-media-action="delete"
        data-media-id="${escapeHtml(mediaId)}"
      >
        ${escapeHtml(t("Delete"))}
      </button>
    </div>
  `;
}

function renderMediaCards() {
  galleryLightboxItems = [];

  const mediaList = getFilteredMediaList();

  currentRenderedMediaList = mediaList || [];
  updateApproveAllImagesButtonVisibility(currentRenderedMediaList);

  if (!mediaList || mediaList.length === 0) {
    mediaGallery.innerHTML = `
      <div class="empty-gallery">
        <div>
          <h3>${escapeHtml(t("No media found."))}</h3>
          <p>
            ${escapeHtml(
              t("There are no uploaded memories for this filter yet."),
            )}
          </p>
        </div>
      </div>
    `;
    return;
  }

  mediaGallery.innerHTML = mediaList
    .map((media) => {
      const mediaId = media.media_id || media.id || "";
      const mediaUrl = getMediaUrl(media);
      const mediaKind = getMediaKind(media);
      const status = getMediaStatus(media);
      const message = media.message || media.media_message || "";
      const guestName =
        media.guest_name ||
        media.guestName ||
        media.user_name ||
        media.userName ||
        t("Unknown Guest");

      const uploadedAt = media.media_created_at
        ? formatDateTime(media.media_created_at)
        : "";

      const uploaderHtml = `
        <div class="media-uploader">
          <span>${escapeHtml(t("Uploaded by"))}</span>
          <strong>${escapeHtml(guestName)}</strong>
          ${uploadedAt ? `<small>${escapeHtml(uploadedAt)}</small>` : ""}
        </div>
      `;

      const badgeHtml = `
        <div class="media-badge-row">
          <span class="media-type-badge ${escapeHtml(mediaKind)}">
            ${escapeHtml(getTypeLabel(mediaKind))}
          </span>
          <span class="media-status-badge ${escapeHtml(status)}">
            ${escapeHtml(getStatusLabel(status))}
          </span>
        </div>
      `;

      if (mediaUrl && mediaKind === "video") {
        return `
          <article class="media-card admin-media-card">
            <div class="media-preview-wrap">
              ${badgeHtml}
              <video src="${escapeHtml(mediaUrl)}" controls></video>
            </div>

            <div class="media-card-body">
              ${uploaderHtml}
              <p>${escapeHtml(message || t("Video memory"))}</p>
              ${renderAdminActions(mediaId, status)}
            </div>
          </article>
        `;
      }

      if (mediaUrl && mediaKind === "image") {
        const galleryIndex = galleryLightboxItems.length;

        galleryLightboxItems.push({
          url: mediaUrl,
          guestName,
          uploadedAt,
          message: message || t("Photo memory"),
        });

        return `
          <article class="media-card admin-media-card">
            <div class="media-preview-wrap">
              ${badgeHtml}
              <button
                type="button"
                class="media-lightbox-trigger"
                data-gallery-index="${galleryIndex}"
                aria-label="${escapeHtml(
                  t("Open photo uploaded by {name}", { name: guestName }),
                )}"
              >
                <img src="${escapeHtml(mediaUrl)}" alt="Uploaded by ${escapeHtml(
                  guestName,
                )}" />
              </button>
            </div>

            <div class="media-card-body">
              ${uploaderHtml}
              <p>${escapeHtml(message || t("Photo memory"))}</p>
              ${renderAdminActions(mediaId, status)}
            </div>
          </article>
        `;
      }

      return `
        <article class="media-card admin-media-card text-memory-card">
          <div class="media-card-body">
            ${badgeHtml}
            ${uploaderHtml}
            <p>${escapeHtml(message || t("Text memory"))}</p>
            ${renderAdminActions(mediaId, status)}
          </div>
        </article>
      `;
    })
    .join("");

  bindGalleryLightboxButtons();
}

function renderMedia(mediaList) {
  allMediaItems = Array.isArray(mediaList) ? mediaList : [];
  currentRenderedMediaList = getFilteredMediaList();

  updateMemoryBookAvailability();
  updateApproveAllImagesButtonVisibility(currentRenderedMediaList);

  renderMediaFilters();
  renderMediaCards();
}

function updateMemoryBookAvailability() {
  approvedMemoryBookPhotos = allMediaItems.filter(
    (media) => getMediaStatus(media) === "approved" && isImageMedia(media),
  );

  const approvedCount = approvedMemoryBookPhotos.length;

  if (memoryBookOpen) {
    memoryBookOpen.disabled = approvedCount === 0;
    memoryBookOpen.setAttribute(
      "aria-label",
      approvedCount
        ? t("Prepare Memory Book with {count} approved photos", {
            count: approvedCount,
          })
        : t("Memory Book is waiting for approved photos"),
    );
  }

  if (memoryBookButtonMeta) {
    memoryBookButtonMeta.textContent = approvedCount
      ? t("{count} approved photos ready", { count: approvedCount })
      : t("Waiting for approved photos");
  }

  if (memoryBookPhotoCount) {
    memoryBookPhotoCount.textContent = String(approvedCount);
  }

  if (memoryBookPageCount) {
    memoryBookPageCount.textContent = String(
      approvedCount ? approvedCount + 2 : 0,
    );
  }

  updateMemoryBookPreview();
}

function openMemoryBook() {
  if (!approvedMemoryBookPhotos.length || !memoryBookModal) {
    return;
  }

  memoryBookReturnTarget = document.activeElement;
  memoryBookScrollY = window.scrollY;
  memoryBookStatus.textContent = "";
  memoryBookStatus.className = "memory-book-status";
  memoryBookDownload.disabled = false;
  memoryBookCancel.disabled = false;
  memoryBookClose.disabled = false;
  memoryBookDownload.querySelector("span").textContent = t(
    "Download Memory Book",
  );

  updateMemoryBookPreview();
  memoryBookModal.classList.add("active");
  memoryBookModal.setAttribute("aria-hidden", "false");
  document.body.style.top = `-${memoryBookScrollY}px`;
  document.body.classList.add("memory-book-open");
  memoryBookClose.focus();
}

function closeMemoryBook() {
  if (!memoryBookModal || memoryBookDownload.disabled) {
    return;
  }

  memoryBookModal.classList.remove("active");
  memoryBookModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("memory-book-open");
  document.body.style.removeProperty("top");
  window.scrollTo(0, memoryBookScrollY);

  if (memoryBookReturnTarget instanceof HTMLElement) {
    memoryBookReturnTarget.focus();
  }
}

async function downloadMemoryBook() {
  if (
    !eventId ||
    !approvedMemoryBookPhotos.length ||
    memoryBookDownload.disabled
  ) {
    return;
  }

  const buttonText = memoryBookDownload.querySelector("span");

  try {
    memoryBookDownload.disabled = true;
    memoryBookCancel.disabled = true;
    memoryBookClose.disabled = true;
    buttonText.textContent = t("Creating your book...");
    memoryBookStatus.className = "memory-book-status active";
    memoryBookStatus.textContent = t(
      "Arranging approved photos, guest messages and event details...",
    );

    const result = await createMemoryBookPdf({
      event: currentEvent,
      mediaItems: approvedMemoryBookPhotos,
      locale: getCurrentLocale(),
      onProgress: ({ completed, total }) => {
        memoryBookStatus.textContent = t(
          "Preparing photo {completed} of {total}...",
          { completed, total },
        );
      },
    });

    const objectUrl = URL.createObjectURL(result.blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = objectUrl;
    downloadLink.download = result.fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

    memoryBookStatus.className = "memory-book-status active success";
    memoryBookStatus.textContent = result.skippedCount
      ? t(
          "Your Memory Book is ready. {count} unreadable photo(s) were skipped.",
          { count: result.skippedCount },
        )
      : t("Your Memory Book is ready. The download has started.");
    buttonText.textContent = t("Downloaded");

    window.setTimeout(() => {
      memoryBookDownload.disabled = false;
      memoryBookCancel.disabled = false;
      memoryBookClose.disabled = false;
      closeMemoryBook();
    }, 1200);
  } catch (error) {
    console.error("Memory Book download error:", error);
    memoryBookStatus.className = "memory-book-status active error";
    memoryBookStatus.textContent = t(
      error.message || "The Memory Book could not be created.",
    );
    memoryBookDownload.disabled = false;
    memoryBookCancel.disabled = false;
    memoryBookClose.disabled = false;
    buttonText.textContent = t("Try Again");
  }
}

function showGalleryLightboxItem(index) {
  if (
    !galleryLightboxItems.length ||
    !galleryLightboxImage ||
    !galleryLightboxTitle ||
    !galleryLightboxMeta
  ) {
    return;
  }

  if (index < 0) {
    activeGalleryIndex = galleryLightboxItems.length - 1;
  } else if (index >= galleryLightboxItems.length) {
    activeGalleryIndex = 0;
  } else {
    activeGalleryIndex = index;
  }

  const item = galleryLightboxItems[activeGalleryIndex];

  galleryLightboxImage.src = item.url;
  galleryLightboxImage.alt = t("Uploaded by {name}", {
    name: item.guestName,
  });
  galleryLightboxTitle.textContent = t("Uploaded by {name}", {
    name: item.guestName,
  });

  const metaParts = [item.message, item.uploadedAt].filter(Boolean);
  galleryLightboxMeta.textContent = metaParts.join(" · ");

  const hasMultipleItems = galleryLightboxItems.length > 1;

  if (galleryLightboxPrev) {
    galleryLightboxPrev.hidden = !hasMultipleItems;
  }

  if (galleryLightboxNext) {
    galleryLightboxNext.hidden = !hasMultipleItems;
  }
}

function openGalleryLightbox(index) {
  if (!galleryLightbox || !galleryLightboxImage) {
    return;
  }

  showGalleryLightboxItem(index);

  galleryLightbox.classList.add("active");
  galleryLightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("gallery-lightbox-open");
}

function closeGalleryLightbox() {
  if (!galleryLightbox || !galleryLightboxImage) {
    return;
  }

  galleryLightbox.classList.remove("active");
  galleryLightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("gallery-lightbox-open");

  galleryLightboxImage.src = "";
}

function bindGalleryLightboxButtons() {
  const buttons = document.querySelectorAll("[data-gallery-index]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.galleryIndex);
      openGalleryLightbox(index);
    });
  });
}

function getFilteredGuests() {
  const searchValue = guestSearchTerm.trim().toLocaleLowerCase("tr-TR");

  if (!searchValue) {
    return allGuests;
  }

  return allGuests.filter((guest) => {
    const guestName = guest.guest_name || "";

    return guestName.toLocaleLowerCase("tr-TR").includes(searchValue);
  });
}

function renderGuestTotalBadge(totalCount) {
  if (!guestTotalBadge) {
    return;
  }

  guestTotalBadge.textContent = t("{count} guests", { count: totalCount });
}

function renderGuestResultCount(visibleCount, totalCount) {
  if (!guestResultCount) {
    return;
  }

  if (totalCount === 0) {
    guestResultCount.textContent = t(
      "No guests have joined this event yet.",
    );
    return;
  }

  if (guestSearchTerm.trim() !== "") {
    guestResultCount.textContent = t(
      "{visible} of {total} guests found.",
      {
        visible: visibleCount,
        total: totalCount,
      },
    );
    return;
  }

  guestResultCount.textContent = t("{count} guests joined this event.", {
    count: totalCount,
  });
}

function renderGuests() {
  if (!guestList) {
    return;
  }

  const filteredGuests = getFilteredGuests();

  renderGuestTotalBadge(allGuests.length);
  renderGuestResultCount(filteredGuests.length, allGuests.length);

  if (!allGuests || allGuests.length === 0) {
    guestList.innerHTML = `
      <div class="guest-empty">
        ${escapeHtml(t("No guests have joined this event yet."))}
      </div>
    `;
    return;
  }

  if (filteredGuests.length === 0) {
    guestList.innerHTML = `
      <div class="guest-empty">
        ${escapeHtml(t("No guests matched your search."))}
      </div>
    `;
    return;
  }

  guestList.innerHTML = filteredGuests
    .map((guest) => {
      const guestName = guest.guest_name || t("Unknown Guest");
      const totalUploads = guest.total_uploads || 0;
      const pendingUploads = guest.pending_uploads || 0;
      const approvedUploads = guest.approved_uploads || 0;
      const rejectedUploads = guest.rejected_uploads || 0;

      return `
        <article class="guest-card">
          <div class="guest-avatar">
            ${escapeHtml(guestName.charAt(0).toUpperCase())}
          </div>

          <div class="guest-main">
            <strong>${escapeHtml(guestName)}</strong>
            <span>${escapeHtml(
              t("{count} uploads", { count: totalUploads }),
            )}</span>
          </div>

          <div class="guest-stats">
            <span class="approved">${escapeHtml(
              t("{count} approved", { count: approvedUploads }),
            )}</span>
            <span class="pending">${escapeHtml(
              t("{count} pending", { count: pendingUploads }),
            )}</span>
            <span class="rejected">${escapeHtml(
              t("{count} rejected", { count: rejectedUploads }),
            )}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadEventGuests() {
  if (!eventId || !guestList) {
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/events/detail/${eventId}/guests`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || data.message || "Guests could not be loaded.",
      );
    }

    allGuests = data.guests || [];
    renderGuests();
  } catch (error) {
    console.error("Guest list error:", error);

    allGuests = [];
    renderGuestTotalBadge(0);

    if (guestResultCount) {
      guestResultCount.textContent =
        t(error.message || "Guests could not be loaded.");
    }

    guestList.innerHTML = `
      <div class="guest-empty error">
        ${escapeHtml(t(error.message || "Guests could not be loaded."))}
      </div>
    `;
  }
}

async function loadEventDetail() {
  if (!eventId) {
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/events/detail/${eventId}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok || !data.success) {
      showError(data.message || "Event detail could not be loaded.");
      return;
    }

    renderEventInfo(data.event);
    renderSettings(data.settings);
    renderMedia(data.media || []);
    await loadEventGuests();
    showContent();
  } catch (error) {
    console.error("Event detail error:", error);
    showError("Backend connection error.");
  }
}

function getLocationEditorPicker() {
  if (locationEditorPicker) {
    return locationEditorPicker;
  }

  locationEditorPicker = createLocationMapPicker({
    mapElement: locationEditorMap,
    latitudeInput: locationEditorLatitude,
    longitudeInput: locationEditorLongitude,
    addressInput: locationEditorAddress,
    clearButton: locationEditorMapClear,
    statusElement: locationEditorMapStatus,
    translate: t,
  });

  return locationEditorPicker;
}

function setLocationEditorResult(message = "", state = "") {
  if (!locationEditorResult) {
    return;
  }

  locationEditorResult.textContent = message;

  if (state) {
    locationEditorResult.dataset.state = state;
  } else {
    delete locationEditorResult.dataset.state;
  }
}

function openLocationEditor() {
  if (!locationEditorModal || !currentEvent) {
    return;
  }

  locationEditorLastFocusedElement = document.activeElement;
  locationEditorVenue.value = currentEvent.event_location || "";
  locationEditorAddress.value = currentEvent.event_address || "";
  setLocationEditorResult();

  locationEditorModal.classList.add("active");
  locationEditorModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("location-editor-open");

  const picker = getLocationEditorPicker();
  picker?.resetAddressTracking();
  picker?.setCoordinates(
    currentEvent.event_latitude,
    currentEvent.event_longitude,
  );

  requestAnimationFrame(() => {
    picker?.resize();
    locationEditorClose?.focus();
  });
}

function closeLocationEditor({ restoreFocus = true } = {}) {
  if (!locationEditorModal) {
    return;
  }

  locationEditorModal.classList.remove("active");
  locationEditorModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("location-editor-open");
  setLocationEditorResult();

  if (restoreFocus) {
    locationEditorLastFocusedElement?.focus?.();
  }
}

async function updateCurrentEventLocation(payload) {
  const response = await fetch(
    `${API_BASE_URL}/api/events/detail/${eventId}/location`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );
  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    logout();
    return null;
  }

  if (!response.ok || !data.success || !data.event) {
    const error = new Error("Location could not be updated.");
    error.serverMessage = data.error || data.message || "";
    throw error;
  }

  return data.event;
}

function openEventDeleteSuccessPopup() {
  closeSettingsModal();
  eventDeleteSuccessModal?.classList.add("active");
  eventDeleteSuccessModal?.setAttribute("aria-hidden", "false");
  document.body.classList.add("event-delete-success-open");
  eventDeleteSuccessButton?.focus();
}

function returnToAccountAfterDelete() {
  window.location.href = "account.html";
}

function openSettingsModal() {
  if (!settingsModal) {
    return;
  }

  fillSettingsForm(currentSettings);

  if (settingsResult) {
    settingsResult.textContent = "";
  }

  settingsModal.classList.add("active");
  settingsModal.setAttribute("aria-hidden", "false");
}

function closeSettingsModal() {
  if (!settingsModal) {
    return;
  }

  settingsModal.classList.remove("active");
  settingsModal.setAttribute("aria-hidden", "true");
}

function getSettingsPayload() {
  return {
    is_event_active: settingEventActive.checked,
    allow_upload: settingAllowUpload.checked,
    only_users: settingOnlyUsers.checked,
    allow_comments: settingAllowComments.checked,
    allow_likes: settingAllowLikes.checked,
    require_approval: settingRequireApproval.checked,
    allow_gallery_view: settingAllowGalleryView.checked,
    max_storage_per_guest: Number(settingMaxStorage.value) || 500,
    max_upload_per_guest: Number(settingMaxUpload.value) || 20,
  };
}

async function updateEventSettings(payload) {
  const response = await fetch(
    `${API_BASE_URL}/api/events/detail/${eventId}/settings`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  const data = await response.json();

  if (response.status === 401) {
    logout();
    return null;
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Settings could not be updated.");
  }

  return data.settings;
}

async function deleteCurrentEvent() {
  const response = await fetch(`${API_BASE_URL}/api/events/detail/${eventId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (response.status === 401) {
    logout();
    return;
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Event could not be deleted.");
  }

  return true;
}

function setUploadMessage(message, type = "info") {
  if (!uploadMessage) {
    return;
  }

  uploadMessage.textContent = message;
  uploadMessage.className = `upload-message ${type}`;
}

function openUploadSuccessPopup(title, message) {
  if (!uploadSuccessPopup) {
    return;
  }

  uploadSuccessLastFocusedElement = document.activeElement;

  if (uploadSuccessTitle) {
    uploadSuccessTitle.textContent = title;
  }

  if (uploadSuccessText) {
    uploadSuccessText.textContent = message;
  }

  uploadSuccessPopup.classList.add("active");
  uploadSuccessPopup.setAttribute("aria-hidden", "false");
  document.body.classList.add("upload-success-open");
  uploadSuccessClose?.focus();
}

function closeUploadSuccessPopup({ restoreFocus = true } = {}) {
  if (!uploadSuccessPopup) {
    return;
  }

  uploadSuccessPopup.classList.remove("active");
  uploadSuccessPopup.setAttribute("aria-hidden", "true");
  document.body.classList.remove("upload-success-open");

  if (restoreFocus && uploadSuccessLastFocusedElement instanceof HTMLElement) {
    uploadSuccessLastFocusedElement.focus();
  }

  uploadSuccessLastFocusedElement = null;
}

function releaseUploadPreviewUrls(type) {
  const urls = type === "video" ? videoPreviewObjectUrls : photoPreviewObjectUrls;

  urls.forEach((url) => URL.revokeObjectURL(url));

  if (type === "video") {
    videoPreviewObjectUrls = [];
  } else {
    photoPreviewObjectUrls = [];
  }
}

function getSelectedUploadFiles(type = activeUploadType) {
  if (type === "video") {
    return [...queuedVideoFiles];
  }

  if (type === "photo") {
    return [...queuedPhotoFiles];
  }

  return [];
}

function getUploadFileKey(file) {
  return [file.name, file.size, file.type, file.lastModified].join("::");
}

function appendUploadFiles(type, newFiles) {
  const currentFiles = type === "video" ? queuedVideoFiles : queuedPhotoFiles;
  const existingKeys = new Set(currentFiles.map(getUploadFileKey));
  const uniqueNewFiles = newFiles.filter((file) => {
    const key = getUploadFileKey(file);

    if (existingKeys.has(key)) {
      return false;
    }

    existingKeys.add(key);
    return true;
  });

  const combinedFiles = [...currentFiles, ...uniqueNewFiles];

  if (combinedFiles.length > MEDIA_UPLOAD_MAX_FILES) {
    throw new Error("You can select up to 15 files at once.");
  }

  const totalBytes = combinedFiles.reduce((sum, file) => sum + file.size, 0);

  if (totalBytes > MEDIA_UPLOAD_MAX_TOTAL_SIZE) {
    throw new Error("Selected files must be 200 MB or smaller in total.");
  }

  if (type === "video") {
    queuedVideoFiles = combinedFiles;
    return queuedVideoFiles;
  }

  queuedPhotoFiles = combinedFiles;
  return queuedPhotoFiles;
}

function formatUploadFileSize(size) {
  if (!Number.isFinite(size) || size <= 0) {
    return "0 KB";
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function renderUploadPreviews(type, files) {
  const isVideo = type === "video";
  const previewBox = isVideo ? videoPreviewBox : photoPreviewBox;
  const previewList = isVideo ? videoPreviewList : photoPreviewList;

  releaseUploadPreviewUrls(type);

  if (!previewList || !previewBox) {
    return;
  }

  previewList.innerHTML = "";

  if (files.length === 0) {
    previewBox.classList.add("hidden");
    return;
  }

  const objectUrls = [];

  files.forEach((file, index) => {
    const objectUrl = URL.createObjectURL(file);
    objectUrls.push(objectUrl);

    const item = document.createElement("article");
    item.className = "upload-preview-item";

    const mediaWrap = document.createElement("div");
    mediaWrap.className = "upload-preview-media";

    if (isVideo) {
      const video = document.createElement("video");
      video.src = objectUrl;
      video.controls = true;
      video.preload = "metadata";
      video.setAttribute("playsinline", "");
      mediaWrap.appendChild(video);
    } else {
      const image = document.createElement("img");
      image.src = objectUrl;
      image.alt = t("Selected photo {count}", { count: index + 1 });
      mediaWrap.appendChild(image);
    }

    const details = document.createElement("div");
    details.className = "upload-preview-details";

    const name = document.createElement("strong");
    name.textContent = file.name;
    name.title = file.name;

    const size = document.createElement("span");
    size.textContent = formatUploadFileSize(file.size);

    details.append(name, size);
    item.append(mediaWrap, details);
    previewList.appendChild(item);
  });

  if (isVideo) {
    videoPreviewObjectUrls = objectUrls;
  } else {
    photoPreviewObjectUrls = objectUrls;
  }

  previewBox.classList.remove("hidden");
}

function updateMemoryMessageCount() {
  if (!memoryMessageCount) {
    return;
  }

  const currentLength = memoryMessageInput?.value.length || 0;
  memoryMessageCount.textContent = `${currentLength} / 1000`;
}

function getUploadButtonLabel(type = activeUploadType) {
  const selectedFileCount = getSelectedUploadFiles(type).length;

  if (type === "video") {
    return selectedFileCount > 1
      ? t("Upload {count} Videos", { count: selectedFileCount })
      : t("Upload Video");
  }

  if (type === "message") {
    return t("Send Message");
  }

  return selectedFileCount > 1
    ? t("Upload {count} Photos", { count: selectedFileCount })
    : t("Upload Photo");
}

function setActiveUploadType(type) {
  if (!["photo", "video", "message"].includes(type)) {
    return;
  }

  activeUploadType = type;

  uploadTypeButtons.forEach((button) => {
    const isActive = button.dataset.uploadType === type;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  });

  uploadTypePanels.forEach((panel) => {
    const isActive = panel.dataset.uploadPanel === type;
    panel.hidden = !isActive;
    panel.classList.toggle("active", isActive);
  });

  if (uploadMediaBtn) {
    uploadMediaBtn.textContent = getUploadButtonLabel(type);
  }

  setUploadMessage("", "info");
}

function resetUploadInput(type = activeUploadType) {
  if (type === "photo") {
    queuedPhotoFiles = [];
    releaseUploadPreviewUrls("photo");

    if (photoInput) {
      photoInput.value = "";
    }

    if (photoPreviewList) {
      photoPreviewList.innerHTML = "";
    }

    photoPreviewBox?.classList.add("hidden");
    return;
  }

  if (type === "video") {
    queuedVideoFiles = [];
    releaseUploadPreviewUrls("video");

    if (videoInput) {
      videoInput.value = "";
    }

    if (videoPreviewList) {
      videoPreviewList.querySelectorAll("video").forEach((video) => {
        video.pause();
        video.removeAttribute("src");
        video.load();
      });
      videoPreviewList.innerHTML = "";
    }

    videoPreviewBox?.classList.add("hidden");
    return;
  }

  if (memoryMessageInput) {
    memoryMessageInput.value = "";
  }

  updateMemoryMessageCount();
}

function validateUploadFile(file, allowedTypes, invalidTypeMessage) {
  if (!allowedTypes.includes(file.type)) {
    throw new Error(invalidTypeMessage);
  }

  if (file.size > MEDIA_UPLOAD_MAX_SIZE) {
    throw new Error("The selected file must be 50 MB or smaller.");
  }
}

function validateUploadFiles(files, allowedTypes, invalidTypeMessage) {
  files.forEach((file) => {
    validateUploadFile(file, allowedTypes, invalidTypeMessage);
  });
}

async function createGuestForUpload(guestName) {
  const sessionKey = `snapup_guest_${eventId}_${guestName.trim().toLocaleLowerCase("tr-TR")}`;
  try {
    const cached = JSON.parse(sessionStorage.getItem(sessionKey) || "null");
    if (cached?.guest_id && cached?.guest_access_token) return cached;
  } catch (_error) {}
  const response = await fetch(`${API_BASE_URL}/api/media/guests`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      event_id: eventId,
      guest_name: guestName,
    }),
  });

  const data = await response.json();

  if (response.status === 401) {
    logout();
    return null;
  }

  if (!response.ok || !data.success) {
    throw new Error(
      data.error || data.message || "Guest could not be created.",
    );
  }

  const guestSession = { ...data.guest, guest_access_token: data.guest_access_token };
  sessionStorage.setItem(sessionKey, JSON.stringify(guestSession));
  return guestSession;
}

async function uploadFilesToEvent(guestId, guestToken, files) {
  const formData = new FormData();

  files.forEach((file) => formData.append("media", file));
  formData.append("event_id", eventId);
  formData.append("guest_id", guestId);

  if (uploadMediaBtn) {
    uploadMediaBtn.textContent = t("Uploading...");
  }

  setUploadMessage(t("Uploading selected files, please wait..."), "info");

  const response = await fetch(`${API_BASE_URL}/api/media/upload`, {
    method: "POST",
    headers: { "X-Guest-Token": guestToken },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || "Media upload failed.");
  }

  return {
    uploaded: Number(data.uploaded_count) || files.length,
    failures: [],
  };
}

async function sendMessageToEvent(guestId, guestToken, message) {
  const response = await fetch(`${API_BASE_URL}/api/media/message`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "X-Guest-Token": guestToken },
    body: JSON.stringify({
      event_id: eventId,
      guest_id: guestId,
      message,
    }),
  });

  const data = await response.json();

  if (response.status === 401) {
    logout();
    return null;
  }

  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || "Message could not be sent.");
  }

  return data.media;
}

async function updateMediaStatus(mediaId, status) {
  const response = await fetch(`${API_BASE_URL}/api/media/${mediaId}/status`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      media_status: status,
    }),
  });

  const data = await response.json();

  if (response.status === 401) {
    logout();
    return null;
  }

  if (!response.ok || !data.success) {
    throw new Error(
      data.error || data.message || "Media status could not be updated.",
    );
  }

  return data.media;
}

async function deleteMediaItem(mediaId) {
  const response = await fetch(`${API_BASE_URL}/api/media/${mediaId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (response.status === 401) {
    logout();
    return;
  }

  if (!response.ok || !data.success) {
    throw new Error(
      data.error || data.message || "Media could not be deleted.",
    );
  }
}

async function handleMediaAdminAction(action, mediaId) {
  if (!mediaId) {
    return;
  }

  try {
    if (action === "delete") {
      const confirmDelete = confirm(
        t("This uploaded memory will be deleted. Are you sure?"),
      );

      if (!confirmDelete) {
        return;
      }

      await deleteMediaItem(mediaId);
      await loadEventDetail();
      return;
    }

    if (action === "approve") {
      await updateMediaStatus(mediaId, "approved");
      await loadEventDetail();
      return;
    }

    if (action === "reject") {
      await updateMediaStatus(mediaId, "rejected");
      await loadEventDetail();
    }
  } catch (error) {
    console.error("Media admin action error:", error);
    alert(t(error.message || "Media action failed."));
  }
}

if (eventCode) {
  eventCode.addEventListener("click", async () => {
    try {
      await copyCurrentEventCode();
    } catch (error) {
      console.error("Event code copy error:", error);
    }
  });
}

if (copyCodeButton) {
  copyCodeButton.addEventListener("click", async () => {
    try {
      await copyCurrentEventCode();
      copyCodeButton.textContent = t("Copied!");

      setTimeout(() => {
        copyCodeButton.textContent = t("Copy Code");
      }, 1300);
    } catch (error) {
      console.error("Event code copy error:", error);
    }
  });
}

if (copyJoinLinkButton) {
  copyJoinLinkButton.addEventListener("click", async () => {
    if (!currentEvent) {
      return;
    }

    await copyTextToClipboard(getJoinUrl(currentEvent));
    copyJoinLinkButton.textContent = t("Copied!");

    setTimeout(() => {
      copyJoinLinkButton.textContent = t("Copy Join Link");
    }, 1300);
  });
}

if (downloadQrButton) {
  downloadQrButton.addEventListener("click", async () => {
    const qrImageUrl = getQrImageUrl(currentEvent);

    if (!qrImageUrl) {
      return;
    }

    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const downloadLink = document.createElement("a");
      downloadLink.href = objectUrl;
      downloadLink.download = `snapup-event-${currentEvent.event_code}.png`;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      window.open(qrImageUrl, "_blank");
    }
  });
}

memoryBookOpen?.addEventListener("click", openMemoryBook);
memoryBookClose?.addEventListener("click", closeMemoryBook);
memoryBookCancel?.addEventListener("click", closeMemoryBook);
memoryBookModalBackdrop?.addEventListener("click", closeMemoryBook);
memoryBookDownload?.addEventListener("click", downloadMemoryBook);

eventLocationEditButton?.addEventListener("click", openLocationEditor);

locationEditorClose?.addEventListener("click", () => {
  closeLocationEditor();
});

locationEditorCancel?.addEventListener("click", () => {
  closeLocationEditor();
});

locationEditorModal?.addEventListener("click", (event) => {
  if (event.target === locationEditorModal) {
    closeLocationEditor();
  }
});

locationEditorForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    locationEditorSave.disabled = true;
    locationEditorSave.textContent = t("Saving...");
    setLocationEditorResult();

    const updatedLocation = await updateCurrentEventLocation({
      event_location: locationEditorVenue.value.trim() || null,
      event_address: locationEditorAddress.value.trim() || null,
      event_latitude: locationEditorLatitude.value
        ? Number(locationEditorLatitude.value)
        : null,
      event_longitude: locationEditorLongitude.value
        ? Number(locationEditorLongitude.value)
        : null,
    });

    if (!updatedLocation) {
      return;
    }

    currentEvent = { ...currentEvent, ...updatedLocation };
    renderEventInfo(currentEvent);
    setInvitationStudioEvent(currentEvent, getJoinUrl(currentEvent));
    updateMemoryBookPreview();
    closeLocationEditor({ restoreFocus: false });
    showEventCoverToast(t("Location updated."));
    eventLocationEditButton?.focus();
  } catch (error) {
    setLocationEditorResult(
      t(error.message || "Location could not be updated."),
      "error",
    );
  } finally {
    locationEditorSave.disabled = false;
    locationEditorSave.textContent = t("Save location");
  }
});

eventDeleteSuccessButton?.addEventListener(
  "click",
  returnToAccountAfterDelete,
);

if (openSettingsButton) {
  openSettingsButton.addEventListener("click", openSettingsModal);
}

if (settingsModalClose) {
  settingsModalClose.addEventListener("click", closeSettingsModal);
}

if (settingsModal) {
  settingsModal.addEventListener("click", (event) => {
    if (event.target === settingsModal) {
      closeSettingsModal();
    }
  });
}

if (settingsForm) {
  settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      settingsSaveButton.disabled = true;
      settingsSaveButton.textContent = t("Saving...");

      settingsResult.textContent = "";
      delete settingsResult.dataset.state;

      const payload = getSettingsPayload();
      const updatedSettings = await updateEventSettings(payload);

      if (!updatedSettings) {
        return;
      }

      renderSettings(updatedSettings);

      settingsResult.textContent = t("Settings updated successfully.");
      settingsResult.dataset.state = "success";
    } catch (error) {
      settingsResult.textContent = t(error.message);
      settingsResult.dataset.state = "error";
    } finally {
      settingsSaveButton.disabled = false;
      settingsSaveButton.textContent = t("Save Settings");
    }
  });
}

if (deleteEventButton) {
  deleteEventButton.addEventListener("click", async () => {
    const confirmDelete = confirm(
      t("This event will be permanently deleted. Are you sure?"),
    );

    if (!confirmDelete) {
      return;
    }

    try {
      deleteEventButton.disabled = true;
      deleteEventButton.textContent = t("Deleting...");

      if (settingsResult) {
        settingsResult.textContent = "";
      }

      const wasDeleted = await deleteCurrentEvent();

      if (wasDeleted) {
        openEventDeleteSuccessPopup();
      }
    } catch (error) {
      deleteEventButton.disabled = false;
      deleteEventButton.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
          <path
            d="M9 4H15M4.5 7H19.5M10 11V17M14 11V17M6.5 7L7.2 19C7.3 20.1 8.2 21 9.3 21H14.7C15.8 21 16.7 20.1 16.8 19L17.5 7"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        ${escapeHtml(t("Delete Event"))}
      `;

      if (settingsResult) {
        settingsResult.textContent = t(error.message);
        settingsResult.dataset.state = "error";
      }
    }
  });
}

if (mediaGallery) {
  mediaGallery.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-media-action]");

    if (!actionButton) {
      return;
    }

    const action = actionButton.dataset.mediaAction;
    const mediaId = actionButton.dataset.mediaId;

    handleMediaAdminAction(action, mediaId);
  });
}

if (guestSearchInput) {
  guestSearchInput.addEventListener("input", () => {
    guestSearchTerm = guestSearchInput.value || "";
    renderGuests();
  });
}

if (galleryLightboxClose) {
  galleryLightboxClose.addEventListener("click", closeGalleryLightbox);
}

if (galleryLightboxBackdrop) {
  galleryLightboxBackdrop.addEventListener("click", closeGalleryLightbox);
}

if (galleryLightboxPrev) {
  galleryLightboxPrev.addEventListener("click", () => {
    showGalleryLightboxItem(activeGalleryIndex - 1);
  });
}

if (galleryLightboxNext) {
  galleryLightboxNext.addEventListener("click", () => {
    showGalleryLightboxItem(activeGalleryIndex + 1);
  });
}

eventCoverChangeButton?.addEventListener("click", () => {
  eventCoverChangeInput?.click();
});

eventCoverRemoveButton?.addEventListener("click", () => {
  openEventCoverRemoveDialog();
});

eventCoverRemoveClose?.addEventListener("click", () => {
  closeEventCoverRemoveDialog();
});

eventCoverRemoveCancel?.addEventListener("click", () => {
  closeEventCoverRemoveDialog();
});

eventCoverRemoveModal?.addEventListener("click", (event) => {
  if (event.target === eventCoverRemoveModal) {
    closeEventCoverRemoveDialog();
  }
});

eventCoverRemoveConfirm?.addEventListener("click", async () => {
  try {
    eventCoverRemoveConfirm.disabled = true;
    eventCoverRemoveCancel.disabled = true;
    eventCoverRemoveConfirm.textContent = t("Removing photo...");
    setEventCoverRemoveStatus(t("Removing photo..."));

    const updatedEvent = await removeCurrentEventCover();

    if (!updatedEvent) {
      return;
    }

    currentEvent = { ...currentEvent, ...updatedEvent };
    setEventCoverBackground(null);
    setInvitationStudioEvent(currentEvent, getJoinUrl(currentEvent));
    updateMemoryBookPreview();
    closeEventCoverRemoveDialog({ restoreFocus: false });
    showEventCoverToast(t("Event photo removed successfully."));
    eventCoverChangeButton?.focus();
  } catch (error) {
    console.error(
      "Event cover remove error:",
      error.serverMessage || error.message,
    );
    setEventCoverRemoveStatus(
      t(error.message || "Event photo could not be removed."),
    );
  } finally {
    eventCoverRemoveConfirm.disabled = false;
    eventCoverRemoveCancel.disabled = false;
    eventCoverRemoveConfirm.textContent = t("Remove Photo");
  }
});

eventCoverChangeInput?.addEventListener("change", () => {
  const file = eventCoverChangeInput.files?.[0] || null;

  if (!file) {
    return;
  }

  if (!EVENT_COVER_TYPES.includes(file.type)) {
    eventCoverChangeInput.value = "";
    showEventCoverToast(
      t("Only JPG, PNG or WEBP images are allowed."),
      "error",
    );
    return;
  }

  if (file.size > EVENT_COVER_MAX_SIZE) {
    eventCoverChangeInput.value = "";
    showEventCoverToast(
      t("Event photo must be 8 MB or smaller."),
      "error",
    );
    return;
  }

  openEventCoverEditor(file);
});

eventCoverEditorClose?.addEventListener("click", () => {
  closeEventCoverEditor();
});

eventCoverEditorCancel?.addEventListener("click", () => {
  closeEventCoverEditor();
});

eventCoverEditor?.addEventListener("click", (event) => {
  if (event.target === eventCoverEditor) {
    closeEventCoverEditor();
  }
});

eventCoverEditorZoom?.addEventListener("input", () => {
  eventCoverEditorCrop.zoom = clampEventCoverValue(
    Number(eventCoverEditorZoom.value) || 1,
    1,
    3,
  );
  renderEventCoverEditor();
});

eventCoverEditorReset?.addEventListener("click", () => {
  eventCoverEditorCrop = { focalX: 0.5, focalY: 0.5, zoom: 1 };
  eventCoverEditorZoom.value = "1";
  renderEventCoverEditor();
});

eventCoverEditorStage?.addEventListener("pointerdown", (event) => {
  const metrics = getEventCoverEditorMetrics();

  if (!metrics || eventCoverEditorSave?.disabled) {
    return;
  }

  event.preventDefault();
  eventCoverEditorDrag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    left: metrics.left,
    top: metrics.top,
  };
  eventCoverEditorStage.setPointerCapture(event.pointerId);
  eventCoverEditorStage.classList.add("is-dragging");
});

eventCoverEditorStage?.addEventListener("pointermove", (event) => {
  if (
    !eventCoverEditorDrag ||
    eventCoverEditorDrag.pointerId !== event.pointerId
  ) {
    return;
  }

  const metrics = getEventCoverEditorMetrics();

  if (!metrics) {
    return;
  }

  const left = clampEventCoverValue(
    eventCoverEditorDrag.left +
      event.clientX -
      eventCoverEditorDrag.startX,
    metrics.stageWidth - metrics.width,
    0,
  );
  const top = clampEventCoverValue(
    eventCoverEditorDrag.top +
      event.clientY -
      eventCoverEditorDrag.startY,
    metrics.stageHeight - metrics.height,
    0,
  );

  eventCoverEditorCrop.focalX = clampEventCoverValue(
    (metrics.stageWidth / 2 - left) / metrics.width,
    0,
    1,
  );
  eventCoverEditorCrop.focalY = clampEventCoverValue(
    (metrics.stageHeight / 2 - top) / metrics.height,
    0,
    1,
  );
  renderEventCoverEditor();
});

function finishEventCoverEditorDrag(event) {
  if (
    !eventCoverEditorDrag ||
    eventCoverEditorDrag.pointerId !== event.pointerId
  ) {
    return;
  }

  if (eventCoverEditorStage.hasPointerCapture(event.pointerId)) {
    eventCoverEditorStage.releasePointerCapture(event.pointerId);
  }

  eventCoverEditorDrag = null;
  eventCoverEditorStage.classList.remove("is-dragging");
}

eventCoverEditorStage?.addEventListener(
  "pointerup",
  finishEventCoverEditorDrag,
);
eventCoverEditorStage?.addEventListener(
  "pointercancel",
  finishEventCoverEditorDrag,
);

eventCoverEditorStage?.addEventListener("keydown", (event) => {
  const directionByKey = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  };
  const direction = directionByKey[event.key];

  if (!direction || eventCoverEditorSave?.disabled) {
    return;
  }

  event.preventDefault();
  const step = event.shiftKey ? 0.05 : 0.015;
  eventCoverEditorCrop.focalX = clampEventCoverValue(
    eventCoverEditorCrop.focalX + direction[0] * step,
    0,
    1,
  );
  eventCoverEditorCrop.focalY = clampEventCoverValue(
    eventCoverEditorCrop.focalY + direction[1] * step,
    0,
    1,
  );
  renderEventCoverEditor();
});

eventCoverEditorSave?.addEventListener("click", async () => {
  try {
    eventCoverEditorSave.disabled = true;
    eventCoverEditorSave.textContent = t("Saving photo...");
    setEventCoverEditorStatus(t("Saving photo..."));

    const croppedFile = await createCroppedEventCover();
    const updatedEvent = await uploadChangedEventCover(croppedFile);

    if (!updatedEvent) {
      return;
    }

    currentEvent = { ...currentEvent, ...updatedEvent };
    setEventCoverBackground(currentEvent.event_cover_url);
    setInvitationStudioEvent(currentEvent, getJoinUrl(currentEvent));
    updateMemoryBookPreview();
    closeEventCoverEditor({ restoreFocus: false });
    showEventCoverToast(t("Event photo updated successfully."));
    eventCoverChangeButton?.focus();
  } catch (error) {
    console.error(
      "Event cover update error:",
      error.serverMessage || error.message,
    );
    setEventCoverEditorStatus(
      t(error.message || "Event photo could not be updated."),
    );
  } finally {
    eventCoverEditorSave.disabled = false;
    eventCoverEditorSave.textContent = t("Save Photo");
  }
});

if ("ResizeObserver" in window && eventCoverEditorStage) {
  new ResizeObserver(() => {
    if (eventCoverEditor?.classList.contains("active")) {
      renderEventCoverEditor();
    }
  }).observe(eventCoverEditorStage);
} else {
  window.addEventListener("resize", renderEventCoverEditor);
}

window.addEventListener("keydown", (event) => {
  if (uploadSuccessPopup?.classList.contains("active")) {
    if (event.key === "Escape" || event.key === "Enter") {
      closeUploadSuccessPopup();
    }

    return;
  }

  if (eventDeleteSuccessModal?.classList.contains("active")) {
    if (event.key === "Escape" || event.key === "Enter") {
      returnToAccountAfterDelete();
    }

    return;
  }

  if (locationEditorModal?.classList.contains("active")) {
    if (event.key === "Escape") {
      closeLocationEditor();
    }

    return;
  }

  if (eventCoverRemoveModal?.classList.contains("active")) {
    if (event.key === "Escape") {
      closeEventCoverRemoveDialog();
    }

    return;
  }

  if (eventCoverEditor?.classList.contains("active")) {
    if (event.key === "Escape") {
      closeEventCoverEditor();
    }

    return;
  }

  if (memoryBookModal?.classList.contains("active")) {
    if (event.key === "Escape") {
      closeMemoryBook();
    }

    return;
  }

  if (!galleryLightbox?.classList.contains("active")) {
    return;
  }

  if (event.key === "Escape") {
    closeGalleryLightbox();
  }

  if (event.key === "ArrowLeft") {
    showGalleryLightboxItem(activeGalleryIndex - 1);
  }

  if (event.key === "ArrowRight") {
    showGalleryLightboxItem(activeGalleryIndex + 1);
  }
});

window.addEventListener("beforeunload", () => {
  releaseEventCoverEditorObjectUrl();
  releaseUploadPreviewUrls("photo");
  releaseUploadPreviewUrls("video");
});

uploadTypeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveUploadType(button.dataset.uploadType || "photo");
  });

  button.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const currentIndex = uploadTypeButtons.indexOf(button);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex =
      (currentIndex + direction + uploadTypeButtons.length) %
      uploadTypeButtons.length;
    const nextButton = uploadTypeButtons[nextIndex];

    setActiveUploadType(nextButton.dataset.uploadType || "photo");
    nextButton.focus();
  });
});

if (photoInput) {
  photoInput.addEventListener("change", () => {
    const newlySelectedFiles = Array.from(photoInput.files || []);

    if (newlySelectedFiles.length === 0) {
      return;
    }

    try {
      validateUploadFiles(
        newlySelectedFiles,
        PHOTO_UPLOAD_TYPES,
        "Only JPG, PNG and WEBP images are allowed.",
      );
      const files = appendUploadFiles("photo", newlySelectedFiles);

      renderUploadPreviews("photo", files);
      uploadMediaBtn.textContent = getUploadButtonLabel("photo");
      setUploadMessage(
        files.length === 1
          ? t("1 photo selected. You can add more before uploading.")
          : t("{count} photos selected. You can add more before uploading.", {
              count: files.length,
            }),
        "info",
      );
    } catch (error) {
      setUploadMessage(t(error.message), "error");
    } finally {
      photoInput.value = "";
    }
  });
}

if (videoInput) {
  videoInput.addEventListener("change", () => {
    const newlySelectedFiles = Array.from(videoInput.files || []);

    if (newlySelectedFiles.length === 0) {
      return;
    }

    try {
      validateUploadFiles(
        newlySelectedFiles,
        VIDEO_UPLOAD_TYPES,
        "Only MP4, WEBM and MOV videos are allowed.",
      );
      const files = appendUploadFiles("video", newlySelectedFiles);

      renderUploadPreviews("video", files);
      uploadMediaBtn.textContent = getUploadButtonLabel("video");
      setUploadMessage(
        files.length === 1
          ? t("1 video selected. You can add more before uploading.")
          : t("{count} videos selected. You can add more before uploading.", {
              count: files.length,
            }),
        "info",
      );
    } catch (error) {
      setUploadMessage(t(error.message), "error");
    } finally {
      videoInput.value = "";
    }
  });
}

memoryMessageInput?.addEventListener("input", () => {
  updateMemoryMessageCount();
  setUploadMessage("", "info");
});

uploadSuccessClose?.addEventListener("click", () => {
  closeUploadSuccessPopup();
});

uploadSuccessBackdrop?.addEventListener("click", () => {
  closeUploadSuccessPopup();
});

if (uploadMediaBtn) {
  uploadMediaBtn.addEventListener("click", async () => {
    const selectedType = activeUploadType;

    try {
      const guestName = guestNameInput?.value.trim();
      const selectedFiles = getSelectedUploadFiles(selectedType);
      const message = memoryMessageInput?.value.trim() || "";

      if (!eventId) {
        setUploadMessage(t("Event ID not found in URL."), "error");
        return;
      }

      if (!guestName) {
        setUploadMessage(t("Please enter your name."), "error");
        guestNameInput?.focus();
        return;
      }

      if (selectedType === "photo" && selectedFiles.length === 0) {
        setUploadMessage(t("Please choose at least one photo first."), "error");
        photoInput?.focus();
        return;
      }

      if (selectedType === "video" && selectedFiles.length === 0) {
        setUploadMessage(t("Please choose at least one video first."), "error");
        videoInput?.focus();
        return;
      }

      if (selectedType === "message" && !message) {
        setUploadMessage(t("Please write a message first."), "error");
        memoryMessageInput?.focus();
        return;
      }

      uploadMediaBtn.disabled = true;
      uploadMediaBtn.textContent = t(
        selectedType === "message" ? "Sending..." : "Uploading...",
      );

      setUploadMessage(
        t(
          selectedType === "message"
            ? "Sending message, please wait..."
            : "Preparing selected files...",
        ),
        "info",
      );

      const guest = await createGuestForUpload(guestName);

      if (!guest) {
        return;
      }

      if (selectedType === "message") {
        await sendMessageToEvent(guest.guest_id, guest.guest_access_token, message);
        setUploadMessage(t("Message sent successfully!"), "success");
        resetUploadInput("message");
        openUploadSuccessPopup(
          t("Message sent"),
          t("Your message was added to the event successfully."),
        );
      } else {
        const uploadResult = await uploadFilesToEvent(
          guest.guest_id,
          guest.guest_access_token,
          selectedFiles,
        );

        if (uploadResult.uploaded === 0) {
          throw uploadResult.failures[0]?.error || new Error("Media upload failed.");
        }

        const isPhoto = selectedType === "photo";
        const allUploaded = uploadResult.failures.length === 0;
        const successMessage = allUploaded
          ? isPhoto
            ? uploadResult.uploaded === 1
              ? t("Photo uploaded successfully!")
              : t("{count} photos uploaded successfully!", {
                  count: uploadResult.uploaded,
                })
            : uploadResult.uploaded === 1
              ? t("Video uploaded successfully!")
              : t("{count} videos uploaded successfully!", {
                  count: uploadResult.uploaded,
                })
          : t("{uploaded} of {total} files uploaded successfully.", {
              uploaded: uploadResult.uploaded,
              total: selectedFiles.length,
            });

        setUploadMessage(successMessage, allUploaded ? "success" : "error");
        resetUploadInput(selectedType);
        openUploadSuccessPopup(
          allUploaded ? t("Upload complete") : t("Upload partially completed"),
          allUploaded
            ? t("Your selected files were received successfully.")
            : t("{uploaded} files were uploaded. {failed} files could not be uploaded.", {
                uploaded: uploadResult.uploaded,
                failed: uploadResult.failures.length,
              }),
        );
      }

      await loadEventDetail();
    } catch (error) {
      console.error("Upload error:", error);
      setUploadMessage(
        t(error.message || "Something went wrong while uploading."),
        "error",
      );
    } finally {
      uploadMediaBtn.disabled = false;
      uploadMediaBtn.textContent = getUploadButtonLabel(selectedType);
    }
  });
}

setActiveUploadType("photo");
updateMemoryMessageCount();

async function approveAllImages() {
  if (!eventId || !token || !approveAllImagesButton) {
    return;
  }

  const pendingImageCount = currentRenderedMediaList.filter(
    (media) => getMediaStatus(media) === "pending" && isImageMedia(media),
  ).length;

  if (pendingImageCount === 0) {
    approveAllImagesButton.hidden = true;
    return;
  }

  const confirmed = confirm(
    t("Are you sure you want to approve {count} pending photo(s)?", {
      count: pendingImageCount,
    }),
  );

  if (!confirmed) {
    return;
  }

  try {
    approveAllImagesButton.disabled = true;
    approveAllImagesButton.textContent = t("Approving...");

    const response = await fetch(
      `${API_BASE_URL}/api/media/events/${eventId}/approve-images`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || data.message || "Photos could not be approved.",
      );
    }

    alert(
      data.message || t("All pending photos approved successfully."),
    );

    activeMediaFilter = "pending";
    await loadEventDetail();
  } catch (error) {
    alert(t(error.message || "Photos could not be approved."));
    console.error("Approve all photos error:", error);
  } finally {
    approveAllImagesButton.disabled = false;
    approveAllImagesButton.textContent = t("Approve All Photos");
    updateApproveAllImagesButtonVisibility(currentRenderedMediaList);
  }
}
if (approveAllImagesButton) {
  approveAllImagesButton.addEventListener("click", approveAllImages);
}

setupMobileSectionNavigation();
loadEventDetail();
