import { API_URL } from "./config.js?v=runtime-api-2";

const FORMAT_DEFINITIONS = {
  mini_card: {
    label: "Mini Card · 1080 × 1350",
    width: 1080,
    height: 1350,
  },
  story: {
    label: "Story · 1080 × 1920",
    width: 1080,
    height: 1920,
  },
  pdf: {
    label: "Print PDF · A5",
    width: 1240,
    height: 1754,
  },
};

const MAX_SAVED_INVITATIONS = 3;

const TEMPLATE_DEFAULTS = {
  "birthday-confetti": {
    category: "birthday",
    primary: "#16457A",
    secondary: "#F26B5B",
    text: "#163A68",
    font: "rounded",
    renderer: "joyful",
    frame: "rounded",
    background: "assets/invitations/birthday-confetti.webp",
  },
  "birthday-colorburst": {
    category: "birthday",
    primary: "#173F70",
    secondary: "#E75E50",
    text: "#173F70",
    font: "rounded",
    renderer: "joyful",
    frame: "oval",
    background: "assets/invitations/birthday-sunlit-ribbon.webp",
  },
  "birthday-celebration": {
    category: "birthday",
    primary: "#1756A9",
    secondary: "#E84C62",
    text: "#17335B",
    font: "rounded",
    renderer: "joyful",
    frame: "polaroid",
    background: "assets/invitations/celebration-gouache.webp",
  },
  "house-after-dark": {
    category: "house",
    primary: "#FFF5E8",
    secondary: "#FF5B91",
    text: "#FFF5E8",
    font: "rounded",
    renderer: "watercolor",
    frame: "film",
    background: "assets/invitations/house-party-after-dark.webp",
  },
  "house-polaroid": {
    category: "house",
    primary: "#FFF5F4",
    secondary: "#FF6E86",
    text: "#FFF5F4",
    font: "rounded",
    renderer: "joyful",
    frame: "oval",
    background: "assets/invitations/house-velvet-frequency.webp",
  },
  "wedding-botanical": {
    category: "wedding",
    primary: "#355044",
    secondary: "#B88A66",
    text: "#2F463B",
    font: "serif",
    renderer: "botanical",
    frame: "arch",
    background: "assets/invitations/wedding-botanical.webp",
  },
  "wedding-watercolor": {
    category: "wedding",
    primary: "#63465B",
    secondary: "#C08D91",
    text: "#4A3545",
    font: "serif",
    renderer: "watercolor",
    frame: "oval",
    background: "assets/invitations/watercolor-elegant.webp",
  },
  "wedding-editorial": {
    category: "wedding",
    primary: "#30493B",
    secondary: "#B88A4A",
    text: "#25352D",
    font: "serif",
    renderer: "botanical",
    frame: "rounded",
    background: "assets/invitations/botanical-editorial.webp",
  },
  "graduation-midnight": {
    category: "graduation",
    primary: "#FAE8BD",
    secondary: "#D9AB55",
    text: "#FAE8BD",
    font: "serif",
    renderer: "botanical",
    frame: "arch",
    background: "assets/invitations/graduation-nocturne-lines.webp",
  },
  "graduation-gold": {
    category: "graduation",
    primary: "#F8E7B6",
    secondary: "#F2B632",
    text: "#F8E7B6",
    font: "serif",
    renderer: "botanical",
    frame: "stamp",
    background: "assets/invitations/graduation-midnight.webp",
  },
  "travel-postcard": {
    category: "travel",
    primary: "#174D68",
    secondary: "#D96B49",
    text: "#174D68",
    font: "serif",
    renderer: "watercolor",
    frame: "polaroid",
    background: "assets/invitations/travel-postcard.webp",
  },
  "travel-route": {
    category: "travel",
    primary: "#17565B",
    secondary: "#D46F4F",
    text: "#17565B",
    font: "serif",
    renderer: "watercolor",
    frame: "stamp",
    background: "assets/invitations/travel-atlas-keepsake.webp",
  },
};

const LEGACY_TEMPLATE_MAP = {
  modern: "wedding-editorial",
  elegant: "wedding-watercolor",
  joyful: "birthday-celebration",
};

const openButton = document.getElementById("invitationStudioOpen");
const modal = document.getElementById("invitationStudioModal");
const backdrop = document.getElementById("invitationStudioBackdrop");
const closeButton = document.getElementById("invitationStudioClose");
const form = document.getElementById("invitationStudioForm");
const savedSelect = document.getElementById("invitationSavedSelect");
const newButton = document.getElementById("invitationNewButton");
const deleteButton = document.getElementById("invitationDeleteButton");
const saveButton = document.getElementById("invitationSaveButton");
const downloadPngButton = document.getElementById("invitationDownloadPng");
const downloadPdfButton = document.getElementById("invitationDownloadPdf");
const previewCanvas = document.getElementById("invitationPreviewCanvas");
const previewFormat = document.getElementById("invitationPreviewFormat");
const statusText = document.getElementById("invitationStudioStatus");
const savedCountText = document.getElementById("invitationSavedCount");
const savedLibrary = savedSelect?.closest(".invitation-studio-library");
const deleteConfirm = document.getElementById("invitationDeleteConfirm");
const deleteConfirmBackdrop = document.getElementById(
  "invitationDeleteConfirmBackdrop",
);
const deleteConfirmCancel = document.getElementById(
  "invitationDeleteConfirmCancel",
);
const deleteConfirmSubmit = document.getElementById(
  "invitationDeleteConfirmSubmit",
);
const deleteConfirmName = document.getElementById(
  "invitationDeleteConfirmName",
);
const invitationLanguageSelect = document.getElementById(
  "invitationLanguageSelect",
);
const invitationThemeToggle = document.getElementById(
  "invitationThemeToggle",
);
const invitationThemeLabel = document.getElementById("invitationThemeLabel");

const invitationName = document.getElementById("invitationName");
const invitationTitle = document.getElementById("invitationTitle");
const invitationMessage = document.getElementById("invitationMessage");
const invitationDressCode = document.getElementById("invitationDressCode");
const invitationContactPhone = document.getElementById(
  "invitationContactPhone",
);
const invitationRsvpDeadline = document.getElementById(
  "invitationRsvpDeadline",
);
const invitationPrimaryColor = document.getElementById(
  "invitationPrimaryColor",
);
const invitationSecondaryColor = document.getElementById(
  "invitationSecondaryColor",
);
const invitationPrimaryColorValue = document.getElementById(
  "invitationPrimaryColorValue",
);
const invitationSecondaryColorValue = document.getElementById(
  "invitationSecondaryColorValue",
);
const invitationShowCover = document.getElementById("invitationShowCover");
const invitationShowQr = document.getElementById("invitationShowQr");
const invitationPhotoInput = document.getElementById("invitationPhotoInput");
const invitationPhotoButton = document.getElementById(
  "invitationPhotoButton",
);
const invitationPhotoRemove = document.getElementById(
  "invitationPhotoRemove",
);
const invitationPhotoName = document.getElementById("invitationPhotoName");
const invitationPhotoZoom = document.getElementById("invitationPhotoZoom");
const invitationPhotoX = document.getElementById("invitationPhotoX");
const invitationPhotoY = document.getElementById("invitationPhotoY");
const invitationPhotoZoomValue = document.getElementById(
  "invitationPhotoZoomValue",
);
const invitationPhotoXValue = document.getElementById(
  "invitationPhotoXValue",
);
const invitationPhotoYValue = document.getElementById(
  "invitationPhotoYValue",
);
const invitationPhotoFrameInputs = Array.from(
  document.querySelectorAll('input[name="invitationPhotoFrame"]'),
);
const templateButtons = Array.from(
  document.querySelectorAll("[data-invitation-template]"),
);
const categoryButtons = Array.from(
  document.querySelectorAll("[data-invitation-category-filter]"),
);

const token = localStorage.getItem("snapup_token");
const params = new URLSearchParams(window.location.search);
const eventId = params.get("event_id");
const THEME_STORAGE_KEY = "snapup_theme";
const LANGUAGE_REOPEN_KEY = "snapup_invitation_language_reopen";
const LANGUAGE_SNAPSHOT_KEY = "snapup_invitation_language_snapshot";

let eventData = null;
let joinUrl = "";
let activeTemplate = "birthday-confetti";
let activeCategory = "all";
let activeInvitationId = null;
let savedInvitations = [];
let savedInvitationsLoaded = false;
let modalScrollY = 0;
let returnTarget = null;
let renderFrame = 0;
let renderVersion = 0;
let actionInProgress = false;
let customPhotoUrl = "";
let customPhotoFileName = "";
let deleteConfirmResolver = null;
let deleteConfirmReturnTarget = null;

const imageCache = new Map();

function t(value, replacements = {}) {
  const translated = window.SnapUpI18n?.t?.(value) || value;

  return Object.entries(replacements).reduce(
    (result, [key, replacement]) =>
      result.replaceAll(`{${key}}`, String(replacement)),
    translated,
  );
}

function syncInvitationLanguageControl() {
  if (!invitationLanguageSelect) {
    return;
  }

  const language = window.SnapUpI18n?.language || "en";
  invitationLanguageSelect.value = language;
}

function syncInvitationThemeControl() {
  if (!invitationThemeToggle) {
    return;
  }

  const isDark = document.documentElement.dataset.theme === "dark";
  const nextModeLabel = t(isDark ? "Light mode" : "Dark mode");
  const nextModeAction = t(
    isDark ? "Switch to light mode" : "Switch to dark mode",
  );

  invitationThemeToggle.setAttribute("aria-pressed", String(isDark));
  invitationThemeToggle.setAttribute("aria-label", nextModeAction);
  invitationThemeToggle.title = nextModeLabel;

  if (invitationThemeLabel) {
    invitationThemeLabel.textContent = nextModeLabel;
  }
}

function toggleInvitationTheme() {
  const pageThemeToggle = document.querySelector(
    "body > .theme-toggle",
  );

  if (pageThemeToggle instanceof HTMLButtonElement) {
    pageThemeToggle.click();
  } else {
    const nextTheme =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }

  syncInvitationThemeControl();
}

function getLocale() {
  const language = window.SnapUpI18n?.language || "en";
  const locales = {
    tr: "tr-TR",
    en: "en-US",
    de: "de-DE",
    fr: "fr-FR",
    es: "es-ES",
    it: "it-IT",
    nl: "nl-NL",
    ar: "ar",
  };

  return locales[language] || "en-US";
}

function getSelectedFormat() {
  return (
    form?.querySelector('input[name="invitationFormat"]:checked')?.value ||
    "mini_card"
  );
}

function getFormatDefinition() {
  return FORMAT_DEFINITIONS[getSelectedFormat()] || FORMAT_DEFINITIONS.mini_card;
}

function getTemplateDefaults() {
  return (
    TEMPLATE_DEFAULTS[activeTemplate] ||
    TEMPLATE_DEFAULTS["birthday-confetti"]
  );
}

function getDefaultInvitationTitle() {
  const eventName = eventData?.event_name || t("our celebration");
  return t("Join us for {eventName}", { eventName });
}

