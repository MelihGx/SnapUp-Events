import { API_URL } from "./config.js?v=runtime-api-2";
import { createLocationMapPicker } from "./location-map-picker.js?v=location-map-2";

const token = localStorage.getItem("snapup_token");

const createEventForm = document.getElementById("createEventPageForm");
const createEventSubmit = document.getElementById("createEventSubmit");
const createEventResult = document.getElementById("createEventResult");
const eventCodePreview = document.getElementById("eventCodePreview");
const qrPreviewBox = document.getElementById("qrPreviewBox");
const qrActions = document.getElementById("qrActions");
const downloadQrButton = document.getElementById("downloadQrButton");
const shareQrButton = document.getElementById("shareQrButton");

const eventDateInput = document.getElementById("eventDate");
const eventStartTimeInput = document.getElementById("eventStartTime");
const eventFinishTimeInput = document.getElementById("eventFinishTime");
const eventLatitudeInput = document.getElementById("eventLatitude");
const eventLongitudeInput = document.getElementById("eventLongitude");
const eventAddressInput = document.getElementById("eventAddress");
const createEventLocationMap = document.getElementById(
  "createEventLocationMap",
);
const createEventLocationClear = document.getElementById(
  "createEventLocationClear",
);
const createEventLocationStatus = document.getElementById(
  "createEventLocationStatus",
);
const eventCoverInput = document.getElementById("eventCoverInput");
const eventCoverPreview = document.getElementById("eventCoverPreview");
const eventCoverPlaceholder = document.getElementById(
  "eventCoverPlaceholder",
);
const eventCoverChoose = document.getElementById("eventCoverChoose");
const eventCoverAdjust = document.getElementById("eventCoverAdjust");
const eventCoverRemove = document.getElementById("eventCoverRemove");
const eventCoverCropOverlay = document.getElementById(
  "eventCoverCropOverlay",
);
const eventCoverCropClose = document.getElementById("eventCoverCropClose");
const eventCoverCropCancel = document.getElementById("eventCoverCropCancel");
const eventCoverCropApply = document.getElementById("eventCoverCropApply");
const eventCoverCropReset = document.getElementById("eventCoverCropReset");
const eventCoverCropStage = document.getElementById("eventCoverCropStage");
const eventCoverCropImage = document.getElementById("eventCoverCropImage");
const eventCoverCropZoom = document.getElementById("eventCoverCropZoom");

const paymentPopup = document.getElementById("paymentPopup");
const paymentPopupClose = document.getElementById("paymentPopupClose");
const paymentDemoButton = document.getElementById("paymentDemoButton");
const paymentDemoNote = document.getElementById("paymentDemoNote");
const paymentPackageName = document.getElementById("paymentPackageName");
const paymentPackagePrice = document.getElementById("paymentPackagePrice");

const cardHolderInput = document.getElementById("cardHolderInput");
const cardNumberInput = document.getElementById("cardNumberInput");
const cardExpiryInput = document.getElementById("cardExpiryInput");
const cardCvcInput = document.getElementById("cardCvcInput");

const liveCardNumber = document.getElementById("liveCardNumber");
const liveCardHolder = document.getElementById("liveCardHolder");
const liveCardExpiry = document.getElementById("liveCardExpiry");

const paymentSuccessPopup = document.getElementById("paymentSuccessPopup");
const paymentSuccessClose = document.getElementById("paymentSuccessClose");

let pendingEventPayload = null;
let currentQrCodeUrl = null;
let currentEventCode = null;
let lastFocusedElement = null;
let eventCoverFile = null;
let eventCoverObjectUrl = null;
let eventCoverSourceFile = null;
let eventCoverCrop = { focalX: 0.5, focalY: 0.5, zoom: 1 };
let cropSourceFile = null;
let cropSourceObjectUrl = null;
let cropImageWidth = 0;
let cropImageHeight = 0;
let cropLoadToken = 0;
let cropLastFocusedElement = null;
let cropDrag = null;

const EVENT_COVER_MAX_SIZE = 8 * 1024 * 1024;
const EVENT_COVER_TYPES = ["image/jpeg", "image/png", "image/webp"];
const EVENT_COVER_OUTPUT_WIDTH = 1296;
const EVENT_COVER_OUTPUT_HEIGHT = 1032;

