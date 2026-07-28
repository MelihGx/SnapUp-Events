import { API_URL } from "./config.js?v=runtime-api-2";

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

if (!token) {
  sessionStorage.setItem("snapup_after_login", "create-event.html");
  window.location.href = "login.html";
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
  const response = await fetch(`${API_URL}/api/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(pendingEventPayload),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || t("Event could not be created."));
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
    paymentDemoNote.textContent = t("Creating your event...");

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

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
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

updateLiveCard();