function getDefaultInvitationMessage() {
  return t(
    "We would love to celebrate this special moment with you. Scan the QR code to join our SnapUp event.",
  );
}

function getDefaultInvitationName() {
  const eventName = eventData?.event_name || t("Event");
  return t("{eventName} Invitation", { eventName });
}

function setStatus(message = "", type = "") {
  if (!statusText) {
    return;
  }

  statusText.textContent = message;
  statusText.className = "invitation-studio-status";

  if (type) {
    statusText.classList.add(type);
  }
}

function hasReachedInvitationLimit() {
  return savedInvitations.length >= MAX_SAVED_INVITATIONS;
}

function updateDraftActionState() {
  const hasSavedInvitation = Boolean(activeInvitationId);
  const limitReached = hasReachedInvitationLimit();

  if (deleteButton) {
    deleteButton.hidden = !hasSavedInvitation;
    deleteButton.disabled = actionInProgress || !hasSavedInvitation;
  }

  if (savedCountText) {
    savedCountText.textContent = `${savedInvitations.length} / ${MAX_SAVED_INVITATIONS}`;
    savedCountText.setAttribute(
      "aria-label",
      t("Saved {count} of {limit}", {
        count: savedInvitations.length,
        limit: MAX_SAVED_INVITATIONS,
      }),
    );
  }

  savedLibrary?.classList.toggle("limit-reached", limitReached);

  if (newButton) {
    newButton.disabled = actionInProgress || limitReached;
    newButton.title = limitReached
      ? t("Delete a saved invitation to create a new one.")
      : "";
  }

  if (saveButton) {
    const creatingAtLimit = !hasSavedInvitation && limitReached;
    saveButton.disabled = actionInProgress || creatingAtLimit;
    saveButton.textContent = hasSavedInvitation
      ? t("Update Draft")
      : creatingAtLimit
        ? t("3 Draft Limit Reached")
        : t("Save Draft");
    saveButton.title = creatingAtLimit
      ? t("Delete a saved invitation to save a new one.")
      : "";
  }
}

function setActionInProgress(isBusy) {
  actionInProgress = isBusy;

  [downloadPngButton, downloadPdfButton].forEach((button) => {
    if (button) {
      button.disabled = isBusy;
    }
  });

  if (savedSelect) {
    savedSelect.disabled = isBusy;
  }

  updateDraftActionState();
}

function showDeleteConfirmation(invitationName) {
  if (
    !deleteConfirm ||
    !deleteConfirmCancel ||
    !deleteConfirmSubmit ||
    deleteConfirmResolver
  ) {
    return Promise.resolve(false);
  }

  if (deleteConfirmName) {
    deleteConfirmName.textContent = invitationName;
  }

  deleteConfirmReturnTarget = document.activeElement;
  deleteConfirm.classList.add("active");
  deleteConfirm.setAttribute("aria-hidden", "false");

  return new Promise((resolve) => {
    deleteConfirmResolver = resolve;
    requestAnimationFrame(() => deleteConfirmCancel.focus());
  });
}

function closeDeleteConfirmation(confirmed = false) {
  if (!deleteConfirmResolver) {
    return;
  }

  const resolve = deleteConfirmResolver;
  deleteConfirmResolver = null;
  deleteConfirm.classList.remove("active");
  deleteConfirm.setAttribute("aria-hidden", "true");

  if (deleteConfirmReturnTarget instanceof HTMLElement) {
    deleteConfirmReturnTarget.focus();
  }

  deleteConfirmReturnTarget = null;
  resolve(confirmed);
}

function updateColorOutputs() {
  if (invitationPrimaryColorValue) {
    invitationPrimaryColorValue.value =
      invitationPrimaryColor?.value?.toUpperCase() || "";
    invitationPrimaryColorValue.textContent =
      invitationPrimaryColor?.value?.toUpperCase() || "";
  }

  if (invitationSecondaryColorValue) {
    invitationSecondaryColorValue.value =
      invitationSecondaryColor?.value?.toUpperCase() || "";
    invitationSecondaryColorValue.textContent =
      invitationSecondaryColor?.value?.toUpperCase() || "";
  }
}

function updatePhotoControl() {
  if (invitationPhotoName) {
    invitationPhotoName.textContent = customPhotoFileName
      ? t("Selected photo: {fileName}", { fileName: customPhotoFileName })
      : t("Event cover will be used automatically.");
  }

  if (invitationPhotoRemove) {
    invitationPhotoRemove.hidden = !customPhotoUrl;
  }

  if (invitationPhotoZoomValue) {
    invitationPhotoZoomValue.value = `${invitationPhotoZoom?.value || 100}%`;
    invitationPhotoZoomValue.textContent =
      `${invitationPhotoZoom?.value || 100}%`;
  }

  if (invitationPhotoXValue) {
    const value = Number(invitationPhotoX?.value || 0);
    invitationPhotoXValue.value = `${value > 0 ? "+" : ""}${value}`;
    invitationPhotoXValue.textContent = `${value > 0 ? "+" : ""}${value}`;
  }

  if (invitationPhotoYValue) {
    const value = Number(invitationPhotoY?.value || 0);
    invitationPhotoYValue.value = `${value > 0 ? "+" : ""}${value}`;
    invitationPhotoYValue.textContent = `${value > 0 ? "+" : ""}${value}`;
  }
}

function resetPhotoAdjustments() {
  if (invitationPhotoZoom) {
    invitationPhotoZoom.value = "100";
  }
  if (invitationPhotoX) {
    invitationPhotoX.value = "0";
  }
  if (invitationPhotoY) {
    invitationPhotoY.value = "0";
  }
  updatePhotoControl();
}

function clearCustomPhoto({ render = true } = {}) {
  if (customPhotoUrl) {
    imageCache.delete(customPhotoUrl);
    URL.revokeObjectURL(customPhotoUrl);
  }

  customPhotoUrl = "";
  customPhotoFileName = "";

  if (invitationPhotoInput) {
    invitationPhotoInput.value = "";
  }

  updatePhotoControl();

  if (render) {
    queuePreviewRender();
  }
}

function selectCustomPhoto(file) {
  if (!file) {
    return;
  }

  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

  if (!allowedTypes.has(file.type)) {
    setStatus(t("Please choose a JPG, PNG or WebP photo."), "error");
    return;
  }

  if (file.size > 12 * 1024 * 1024) {
    setStatus(t("The invitation photo must be smaller than 12 MB."), "error");
    return;
  }

  clearCustomPhoto({ render: false });
  customPhotoUrl = URL.createObjectURL(file);
  customPhotoFileName = file.name;
  resetPhotoAdjustments();

  if (invitationShowCover) {
    invitationShowCover.checked = true;
  }

  updatePhotoControl();
  setStatus(t("Invitation photo added."), "success");
  queuePreviewRender();
}

function getSelectedPhotoFrame() {
  return (
    invitationPhotoFrameInputs.find((input) => input.checked)?.value ||
    getTemplateDefaults().frame ||
    "rounded"
  );
}

function selectPhotoFrame(frameKey) {
  const validFrame = invitationPhotoFrameInputs.some(
    (input) => input.value === frameKey,
  )
    ? frameKey
    : "rounded";

  invitationPhotoFrameInputs.forEach((input) => {
    input.checked = input.value === validFrame;
  });
}

