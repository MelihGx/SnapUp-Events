import { API_URL } from "./config.js?v=runtime-api-2";

const token = localStorage.getItem("snapup_token");
const eventId = new URLSearchParams(window.location.search).get("event_id");
const API_BASE_URL = API_URL;
const POLL_INTERVAL_MS = 4000;
const MIN_SECONDS = 3;
const MAX_SECONDS = 300;
const THEME_STORAGE_KEY = "snapup_theme";
const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

const DEFAULT_SETTINGS = {
  slideshow_mode: "latest",
  latest_min_seconds: 10,
  random_interval_seconds: 10,
  selected_media_id: null,
  slideshow_updated_at: null,
};

const elements = {
  body: document.body,
  stage: document.getElementById("slideshowStage"),
  loading: document.getElementById("slideshowLoading"),
  empty: document.getElementById("slideshowEmpty"),
  emptyTitle: document.getElementById("slideshowEmptyTitle"),
  emptyText: document.getElementById("slideshowEmptyText"),
  canvas: document.getElementById("slideCanvas"),
  backdrop: document.getElementById("slideBackdrop"),
  imageLayers: [
    document.getElementById("slideImageA"),
    document.getElementById("slideImageB"),
  ],
  eventName: document.getElementById("slideshowEventName"),
  eventCode: document.getElementById("slideshowEventCode"),
  syncStatus: document.getElementById("slideshowSyncStatus"),
  themeButton: document.getElementById("slideshowThemeButton"),
  themeColor: document.getElementById("slideshowThemeColor"),
  controls: document.getElementById("slideshowControls"),
  controlsClose: document.getElementById("slideshowControlsClose"),
  settingsForm: document.getElementById("slideshowSettingsForm"),
  latestSeconds: document.getElementById("latestMinSeconds"),
  randomSeconds: document.getElementById("randomIntervalSeconds"),
  photoGrid: document.getElementById("slideshowPhotoGrid"),
  photoCount: document.getElementById("slideshowPhotoCount"),
  selectedStatus: document.getElementById("slideshowSelectedStatus"),
  formStatus: document.getElementById("slideshowFormStatus"),
  saveButton: document.getElementById("slideshowSaveButton"),
  startButton: document.getElementById("slideshowStartButton"),
  slideMeta: document.getElementById("slideMeta"),
  slideGuestLabel: document.getElementById("slideGuestLabel"),
  slideGuestName: document.getElementById("slideGuestName"),
  slideMessage: document.getElementById("slideMessage"),
  slideCreatedAt: document.getElementById("slideCreatedAt"),
  modeLabel: document.getElementById("slideModeLabel"),
  toast: document.getElementById("slideshowToast"),
};

let currentEvent = null;
let currentSettings = { ...DEFAULT_SETTINGS };
let approvedPhotos = [];
let knownPhotoIds = new Set();
let latestQueue = [];
let currentPhotoId = null;
let currentShownAt = 0;
let selectedMediaIdDraft = null;
let activeLayerIndex = 0;
let imageLoadSequence = 0;
let imageLoading = false;
let formDirty = false;
let initialLoadComplete = false;
let pollInFlight = false;
let pollTimer = null;
let modeTimer = null;
let latestQueueTimer = null;
let toastTimer = null;

function t(value, replacements = {}) {
  const translated = window.SnapUpI18n?.t?.(value) || value;

  return Object.entries(replacements).reduce(
    (result, [key, replacement]) =>
      result.replaceAll(`{${key}}`, String(replacement)),
    translated,
  );
}

function storedTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === "light" || savedTheme === "dark" ? savedTheme : null;
  } catch (_error) {
    return null;
  }
}

function preferredTheme() {
  return storedTheme() || (colorSchemeQuery.matches ? "dark" : "light");
}

