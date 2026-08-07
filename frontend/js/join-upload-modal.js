import { API_URL } from "./config.js?v=runtime-api-2";
import { buildEventMapUrl } from "./location-map-picker.js?v=location-map-2";

const API_BASE_URL = API_URL;
const MAX_MEDIA_FILES = 15;
const MAX_MEDIA_FILE_BYTES = 50 * 1024 * 1024;
const MAX_MEDIA_TOTAL_BYTES = 200 * 1024 * 1024;
const IMAGE_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO_MEDIA_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

let selectedMediaType = "message";
let selectedEvent = null;
let selectedFiles = [];
let selectedFilePreviewUrls = [];
let successPopupHideTimer = null;

const successButtonLabels = {
  en: "Continue",
  tr: "Devam Et",
  ar: "متابعة",
  de: "Weiter",
  fr: "Continuer",
  es: "Continuar",
  it: "Continua",
  nl: "Doorgaan",
  bg: "Продължи",
  ro: "Continuă",
  el: "Συνέχεια",
  sr: "Nastavi",
  hr: "Nastavi",
  bs: "Nastavi",
  sq: "Vazhdo",
  mk: "Продолжи",
};

const messageSuccessTitleLabels = {
  en: "Sent!",
  tr: "Gönderildi!",
  ar: "تم الإرسال!",
  de: "Gesendet!",
  fr: "Envoyé !",
  es: "¡Enviado!",
  it: "Inviato!",
  nl: "Verzonden!",
  bg: "Изпратено!",
  ro: "Trimis!",
  el: "Στάλθηκε!",
  sr: "Poslato!",
  hr: "Poslano!",
  bs: "Poslano!",
  sq: "U dërgua!",
  mk: "Испратено!",
};

function translate(message) {
  return window.SnapUpI18n?.t?.(message) || message;
}

function isSuccessPopupOpen() {
  return document
    .getElementById("joinUploadSuccess")
    ?.classList.contains("active");
}

function openUploadSuccessPopup(mediaType, uploadedCount = 1) {
  const popup = document.getElementById("joinUploadSuccess");
  const title = document.getElementById("joinUploadSuccessTitle");
  const message = document.getElementById("joinUploadSuccessMessage");
  const button = document.getElementById("joinUploadSuccessButton");
  const uploadPanel = document.querySelector(".join-upload-panel");

  if (!popup || !title || !message || !button) return;

  window.clearTimeout(successPopupHideTimer);

  const language = window.SnapUpI18n?.language || "en";
  const safeCount = Number(uploadedCount) || 1;
  const isMessage = mediaType === "message";

  title.textContent = isMessage
    ? messageSuccessTitleLabels[language] || messageSuccessTitleLabels.en
    : translate("Uploaded!");
  message.textContent = isMessage
    ? translate("Message sent successfully!")
    : translate(`${safeCount} file(s) uploaded successfully!`);
  button.textContent =
    successButtonLabels[language] || successButtonLabels.en;

  popup.hidden = false;
  popup.setAttribute("aria-hidden", "false");
  document.body.classList.add("join-upload-success-open");
  uploadPanel?.setAttribute("inert", "");

  requestAnimationFrame(() => {
    popup.classList.add("active");
    button.focus();
  });
}

function closeUploadSuccessPopup() {
  const popup = document.getElementById("joinUploadSuccess");
  const uploadPanel = document.querySelector(".join-upload-panel");

  if (!popup) return;

  if (popup.contains(document.activeElement)) {
    document.activeElement.blur?.();
  }

  popup.classList.remove("active");
  popup.setAttribute("aria-hidden", "true");
  document.body.classList.remove("join-upload-success-open");
  uploadPanel?.removeAttribute("inert");

  window.clearTimeout(successPopupHideTimer);
  successPopupHideTimer = window.setTimeout(() => {
    popup.hidden = true;
  }, 220);
}