function selectTemplate(
  templateKey,
  { applyColors = true, applyFrame = true } = {},
) {
  const normalizedKey = LEGACY_TEMPLATE_MAP[templateKey] || templateKey;
  activeTemplate = TEMPLATE_DEFAULTS[normalizedKey]
    ? normalizedKey
    : "birthday-confetti";

  templateButtons.forEach((button) => {
    const isActive = button.dataset.invitationTemplate === activeTemplate;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  if (applyColors) {
    const defaults = getTemplateDefaults();

    if (invitationPrimaryColor) {
      invitationPrimaryColor.value = defaults.primary;
    }

    if (invitationSecondaryColor) {
      invitationSecondaryColor.value = defaults.secondary;
    }
  }

  if (applyFrame) {
    selectPhotoFrame(getTemplateDefaults().frame);
  }

  updateColorOutputs();
  queuePreviewRender();
}

function filterTemplateCategory(category) {
  activeCategory = category || "all";

  categoryButtons.forEach((button) => {
    const isActive =
      button.dataset.invitationCategoryFilter === activeCategory;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  templateButtons.forEach((button) => {
    const isVisible =
      activeCategory === "all" ||
      button.dataset.invitationCategory === activeCategory;
    button.classList.toggle("template-hidden", !isVisible);
  });
}

function resetInvitationForm() {
  activeInvitationId = null;
  clearCustomPhoto({ render: false });

  if (savedSelect) {
    savedSelect.value = "";
  }

  form?.reset();

  const miniCardOption = form?.querySelector(
    'input[name="invitationFormat"][value="mini_card"]',
  );

  if (miniCardOption) {
    miniCardOption.checked = true;
  }

  if (invitationName) {
    invitationName.value = getDefaultInvitationName();
  }

  if (invitationTitle) {
    invitationTitle.value = getDefaultInvitationTitle();
  }

  if (invitationMessage) {
    invitationMessage.value = getDefaultInvitationMessage();
  }

  if (invitationShowCover) {
    invitationShowCover.checked = true;
  }

  if (invitationShowQr) {
    invitationShowQr.checked = true;
  }

  resetPhotoAdjustments();

  filterTemplateCategory("all");
  selectTemplate("birthday-confetti");
  updatePhotoControl();
  updateDraftActionState();
  setStatus("");
  queuePreviewRender();
}

function cleanFileName(value) {
  return String(value || "snapup-invitation")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .toLowerCase();
}

function formatEventDate(value) {
  if (!value) {
    return t("Date to be announced");
  }

  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date(value);

  if (Number.isNaN(safeDate.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(getLocale(), {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(safeDate);
}

function formatEventTime(event) {
  const start = event?.event_start_time
    ? String(event.event_start_time).slice(0, 5)
    : "";
  const finish = event?.event_finish_time
    ? String(event.event_finish_time).slice(0, 5)
    : "";

  if (start && finish) {
    return `${start} – ${finish}`;
  }

  return start || "";
}

function formatEventLocation(event) {
  return [event?.event_location, event?.event_address]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");
}

function formatRsvpDate(value) {
  if (!value) {
    return "";
  }

  return formatEventDate(value);
}

function getFormValues() {
  const defaults = getTemplateDefaults();

  return {
    format: getSelectedFormat(),
    template: activeTemplate,
    name: invitationName?.value.trim() || getDefaultInvitationName(),
    title: invitationTitle?.value.trim() || getDefaultInvitationTitle(),
    message: invitationMessage?.value.trim() || getDefaultInvitationMessage(),
    dressCode: invitationDressCode?.value.trim() || "",
    contactPhone: invitationContactPhone?.value.trim() || "",
    rsvpDeadline: invitationRsvpDeadline?.value || "",
    primary: invitationPrimaryColor?.value || defaults.primary,
    secondary: invitationSecondaryColor?.value || defaults.secondary,
    textColor: defaults.text,
    showCover: invitationShowCover?.checked !== false,
    showQr: invitationShowQr?.checked !== false,
    photoSource: customPhotoUrl || eventData?.event_cover_url || "",
    hasCustomPhoto: Boolean(customPhotoUrl),
    backgroundSource: defaults.background,
    photoZoom: Math.max(1, Number(invitationPhotoZoom?.value || 100) / 100),
    photoX: Math.max(-100, Math.min(100, Number(invitationPhotoX?.value || 0))),
    photoY: Math.max(-100, Math.min(100, Number(invitationPhotoY?.value || 0))),
    photoFrame: getSelectedPhotoFrame(),
  };
}

function saveLanguageSwitchSnapshot() {
  if (!eventData || !form) {
    return;
  }

  const values = getFormValues();
  const snapshot = {
    eventId,
    activeInvitationId,
    format: values.format,
    template: values.template,
    name: values.name,
    title: values.title,
    message: values.message,
    dressCode: values.dressCode,
    contactPhone: values.contactPhone,
    rsvpDeadline: values.rsvpDeadline,
    primary: values.primary,
    secondary: values.secondary,
    showCover: values.showCover,
    showQr: values.showQr,
    photoZoom: Math.round(values.photoZoom * 100),
    photoX: values.photoX,
    photoY: values.photoY,
    photoFrame: values.photoFrame,
    hadCustomPhoto: values.hasCustomPhoto,
  };

  try {
    sessionStorage.setItem(LANGUAGE_SNAPSHOT_KEY, JSON.stringify(snapshot));
    sessionStorage.setItem(LANGUAGE_REOPEN_KEY, "1");
  } catch (error) {
    console.warn("Invitation language snapshot could not be saved:", error);
  }
}

function readLanguageSwitchSnapshot() {
  try {
    const rawSnapshot = sessionStorage.getItem(LANGUAGE_SNAPSHOT_KEY);
    if (!rawSnapshot) {
      return null;
    }

    const snapshot = JSON.parse(rawSnapshot);
    return snapshot?.eventId === eventId ? snapshot : null;
  } catch (error) {
    console.warn("Invitation language snapshot could not be read:", error);
    return null;
  }
}

function clearLanguageSwitchSnapshot() {
  sessionStorage.removeItem(LANGUAGE_SNAPSHOT_KEY);
  sessionStorage.removeItem(LANGUAGE_REOPEN_KEY);
}

function restoreLanguageSwitchSnapshot(snapshot) {
  if (!snapshot || !form) {
    return;
  }

  const savedInvitation = snapshot.activeInvitationId
    ? savedInvitations.find(
        (item) => item.invitation_id === snapshot.activeInvitationId,
      )
    : null;

  if (savedInvitation) {
    applySavedInvitation(savedInvitation);
  } else {
    resetInvitationForm();
  }

  const formatInput = form.querySelector(
    `input[name="invitationFormat"][value="${snapshot.format}"]`,
  );
  if (formatInput) {
    formatInput.checked = true;
  }

  filterTemplateCategory("all");
  selectTemplate(snapshot.template || "birthday-confetti", {
    applyColors: false,
    applyFrame: false,
  });

  if (invitationName) invitationName.value = snapshot.name || "";
  if (invitationTitle) invitationTitle.value = snapshot.title || "";
  if (invitationMessage) invitationMessage.value = snapshot.message || "";
  if (invitationDressCode) {
    invitationDressCode.value = snapshot.dressCode || "";
  }
  if (invitationContactPhone) {
    invitationContactPhone.value = snapshot.contactPhone || "";
  }
  if (invitationRsvpDeadline) {
    invitationRsvpDeadline.value = snapshot.rsvpDeadline || "";
  }
  if (invitationPrimaryColor && snapshot.primary) {
    invitationPrimaryColor.value = snapshot.primary;
  }
  if (invitationSecondaryColor && snapshot.secondary) {
    invitationSecondaryColor.value = snapshot.secondary;
  }
  if (invitationShowCover) {
    invitationShowCover.checked = snapshot.showCover !== false;
  }
  if (invitationShowQr) {
    invitationShowQr.checked = snapshot.showQr !== false;
  }
  if (invitationPhotoZoom) {
    invitationPhotoZoom.value = String(snapshot.photoZoom || 100);
  }
  if (invitationPhotoX) {
    invitationPhotoX.value = String(snapshot.photoX || 0);
  }
  if (invitationPhotoY) {
    invitationPhotoY.value = String(snapshot.photoY || 0);
  }

  selectPhotoFrame(snapshot.photoFrame || getTemplateDefaults().frame);
  activeInvitationId = savedInvitation?.invitation_id || null;

  if (savedSelect) {
    savedSelect.value = activeInvitationId || "";
  }

  updateColorOutputs();
  updatePhotoControl();
  updateDraftActionState();
  queuePreviewRender();

  if (snapshot.hadCustomPhoto) {
    setStatus(
      t("Language changed. Please choose your custom photo again."),
      "error",
    );
  } else {
    setStatus(t("Language changed."), "success");
  }
}

function roundRectPath(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(
    x + width,
    y + height,
    x,
    y + height,
    safeRadius,
  );
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function fillRoundRect(context, x, y, width, height, radius, color) {
  context.save();
  roundRectPath(context, x, y, width, height, radius);
  context.fillStyle = color;
  context.fill();
  context.restore();
}

function hexToRgba(hex, alpha) {
  const normalized = String(hex || "#000000").replace("#", "");
  const safe = normalized.length === 6 ? normalized : "000000";
  const red = parseInt(safe.slice(0, 2), 16);
  const green = parseInt(safe.slice(2, 4), 16);
  const blue = parseInt(safe.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getCoverCrop(image, boxRatio, photoOptions = {}) {
  const imageRatio = image.width / image.height;
  let sourceWidth = image.width;
  let sourceHeight = image.height;

  if (imageRatio > boxRatio) {
    sourceWidth = image.height * boxRatio;
  } else {
    sourceHeight = image.width / boxRatio;
  }

  const zoom = Math.max(1, Number(photoOptions.photoZoom || 1));
  sourceWidth /= zoom;
  sourceHeight /= zoom;

  const positionX = Math.max(
    -100,
    Math.min(100, Number(photoOptions.photoX || 0)),
  );
  const positionY = Math.max(
    -100,
    Math.min(100, Number(photoOptions.photoY || 0)),
  );
  const availableX = Math.max(0, image.width - sourceWidth);
  const availableY = Math.max(0, image.height - sourceHeight);

  return {
    sourceWidth,
    sourceHeight,
    sourceX: availableX * ((positionX + 100) / 200),
    sourceY: availableY * ((positionY + 100) / 200),
  };
}

function drawCoverImage(
  context,
  image,
  x,
  y,
  width,
  height,
  radius,
  photoOptions = {},
) {
  if (!image) {
    return false;
  }

  const { sourceWidth, sourceHeight, sourceX, sourceY } = getCoverCrop(
    image,
    width / height,
    photoOptions,
  );

  context.save();
  roundRectPath(context, x, y, width, height, radius);
  context.clip();
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );
  context.restore();

  return true;
}

function wrapText(context, text, maxWidth) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (!currentLine || context.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function drawWrappedText(
  context,
  text,
  x,
  y,
  maxWidth,
  lineHeight,
  maxLines,
) {
  const lines = wrapText(context, text, maxWidth);
  const visibleLines = lines.slice(0, maxLines);

  if (lines.length > maxLines && visibleLines.length) {
    let lastLine = visibleLines[visibleLines.length - 1];

    while (
      lastLine.length > 1 &&
      context.measureText(`${lastLine}…`).width > maxWidth
    ) {
      lastLine = lastLine.slice(0, -1);
    }

    visibleLines[visibleLines.length - 1] = `${lastLine.trim()}…`;
  }

  visibleLines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });

  return y + visibleLines.length * lineHeight;
}

function drawQrCode(context, value, x, y, size, darkColor = "#111111") {
  if (!value || typeof window.qrcode !== "function") {
    return false;
  }

  try {
    const qr = window.qrcode(0, "M");
    qr.addData(value, "Byte");
    qr.make();

    const count = qr.getModuleCount();
    const quietZone = 4;
    const totalModules = count + quietZone * 2;
    const cellSize = size / totalModules;

    context.save();
    context.fillStyle = "#FFFFFF";
    context.fillRect(x, y, size, size);
    context.fillStyle = darkColor;

    for (let row = 0; row < count; row += 1) {
      for (let column = 0; column < count; column += 1) {
        if (!qr.isDark(row, column)) {
          continue;
        }

        const left = x + (column + quietZone) * cellSize;
        const top = y + (row + quietZone) * cellSize;
        const right = x + (column + quietZone + 1) * cellSize;
        const bottom = y + (row + quietZone + 1) * cellSize;

        context.fillRect(
          Math.floor(left),
          Math.floor(top),
          Math.ceil(right - left),
          Math.ceil(bottom - top),
        );
      }
    }

    context.restore();
    return true;
  } catch (error) {
    console.warn("Invitation QR render failed:", error);
    return false;
  }
}

function getImageFromUrl(url) {
  if (!url) {
    return Promise.resolve(null);
  }

  if (imageCache.has(url)) {
    return imageCache.get(url);
  }

  const imagePromise = fetch(url, { mode: "cors" })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Cover image could not be loaded.");
      }

      return response.blob();
    })
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const objectUrl = URL.createObjectURL(blob);
          const image = new Image();

          image.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(image);
          };
          image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Cover image could not be decoded."));
          };
          image.src = objectUrl;
        }),
    )
    .catch((error) => {
      console.warn("Invitation cover skipped:", error);
      return null;
    });

  imageCache.set(url, imagePromise);
  return imagePromise;
}

function drawModernInvitation(context, width, height, values, coverImage) {
  const unit = width / 1080;
  const padding = 72 * unit;
  const tall = height / width > 1.5;

  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, values.secondary);
  background.addColorStop(0.48, values.primary);
  background.addColorStop(1, "#17122B");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.fillStyle = hexToRgba("#2DD4BF", 0.55);
  context.beginPath();
  context.arc(width * 0.88, height * 0.08, width * 0.23, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "rgba(255,255,255,0.08)";
  context.lineWidth = 1.5 * unit;
  for (let x = 0; x < width; x += 54 * unit) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = 0; y < height; y += 54 * unit) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  const coverHeight = height * (tall ? 0.4 : 0.36);
  const coverY = padding;
  const coverDrawn =
    values.showCover &&
    drawCoverImage(
      context,
      coverImage,
      padding,
      coverY,
      width - padding * 2,
      coverHeight,
      34 * unit,
    );

  if (!coverDrawn) {
    const coverGradient = context.createLinearGradient(
      padding,
      coverY,
      width - padding,
      coverY + coverHeight,
    );
    coverGradient.addColorStop(0, hexToRgba(values.secondary, 0.78));
    coverGradient.addColorStop(1, hexToRgba("#2DD4BF", 0.65));
    fillRoundRect(
      context,
      padding,
      coverY,
      width - padding * 2,
      coverHeight,
      34 * unit,
      coverGradient,
    );
  }

  const overlay = context.createLinearGradient(
    0,
    coverY,
    0,
    coverY + coverHeight,
  );
  overlay.addColorStop(0, "rgba(9,5,22,0.04)");
  overlay.addColorStop(1, "rgba(9,5,22,0.72)");
  fillRoundRect(
    context,
    padding,
    coverY,
    width - padding * 2,
    coverHeight,
    34 * unit,
    overlay,
  );

  context.fillStyle = "#FFFFFF";
  context.textAlign = "left";
  context.textBaseline = "top";
  context.font = `900 ${16 * unit}px Arial, sans-serif`;
  context.fillText("SNAPUP INVITATION", padding + 28 * unit, coverY + 26 * unit);

  let contentY = coverY + coverHeight + 44 * unit;
  context.font = `900 ${62 * unit}px Arial, sans-serif`;
  contentY = drawWrappedText(
    context,
    values.title,
    padding,
    contentY,
    width - padding * 2,
    66 * unit,
    2,
  );

  context.fillStyle = "rgba(255,255,255,0.74)";
  context.font = `700 ${22 * unit}px Arial, sans-serif`;
  contentY = drawWrappedText(
    context,
    eventData?.event_name || "",
    padding,
    contentY + 8 * unit,
    width - padding * 2,
    28 * unit,
    2,
  );

  const detailY = contentY + 24 * unit;
  const dateText = [
    formatEventDate(eventData?.event_date),
    formatEventTime(eventData),
  ]
    .filter(Boolean)
    .join(" · ");
  const locationText =
    formatEventLocation(eventData) || t("Location to be announced");

  context.fillStyle = "#FFFFFF";
  context.font = `850 ${20 * unit}px Arial, sans-serif`;
  context.fillText(dateText, padding, detailY);
  context.fillStyle = "rgba(255,255,255,0.7)";
  context.font = `700 ${18 * unit}px Arial, sans-serif`;
  drawWrappedText(
    context,
    locationText,
    padding,
    detailY + 33 * unit,
    width - padding * 2 - (values.showQr ? 220 * unit : 0),
    25 * unit,
    2,
  );

  const qrSize = 176 * unit;
  const qrX = width - padding - qrSize;
  const qrY = height - padding - qrSize;
  const footerTextWidth = values.showQr
    ? width - padding * 2 - qrSize - 30 * unit
    : width - padding * 2;
  const messageY = Math.min(
    detailY + 103 * unit,
    height - padding - (values.showQr ? qrSize : 92 * unit),
  );

  context.fillStyle = "rgba(255,255,255,0.86)";
  context.font = `650 ${17 * unit}px Arial, sans-serif`;
  drawWrappedText(
    context,
    values.message,
    padding,
    messageY,
    footerTextWidth,
    25 * unit,
    tall ? 5 : 3,
  );

  const extraDetails = [
    values.dressCode ? `${t("Dress code")}: ${values.dressCode}` : "",
    values.rsvpDeadline
      ? `${t("RSVP")}: ${formatRsvpDate(values.rsvpDeadline)}`
      : "",
    values.contactPhone ? `${t("Contact")}: ${values.contactPhone}` : "",
  ].filter(Boolean);

  context.fillStyle = "rgba(255,255,255,0.6)";
  context.font = `700 ${14 * unit}px Arial, sans-serif`;
  extraDetails.slice(0, tall ? 3 : 2).forEach((line, index) => {
    context.fillText(
      line,
      padding,
      height - padding - 56 * unit + index * 22 * unit,
    );
  });

  if (values.showQr && drawQrCode(context, joinUrl, qrX, qrY, qrSize)) {
    context.fillStyle = "rgba(255,255,255,0.72)";
    context.textAlign = "center";
    context.font = `800 ${13 * unit}px Arial, sans-serif`;
    context.fillText(
      eventData?.event_code || "",
      qrX + qrSize / 2,
      qrY - 24 * unit,
    );
  }
}