function applyTheme(theme, { persist = false } = {}) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  const isDark = nextTheme === "dark";
  const actionLabel = t(isDark ? "Switch to light mode" : "Switch to dark mode");
  const modeLabel = t(isDark ? "Light mode" : "Dark mode");

  document.documentElement.dataset.theme = nextTheme;
  elements.themeButton?.setAttribute("aria-pressed", String(isDark));
  elements.themeButton?.setAttribute("aria-label", actionLabel);
  if (elements.themeButton) {
    elements.themeButton.title = modeLabel;
  }
  if (elements.themeColor) {
    elements.themeColor.content = isDark ? "#17122b" : "#f7f3ff";
  }

  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (_error) {
      // The visual theme still works when storage is unavailable.
    }
  }
}

function toggleTheme() {
  const nextTheme =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme, { persist: true });
}

function getLocale() {
  const language = window.SnapUpI18n?.language || "en";
  return (
    window.SnapUpAdditionalLanguages?.[language]?.locale ||
    {
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
    }[language] ||
    "en-US"
  );
}

function clampSeconds(value, fallbackValue) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return fallbackValue;
  }

  return Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, parsed));
}

function settingsSignature(settings) {
  return [
    settings.slideshow_mode,
    settings.latest_min_seconds,
    settings.random_interval_seconds,
    settings.selected_media_id || "",
    settings.slideshow_updated_at || "",
  ].join("|");
}

function mediaSignature(media) {
  return media.map((photo) => photo.media_id).join("|");
}

function sortPhotos(media) {
  return [...media].sort((first, second) => {
    const dateDifference =
      new Date(first.media_created_at).getTime() -
      new Date(second.media_created_at).getTime();

    return dateDifference || String(first.media_id).localeCompare(String(second.media_id));
  });
}

function getModeLabel(mode = currentSettings.slideshow_mode) {
  return {
    latest: t("Newest photo"),
    random: t("Random photos"),
    selected: t("Selected photo"),
  }[mode] || t("Newest photo");
}

function showToast(message, type = "success") {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.toggle("is-error", type === "error");
  elements.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 3600);
}

function setFormStatus(message = "", type = "error") {
  elements.formStatus.textContent = message;
  elements.formStatus.classList.toggle("is-success", type === "success");
}

function redirectToLogin() {
  const returnPath = `live-slideshow.html?event_id=${encodeURIComponent(eventId || "")}`;
  sessionStorage.setItem("snapup_after_login", returnPath);
  window.location.href = "login.html";
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    redirectToLogin();
    throw new Error(t("Your session has expired. Please log in again."));
  }

  if (!response.ok || data.success === false) {
    const error = new Error(
      data.message || t("Live slideshow could not be loaded."),
    );
    error.code = data.code || "";
    error.status = response.status;
    throw error;
  }

  return data;
}

function setControls(open) {
  elements.body.classList.toggle("controls-open", open);
  elements.body.classList.toggle("presentation-mode", !open);

  if (open) {
    elements.controls.scrollTop = 0;
  }
}

function updateModeSettingsVisibility(mode) {
  document.querySelectorAll("[data-mode-settings]").forEach((section) => {
    section.hidden = section.dataset.modeSettings !== mode;
  });
}

function populateSettingsForm() {
  const modeInput = elements.settingsForm.querySelector(
    `input[name="slideshowMode"][value="${currentSettings.slideshow_mode}"]`,
  );

  if (modeInput) {
    modeInput.checked = true;
  }

  elements.latestSeconds.value = currentSettings.latest_min_seconds;
  elements.randomSeconds.value = currentSettings.random_interval_seconds;
  selectedMediaIdDraft = currentSettings.selected_media_id || null;
  updateModeSettingsVisibility(currentSettings.slideshow_mode);
  updateSelectedPhotoUi();
}

function updateSelectedPhotoUi() {
  elements.photoGrid
    .querySelectorAll(".slideshow-photo-option")
    .forEach((button) => {
      const isSelected = button.dataset.mediaId === selectedMediaIdDraft;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });

  elements.selectedStatus.textContent = selectedMediaIdDraft
    ? t("Photo selected")
    : t("No photo selected");
}