function formatDate(value) {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}.${month}.${year}`;
  }

  return new Date(value).toLocaleDateString("tr-TR");
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";

  const mb = bytes / (1024 * 1024);

  if (mb >= 1) {
    return `${mb.toFixed(1)} MB`;
  }

  return `${(bytes / 1024).toFixed(0)} KB`;
}

function setResult(message, type = "info") {
  const result = document.getElementById("joinUploadResult");
  if (!result) return;

  result.textContent = message;
  result.className = `join-upload-result ${type}`;
}

function setLoading(isLoading) {
  const button = document.getElementById("joinSubmitButton");
  if (!button) return;

  button.disabled = isLoading;
  button.classList.toggle("is-loading", isLoading);
  button.setAttribute("aria-busy", String(isLoading));
  button.textContent = translate(
    isLoading ? "Sending..." : "Send to Event",
  );
}

function openModal() {
  const modal = document.getElementById("joinUploadModal");
  if (!modal) return;

  closeUploadSuccessPopup();
  selectedEvent = null;
  renderEventPreview(null);
  setResult("");

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("join-upload-open");

  setTimeout(() => {
    document.getElementById("joinEventCode")?.focus();
  }, 80);
}

function closeModal() {
  const modal = document.getElementById("joinUploadModal");
  if (!modal) return;

  closeUploadSuccessPopup();
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("join-upload-open");
}

function finishUploadSuccessFlow() {
  closeUploadSuccessPopup();
  closeModal();
}

function getEventGalleryUrl(event) {
  if (!event?.event_code) {
    return "#";
  }

  const galleryUrl = new URL("event-gallery.html", window.location.href);
  galleryUrl.searchParams.set("code", event.event_code);

  return galleryUrl.toString();
}

function getEventLocationParts(event) {
  return {
    venue: String(event?.event_location || "").trim(),
    address: String(event?.event_address || "").trim(),
  };
}

function getEventMapUrl(event) {
  return buildEventMapUrl(event);
}

function ensureGalleryButton(preview) {
  let button = document.getElementById("joinEventGalleryLink");

  if (!button) {
    button = document.createElement("a");
    button.id = "joinEventGalleryLink";
    button.className = "join-event-gallery-link";
    button.textContent = "View Gallery";
    button.setAttribute("aria-label", "View approved event gallery");
    preview.appendChild(button);
  }

  return button;
}

function clearSelectedFiles() {
  selectedFiles = [];
  selectedFilePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
  selectedFilePreviewUrls = [];

  const fileInput = document.getElementById("joinMediaFile");
  const filePreview = document.getElementById("joinFilePreview");

  if (fileInput) {
    fileInput.value = "";
  }

  if (filePreview) {
    filePreview.hidden = true;
    filePreview.innerHTML = "";
  }
}

function isSameFile(fileA, fileB) {
  return (
    fileA.name === fileB.name &&
    fileA.size === fileB.size &&
    fileA.lastModified === fileB.lastModified
  );
}

function addFilesToSelection(files) {
  const incomingFiles = Array.from(files || []);
  const allowedTypes = selectedMediaType === "video"
    ? VIDEO_MEDIA_TYPES
    : IMAGE_MEDIA_TYPES;

  incomingFiles.forEach((file) => {
    if (!allowedTypes.has(file.type)) {
      throw new Error(
        selectedMediaType === "video"
          ? "Only MP4, WEBM and MOV videos are allowed."
          : "Only JPG, PNG and WEBP images are allowed.",
      );
    }

    if (file.size > MAX_MEDIA_FILE_BYTES) {
      throw new Error("Each file must be 50 MB or smaller.");
    }
  });

  const uniqueIncomingFiles = incomingFiles.filter(
    (file) => !selectedFiles.some((item) => isSameFile(item, file)),
  );

  if (selectedFiles.length + uniqueIncomingFiles.length > MAX_MEDIA_FILES) {
    throw new Error("You can select up to 15 files at once.");
  }

  const totalBytes = [...selectedFiles, ...uniqueIncomingFiles].reduce(
    (sum, file) => sum + file.size,
    0,
  );

  if (totalBytes > MAX_MEDIA_TOTAL_BYTES) {
    throw new Error("Selected files must be 200 MB or smaller in total.");
  }

  selectedFiles.push(...uniqueIncomingFiles);
}

function removeSelectedFile(index) {
  selectedFiles.splice(index, 1);
  renderFilePreview();
}

function createFileThumbnail(file) {
  const thumb = document.createElement("div");
  thumb.className = "join-selected-file-thumb";

  if (file.type.startsWith("image/")) {
    const image = document.createElement("img");
    const objectUrl = URL.createObjectURL(file);
    selectedFilePreviewUrls.push(objectUrl);
    image.src = objectUrl;
    image.alt = file.name;
    thumb.appendChild(image);
    return thumb;
  }

  if (file.type.startsWith("video/")) {
    const videoBadge = document.createElement("span");
    videoBadge.textContent = "▶";
    thumb.classList.add("video-thumb");
    thumb.appendChild(videoBadge);
    return thumb;
  }

  const fileBadge = document.createElement("span");
  fileBadge.textContent = "FILE";
  thumb.appendChild(fileBadge);

  return thumb;
}

function renderFilePreview() {
  const filePreview = document.getElementById("joinFilePreview");

  if (!filePreview) return;

  selectedFilePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
  selectedFilePreviewUrls = [];
  filePreview.innerHTML = "";

  if (selectedFiles.length === 0) {
    filePreview.hidden = true;
    return;
  }

  const previewHeader = document.createElement("div");
  previewHeader.className = "join-selected-header";

  const titleBox = document.createElement("div");

  const title = document.createElement("strong");
  title.textContent = "Selected files";

  const subtitle = document.createElement("span");
  subtitle.textContent =
    selectedFiles.length === 1
      ? "1 file is ready to upload."
      : `${selectedFiles.length} files are ready to upload.`;

  titleBox.appendChild(title);
  titleBox.appendChild(subtitle);

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "join-clear-files-button";
  clearButton.textContent = "Clear all";
  clearButton.addEventListener("click", clearSelectedFiles);

  previewHeader.appendChild(titleBox);
  previewHeader.appendChild(clearButton);

  const fileList = document.createElement("div");
  fileList.className = "join-selected-file-list";

  selectedFiles.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "join-selected-file-card";

    const thumb = createFileThumbnail(file);

    const info = document.createElement("div");
    info.className = "join-selected-file-info";

    const name = document.createElement("strong");
    name.textContent = file.name;

    const meta = document.createElement("span");
    meta.textContent = `${formatFileSize(file.size)} · ${file.type || "file"}`;

    info.appendChild(name);
    info.appendChild(meta);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "join-remove-file-button";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      removeSelectedFile(index);
    });

    item.appendChild(thumb);
    item.appendChild(info);
    item.appendChild(removeButton);

    fileList.appendChild(item);
  });

  const helper = document.createElement("p");
  helper.className = "join-file-helper-text";
  helper.textContent =
    "Up to 15 files · 50 MB each · 200 MB total. You can reopen the file picker to add more.";

  filePreview.appendChild(previewHeader);
  filePreview.appendChild(fileList);
  filePreview.appendChild(helper);
  filePreview.hidden = false;
}

function updateMediaFields() {
  const messageField = document.getElementById("joinMessageField");
  const fileField = document.getElementById("joinFileField");
  const fileInput = document.getElementById("joinMediaFile");
  const messageText = document.getElementById("joinMessageText");

  if (!messageField || !fileField || !fileInput || !messageText) return;

  messageField.hidden = false;
  clearSelectedFiles();

  if (selectedMediaType === "message") {
    fileField.hidden = true;

    fileInput.multiple = false;
    fileInput.removeAttribute("multiple");
    fileInput.removeAttribute("accept");

    messageText.placeholder = "Write your memory or wish...";
    return;
  }

  fileField.hidden = false;

  fileInput.multiple = true;
  fileInput.setAttribute("multiple", "multiple");

  messageText.placeholder = "Add a caption for this media...";

  if (selectedMediaType === "image") {
    fileInput.accept = "image/jpeg,image/png,image/webp";
  }

  if (selectedMediaType === "video") {
    fileInput.accept = "video/mp4,video/webm,video/quicktime";
  }
}

function renderEventPreview(event) {
  const preview = document.getElementById("joinEventPreview");
  const name = document.getElementById("joinEventName");
  const meta = document.getElementById("joinEventMeta");
  const addressElement = document.getElementById("joinEventAddress");
  const mapLink = document.getElementById("joinEventMapLink");
  const cover = document.getElementById("joinEventCover");
  const coverImage = document.getElementById("joinEventCoverImage");
  const coverPlaceholder = document.getElementById(
    "joinEventCoverPlaceholder",
  );

  if (
    !preview ||
    !name ||
    !meta ||
    !addressElement ||
    !mapLink ||
    !cover ||
    !coverImage ||
    !coverPlaceholder
  ) {
    return;
  }

  const galleryButton = ensureGalleryButton(preview);

  if (!event) {
    preview.hidden = true;
    name.textContent = "";
    meta.textContent = "";
    addressElement.textContent = "";
    addressElement.hidden = true;
    mapLink.hidden = true;
    mapLink.removeAttribute("href");
    mapLink.removeAttribute("title");
    mapLink.removeAttribute("aria-label");
    cover.classList.remove("has-image");
    coverImage.hidden = true;
    coverImage.removeAttribute("src");
    coverImage.alt = "";
    coverPlaceholder.hidden = false;
    galleryButton.hidden = true;
    galleryButton.removeAttribute("href");
    return;
  }

  name.textContent = event.event_name || "Untitled Event";

  if (event.event_cover_url) {
    coverImage.onload = () => {
      cover.classList.add("has-image");
      coverImage.hidden = false;
      coverPlaceholder.hidden = true;
    };
    coverImage.onerror = () => {
      cover.classList.remove("has-image");
      coverImage.hidden = true;
      coverPlaceholder.hidden = false;
    };
    coverImage.alt = event.event_name || "Event";
    coverImage.src = event.event_cover_url;
  } else {
    cover.classList.remove("has-image");
    coverImage.hidden = true;
    coverImage.removeAttribute("src");
    coverImage.alt = "";
    coverPlaceholder.hidden = false;
  }

  const { venue, address } = getEventLocationParts(event);
  const mapUrl = getEventMapUrl(event);
  const parts = [
    venue || address,
    formatDate(event.event_date),
    event.event_code || "",
  ].filter(Boolean);

  meta.textContent = parts.join(" · ");
  addressElement.textContent = venue && address ? address : "";
  addressElement.hidden = !(venue && address);
  mapLink.hidden = !mapUrl;

  if (mapUrl) {
    mapLink.href = mapUrl;
    mapLink.title = translate("Open event location in Maps");
    mapLink.setAttribute(
      "aria-label",
      translate("Open event location in Maps"),
    );
  } else {
    mapLink.removeAttribute("href");
    mapLink.removeAttribute("title");
    mapLink.removeAttribute("aria-label");
  }

  if (event.allow_gallery_view === false) {
    galleryButton.hidden = true;
    galleryButton.removeAttribute("href");
  } else {
    galleryButton.href = getEventGalleryUrl(event);
    galleryButton.hidden = false;
  }

  preview.hidden = false;
}

async function findEventByCode(eventCode) {
  const response = await fetch(
    `${API_BASE_URL}/api/events/${encodeURIComponent(eventCode)}`,
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Event could not be found.");
  }

  return data.event;
}

async function createGuest(eventId, guestName) {
  const sessionKey = `snapup_guest_${eventId}_${guestName.trim().toLocaleLowerCase("tr-TR")}`;
  try {
    const cached = JSON.parse(sessionStorage.getItem(sessionKey) || "null");
    if (cached?.guest_id && cached?.guest_access_token) return cached;
  } catch (_error) {}
  const userToken = localStorage.getItem("snapup_token");
  const response = await fetch(`${API_BASE_URL}/api/media/guests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(userToken ? { Authorization: `Bearer ${userToken}` } : {}),
    },
    body: JSON.stringify({
      event_id: eventId,
      guest_name: guestName,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.error || data.message || "Guest could not be created.",
    );
  }

  const guestSession = { ...data.guest, guest_access_token: data.guest_access_token };
  sessionStorage.setItem(sessionKey, JSON.stringify(guestSession));
  return guestSession;
}