function drawElegantInvitation(context, width, height, values, coverImage) {
  const unit = width / 1080;
  const padding = 76 * unit;
  const tall = height / width > 1.5;
  const paper = "#F6F0E6";
  const ink = values.primary;

  context.fillStyle = paper;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = values.secondary;
  context.lineWidth = 3 * unit;
  context.strokeRect(28 * unit, 28 * unit, width - 56 * unit, height - 56 * unit);
  context.lineWidth = 1 * unit;
  context.strokeRect(42 * unit, 42 * unit, width - 84 * unit, height - 84 * unit);

  context.fillStyle = hexToRgba(values.secondary, 0.15);
  context.beginPath();
  context.arc(width / 2, -20 * unit, 205 * unit, 0, Math.PI * 2);
  context.fill();

  context.textAlign = "center";
  context.textBaseline = "top";
  context.fillStyle = values.secondary;
  context.font = `700 ${15 * unit}px Georgia, serif`;
  context.fillText("SNAPUP EVENTS · INVITATION", width / 2, 84 * unit);

  const coverWidth = width - padding * 2;
  const coverHeight = height * (tall ? 0.34 : 0.3);
  const coverY = 128 * unit;
  const coverDrawn =
    values.showCover &&
    drawCoverImage(
      context,
      coverImage,
      padding,
      coverY,
      coverWidth,
      coverHeight,
      999 * unit,
    );

  if (!coverDrawn) {
    const coverGradient = context.createLinearGradient(
      padding,
      coverY,
      width - padding,
      coverY + coverHeight,
    );
    coverGradient.addColorStop(0, hexToRgba(values.secondary, 0.32));
    coverGradient.addColorStop(1, hexToRgba(values.primary, 0.2));
    fillRoundRect(
      context,
      padding,
      coverY,
      coverWidth,
      coverHeight,
      999 * unit,
      coverGradient,
    );
  }

  let contentY = coverY + coverHeight + 48 * unit;
  context.fillStyle = ink;
  context.font = `700 ${59 * unit}px Georgia, serif`;
  const titleLines = wrapText(context, values.title, width - padding * 2).slice(
    0,
    2,
  );
  titleLines.forEach((line, index) => {
    context.fillText(line, width / 2, contentY + index * 66 * unit);
  });
  contentY += titleLines.length * 66 * unit;

  context.fillStyle = values.secondary;
  context.font = `700 ${20 * unit}px Georgia, serif`;
  context.fillText(
    eventData?.event_name || "",
    width / 2,
    contentY + 8 * unit,
  );
  contentY += 54 * unit;

  context.fillStyle = ink;
  context.font = `700 ${19 * unit}px Georgia, serif`;
  context.fillText(
    [
      formatEventDate(eventData?.event_date),
      formatEventTime(eventData),
    ]
      .filter(Boolean)
      .join(" · "),
    width / 2,
    contentY,
  );

  context.fillStyle = hexToRgba(ink, 0.72);
  context.font = `400 ${17 * unit}px Georgia, serif`;
  const locationLines = wrapText(
    context,
    formatEventLocation(eventData) || t("Location to be announced"),
    width - padding * 2,
  ).slice(0, 2);
  locationLines.forEach((line, index) => {
    context.fillText(line, width / 2, contentY + 34 * unit + index * 23 * unit);
  });

  const messageTop = contentY + 92 * unit;
  context.fillStyle = hexToRgba(ink, 0.82);
  context.font = `italic 400 ${18 * unit}px Georgia, serif`;
  const messageLines = wrapText(
    context,
    values.message,
    width - padding * 2 - 80 * unit,
  ).slice(0, tall ? 5 : 3);
  messageLines.forEach((line, index) => {
    context.fillText(
      line,
      width / 2,
      messageTop + index * 26 * unit,
    );
  });

  const qrSize = 154 * unit;
  const qrX = width / 2 - qrSize / 2;
  const qrY = height - padding - qrSize - 38 * unit;

  if (values.showQr && drawQrCode(context, joinUrl, qrX, qrY, qrSize, ink)) {
    context.fillStyle = ink;
    context.font = `700 ${13 * unit}px Georgia, serif`;
    context.fillText(
      `${t("JOIN CODE")} · ${eventData?.event_code || ""}`,
      width / 2,
      qrY + qrSize + 14 * unit,
    );
  }

  const footerDetails = [
    values.dressCode ? `${t("Dress code")}: ${values.dressCode}` : "",
    values.rsvpDeadline
      ? `${t("RSVP")}: ${formatRsvpDate(values.rsvpDeadline)}`
      : "",
    values.contactPhone ? `${t("Contact")}: ${values.contactPhone}` : "",
  ].filter(Boolean);

  context.fillStyle = hexToRgba(ink, 0.68);
  context.font = `600 ${13 * unit}px Georgia, serif`;
  context.fillText(
    footerDetails.join("  ·  "),
    width / 2,
    height - 72 * unit,
  );
}

