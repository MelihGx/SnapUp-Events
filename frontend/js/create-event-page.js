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

if (!token) {
  sessionStorage.setItem("snapup_after_login", "create-event.html");
  window.location.href = "login.html";
}

function showResult(message, type = "error") {
  createEventResult.textContent = message;
  createEventResult.style.color = type === "success" ? "#21c55d" : "#ff4d4d";
}

function formatTimeForDatabase(timeValue) {
  if (!timeValue) {
    return null;
  }

  if (timeValue.length === 5) {
    return `${timeValue}:00`;
  }

  return timeValue;
}

function validateEventDateFields() {
  const eventDate = eventDateInput.value;
  const eventStartTime = eventStartTimeInput.value;
  const eventFinishTime = eventFinishTimeInput.value;

  if (!eventDate && (eventStartTime || eventFinishTime)) {
    showResult("Please select an event date before choosing event time.");
    eventDateInput.focus();
    return false;
  }

  if (eventStartTime && eventFinishTime && eventFinishTime <= eventStartTime) {
    showResult("Finish time must be later than start time.");
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
      name: "Starter",
      price: "Free",
    },
    standard: {
      name: "Standard",
      price: "â‚º149",
    },
    premium: {
      name: "Premium",
      price: "â‚º299",
    },
  };

  return packageMap[selectedPackage] || packageMap.starter;
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

  liveCardNumber.innerHTML = `
    <span>${numberParts[0] || "4242"}</span>
    <span>${numberParts[1] || "4242"}</span>
    <span>${numberParts[2] || "4242"}</span>
    <span>${numberParts[3] || "4242"}</span>
  `;

  liveCardHolder.textContent = holderValue
    ? holderValue.toUpperCase()
    : "SNAPUP USER";

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
  paymentPackagePrice.textContent = packageInfo.price;

  paymentDemoButton.disabled = false;
  paymentDemoButton.textContent =
    packageInfo.price === "Free" ? "Continue Demo" : "Pay Demo";

  paymentDemoNote.textContent =
    "Demo mode only â€” this step is for UI testing.";

  resetPaymentForm();

  paymentPopup.classList.add("active");
  paymentPopup.setAttribute("aria-hidden", "false");
}

function closePaymentPopup() {
  paymentPopup.classList.remove("active");
  paymentPopup.setAttribute("aria-hidden", "true");
}

function openPaymentSuccessPopup() {
  paymentSuccessPopup.classList.add("active");
  paymentSuccessPopup.setAttribute("aria-hidden", "false");
}

function closePaymentSuccessPopup() {
  paymentSuccessPopup.classList.remove("active");
  paymentSuccessPopup.setAttribute("aria-hidden", "true");
}

function renderQrCode(createdEvent) {
  if (!qrPreviewBox) {
    return;
  }

  currentQrCodeUrl = createdEvent.qr_code_url || null;
  currentEventCode = createdEvent.event_code || "event";

  if (currentQrCodeUrl) {
    qrPreviewBox.innerHTML = `
      <img src="${currentQrCodeUrl}" alt="Event QR code" />
    `;

    if (qrActions) {
      qrActions.hidden = false;
    }

    return;
  }

  qrPreviewBox.innerHTML = `
    <span>QR code could not be generated.</span>
  `;

  if (qrActions) {
    qrActions.hidden = true;
  }
}

async function createEventOnBackend() {
  const response = await fetch(
    "https://snapup-events-api.onrender.com/api/events",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(pendingEventPayload),
    },
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Event could not be created.");
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

    document.body.appendChild(fallbackLink);
    fallbackLink.click();
    fallbackLink.remove();
  }
}

async function shareQrCode() {
  if (!currentQrCodeUrl) {
    return;
  }

  const shareText = `SnapUp Event Code: ${currentEventCode}`;

  try {
    const response = await fetch(currentQrCodeUrl);
    const blob = await response.blob();

    const qrFile = new File([blob], `snapup-event-${currentEventCode}.png`, {
      type: "image/png",
    });

    if (navigator.canShare && navigator.canShare({ files: [qrFile] })) {
      await navigator.share({
        title: "SnapUp Event QR Code",
        text: shareText,
        files: [qrFile],
      });
      return;
    }
  } catch (error) {
    // GÃ¶rsel paylaÅŸÄ±mÄ± desteklenmezse link paylaÅŸÄ±mÄ±na geÃ§er.
  }

  try {
    if (navigator.share) {
      await navigator.share({
        title: "SnapUp Event QR Code",
        text: shareText,
        url: currentQrCodeUrl,
      });
      return;
    }

    await navigator.clipboard.writeText(currentQrCodeUrl);
    showResult("QR code link copied to clipboard.", "success");
  } catch (error) {
    showResult("QR code could not be shared.", "error");
  }
}

createEventForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const eventName = document.getElementById("eventName").value.trim();

  if (!eventName) {
    showResult("Event name is required.");
    return;
  }

  if (!validateEventDateFields()) {
    return;
  }

  pendingEventPayload = buildEventPayload();

  showResult("");
  openPaymentPopup();
});

paymentPopupClose.addEventListener("click", closePaymentPopup);

paymentPopup.addEventListener("click", (event) => {
  if (event.target === paymentPopup) {
    closePaymentPopup();
  }
});

cardHolderInput.addEventListener("input", () => {
  updateLiveCard();
});

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
    paymentDemoButton.textContent = "Processing...";
    paymentDemoNote.textContent = "Creating your event...";

    const createdEvent = await createEventOnBackend();

    paymentDemoButton.textContent = "Payment Completed";

    if (eventCodePreview) {
      eventCodePreview.textContent = createdEvent.event_code || "------";
    }

    renderQrCode(createdEvent);

    closePaymentPopup();

    showResult(
      `Event created successfully. Event code: ${createdEvent.event_code}`,
      "success",
    );

    openPaymentSuccessPopup();
  } catch (error) {
    paymentDemoButton.disabled = false;
    paymentDemoButton.textContent = "Try Again";
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

if (downloadQrButton) {
  downloadQrButton.addEventListener("click", downloadQrCode);
}

if (shareQrButton) {
  shareQrButton.addEventListener("click", shareQrCode);
}

updateLiveCard();