async function sendMessage(eventId, guestId, guestToken, message) {
  const response = await fetch(`${API_BASE_URL}/api/media/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Guest-Token": guestToken,
    },
    body: JSON.stringify({
      event_id: eventId,
      guest_id: guestId,
      message,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || "Message could not be sent.");
  }

  return data;
}

async function uploadMedia(eventId, guestId, guestToken, files, messageText = "") {
  const mediaFiles = Array.from(files || []);

  if (mediaFiles.length === 0) {
    throw new Error("Please choose at least one file.");
  }

  const formData = new FormData();

  mediaFiles.forEach((file) => {
    formData.append("media", file);
  });

  formData.append("event_id", eventId);
  formData.append("guest_id", guestId);

  if (messageText && messageText.trim() !== "") {
    formData.append("message", messageText.trim());
  }

  const response = await fetch(`${API_BASE_URL}/api/media/upload`, {
    method: "POST",
    headers: { "X-Guest-Token": guestToken },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.error || data.message || "Media could not be uploaded.",
    );
  }

  return data;
}

function resetFormAfterSuccess() {
  const messageText = document.getElementById("joinMessageText");

  if (messageText) {
    messageText.value = "";
  }

  clearSelectedFiles();
}

function initMediaTypeButtons() {
  const buttons = document.querySelectorAll("[data-join-media-type]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedMediaType = button.dataset.joinMediaType || "message";

      buttons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");

      setResult("");
      updateMediaFields();
    });
  });
}

function initFilePreview() {
  const fileInput = document.getElementById("joinMediaFile");

  if (!fileInput) return;

  fileInput.addEventListener("change", () => {
    try {
      addFilesToSelection(fileInput.files);
      renderFilePreview();
      setResult(
        `${selectedFiles.length} of ${MAX_MEDIA_FILES} file slot(s) selected.`,
        "info",
      );
    } catch (error) {
      setResult(error.message, "error");
    } finally {
      fileInput.value = "";
    }
  });
}

function initEventCodeLookup() {
  const eventCodeInput = document.getElementById("joinEventCode");

  if (!eventCodeInput) return;

  let timeoutId = null;

  eventCodeInput.addEventListener("input", () => {
    selectedEvent = null;
    renderEventPreview(null);
    setResult("");

    clearTimeout(timeoutId);

    const code = eventCodeInput.value
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 12)
      .toUpperCase();

    eventCodeInput.value = code;

    if (code.length < 6) return;

    timeoutId = setTimeout(async () => {
      try {
        setResult("Checking event code...", "info");
        selectedEvent = await findEventByCode(code);
        renderEventPreview(selectedEvent);
        setResult("Event found. You can send your memory.", "success");
      } catch (error) {
        selectedEvent = null;
        renderEventPreview(null);
        setResult(error.message, "error");
      }
    }, 350);
  });
}

function initFormSubmit() {
  const form = document.getElementById("joinUploadForm");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const eventCode = document.getElementById("joinEventCode")?.value.trim();
    const guestName = document.getElementById("joinGuestName")?.value.trim();
    const messageText =
      document.getElementById("joinMessageText")?.value.trim() || "";
    const submissionMediaType = selectedMediaType;

    try {
      if (!eventCode) {
        setResult("Please enter event code.", "error");
        return;
      }

      if (!guestName) {
        setResult("Please enter your name.", "error");
        return;
      }

      if (submissionMediaType === "message" && !messageText) {
        setResult("Please write a message.", "error");
        return;
      }

      if (submissionMediaType !== "message" && selectedFiles.length === 0) {
        setResult("Please choose at least one file.", "error");
        return;
      }

      if (selectedFiles.length > MAX_MEDIA_FILES) {
        setResult("You can select up to 15 files at once.", "error");
        return;
      }

      setLoading(true);

      if (submissionMediaType === "message") {
        setResult("Sending message...", "info");
      } else {
        setResult(`Uploading ${selectedFiles.length} file(s)...`, "info");
      }

      const eventData = selectedEvent || (await findEventByCode(eventCode));
      selectedEvent = eventData;
      renderEventPreview(eventData);

      const guest = await createGuest(eventData.event_id, guestName);

      if (submissionMediaType === "message") {
        await sendMessage(eventData.event_id, guest.guest_id, guest.guest_access_token, messageText);

        setResult("Message sent successfully!", "success");
        resetFormAfterSuccess();
        openUploadSuccessPopup(submissionMediaType);
        return;
      } else {
        const uploadResult = await uploadMedia(
          eventData.event_id,
          guest.guest_id,
          guest.guest_access_token,
          selectedFiles,
          messageText,
        );

        const uploadedCount =
          uploadResult.uploaded_count || selectedFiles.length;

        setResult(`${uploadedCount} file(s) uploaded successfully!`, "success");
        resetFormAfterSuccess();
        openUploadSuccessPopup(submissionMediaType, uploadedCount);
        return;
      }
    } catch (error) {
      console.error("Join upload error:", error);
      setResult(error.message || "Upload failed.", "error");
    } finally {
      setLoading(false);
    }
  });
}

function initOpenClose() {
  const openButtons = document.querySelectorAll("[data-join-upload-open]");
  const closeButtons = document.querySelectorAll("[data-join-upload-close]");

  openButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      openModal();
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (isSuccessPopupOpen()) {
        finishUploadSuccessFlow();
        return;
      }

      closeModal();
    }
  });
}

function initUploadSuccessPopup() {
  document.querySelectorAll("[data-upload-success-finish]").forEach((item) => {
    item.addEventListener("click", finishUploadSuccessFlow);
  });
}

export function initJoinUploadModal() {
  initOpenClose();
  initMediaTypeButtons();
  initFilePreview();
  initEventCodeLookup();
  initFormSubmit();
  initUploadSuccessPopup();
  updateMediaFields();

  const params = new URLSearchParams(window.location.search);
  const codeFromUrl = params.get("code");

  if (codeFromUrl) {
    const input = document.getElementById("joinEventCode");

    if (input) {
      input.value = codeFromUrl.toUpperCase();
      input.dispatchEvent(new Event("input"));
      openModal();
    }
  }
}