function drawJoyfulInvitation(context, width, height, values, coverImage) {
  const unit = width / 1080;
  const padding = 64 * unit;
  const tall = height / width > 1.5;

  context.fillStyle = values.primary;
  context.fillRect(0, 0, width, height);

  context.fillStyle = values.secondary;
  context.beginPath();
  context.arc(width * 0.08, height * 0.2, width * 0.22, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#FBBF24";
  context.beginPath();
  context.arc(width * 0.9, height * 0.07, width * 0.18, 0, Math.PI * 2);
  context.fill();

  context.save();
  context.translate(width * 0.86, height * 0.68);
  context.rotate(-0.45);
  context.fillStyle = "rgba(255,255,255,0.18)";
  context.fillRect(-180 * unit, -24 * unit, 360 * unit, 48 * unit);
  context.restore();

  fillRoundRect(
    context,
    padding,
    padding,
    width - padding * 2,
    height - padding * 2,
    46 * unit,
    "#FFF9F1",
  );

  context.textAlign = "left";
  context.textBaseline = "top";
  context.fillStyle = values.primary;
  context.font = `900 ${16 * unit}px "Arial Rounded MT Bold", Arial, sans-serif`;
  context.fillText("YOU'RE INVITED!", padding + 38 * unit, padding + 34 * unit);

  const coverX = padding + 32 * unit;
  const coverY = padding + 84 * unit;
  const coverWidth = width - padding * 2 - 64 * unit;
  const coverHeight = height * (tall ? 0.36 : 0.32);

  context.save();
  context.translate(width / 2, coverY + coverHeight / 2);
  context.rotate(-0.018);
  const translatedX = -coverWidth / 2;
  const translatedY = -coverHeight / 2;
  const coverDrawn =
    values.showCover &&
    drawCoverImage(
      context,
      coverImage,
      translatedX,
      translatedY,
      coverWidth,
      coverHeight,
      30 * unit,
    );

  if (!coverDrawn) {
    const coverGradient = context.createLinearGradient(
      translatedX,
      translatedY,
      translatedX + coverWidth,
      translatedY + coverHeight,
    );
    coverGradient.addColorStop(0, values.secondary);
    coverGradient.addColorStop(1, "#FBBF24");
    fillRoundRect(
      context,
      translatedX,
      translatedY,
      coverWidth,
      coverHeight,
      30 * unit,
      coverGradient,
    );
  }
  context.restore();

  let contentY = coverY + coverHeight + 42 * unit;
  context.fillStyle = "#172036";
  context.font = `900 ${58 * unit}px "Arial Rounded MT Bold", Arial, sans-serif`;
  contentY = drawWrappedText(
    context,
    values.title,
    padding + 36 * unit,
    contentY,
    width - padding * 2 - 72 * unit,
    63 * unit,
    2,
  );

  context.fillStyle = values.primary;
  context.font = `900 ${21 * unit}px "Arial Rounded MT Bold", Arial, sans-serif`;
  contentY = drawWrappedText(
    context,
    eventData?.event_name || "",
    padding + 36 * unit,
    contentY + 8 * unit,
    width - padding * 2 - 72 * unit,
    28 * unit,
    2,
  );

  const infoY = contentY + 24 * unit;
  context.fillStyle = "#172036";
  context.font = `800 ${18 * unit}px Arial, sans-serif`;
  context.fillText(
    [
      formatEventDate(eventData?.event_date),
      formatEventTime(eventData),
    ]
      .filter(Boolean)
      .join(" · "),
    padding + 36 * unit,
    infoY,
  );

  context.fillStyle = "rgba(23,32,54,0.65)";
  context.font = `700 ${16 * unit}px Arial, sans-serif`;
  drawWrappedText(
    context,
    formatEventLocation(eventData) || t("Location to be announced"),
    padding + 36 * unit,
    infoY + 30 * unit,
    width - padding * 2 - 72 * unit,
    23 * unit,
    2,
  );

  const qrSize = 160 * unit;
  const qrX = width - padding - 36 * unit - qrSize;
  const qrY = height - padding - 36 * unit - qrSize;
  const messageWidth = values.showQr
    ? width - padding * 2 - qrSize - 100 * unit
    : width - padding * 2 - 72 * unit;

  context.fillStyle = "rgba(23,32,54,0.77)";
  context.font = `650 ${16 * unit}px Arial, sans-serif`;
  drawWrappedText(
    context,
    values.message,
    padding + 36 * unit,
    Math.min(infoY + 94 * unit, qrY - 18 * unit),
    messageWidth,
    23 * unit,
    tall ? 6 : 3,
  );

  if (
    values.showQr &&
    drawQrCode(context, joinUrl, qrX, qrY, qrSize, "#172036")
  ) {
    context.fillStyle = "#172036";
    context.textAlign = "center";
    context.font = `900 ${13 * unit}px Arial, sans-serif`;
    context.fillText(
      eventData?.event_code || "",
      qrX + qrSize / 2,
      qrY - 23 * unit,
    );
  }

  const footerDetails = [
    values.dressCode ? `${t("Dress code")}: ${values.dressCode}` : "",
    values.rsvpDeadline
      ? `${t("RSVP")}: ${formatRsvpDate(values.rsvpDeadline)}`
      : "",
    values.contactPhone ? `${t("Contact")}: ${values.contactPhone}` : "",
  ].filter(Boolean);

  context.textAlign = "left";
  context.fillStyle = "rgba(23,32,54,0.58)";
  context.font = `750 ${13 * unit}px Arial, sans-serif`;
  footerDetails.slice(0, tall ? 3 : 2).forEach((line, index) => {
    context.fillText(
      line,
      padding + 36 * unit,
      height - padding - 78 * unit + index * 20 * unit,
    );
  });
}

function drawImageCoverRect(
  context,
  image,
  x,
  y,
  width,
  height,
  photoOptions = {},
) {
  if (!image) {
    return false;
  }

  const { sourceWidth, sourceHeight, sourceX, sourceY } = getCoverCrop(
    image,
    width / height,
    photoOptions,
  );

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );

  return true;
}

function drawPosterBackground(context, image, width, height, fallbackColor) {
  context.fillStyle = fallbackColor;
  context.fillRect(0, 0, width, height);

  if (image) {
    drawImageCoverRect(context, image, 0, 0, width, height);
  }

  const veil = context.createLinearGradient(0, 0, 0, height);
  veil.addColorStop(0, "rgba(255,255,255,0.04)");
  veil.addColorStop(0.46, "rgba(255,255,255,0.1)");
  veil.addColorStop(1, "rgba(255,255,255,0.2)");
  context.fillStyle = veil;
  context.fillRect(0, 0, width, height);
}

function drawSmallBranding(context, width, height, ink, unit) {
  context.save();
  context.fillStyle = hexToRgba(ink, 0.88);
  context.textBaseline = "top";
  context.font = `900 ${18 * unit}px Arial, sans-serif`;
  context.textAlign = "left";
  context.fillText("SnapUp Events", 38 * unit, 30 * unit);
  context.textAlign = "right";
  context.fillText(
    "SnapUp Events",
    width - 38 * unit,
    height - 52 * unit,
  );
  context.restore();
}

function drawQrPanel(
  context,
  width,
  y,
  qrSize,
  ink,
  accent,
  unit,
) {
  const cardPadding = 18 * unit;
  const labelHeight = 72 * unit;
  const cardWidth = qrSize + cardPadding * 2;
  const cardHeight = qrSize + cardPadding * 2 + labelHeight;
  const cardX = (width - cardWidth) / 2;
  const radius = 24 * unit;

  context.save();
  context.shadowColor = "rgba(44, 34, 25, 0.17)";
  context.shadowBlur = 28 * unit;
  context.shadowOffsetY = 12 * unit;
  fillRoundRect(
    context,
    cardX,
    y,
    cardWidth,
    cardHeight,
    radius,
    "rgba(255,255,255,0.97)",
  );
  context.restore();

  context.save();
  roundRectPath(context, cardX, y, cardWidth, cardHeight, radius);
  context.strokeStyle = hexToRgba(accent, 0.7);
  context.lineWidth = 2 * unit;
  context.stroke();
  context.restore();

  const qrX = cardX + cardPadding;
  const qrY = y + cardPadding;
  const qrDrawn = drawQrCode(
    context,
    joinUrl,
    qrX,
    qrY,
    qrSize,
    "#171717",
  );

  context.save();
  const labelY = qrY + qrSize + 10 * unit;
  context.textAlign = "center";
  context.textBaseline = "top";
  context.fillStyle = "#5B6472";
  context.font = `800 ${12 * unit}px Arial, sans-serif`;
  context.fillText(t("SCAN TO JOIN"), width / 2, labelY);
  context.fillStyle = "#111827";
  context.font = `900 ${25 * unit}px "Courier New", monospace`;
  context.fillText(
    eventData?.event_code || "",
    width / 2,
    labelY + 22 * unit,
  );
  context.restore();

  return {
    bottom: y + cardHeight,
    drawn: qrDrawn,
    size: qrSize,
  };
}

function drawArchPhoto(
  context,
  image,
  x,
  y,
  width,
  height,
  borderColor,
  unit,
  photoOptions = {},
) {
  const radius = width / 2;

  context.save();
  context.shadowColor = "rgba(57, 50, 35, 0.18)";
  context.shadowBlur = 30 * unit;
  context.shadowOffsetY = 12 * unit;
  context.beginPath();
  context.moveTo(x, y + height);
  context.lineTo(x, y + radius);
  context.arc(x + radius, y + radius, radius, Math.PI, 0);
  context.lineTo(x + width, y + height);
  context.closePath();
  context.fillStyle = "rgba(255,255,255,0.94)";
  context.fill();
  context.restore();

  context.save();
  context.beginPath();
  context.moveTo(x, y + height);
  context.lineTo(x, y + radius);
  context.arc(x + radius, y + radius, radius, Math.PI, 0);
  context.lineTo(x + width, y + height);
  context.closePath();
  context.clip();

  if (image) {
    drawImageCoverRect(context, image, x, y, width, height, photoOptions);
  } else {
    const placeholder = context.createLinearGradient(x, y, x + width, y + height);
    placeholder.addColorStop(0, "#E9E1D0");
    placeholder.addColorStop(1, "#C8D2C4");
    context.fillStyle = placeholder;
    context.fillRect(x, y, width, height);
  }
  context.restore();

  context.save();
  context.beginPath();
  context.moveTo(x, y + height);
  context.lineTo(x, y + radius);
  context.arc(x + radius, y + radius, radius, Math.PI, 0);
  context.lineTo(x + width, y + height);
  context.closePath();
  context.strokeStyle = hexToRgba(borderColor, 0.78);
  context.lineWidth = 4 * unit;
  context.stroke();
  context.restore();
}

function drawRoundedPhoto(
  context,
  image,
  x,
  y,
  width,
  height,
  radius,
  borderColor,
  unit,
  photoOptions = {},
) {
  context.save();
  context.shadowColor = "rgba(64, 44, 58, 0.2)";
  context.shadowBlur = 30 * unit;
  context.shadowOffsetY = 12 * unit;
  fillRoundRect(
    context,
    x - 8 * unit,
    y - 8 * unit,
    width + 16 * unit,
    height + 16 * unit,
    radius + 8 * unit,
    "rgba(255,255,255,0.92)",
  );
  context.restore();

  if (image) {
    drawCoverImage(
      context,
      image,
      x,
      y,
      width,
      height,
      radius,
      photoOptions,
    );
  } else {
    const placeholder = context.createLinearGradient(x, y, x + width, y + height);
    placeholder.addColorStop(0, "#F2DADB");
    placeholder.addColorStop(1, "#CBD8E5");
    fillRoundRect(context, x, y, width, height, radius, placeholder);
  }

  context.save();
  roundRectPath(context, x, y, width, height, radius);
  context.strokeStyle = hexToRgba(borderColor, 0.72);
  context.lineWidth = 3 * unit;
  context.stroke();
  context.restore();
}