const eventLocationPicker = createLocationMapPicker({
  mapElement: createEventLocationMap,
  latitudeInput: eventLatitudeInput,
  longitudeInput: eventLongitudeInput,
  addressInput: eventAddressInput,
  clearButton: createEventLocationClear,
  statusElement: createEventLocationStatus,
  translate: t,
});

if (!token) {
  const currentPage = `${window.location.pathname.split("/").pop() || "create-event.html"}${window.location.search}${window.location.hash}`;
  sessionStorage.setItem("snapup_after_login", currentPage);
  window.location.replace("login.html");
}

function t(key, replacements = {}) {
  const translated = window.SnapUpI18n?.t?.(key) || key;
  return Object.entries(replacements).reduce(
    (result, [name, value]) =>
      result.replaceAll(`{${name}}`, String(value ?? "")),
    translated,
  );
}

function showResult(message, type = "error") {
  createEventResult.textContent = message;
  createEventResult.classList.remove("is-success", "is-error");

  if (!message) {
    return;
  }

  createEventResult.classList.add(
    type === "success" ? "is-success" : "is-error",
  );
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function getCropMetrics() {
  if (
    !eventCoverCropStage ||
    !cropImageWidth ||
    !cropImageHeight
  ) {
    return null;
  }

  const stageWidth = eventCoverCropStage.clientWidth;
  const stageHeight = eventCoverCropStage.clientHeight;

  if (!stageWidth || !stageHeight) {
    return null;
  }

  const baseScale = Math.max(
    stageWidth / cropImageWidth,
    stageHeight / cropImageHeight,
  );
  const scale = baseScale * eventCoverCrop.zoom;
  const width = cropImageWidth * scale;
  const height = cropImageHeight * scale;
  const unclampedLeft =
    stageWidth / 2 - eventCoverCrop.focalX * width;
  const unclampedTop =
    stageHeight / 2 - eventCoverCrop.focalY * height;
  const left = clamp(unclampedLeft, stageWidth - width, 0);
  const top = clamp(unclampedTop, stageHeight - height, 0);

  eventCoverCrop.focalX = clamp(
    (stageWidth / 2 - left) / width,
    0,
    1,
  );
  eventCoverCrop.focalY = clamp(
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

function renderEventCoverCrop() {
  const metrics = getCropMetrics();

  if (!metrics || !eventCoverCropImage) {
    return;
  }

  eventCoverCropImage.style.width = `${metrics.width}px`;
  eventCoverCropImage.style.height = `${metrics.height}px`;
  eventCoverCropImage.style.left = `${metrics.left}px`;
  eventCoverCropImage.style.top = `${metrics.top}px`;
}

function releaseCropSourceUrl() {
  if (cropSourceObjectUrl) {
    URL.revokeObjectURL(cropSourceObjectUrl);
    cropSourceObjectUrl = null;
  }
}

function closeEventCoverCrop({ restoreFocus = true } = {}) {
  cropLoadToken += 1;
  cropDrag = null;
  eventCoverCropStage?.classList.remove("is-dragging");
  eventCoverCropOverlay?.classList.remove("active");
  eventCoverCropOverlay?.setAttribute("aria-hidden", "true");
  eventCoverCropImage?.removeAttribute("src");
  releaseCropSourceUrl();
  cropSourceFile = null;
  eventCoverInput.value = "";
  setPageScrollLocked(false);

  if (restoreFocus && cropLastFocusedElement?.focus) {
    cropLastFocusedElement.focus();
  }
}

function openEventCoverCrop(file, initialCrop = null) {
  if (
    !file ||
    !eventCoverCropOverlay ||
    !eventCoverCropImage ||
    !eventCoverCropStage
  ) {
    return;
  }

  releaseCropSourceUrl();
  cropSourceFile = file;
  cropImageWidth = 0;
  cropImageHeight = 0;
  eventCoverCrop = initialCrop
    ? {
        focalX: initialCrop.focalX,
        focalY: initialCrop.focalY,
        zoom: initialCrop.zoom,
      }
    : { focalX: 0.5, focalY: 0.5, zoom: 1 };
  eventCoverCropZoom.value = String(eventCoverCrop.zoom);
  cropLastFocusedElement =
    document.activeElement === eventCoverInput
      ? eventCoverChoose
      : document.activeElement;
  eventCoverCropApply.disabled = true;
  eventCoverCropImage.style.opacity = "0";

  eventCoverCropOverlay.classList.add("active");
  eventCoverCropOverlay.setAttribute("aria-hidden", "false");
  setPageScrollLocked(true);

  const currentLoadToken = ++cropLoadToken;
  cropSourceObjectUrl = URL.createObjectURL(file);

  eventCoverCropImage.onload = () => {
    if (currentLoadToken !== cropLoadToken) {
      return;
    }

    cropImageWidth = eventCoverCropImage.naturalWidth;
    cropImageHeight = eventCoverCropImage.naturalHeight;

    if (!cropImageWidth || !cropImageHeight) {
      closeEventCoverCrop();
      showResult(
        t("Photo could not be prepared. Please choose another image."),
      );
      return;
    }

    eventCoverCropImage.style.opacity = "1";
    eventCoverCropApply.disabled = false;
    requestAnimationFrame(() => {
      renderEventCoverCrop();
      eventCoverCropStage.focus();
    });
  };

  eventCoverCropImage.onerror = () => {
    if (currentLoadToken !== cropLoadToken) {
      return;
    }

    closeEventCoverCrop();
    showResult(
      t("Photo could not be prepared. Please choose another image."),
    );
  };

  eventCoverCropImage.src = cropSourceObjectUrl;
}

function createCroppedEventCover() {
  const metrics = getCropMetrics();

  if (!metrics || !cropSourceFile) {
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
    eventCoverCropImage,
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
          cropSourceFile.name.replace(/\.[^.]+$/, "") || "event-photo";
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

function clearEventCover() {
  if (eventCoverCropOverlay?.classList.contains("active")) {
    closeEventCoverCrop({ restoreFocus: false });
  }

  if (eventCoverObjectUrl) {
    URL.revokeObjectURL(eventCoverObjectUrl);
    eventCoverObjectUrl = null;
  }

  eventCoverFile = null;
  eventCoverSourceFile = null;
  eventCoverCrop = { focalX: 0.5, focalY: 0.5, zoom: 1 };
  eventCoverInput.value = "";
  eventCoverPreview.removeAttribute("src");
  eventCoverPreview.alt = "";
  eventCoverPreview.hidden = true;
  eventCoverPlaceholder.hidden = false;
  eventCoverAdjust.hidden = true;
  eventCoverRemove.hidden = true;
}

function selectEventCover(file) {
  if (!file) {
    clearEventCover();
    return;
  }

  if (!EVENT_COVER_TYPES.includes(file.type)) {
    eventCoverInput.value = "";
    showResult(t("Only JPG, PNG or WEBP images are allowed."));
    return;
  }

  if (file.size > EVENT_COVER_MAX_SIZE) {
    eventCoverInput.value = "";
    showResult(t("Event photo must be 8 MB or smaller."));
    return;
  }

  showResult("");
  openEventCoverCrop(file);
}

function setPageScrollLocked(locked) {
  document.body.style.overflow = locked ? "hidden" : "";
}

function formatTimeForDatabase(timeValue) {
  if (!timeValue) {
    return null;
  }

  return timeValue.length === 5 ? `${timeValue}:00` : timeValue;
}

function validateEventDateFields() {
  const eventDate = eventDateInput.value;
  const eventStartTime = eventStartTimeInput.value;
  const eventFinishTime = eventFinishTimeInput.value;

  if (!eventDate && (eventStartTime || eventFinishTime)) {
    showResult(
      t("Please select an event date before choosing event time."),
    );
    eventDateInput.focus();
    return false;
  }

  if (eventStartTime && eventFinishTime && eventFinishTime <= eventStartTime) {
    showResult(t("Finish time must be later than start time."));
    eventFinishTimeInput.focus();
    return false;
  }

  return true;
}

function getSelectedPackageInfo() {
  const selectedPackage =
    document.querySelector('input[name="eventPackage"]:checked')?.value ||
    "starter";

  const packageMap = {
    starter: {
      nameKey: "Starter",
      priceKey: "Free",
      price: "Free",
      isFree: true,
    },
    standard: {
      nameKey: "Standard",
      price: "₺149",
      isFree: false,
    },
    premium: {
      nameKey: "Premium",
      price: "₺299",
      isFree: false,
    },
  };

  const selected = packageMap[selectedPackage] || packageMap.starter;

  return {
    ...selected,
    name: t(selected.nameKey),
    displayPrice: selected.priceKey ? t(selected.priceKey) : selected.price,
  };
}

function getSelectedPackageValue() {
  return (
    document.querySelector('input[name="eventPackage"]:checked')?.value ||
    "starter"
  );
}

function formatCardNumber(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(value) {
  const cleaned = value.replace(/\D/g, "").slice(0, 4);

  if (cleaned.length <= 2) {
    return cleaned;
  }

  return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
}

function updateLiveCard() {
  const holderValue = cardHolderInput.value.trim();
  const cardNumberValue = formatCardNumber(cardNumberInput.value);
  const expiryValue = formatExpiry(cardExpiryInput.value);

  const displayNumber = cardNumberValue || "4242 4242 4242 4242";
  const numberParts = displayNumber.split(" ");

  liveCardNumber.replaceChildren(
    ...[0, 1, 2, 3].map((index) => {
      const numberPart = document.createElement("span");
      numberPart.textContent = numberParts[index] || "4242";
      return numberPart;
    }),
  );

  liveCardHolder.textContent = holderValue
    ? holderValue.toLocaleUpperCase()
    : t("SNAPUP USER");

  liveCardExpiry.textContent = expiryValue || "12/28";
}

function resetPaymentForm() {
  cardHolderInput.value = "";
  cardNumberInput.value = "";
  cardExpiryInput.value = "";
  cardCvcInput.value = "";
  updateLiveCard();
}

function buildEventPayload() {
  return {
    eventName: document.getElementById("eventName").value.trim(),
    event_location:
      document.getElementById("eventLocation").value.trim() || null,
    event_address:
      eventAddressInput.value.trim() || null,
    event_latitude: eventLatitudeInput.value
      ? Number(eventLatitudeInput.value)
      : null,
    event_longitude: eventLongitudeInput.value
      ? Number(eventLongitudeInput.value)
      : null,
    event_date: eventDateInput.value || null,
    event_start_time: formatTimeForDatabase(eventStartTimeInput.value),
    event_finish_time: formatTimeForDatabase(eventFinishTimeInput.value),
    description:
      document.getElementById("eventDescription").value.trim() || null,
    eventPackage: getSelectedPackageValue(),
    settings: {
      allow_upload: document.getElementById("allowUpload").checked,
      only_users: document.getElementById("onlyUsers").checked,
      allow_comments: document.getElementById("allowComments").checked,
      allow_likes: document.getElementById("allowLikes").checked,
      require_approval: document.getElementById("requireApproval").checked,
      max_storage_per_guest:
        Number(document.getElementById("maxStoragePerGuest").value) || 500,
      max_upload_per_guest:
        Number(document.getElementById("maxUploadPerGuest").value) || 20,
    },
  };
}

function openPaymentPopup() {
  const packageInfo = getSelectedPackageInfo();

  paymentPackageName.textContent = packageInfo.name;
  paymentPackagePrice.textContent = packageInfo.displayPrice;
  paymentDemoButton.disabled = false;
  paymentDemoButton.textContent = packageInfo.isFree
    ? t("Continue Demo")
    : t("Pay Demo");
  paymentDemoNote.textContent = t(
    "Demo mode only — this step is for UI testing.",
  );

  resetPaymentForm();
  lastFocusedElement = document.activeElement;
  paymentPopup.classList.add("active");
  paymentPopup.setAttribute("aria-hidden", "false");
  setPageScrollLocked(true);
  paymentPopupClose.focus();
}

function closePaymentPopup({ restoreFocus = true } = {}) {
  paymentPopup.classList.remove("active");
  paymentPopup.setAttribute("aria-hidden", "true");

  if (!paymentSuccessPopup.classList.contains("active")) {
    setPageScrollLocked(false);
  }

  if (restoreFocus) {
    lastFocusedElement?.focus?.();
  }
}

function openPaymentSuccessPopup() {
  paymentSuccessPopup.classList.add("active");
  paymentSuccessPopup.setAttribute("aria-hidden", "false");
  setPageScrollLocked(true);
  paymentSuccessClose.focus();
}

function closePaymentSuccessPopup() {
  paymentSuccessPopup.classList.remove("active");
  paymentSuccessPopup.setAttribute("aria-hidden", "true");
  setPageScrollLocked(false);
  createEventSubmit.focus();
}

function renderQrCode(createdEvent) {
  if (!qrPreviewBox) {
    return;
  }

  currentQrCodeUrl = createdEvent.qr_code_url || null;
  currentEventCode = createdEvent.event_code || "event";

  if (currentQrCodeUrl) {
    const qrImage = document.createElement("img");
    qrImage.src = currentQrCodeUrl;
    qrImage.alt = t("Event QR code");
    qrPreviewBox.replaceChildren(qrImage);

    if (qrActions) {
      qrActions.hidden = false;
    }
    return;
  }

  const errorMessage = document.createElement("span");
  errorMessage.textContent = t("QR code could not be generated.");
  qrPreviewBox.replaceChildren(errorMessage);

  if (qrActions) {
    qrActions.hidden = true;
  }
}

async function createEventOnBackend() {
  const formData = new FormData();
  formData.append("payload", JSON.stringify(pendingEventPayload));

  if (eventCoverFile) {
    formData.append("event_cover", eventCoverFile);
  }

  const response = await fetch(`${API_URL}/api/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    const errorKeyByCode = {
      INVALID_EVENT_COVER_TYPE:
        "Only JPG, PNG or WEBP images are allowed.",
      EVENT_COVER_TOO_LARGE: "Event photo must be 8 MB or smaller.",
    };
    const translatedError = errorKeyByCode[data.code]
      ? t(errorKeyByCode[data.code])
      : "";

    throw new Error(
      translatedError || data.message || t("Event could not be created."),
    );
  }

  return data.event;
}

async function downloadQrCode() {
  if (!currentQrCodeUrl) {
    return;
  }

  try {
    const response = await fetch(currentQrCodeUrl);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    downloadLink.href = objectUrl;
    downloadLink.download = `snapup-event-${currentEventCode}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    const fallbackLink = document.createElement("a");
    fallbackLink.href = currentQrCodeUrl;
    fallbackLink.target = "_blank";
    fallbackLink.rel = "noopener";
    document.body.appendChild(fallbackLink);
    fallbackLink.click();
    fallbackLink.remove();
  }
}

async function shareQrCode() {
  if (!currentQrCodeUrl) {
    return;
  }

  const shareText = t("SnapUp Event Code: {code}", {
    code: currentEventCode,
  });

  try {
    const response = await fetch(currentQrCodeUrl);
    const blob = await response.blob();
    const qrFile = new File(
      [blob],
      `snapup-event-${currentEventCode}.png`,
      { type: "image/png" },
    );

    if (navigator.canShare && navigator.canShare({ files: [qrFile] })) {
      await navigator.share({
        title: t("Event QR code"),
        text: shareText,
        files: [qrFile],
      });
      return;
    }
  } catch (error) {
    // Continue with link sharing when file sharing is unavailable.
  }

  try {
    if (navigator.share) {
      await navigator.share({
        title: t("Event QR code"),
        text: shareText,
        url: currentQrCodeUrl,
      });
      return;
    }

    await navigator.clipboard.writeText(currentQrCodeUrl);
    showResult(t("QR code link copied to clipboard."), "success");
  } catch (error) {
    if (error?.name !== "AbortError") {
      showResult(t("QR code could not be shared."));
    }
  }
}

createEventForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const eventName = document.getElementById("eventName").value.trim();

  if (!eventName) {
    showResult(t("Event name is required."));
    document.getElementById("eventName").focus();
    return;
  }

  if (!validateEventDateFields()) {
    return;
  }

  pendingEventPayload = buildEventPayload();
  showResult("");
  openPaymentPopup();
});

paymentPopupClose.addEventListener("click", () => closePaymentPopup());

paymentPopup.addEventListener("click", (event) => {
  if (event.target === paymentPopup) {
    closePaymentPopup();
  }
});

cardHolderInput.addEventListener("input", updateLiveCard);

cardNumberInput.addEventListener("input", () => {
  cardNumberInput.value = formatCardNumber(cardNumberInput.value);
  updateLiveCard();
});

cardExpiryInput.addEventListener("input", () => {
  cardExpiryInput.value = formatExpiry(cardExpiryInput.value);
  updateLiveCard();
});

cardCvcInput.addEventListener("input", () => {
  cardCvcInput.value = cardCvcInput.value.replace(/\D/g, "").slice(0, 4);
});

paymentDemoButton.addEventListener("click", async () => {
  try {
    paymentDemoButton.disabled = true;
    paymentDemoButton.textContent = t("Processing...");
    paymentDemoNote.textContent = eventCoverFile
      ? t("Uploading photo and creating your event...")
      : t("Creating your event...");

    const createdEvent = await createEventOnBackend();
    paymentDemoButton.textContent = t("Payment Completed");

    if (eventCodePreview) {
      eventCodePreview.textContent = createdEvent.event_code || "------";
    }

    renderQrCode(createdEvent);
    closePaymentPopup({ restoreFocus: false });
    showResult(
      t("Event created successfully. Event code: {code}", {
        code: createdEvent.event_code,
      }),
      "success",
    );
    openPaymentSuccessPopup();
  } catch (error) {
    paymentDemoButton.disabled = false;
    paymentDemoButton.textContent = t("Try Again");
    paymentDemoNote.textContent = error.message;
    showResult(error.message);
  }
});

paymentSuccessClose.addEventListener("click", closePaymentSuccessPopup);

paymentSuccessPopup.addEventListener("click", (event) => {
  if (event.target === paymentSuccessPopup) {
    closePaymentSuccessPopup();
  }
});

eventCoverCropClose?.addEventListener("click", () => closeEventCoverCrop());
eventCoverCropCancel?.addEventListener("click", () => closeEventCoverCrop());

eventCoverCropOverlay?.addEventListener("click", (event) => {
  if (event.target === eventCoverCropOverlay) {
    closeEventCoverCrop();
  }
});

eventCoverCropZoom?.addEventListener("input", () => {
  eventCoverCrop.zoom = clamp(
    Number(eventCoverCropZoom.value) || 1,
    1,
    3,
  );
  renderEventCoverCrop();
});

eventCoverCropReset?.addEventListener("click", () => {
  eventCoverCrop = { focalX: 0.5, focalY: 0.5, zoom: 1 };
  eventCoverCropZoom.value = "1";
  renderEventCoverCrop();
});

eventCoverCropStage?.addEventListener("pointerdown", (event) => {
  const metrics = getCropMetrics();

  if (!metrics || eventCoverCropApply.disabled) {
    return;
  }

  cropDrag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    left: metrics.left,
    top: metrics.top,
  };
  eventCoverCropStage.setPointerCapture(event.pointerId);
  eventCoverCropStage.classList.add("is-dragging");
});

eventCoverCropStage?.addEventListener("pointermove", (event) => {
  if (!cropDrag || cropDrag.pointerId !== event.pointerId) {
    return;
  }

  const metrics = getCropMetrics();

  if (!metrics) {
    return;
  }

  const left = clamp(
    cropDrag.left + event.clientX - cropDrag.startX,
    metrics.stageWidth - metrics.width,
    0,
  );
  const top = clamp(
    cropDrag.top + event.clientY - cropDrag.startY,
    metrics.stageHeight - metrics.height,
    0,
  );

  eventCoverCrop.focalX = clamp(
    (metrics.stageWidth / 2 - left) / metrics.width,
    0,
    1,
  );
  eventCoverCrop.focalY = clamp(
    (metrics.stageHeight / 2 - top) / metrics.height,
    0,
    1,
  );
  renderEventCoverCrop();
});

function finishCropDrag(event) {
  if (!cropDrag || cropDrag.pointerId !== event.pointerId) {
    return;
  }

  if (eventCoverCropStage.hasPointerCapture(event.pointerId)) {
    eventCoverCropStage.releasePointerCapture(event.pointerId);
  }

  cropDrag = null;
  eventCoverCropStage.classList.remove("is-dragging");
}

eventCoverCropStage?.addEventListener("pointerup", finishCropDrag);
eventCoverCropStage?.addEventListener("pointercancel", finishCropDrag);

eventCoverCropStage?.addEventListener("keydown", (event) => {
  const directionByKey = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  };
  const direction = directionByKey[event.key];

  if (!direction || eventCoverCropApply.disabled) {
    return;
  }

  event.preventDefault();
  const step = event.shiftKey ? 0.05 : 0.015;
  eventCoverCrop.focalX = clamp(
    eventCoverCrop.focalX + direction[0] * step,
    0,
    1,
  );
  eventCoverCrop.focalY = clamp(
    eventCoverCrop.focalY + direction[1] * step,
    0,
    1,
  );
  renderEventCoverCrop();
});

eventCoverCropApply?.addEventListener("click", async () => {
  const originalSourceFile = cropSourceFile;
  const finalCrop = { ...eventCoverCrop };

  try {
    eventCoverCropApply.disabled = true;
    eventCoverCropApply.textContent = t("Applying...");

    const croppedFile = await createCroppedEventCover();

    if (eventCoverObjectUrl) {
      URL.revokeObjectURL(eventCoverObjectUrl);
    }

    eventCoverFile = croppedFile;
    eventCoverSourceFile = originalSourceFile;
    eventCoverCrop = finalCrop;
    eventCoverObjectUrl = URL.createObjectURL(croppedFile);
    eventCoverPreview.src = eventCoverObjectUrl;
    eventCoverPreview.alt = originalSourceFile?.name || croppedFile.name;
    eventCoverPreview.hidden = false;
    eventCoverPlaceholder.hidden = true;
    eventCoverAdjust.hidden = false;
    eventCoverRemove.hidden = false;

    closeEventCoverCrop({ restoreFocus: false });
    showResult("");
    eventCoverAdjust.focus();
  } catch (error) {
    showResult(
      t("Photo could not be prepared. Please choose another image."),
    );
  } finally {
    eventCoverCropApply.disabled = false;
    eventCoverCropApply.textContent = t("Use photo");
  }
});

if ("ResizeObserver" in window && eventCoverCropStage) {
  new ResizeObserver(() => {
    if (eventCoverCropOverlay?.classList.contains("active")) {
      renderEventCoverCrop();
    }
  }).observe(eventCoverCropStage);
} else {
  window.addEventListener("resize", renderEventCoverCrop);
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (eventCoverCropOverlay?.classList.contains("active")) {
    closeEventCoverCrop();
    return;
  }

  if (paymentSuccessPopup.classList.contains("active")) {
    closePaymentSuccessPopup();
    return;
  }

  if (paymentPopup.classList.contains("active")) {
    closePaymentPopup();
  }
});

downloadQrButton?.addEventListener("click", downloadQrCode);
shareQrButton?.addEventListener("click", shareQrCode);

eventCoverInput?.addEventListener("change", () => {
  selectEventCover(eventCoverInput.files?.[0] || null);
});

eventCoverChoose?.addEventListener("click", () => {
  eventCoverInput?.click();
});

eventCoverAdjust?.addEventListener("click", () => {
  if (eventCoverSourceFile) {
    openEventCoverCrop(eventCoverSourceFile, eventCoverCrop);
  }
});

eventCoverRemove?.addEventListener("click", clearEventCover);

window.addEventListener("beforeunload", () => {
  if (eventCoverObjectUrl) {
    URL.revokeObjectURL(eventCoverObjectUrl);
  }

  releaseCropSourceUrl();
});

updateLiveCard();