function renderPhotoGrid(force = false) {
  const nextSignature = mediaSignature(approvedPhotos);
  const previousSignature = elements.photoGrid.dataset.mediaSignature || "";

  if (!force && nextSignature === previousSignature) {
    const photoById = new Map(
      approvedPhotos.map((photo) => [photo.media_id, photo]),
    );
    elements.photoGrid
      .querySelectorAll(".slideshow-photo-option")
      .forEach((button) => {
        const photo = photoById.get(button.dataset.mediaId);
        const image = button.querySelector("img");
        if (photo && image && image.src !== photo.media_url) {
          image.src = photo.media_url;
        }
      });
    updateSelectedPhotoUi();
    return;
  }

  const previousScrollTop = elements.photoGrid.scrollTop;
  elements.photoGrid.replaceChildren();
  elements.photoGrid.dataset.mediaSignature = nextSignature;

  if (approvedPhotos.length === 0) {
    const emptyText = document.createElement("p");
    emptyText.className = "slideshow-photo-grid-empty";
    emptyText.textContent = t(
      "Approved photos will appear here when they are ready.",
    );
    elements.photoGrid.appendChild(emptyText);
  } else {
    approvedPhotos
      .slice()
      .reverse()
      .forEach((photo, index) => {
        const button = document.createElement("button");
        const image = document.createElement("img");

        button.type = "button";
        button.className = "slideshow-photo-option";
        button.dataset.mediaId = photo.media_id;
        button.setAttribute("aria-pressed", "false");
        button.setAttribute(
          "aria-label",
          t("Select approved photo {number}", { number: index + 1 }),
        );

        image.src = photo.media_url;
        image.alt = photo.guest_name
          ? t("Photo uploaded by {name}", { name: photo.guest_name })
          : t("Approved event photo");
        image.loading = "lazy";
        image.decoding = "async";
        button.appendChild(image);

        button.addEventListener("click", () => {
          selectedMediaIdDraft = photo.media_id;
          const selectedMode = elements.settingsForm.querySelector(
            'input[name="slideshowMode"][value="selected"]',
          );
          selectedMode.checked = true;
          updateModeSettingsVisibility("selected");
          updateSelectedPhotoUi();
          formDirty = true;
          setFormStatus();
        });

        elements.photoGrid.appendChild(button);
      });
  }

  elements.photoCount.textContent = t("{count} approved photos", {
    count: approvedPhotos.length,
  });
  elements.photoGrid.scrollTop = previousScrollTop;
  updateSelectedPhotoUi();
}

function clearPlaybackTimers() {
  window.clearTimeout(modeTimer);
  window.clearTimeout(latestQueueTimer);
  modeTimer = null;
  latestQueueTimer = null;
}

function showEmptyState(title, text) {
  imageLoadSequence += 1;
  imageLoading = false;
  elements.loading.hidden = true;
  elements.canvas.hidden = true;
  elements.slideMeta.hidden = true;
  elements.emptyTitle.textContent = title;
  elements.emptyText.textContent = text;
  elements.empty.hidden = false;
  elements.backdrop.classList.remove("has-image");
  elements.backdrop.style.removeProperty("background-image");
  currentPhotoId = null;
  currentShownAt = 0;
}