function drawPolaroidPhoto(
  context,
  image,
  x,
  y,
  width,
  height,
  rotation,
  accent,
  unit,
  photoOptions = {},
) {
  context.save();
  context.translate(x + width / 2, y + height / 2);
  context.rotate(rotation);

  const frameX = -width / 2 - 14 * unit;
  const frameY = -height / 2 - 14 * unit;
  const frameWidth = width + 28 * unit;
  const frameHeight = height + 56 * unit;

  context.shadowColor = "rgba(26, 42, 70, 0.2)";
  context.shadowBlur = 26 * unit;
  context.shadowOffsetY = 12 * unit;
  fillRoundRect(
    context,
    frameX,
    frameY,
    frameWidth,
    frameHeight,
    24 * unit,
    "#FFFDF8",
  );
  context.shadowColor = "transparent";

  if (image) {
    drawCoverImage(
      context,
      image,
      -width / 2,
      -height / 2,
      width,
      height,
      15 * unit,
      photoOptions,
    );
  } else {
    const placeholder = context.createLinearGradient(
      -width / 2,
      -height / 2,
      width / 2,
      height / 2,
    );
    placeholder.addColorStop(0, "#F6B548");
    placeholder.addColorStop(1, "#3DB8AD");
    fillRoundRect(
      context,
      -width / 2,
      -height / 2,
      width,
      height,
      15 * unit,
      placeholder,
    );
  }

  context.fillStyle = accent;
  context.beginPath();
  context.arc(0, height / 2 + 24 * unit, 5 * unit, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawOvalPhoto(
  context,
  image,
  x,
  y,
  width,
  height,
  borderColor,
  unit,
  photoOptions = {},
) {
  context.save();
  context.shadowColor = "rgba(37, 31, 42, 0.2)";
  context.shadowBlur = 30 * unit;
  context.shadowOffsetY = 12 * unit;
  context.beginPath();
  context.ellipse(
    x + width / 2,
    y + height / 2,
    width / 2 + 8 * unit,
    height / 2 + 8 * unit,
    0,
    0,
    Math.PI * 2,
  );
  context.fillStyle = "rgba(255,255,255,0.94)";
  context.fill();
  context.restore();

  context.save();
  context.beginPath();
  context.ellipse(
    x + width / 2,
    y + height / 2,
    width / 2,
    height / 2,
    0,
    0,
    Math.PI * 2,
  );
  context.clip();

  if (image) {
    drawImageCoverRect(context, image, x, y, width, height, photoOptions);
  } else {
    const placeholder = context.createLinearGradient(x, y, x + width, y + height);
    placeholder.addColorStop(0, "#F0D7C8");
    placeholder.addColorStop(1, "#A8C5CD");
    context.fillStyle = placeholder;
    context.fillRect(x, y, width, height);
  }
  context.restore();

  context.save();
  context.beginPath();
  context.ellipse(
    x + width / 2,
    y + height / 2,
    width / 2,
    height / 2,
    0,
    0,
    Math.PI * 2,
  );
  context.strokeStyle = hexToRgba(borderColor, 0.82);
  context.lineWidth = 4 * unit;
  context.stroke();
  context.restore();
}

function drawFilmPhoto(
  context,
  image,
  x,
  y,
  width,
  height,
  accent,
  unit,
  photoOptions = {},
) {
  const border = 24 * unit;
  const outerX = x - border;
  const outerY = y - border;
  const outerWidth = width + border * 2;
  const outerHeight = height + border * 2;

  context.save();
  context.shadowColor = "rgba(0,0,0,0.3)";
  context.shadowBlur = 28 * unit;
  context.shadowOffsetY = 12 * unit;
  fillRoundRect(
    context,
    outerX,
    outerY,
    outerWidth,
    outerHeight,
    28 * unit,
    "#161A22",
  );
  context.restore();

  if (image) {
    drawCoverImage(
      context,
      image,
      x,
      y,
      width,
      height,
      13 * unit,
      photoOptions,
    );
  } else {
    fillRoundRect(context, x, y, width, height, 13 * unit, "#394355");
  }

  const holeCount = 12;
  const holeWidth = 22 * unit;
  const holeHeight = 9 * unit;
  const gap = (width - holeCount * holeWidth) / (holeCount - 1);

  for (let index = 0; index < holeCount; index += 1) {
    const holeX = x + index * (holeWidth + gap);
    fillRoundRect(
      context,
      holeX,
      outerY + 7 * unit,
      holeWidth,
      holeHeight,
      3 * unit,
      "#F7F2E8",
    );
    fillRoundRect(
      context,
      holeX,
      outerY + outerHeight - 16 * unit,
      holeWidth,
      holeHeight,
      3 * unit,
      "#F7F2E8",
    );
  }

  context.save();
  context.strokeStyle = hexToRgba(accent, 0.82);
  context.lineWidth = 3 * unit;
  roundRectPath(context, x, y, width, height, 13 * unit);
  context.stroke();
  context.restore();
}

function drawStampPhoto(
  context,
  image,
  x,
  y,
  width,
  height,
  accent,
  unit,
  photoOptions = {},
) {
  const border = 18 * unit;

  context.save();
  context.shadowColor = "rgba(52, 39, 28, 0.18)";
  context.shadowBlur = 26 * unit;
  context.shadowOffsetY = 11 * unit;
  fillRoundRect(
    context,
    x - border,
    y - border,
    width + border * 2,
    height + border * 2,
    8 * unit,
    "#FFFDF7",
  );
  context.restore();

  if (image) {
    drawCoverImage(
      context,
      image,
      x,
      y,
      width,
      height,
      3 * unit,
      photoOptions,
    );
  } else {
    fillRoundRect(context, x, y, width, height, 3 * unit, "#D8CFBC");
  }

  context.save();
  context.setLineDash([8 * unit, 7 * unit]);
  context.strokeStyle = hexToRgba(accent, 0.88);
  context.lineWidth = 4 * unit;
  context.strokeRect(
    x - 10 * unit,
    y - 10 * unit,
    width + 20 * unit,
    height + 20 * unit,
  );
  context.restore();
}

function drawInvitationPhotoFrame(
  context,
  image,
  x,
  y,
  width,
  height,
  frame,
  accent,
  unit,
  photoOptions = {},
) {
  const drawArguments = [
    context,
    image,
    x,
    y,
    width,
    height,
    accent,
    unit,
    photoOptions,
  ];

  if (frame === "arch") {
    // Mini Card uses a shorter photo slot than the other formats. A true
    // half-circle needs at least half of its width as height, otherwise the
    // lower ends of the arch fall outside the slot and look cropped.
    const safeArchWidth = Math.min(
      width,
      Math.max(1, (height - 4 * unit) * 2),
    );
    const safeArchX = x + (width - safeArchWidth) / 2;

    drawArchPhoto(
      context,
      image,
      safeArchX,
      y,
      safeArchWidth,
      height,
      accent,
      unit,
      photoOptions,
    );
    return;
  }

  if (frame === "oval") {
    drawOvalPhoto(...drawArguments);
    return;
  }

  if (frame === "film") {
    drawFilmPhoto(...drawArguments);
    return;
  }

  if (frame === "stamp") {
    drawStampPhoto(...drawArguments);
    return;
  }

  if (frame === "polaroid") {
    drawPolaroidPhoto(
      context,
      image,
      x,
      y,
      width,
      height,
      -0.012,
      accent,
      unit,
      photoOptions,
    );
    return;
  }

  drawRoundedPhoto(
    context,
    image,
    x,
    y,
    width,
    height,
    38 * unit,
    accent,
    unit,
    photoOptions,
  );
}

function drawCenteredFittedText(
  context,
  text,
  y,
  maxWidth,
  preferredSize,
  minSize,
  maxLines,
  family,
  weight,
  color,
  unit,
  lineHeightRatio = 1.06,
) {
  let fontSize = preferredSize;
  let lines = [];

  while (fontSize >= minSize) {
    context.font = `${weight} ${fontSize * unit}px ${family}`;
    lines = wrapText(context, text, maxWidth);

    if (lines.length <= maxLines) {
      break;
    }

    fontSize -= 2;
  }

  const visibleLines = lines.slice(0, maxLines);
  const lineHeight = fontSize * lineHeightRatio * unit;

  context.save();
  context.fillStyle = color;
  context.textAlign = "center";
  context.textBaseline = "top";
  context.font = `${weight} ${fontSize * unit}px ${family}`;
  visibleLines.forEach((line, index) => {
    context.fillText(line, context.canvas.width / 2, y + index * lineHeight);
  });
  context.restore();

  return y + visibleLines.length * lineHeight;
}

function drawInvitationCopy(
  context,
  width,
  height,
  startY,
  values,
  ink,
  accent,
  unit,
  style,
) {
  const family =
    style === "joyful"
      ? '"Arial Rounded MT Bold", Arial, sans-serif'
      : 'Georgia, "Times New Roman", serif';
  const baseHeight = height / unit;
  const contentWidth =
    width - (style === "joyful" ? 154 : 174) * unit;
  let y = drawCenteredFittedText(
    context,
    values.title,
    startY,
    contentWidth,
    style === "joyful" ? 68 : 66,
    44,
    2,
    family,
    style === "joyful" ? 900 : 700,
    ink,
    unit,
  );

  y += 12 * unit;
  context.save();
  context.textAlign = "center";
  context.textBaseline = "top";
  context.fillStyle = accent;
  context.font = `${style === "joyful" ? 900 : 700} ${26 * unit}px ${family}`;
  context.fillText(eventData?.event_name || "", width / 2, y);
  context.restore();
  y += 48 * unit;

  const dateText = [
    formatEventDate(eventData?.event_date),
    formatEventTime(eventData),
  ]
    .filter(Boolean)
    .join("  ·  ");

  context.save();
  context.textAlign = "center";
  context.textBaseline = "top";
  context.fillStyle = ink;
  context.font = `850 ${22 * unit}px Arial, sans-serif`;
  context.fillText(dateText, width / 2, y);
  context.fillStyle = hexToRgba(ink, 0.72);
  context.font = `750 ${19 * unit}px Arial, sans-serif`;
  const locationLines = wrapText(
    context,
    formatEventLocation(eventData) || t("Location to be announced"),
    contentWidth,
  ).slice(0, 2);
  locationLines.forEach((line, index) => {
    context.fillText(line, width / 2, y + 34 * unit + index * 27 * unit);
  });
  context.restore();
  y += (locationLines.length > 1 ? 98 : 72) * unit;

  const messageBottomLimit = height - 156 * unit;
  const availableMessageHeight = Math.max(0, messageBottomLimit - y);
  const maxMessageLines = Math.max(
    1,
    Math.min(
      baseHeight > 1700 ? 5 : 3,
      Math.floor(availableMessageHeight / (29 * unit)),
    ),
  );

  context.save();
  context.textAlign = "center";
  context.textBaseline = "top";
  context.fillStyle = hexToRgba(ink, 0.82);
  context.font =
    style === "joyful"
      ? `750 ${20 * unit}px Arial, sans-serif`
      : `italic 500 ${20 * unit}px Georgia, serif`;
  const messageLines = wrapText(context, values.message, contentWidth - 60 * unit)
    .slice(0, maxMessageLines);
  messageLines.forEach((line, index) => {
    context.fillText(line, width / 2, y + index * 29 * unit);
  });
  context.restore();

  const footerDetails = [
    values.dressCode ? `${t("Dress code")}: ${values.dressCode}` : "",
    values.rsvpDeadline
      ? `${t("RSVP")}: ${formatRsvpDate(values.rsvpDeadline)}`
      : "",
    values.contactPhone ? `${t("Contact")}: ${values.contactPhone}` : "",
  ].filter(Boolean);

  if (footerDetails.length) {
    drawCenteredFittedText(
      context,
      footerDetails.join("   ·   "),
      height - 94 * unit,
      width - 132 * unit,
      16,
      13,
      2,
      "Arial, sans-serif",
      750,
      hexToRgba(ink, 0.68),
      unit,
      1.28,
    );
  }
}

function getInvitationLayout(width, height) {
  const unit = width / 1080;
  const baseHeight = height / unit;
  const story = baseHeight > 1700;
  const spacious = baseHeight > 1450;
  const qrSize = (story ? 316 : spacious ? 306 : 292) * unit;
  const qrY = 62 * unit;
  const qrPanelHeight = qrSize + 108 * unit;
  const photoY = qrY + qrPanelHeight + (story ? 36 : 24) * unit;
  const photoHeight = (story ? 590 : spacious ? 390 : 300) * unit;

  return {
    unit,
    story,
    spacious,
    qrSize,
    qrY,
    qrPanelHeight,
    photoY,
    photoHeight,
    contentY: photoY + photoHeight + (story ? 62 : 52) * unit,
    contentYWithoutPhoto:
      qrY + qrPanelHeight + (story ? 94 : 72) * unit,
  };
}

function getInvitationCopyStartY(layout, values) {
  if (values.showCover) {
    return layout.contentY;
  }

  if (values.showQr) {
    return layout.contentYWithoutPhoto;
  }

  return (layout.story ? 300 : layout.spacious ? 260 : 220) * layout.unit;
}

function drawBotanicalInvitationV2(
  context,
  width,
  height,
  values,
  photoImage,
  backgroundImage,
) {
  const layout = getInvitationLayout(width, height);
  const { unit } = layout;
  const ink = values.primary;
  const accent = values.secondary;

  drawPosterBackground(context, backgroundImage, width, height, "#F4EFE3");
  drawSmallBranding(context, width, height, ink, unit);

  if (values.showQr) {
    drawQrPanel(
      context,
      width,
      layout.qrY,
      layout.qrSize,
      ink,
      accent,
      unit,
    );
  }

  if (values.showCover) {
    const photoWidth = (layout.story ? 720 : 690) * unit;
    const photoX = (width - photoWidth) / 2;
    drawInvitationPhotoFrame(
      context,
      photoImage,
      photoX,
      layout.photoY,
      photoWidth,
      layout.photoHeight,
      values.photoFrame,
      accent,
      unit,
      values,
    );
  }

  drawInvitationCopy(
    context,
    width,
    height,
    getInvitationCopyStartY(layout, values),
    values,
    ink,
    accent,
    unit,
    "botanical",
  );
}

function drawWatercolorInvitationV2(
  context,
  width,
  height,
  values,
  photoImage,
  backgroundImage,
) {
  const layout = getInvitationLayout(width, height);
  const { unit } = layout;
  const ink = values.primary;
  const accent = values.secondary;

  drawPosterBackground(context, backgroundImage, width, height, "#FBF7F2");
  drawSmallBranding(context, width, height, ink, unit);

  if (values.showQr) {
    drawQrPanel(
      context,
      width,
      layout.qrY,
      layout.qrSize,
      ink,
      accent,
      unit,
    );
  }

  if (values.showCover) {
    const photoWidth = (layout.story ? 720 : 690) * unit;
    const photoX = (width - photoWidth) / 2;
    drawInvitationPhotoFrame(
      context,
      photoImage,
      photoX,
      layout.photoY,
      photoWidth,
      layout.photoHeight,
      values.photoFrame,
      accent,
      unit,
      values,
    );
  }

  drawInvitationCopy(
    context,
    width,
    height,
    getInvitationCopyStartY(layout, values),
    values,
    ink,
    accent,
    unit,
    "watercolor",
  );
}

function drawCelebrationInvitationV2(
  context,
  width,
  height,
  values,
  photoImage,
  backgroundImage,
) {
  const layout = getInvitationLayout(width, height);
  const { unit } = layout;
  const ink = values.primary;
  const accent = values.secondary;

  drawPosterBackground(context, backgroundImage, width, height, "#FFF5E5");
  drawSmallBranding(context, width, height, ink, unit);

  if (values.showQr) {
    drawQrPanel(
      context,
      width,
      layout.qrY,
      layout.qrSize,
      ink,
      accent,
      unit,
    );
  }

  if (values.showCover) {
    const photoWidth = (layout.story ? 720 : 690) * unit;
    const photoX = (width - photoWidth) / 2;
    drawInvitationPhotoFrame(
      context,
      photoImage,
      photoX,
      layout.photoY,
      photoWidth,
      layout.photoHeight,
      values.photoFrame,
      accent,
      unit,
      values,
    );
  }

  drawInvitationCopy(
    context,
    width,
    height,
    getInvitationCopyStartY(layout, values),
    values,
    ink,
    accent,
    unit,
    "joyful",
  );
}

async function renderInvitationCanvas() {
  if (!previewCanvas || !eventData) {
    return previewCanvas;
  }

  const currentVersion = ++renderVersion;
  const values = getFormValues();
  const format = getFormatDefinition();
  const photoUrl = values.showCover ? values.photoSource : "";
  const [photoImage, backgroundImage] = await Promise.all([
    photoUrl ? getImageFromUrl(photoUrl) : Promise.resolve(null),
    values.backgroundSource
      ? getImageFromUrl(values.backgroundSource)
      : Promise.resolve(null),
  ]);

  if (currentVersion !== renderVersion) {
    return previewCanvas;
  }

  previewCanvas.width = format.width;
  previewCanvas.height = format.height;

  const shell = previewCanvas.closest(".invitation-canvas-shell");

  if (shell) {
    shell.style.setProperty(
      "--invitation-ratio",
      String(format.width / format.height),
    );
  }

  if (previewFormat) {
    previewFormat.textContent = t(format.label);
  }

  const context = previewCanvas.getContext("2d", { alpha: false });

  context.clearRect(0, 0, format.width, format.height);

  const renderer = getTemplateDefaults().renderer || "botanical";

  if (renderer === "watercolor") {
    drawWatercolorInvitationV2(
      context,
      format.width,
      format.height,
      values,
      photoImage,
      backgroundImage,
    );
  } else if (renderer === "joyful") {
    drawCelebrationInvitationV2(
      context,
      format.width,
      format.height,
      values,
      photoImage,
      backgroundImage,
    );
  } else {
    drawBotanicalInvitationV2(
      context,
      format.width,
      format.height,
      values,
      photoImage,
      backgroundImage,
    );
  }

  return previewCanvas;
}

function queuePreviewRender() {
  window.cancelAnimationFrame(renderFrame);
  renderFrame = window.requestAnimationFrame(() => {
    renderInvitationCanvas().catch((error) => {
      console.error("Invitation preview error:", error);
      setStatus(t("The invitation preview could not be created."), "error");
    });
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("The invitation file could not be created."));
        }
      },
      type,
      quality,
    );
  });
}

function downloadBlob(blob, fileName) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
}

async function downloadInvitationPng() {
  if (!eventData || actionInProgress) {
    return;
  }

  try {
    setActionInProgress(true);
    setStatus(t("Preparing high-resolution PNG..."));
    const canvas = await renderInvitationCanvas();
    const blob = await canvasToBlob(canvas, "image/png");
    const fileName = `${cleanFileName(getFormValues().name)}.png`;
    downloadBlob(blob, fileName);
    setStatus(t("Your PNG invitation is ready."), "success");
  } catch (error) {
    console.error("Invitation PNG error:", error);
    setStatus(t(error.message || "PNG could not be downloaded."), "error");
  } finally {
    setActionInProgress(false);
  }
}

function createPdfBlob(documentDefinition) {
  return new Promise((resolve, reject) => {
    if (!window.pdfMake?.createPdf) {
      reject(new Error("PDF library is not available."));
      return;
    }

    try {
      window.pdfMake.createPdf(documentDefinition).getBlob(resolve);
    } catch (error) {
      reject(error);
    }
  });
}

async function downloadInvitationPdf() {
  if (!eventData || actionInProgress) {
    return;
  }

  try {
    setActionInProgress(true);
    setStatus(t("Preparing print-ready PDF..."));
    const canvas = await renderInvitationCanvas();
    const imageData = canvas.toDataURL("image/jpeg", 0.95);
    const pageWidth = 420;
    const pageHeight = pageWidth * (canvas.height / canvas.width);
    const blob = await createPdfBlob({
      pageSize: {
        width: pageWidth,
        height: pageHeight,
      },
      pageMargins: 0,
      content: [
        {
          image: imageData,
          width: pageWidth,
          height: pageHeight,
        },
      ],
      info: {
        title: getFormValues().name,
        subject: eventData.event_name || "SnapUp Events Invitation",
        creator: "SnapUp Events",
      },
    });
    const fileName = `${cleanFileName(getFormValues().name)}.pdf`;
    downloadBlob(blob, fileName);
    setStatus(t("Your PDF invitation is ready."), "success");
  } catch (error) {
    console.error("Invitation PDF error:", error);
    setStatus(t(error.message || "PDF could not be downloaded."), "error");
  } finally {
    setActionInProgress(false);
  }
}

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function getInvitationPayload() {
  const values = getFormValues();
  const format = getFormatDefinition();
  const defaults = getTemplateDefaults();

  return {
    invitation_name: values.name,
    template_key: values.template,
    invitation_format: values.format,
    invitation_title: values.title,
    invitation_message: values.message,
    dress_code: values.dressCode || null,
    contact_phone: values.contactPhone || null,
    rsvp_deadline: values.rsvpDeadline || null,
    language_code: window.SnapUpI18n?.language || "tr",
    primary_color: values.primary,
    secondary_color: values.secondary,
    text_color: defaults.text,
    font_key: defaults.font,
    background_image_url:
      values.showCover && !values.hasCustomPhoto && eventData?.event_cover_url
        ? eventData.event_cover_url
        : null,
    show_event_cover: values.showCover,
    show_qr_code: values.showQr,
    design_data: {
      version: "invitation-studio-v8",
      canvas_width: format.width,
      canvas_height: format.height,
      join_path: `?code=${eventData?.event_code || ""}`,
      photo_source: values.hasCustomPhoto ? "local_upload" : "event_cover",
      photo_zoom: Math.round(values.photoZoom * 100),
      photo_x: values.photoX,
      photo_y: values.photoY,
      photo_frame: values.photoFrame,
      category: defaults.category,
      renderer: defaults.renderer,
    },
    invitation_status: "draft",
  };
}

function renderSavedInvitations() {
  if (!savedSelect) {
    return;
  }

  const selectedId = activeInvitationId || "";
  savedSelect.innerHTML = "";

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = t("New invitation");
  savedSelect.appendChild(emptyOption);

  savedInvitations.forEach((invitation) => {
    const option = document.createElement("option");
    option.value = invitation.invitation_id;
    option.textContent =
      invitation.invitation_name || t("Untitled invitation");
    savedSelect.appendChild(option);
  });

  savedSelect.value = selectedId;
  updateDraftActionState();
}