function updatePhotoMeta(photo) {
  elements.slideMeta.hidden = false;
  elements.slideGuestLabel.textContent = t("Uploaded by");
  elements.slideGuestName.textContent = photo.guest_name || t("Guest");

  if (photo.message) {
    elements.slideMessage.textContent = photo.message;
    elements.slideMessage.hidden = false;
  } else {
    elements.slideMessage.textContent = "";
    elements.slideMessage.hidden = true;
  }

  const createdAt = new Date(photo.media_created_at);
  elements.slideCreatedAt.textContent = Number.isNaN(createdAt.getTime())
    ? ""
    : new Intl.DateTimeFormat(getLocale(), {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(createdAt);
}

function showPhoto(photo, { force = false } = {}) {
  if (!photo?.media_url) {
    return;
  }

  if (!force && currentPhotoId === photo.media_id) {
    updatePhotoMeta(photo);
    if (currentSettings.slideshow_mode === "random" && !modeTimer) {
      scheduleRandomPhoto();
    }
    return;
  }

  const loadSequence = ++imageLoadSequence;
  const preloader = new Image();
  imageLoading = true;

  preloader.onload = () => {
    if (loadSequence !== imageLoadSequence) {
      return;
    }

    imageLoading = false;

    const nextLayerIndex = activeLayerIndex === 0 ? 1 : 0;
    const nextLayer = elements.imageLayers[nextLayerIndex];
    const previousLayer = elements.imageLayers[activeLayerIndex];

    nextLayer.src = photo.media_url;
    nextLayer.alt = photo.guest_name
      ? t("Photo uploaded by {name}", { name: photo.guest_name })
      : t("Approved event photo");
    nextLayer.classList.add("is-visible");
    previousLayer.classList.remove("is-visible");
    activeLayerIndex = nextLayerIndex;

    elements.loading.hidden = true;
    elements.empty.hidden = true;
    elements.canvas.hidden = false;
    elements.backdrop.style.backgroundImage = `url("${photo.media_url.replaceAll('"', "%22")}")`;
    elements.backdrop.classList.add("has-image");
    updatePhotoMeta(photo);

    currentPhotoId = photo.media_id;
    currentShownAt = Date.now();

    if (currentSettings.slideshow_mode === "latest" && latestQueue.length > 0) {
      window.clearTimeout(latestQueueTimer);
      latestQueueTimer = window.setTimeout(
        drainLatestQueue,
        currentSettings.latest_min_seconds * 1000 + 30,
      );
    }

    if (currentSettings.slideshow_mode === "random") {
      scheduleRandomPhoto();
    }
  };

  preloader.onerror = () => {
    if (loadSequence !== imageLoadSequence) {
      return;
    }
    imageLoading = false;
    showToast(t("This photo could not be displayed."), "error");

    if (!currentPhotoId) {
      showEmptyState(
        t("This photo could not be displayed."),
        t("Please try again later."),
      );
    } else {
      elements.loading.hidden = true;
    }

    if (currentSettings.slideshow_mode === "latest") {
      latestQueueTimer = window.setTimeout(drainLatestQueue, 250);
    } else if (currentSettings.slideshow_mode === "random") {
      scheduleRandomPhoto();
    }
  };

  preloader.src = photo.media_url;
}

function randomPhoto() {
  if (approvedPhotos.length <= 1) {
    return approvedPhotos[0] || null;
  }

  const candidates = approvedPhotos.filter(
    (photo) => photo.media_id !== currentPhotoId,
  );
  return candidates[Math.floor(Math.random() * candidates.length)] || null;
}

function scheduleRandomPhoto() {
  window.clearTimeout(modeTimer);

  if (currentSettings.slideshow_mode !== "random") {
    return;
  }

  const interval = currentSettings.random_interval_seconds * 1000;
  modeTimer = window.setTimeout(() => {
    modeTimer = null;
    const nextPhoto = randomPhoto();
    if (nextPhoto) {
      showPhoto(nextPhoto);
    } else {
      scheduleRandomPhoto();
    }
  }, interval);
}

function drainLatestQueue() {
  window.clearTimeout(latestQueueTimer);
  latestQueueTimer = null;

  if (
    currentSettings.slideshow_mode !== "latest" ||
    latestQueue.length === 0
  ) {
    return;
  }

  if (imageLoading) {
    latestQueueTimer = window.setTimeout(drainLatestQueue, 250);
    return;
  }

  const minimumDuration = currentSettings.latest_min_seconds * 1000;
  const elapsed = currentShownAt ? Date.now() - currentShownAt : minimumDuration;
  const remaining = Math.max(0, minimumDuration - elapsed);

  if (remaining > 0) {
    latestQueueTimer = window.setTimeout(drainLatestQueue, remaining + 30);
    return;
  }

  const nextPhoto = latestQueue.shift();
  showPhoto(nextPhoto, { force: true });
}

function applyMode({ force = false } = {}) {
  clearPlaybackTimers();
  elements.modeLabel.textContent = getModeLabel();

  if (approvedPhotos.length === 0) {
    showEmptyState(
      t("Waiting for approved photos"),
      t("New approved photos will appear here automatically."),
    );
    return;
  }

  if (currentSettings.slideshow_mode === "latest") {
    latestQueue = [];
    showPhoto(approvedPhotos.at(-1), { force });
    return;
  }

  if (currentSettings.slideshow_mode === "random") {
    showPhoto(randomPhoto(), { force });
    return;
  }

  const selectedPhoto = approvedPhotos.find(
    (photo) => photo.media_id === currentSettings.selected_media_id,
  );

  if (!selectedPhoto) {
    showEmptyState(
      t("Selected photo is unavailable"),
      t("Open the controls and choose an approved photo."),
    );
    return;
  }

  showPhoto(selectedPhoto, { force });
}

function updateHeader() {
  if (!currentEvent) {
    return;
  }

  elements.eventName.textContent = currentEvent.event_name || "SnapUp Events";
  elements.eventCode.textContent = `${t("EVENT CODE")} · ${currentEvent.event_code || "------"}`;
  document.title = `${currentEvent.event_name || "Live Slideshow"} — ${t("Live Slideshow")}`;
}

function handleSnapshot(data, { initial = false } = {}) {
  const previousSettingsSignature = settingsSignature(currentSettings);
  const previousMediaSignature = mediaSignature(approvedPhotos);
  const nextSettings = { ...DEFAULT_SETTINGS, ...(data.slideshow || {}) };
  const nextPhotos = sortPhotos(Array.isArray(data.media) ? data.media : []);
  const newPhotos = nextPhotos.filter(
    (photo) => !knownPhotoIds.has(photo.media_id),
  );
  const nextPhotoIds = new Set(nextPhotos.map((photo) => photo.media_id));
  const currentPhotoWasRemoved =
    Boolean(currentPhotoId) && !nextPhotoIds.has(currentPhotoId);

  currentEvent = data.event || currentEvent;
  currentSettings = nextSettings;
  approvedPhotos = nextPhotos;
  nextPhotos.forEach((photo) => knownPhotoIds.add(photo.media_id));

  updateHeader();
  renderPhotoGrid(initial || previousMediaSignature !== mediaSignature(nextPhotos));

  const settingsChanged =
    previousSettingsSignature !== settingsSignature(nextSettings);

  if (initial || (settingsChanged && !formDirty)) {
    populateSettingsForm();
  }

  if (initial || settingsChanged || currentPhotoWasRemoved) {
    applyMode({ force: true });
  } else if (currentSettings.slideshow_mode === "latest" && newPhotos.length > 0) {
    latestQueue.push(
      ...newPhotos.filter(
        (photo) => !latestQueue.some((queued) => queued.media_id === photo.media_id),
      ),
    );
    drainLatestQueue();
  }

  elements.syncStatus.textContent = t("Updated now");
  initialLoadComplete = true;
}

async function loadSnapshot({ initial = false } = {}) {
  if (pollInFlight) {
    return;
  }

  pollInFlight = true;

  try {
    const data = await apiRequest(
      `/api/events/detail/${encodeURIComponent(eventId)}/slideshow`,
    );
    handleSnapshot(data, { initial });
  } catch (error) {
    elements.syncStatus.textContent = t("Connection lost");

    if (!initialLoadComplete) {
      elements.loading.hidden = true;
      showEmptyState(
        t("Live slideshow could not be loaded"),
        error.message || t("Please try again later."),
      );
      setFormStatus(error.message || t("Live slideshow could not be loaded."));
    }
  } finally {
    pollInFlight = false;
  }
}

async function saveSettings(event) {
  event.preventDefault();
  setFormStatus();

  const mode = elements.settingsForm.querySelector(
    'input[name="slideshowMode"]:checked',
  )?.value;

  if (mode === "selected" && !selectedMediaIdDraft) {
    setFormStatus(t("Choose an approved photo before saving."));
    elements.photoGrid.focus?.();
    return;
  }

  const payload = {
    slideshow_mode: mode || "latest",
    latest_min_seconds: clampSeconds(
      elements.latestSeconds.value,
      currentSettings.latest_min_seconds,
    ),
    random_interval_seconds: clampSeconds(
      elements.randomSeconds.value,
      currentSettings.random_interval_seconds,
    ),
    selected_media_id: selectedMediaIdDraft || null,
  };

  elements.saveButton.disabled = true;
  elements.saveButton.textContent = t("Saving...");

  try {
    const data = await apiRequest(
      `/api/events/detail/${encodeURIComponent(eventId)}/slideshow`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );

    currentSettings = { ...DEFAULT_SETTINGS, ...(data.slideshow || payload) };
    formDirty = false;
    populateSettingsForm();
    applyMode({ force: true });
    setFormStatus(t("Slideshow settings saved."), "success");
    showToast(t("Slideshow settings saved."));
  } catch (error) {
    setFormStatus(error.message || t("Settings could not be saved."));
    showToast(error.message || t("Settings could not be saved."), "error");
  } finally {
    elements.saveButton.disabled = false;
    elements.saveButton.textContent = t("Save and Apply");
  }
}

async function startPresentation() {
  setControls(false);

  if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
    try {
      await document.documentElement.requestFullscreen();
    } catch (_error) {
      showToast(t("Press F11 to enter browser full screen."));
    }
  }
}

function bindEvents() {
  elements.themeButton?.addEventListener("click", toggleTheme);
  elements.controlsClose.addEventListener("click", () => setControls(false));
  elements.startButton.addEventListener("click", startPresentation);
  elements.settingsForm.addEventListener("submit", saveSettings);

  elements.settingsForm
    .querySelectorAll('input[name="slideshowMode"]')
    .forEach((input) => {
      input.addEventListener("change", () => {
        updateModeSettingsVisibility(input.value);
        formDirty = true;
        setFormStatus();
      });
    });

  [elements.latestSeconds, elements.randomSeconds].forEach((input) => {
    input.addEventListener("input", () => {
      formDirty = true;
      setFormStatus();
    });
    input.addEventListener("change", () => {
      input.value = clampSeconds(input.value, 10);
    });
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement;

    if (event.key === "F11") {
      setControls(false);
      return;
    }

    if (event.key === "Escape") {
      setControls(true);
      return;
    }

    if (!isTyping && event.key.toLowerCase() === "h") {
      event.preventDefault();
      setControls(!elements.body.classList.contains("controls-open"));
    }
  });

  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
      setControls(true);
    }
  });

  colorSchemeQuery.addEventListener?.("change", (event) => {
    if (!storedTheme()) {
      applyTheme(event.matches ? "dark" : "light");
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key === THEME_STORAGE_KEY) {
      applyTheme(preferredTheme());
    }
  });
}

async function init() {
  applyTheme(preferredTheme());

  if (!token) {
    redirectToLogin();
    return;
  }

  if (!eventId) {
    elements.loading.hidden = true;
    showEmptyState(
      t("Event ID was not found"),
      t("Return to Event Detail and open the live slideshow again."),
    );
    return;
  }

  bindEvents();
  await loadSnapshot({ initial: true });
  pollTimer = window.setInterval(() => loadSnapshot(), POLL_INTERVAL_MS);
}

window.addEventListener("beforeunload", () => {
  window.clearInterval(pollTimer);
  clearPlaybackTimers();
});

init();