async function loadSavedInvitations() {
  if (!eventId || !token) {
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/events/detail/${eventId}/invitations`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );
    const data = await response.json();

    if (response.status === 401) {
      localStorage.removeItem("snapup_token");
      window.location.href = "login.html";
      return;
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Saved invitations could not be loaded.");
    }

    savedInvitations = Array.isArray(data.invitations)
      ? data.invitations
      : [];
    savedInvitationsLoaded = true;
    renderSavedInvitations();
  } catch (error) {
    console.error("Invitation list error:", error);
    setStatus(
      t(
        "Saved drafts could not be loaded. You can still design and download your invitation.",
      ),
      "error",
    );
  }
}

function applySavedInvitation(invitation) {
  if (!invitation) {
    resetInvitationForm();
    return;
  }

  activeInvitationId = invitation.invitation_id;
  clearCustomPhoto({ render: false });

  const formatInput = form?.querySelector(
    `input[name="invitationFormat"][value="${invitation.invitation_format}"]`,
  );

  if (formatInput) {
    formatInput.checked = true;
  }

  filterTemplateCategory("all");
  selectTemplate(invitation.template_key || "birthday-confetti", {
    applyColors: false,
    applyFrame: false,
  });

  if (invitationName) {
    invitationName.value =
      invitation.invitation_name || getDefaultInvitationName();
  }
  if (invitationTitle) {
    invitationTitle.value =
      invitation.invitation_title || getDefaultInvitationTitle();
  }
  if (invitationMessage) {
    invitationMessage.value =
      invitation.invitation_message || getDefaultInvitationMessage();
  }
  if (invitationDressCode) {
    invitationDressCode.value = invitation.dress_code || "";
  }
  if (invitationContactPhone) {
    invitationContactPhone.value = invitation.contact_phone || "";
  }
  if (invitationRsvpDeadline) {
    invitationRsvpDeadline.value = invitation.rsvp_deadline || "";
  }
  if (invitationPrimaryColor) {
    invitationPrimaryColor.value =
      invitation.primary_color || getTemplateDefaults().primary;
  }
  if (invitationSecondaryColor) {
    invitationSecondaryColor.value =
      invitation.secondary_color || getTemplateDefaults().secondary;
  }
  if (invitationShowCover) {
    invitationShowCover.checked = invitation.show_event_cover !== false;
  }
  if (invitationShowQr) {
    invitationShowQr.checked = invitation.show_qr_code !== false;
  }
  const designData =
    invitation.design_data && typeof invitation.design_data === "object"
      ? invitation.design_data
      : {};
  if (invitationPhotoZoom) {
    invitationPhotoZoom.value = String(designData.photo_zoom || 100);
  }
  if (invitationPhotoX) {
    invitationPhotoX.value = String(designData.photo_x || 0);
  }
  if (invitationPhotoY) {
    invitationPhotoY.value = String(designData.photo_y || 0);
  }
  selectPhotoFrame(
    designData.photo_frame || getTemplateDefaults().frame || "rounded",
  );
  updateDraftActionState();
  updateColorOutputs();
  setStatus(t("Saved draft loaded."), "success");
  queuePreviewRender();
}

async function saveInvitation() {
  if (!eventId || !eventData || !token || actionInProgress) {
    return;
  }

  if (!activeInvitationId && hasReachedInvitationLimit()) {
    setStatus(
      t(
        "You already have 3 saved invitations. Delete one to save a new invitation.",
      ),
      "error",
    );
    updateDraftActionState();
    return;
  }

  try {
    setActionInProgress(true);
    setStatus(t("Saving invitation draft..."));

    const endpoint = activeInvitationId
      ? `${API_URL}/api/events/detail/${eventId}/invitations/${activeInvitationId}`
      : `${API_URL}/api/events/detail/${eventId}/invitations`;
    const response = await fetch(endpoint, {
      method: activeInvitationId ? "PUT" : "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(getInvitationPayload()),
    });
    const data = await response.json();

    if (response.status === 401) {
      localStorage.removeItem("snapup_token");
      window.location.href = "login.html";
      return;
    }

    if (
      response.status === 409 &&
      data.code === "INVITATION_LIMIT_REACHED"
    ) {
      throw new Error(
        t(
          "You already have 3 saved invitations. Delete one to save a new invitation.",
        ),
      );
    }

    if (!response.ok || !data.success || !data.invitation) {
      throw new Error(data.message || "Invitation draft could not be saved.");
    }

    activeInvitationId = data.invitation.invitation_id;
    const existingIndex = savedInvitations.findIndex(
      (item) => item.invitation_id === activeInvitationId,
    );

    if (existingIndex >= 0) {
      savedInvitations[existingIndex] = data.invitation;
    } else {
      savedInvitations.unshift(data.invitation);
    }

    renderSavedInvitations();

    updateDraftActionState();
    setStatus(t("Invitation draft saved."), "success");
  } catch (error) {
    console.error("Invitation save error:", error);
    setStatus(
      t(error.message || "Invitation draft could not be saved."),
      "error",
    );
  } finally {
    setActionInProgress(false);
  }
}

async function deleteInvitation() {
  if (!eventId || !token || !activeInvitationId || actionInProgress) {
    return;
  }

  const invitation = savedInvitations.find(
    (item) => item.invitation_id === activeInvitationId,
  );
  const invitationName =
    invitation?.invitation_name || t("Untitled invitation");
  const confirmed = await showDeleteConfirmation(invitationName);

  if (!confirmed) {
    return;
  }

  const invitationIdToDelete = activeInvitationId;

  try {
    setActionInProgress(true);
    setStatus(t("Deleting invitation draft..."));

    const response = await fetch(
      `${API_URL}/api/events/detail/${eventId}/invitations/${invitationIdToDelete}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      },
    );
    const data = await response.json();

    if (response.status === 401) {
      localStorage.removeItem("snapup_token");
      window.location.href = "login.html";
      return;
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Invitation draft could not be deleted.");
    }

    savedInvitations = savedInvitations.filter(
      (item) => item.invitation_id !== invitationIdToDelete,
    );
    resetInvitationForm();
    renderSavedInvitations();
    setStatus(t("Invitation draft deleted."), "success");
  } catch (error) {
    console.error("Invitation delete error:", error);
    setStatus(
      t(error.message || "Invitation draft could not be deleted."),
      "error",
    );
  } finally {
    setActionInProgress(false);
  }
}

async function openInvitationStudio() {
  if (!eventData || !modal) {
    return;
  }

  returnTarget = document.activeElement;
  modalScrollY = window.scrollY;
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.top = `-${modalScrollY}px`;
  document.body.classList.add("invitation-studio-opened");
  queuePreviewRender();
  syncInvitationLanguageControl();
  syncInvitationThemeControl();
  closeButton?.focus();

  if (!savedInvitationsLoaded) {
    await loadSavedInvitations();
  }

  if (sessionStorage.getItem(LANGUAGE_REOPEN_KEY) === "1") {
    const snapshot = readLanguageSwitchSnapshot();
    clearLanguageSwitchSnapshot();
    restoreLanguageSwitchSnapshot(snapshot);
  }
}

function closeInvitationStudio() {
  if (!modal || actionInProgress || deleteConfirmResolver) {
    return;
  }

  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("invitation-studio-opened");
  document.body.style.removeProperty("top");
  window.scrollTo(0, modalScrollY);

  if (returnTarget instanceof HTMLElement) {
    returnTarget.focus();
  }
}

export function setInvitationStudioEvent(event, eventJoinUrl) {
  eventData = event || null;
  joinUrl = eventJoinUrl || "";

  if (openButton) {
    openButton.disabled = !eventData;
  }

  if (eventData && !activeInvitationId) {
    resetInvitationForm();
  }

  if (
    eventData &&
    sessionStorage.getItem(LANGUAGE_REOPEN_KEY) === "1" &&
    !modal?.classList.contains("active")
  ) {
    window.setTimeout(openInvitationStudio, 0);
  }
}

templateButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectTemplate(
      button.dataset.invitationTemplate || "birthday-confetti",
    );
  });
});

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterTemplateCategory(
      button.dataset.invitationCategoryFilter || "all",
    );
  });
});

form?.addEventListener("input", () => {
  updateColorOutputs();
  updatePhotoControl();
  queuePreviewRender();
});

form?.addEventListener("change", () => {
  updateColorOutputs();
  updatePhotoControl();
  queuePreviewRender();
});

savedSelect?.addEventListener("change", () => {
  const invitation = savedInvitations.find(
    (item) => item.invitation_id === savedSelect.value,
  );
  applySavedInvitation(invitation || null);

  if (!invitation && hasReachedInvitationLimit()) {
    setStatus(
      t(
        "You already have 3 saved invitations. Delete one to create a new invitation.",
      ),
      "error",
    );
  }
});

openButton?.addEventListener("click", openInvitationStudio);
closeButton?.addEventListener("click", closeInvitationStudio);
backdrop?.addEventListener("click", closeInvitationStudio);
newButton?.addEventListener("click", () => {
  if (hasReachedInvitationLimit()) {
    setStatus(
      t(
        "You already have 3 saved invitations. Delete one to create a new invitation.",
      ),
      "error",
    );
    return;
  }

  resetInvitationForm();
});
deleteButton?.addEventListener("click", deleteInvitation);
deleteConfirmBackdrop?.addEventListener("click", () => {
  closeDeleteConfirmation(false);
});
deleteConfirmCancel?.addEventListener("click", () => {
  closeDeleteConfirmation(false);
});
deleteConfirmSubmit?.addEventListener("click", () => {
  closeDeleteConfirmation(true);
});
invitationLanguageSelect?.addEventListener("change", () => {
  const nextLanguage = invitationLanguageSelect.value;
  const currentLanguage = window.SnapUpI18n?.language || "en";

  if (!nextLanguage || nextLanguage === currentLanguage) {
    return;
  }

  saveLanguageSwitchSnapshot();
  window.SnapUpI18n?.setLanguage?.(nextLanguage);
});
invitationThemeToggle?.addEventListener("click", toggleInvitationTheme);
saveButton?.addEventListener("click", saveInvitation);
downloadPngButton?.addEventListener("click", downloadInvitationPng);
downloadPdfButton?.addEventListener("click", downloadInvitationPdf);
invitationPhotoButton?.addEventListener("click", () => {
  invitationPhotoInput?.click();
});
invitationPhotoRemove?.addEventListener("click", () => {
  clearCustomPhoto();
  setStatus(t("Custom photo removed. Event cover will be used."), "success");
});
invitationPhotoInput?.addEventListener("change", () => {
  selectCustomPhoto(invitationPhotoInput.files?.[0]);
});

window.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    deleteConfirm?.classList.contains("active")
  ) {
    event.preventDefault();
    closeDeleteConfirmation(false);
    return;
  }

  if (
    event.key === "Escape" &&
    modal?.classList.contains("active") &&
    !actionInProgress
  ) {
    closeInvitationStudio();
  }
});

window.addEventListener("pagehide", () => {
  if (customPhotoUrl) {
    URL.revokeObjectURL(customPhotoUrl);
  }
});

new MutationObserver(syncInvitationThemeControl).observe(
  document.documentElement,
  {
    attributes: true,
    attributeFilter: ["data-theme"],
  },
);

syncInvitationLanguageControl();
syncInvitationThemeControl();
