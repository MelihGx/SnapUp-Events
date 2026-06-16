const API_BASE_URL = "http://localhost:3000";

let selectedMediaType = "message";
let selectedEvent = null;

function formatDate(value) {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}.${month}.${year}`;
  }

  return new Date(value).toLocaleDateString("tr-TR");
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
  button.textContent = isLoading ? "Sending..." : "Send to Event";
}

function openModal() {
  const modal = document.getElementById("joinUploadModal");
  if (!modal) return;

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

  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("join-upload-open");
}

function getEventGalleryUrl(event) {
  if (!event?.event_code) {
    return "#";
  }

  const galleryUrl = new URL("event-gallery.html", window.location.href);
  galleryUrl.searchParams.set("code", event.event_code);

  return galleryUrl.toString();
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

function updateMediaFields() {
  const messageField = document.getElementById("joinMessageField");
  const fileField = document.getElementById("joinFileField");
  const fileInput = document.getElementById("joinMediaFile");
  const messageText = document.getElementById("joinMessageText");
  const filePreview = document.getElementById("joinFilePreview");

  if (!messageField || !fileField || !fileInput || !messageText) return;

  messageField.hidden = false;

  if (selectedMediaType === "message") {
    fileField.hidden = true;
    fileInput.value = "";
    fileInput.removeAttribute("accept");
    messageText.placeholder = "Write your memory or wish...";

    if (filePreview) {
      filePreview.hidden = true;
      filePreview.innerHTML = "";
    }

    return;
  }

  fileField.hidden = false;
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

  if (!preview || !name || !meta) return;

  const galleryButton = ensureGalleryButton(preview);

  if (!event) {
    preview.hidden = true;
    name.textContent = "";
    meta.textContent = "";
    galleryButton.hidden = true;
    galleryButton.removeAttribute("href");
    return;
  }

  name.textContent = event.event_name || "Untitled Event";

  const parts = [
    event.event_location || "",
    formatDate(event.event_date),
    event.event_code || "",
  ].filter(Boolean);

  meta.textContent = parts.join(" · ");

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
  const response = await fetch(`${API_BASE_URL}/api/media/guests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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

  return data.guest;
}

async function sendMessage(eventId, guestId, message) {
  const response = await fetch(`${API_BASE_URL}/api/media/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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

async function uploadMedia(eventId, guestId, file, message = "") {
  const formData = new FormData();

  formData.append("media", file);
  formData.append("event_id", eventId);
  formData.append("guest_id", guestId);

  if (message && message.trim() !== "") {
    formData.append("message", message.trim());
  }

  const response = await fetch(`${API_BASE_URL}/api/media/upload`, {
    method: "POST",
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
  const fileInput = document.getElementById("joinMediaFile");
  const messageText = document.getElementById("joinMessageText");
  const filePreview = document.getElementById("joinFilePreview");

  if (fileInput) fileInput.value = "";
  if (messageText) messageText.value = "";

  if (filePreview) {
    filePreview.hidden = true;
    filePreview.innerHTML = "";
  }
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
  const filePreview = document.getElementById("joinFilePreview");

  if (!fileInput || !filePreview) return;

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];

    filePreview.innerHTML = "";

    if (!file) {
      filePreview.hidden = true;
      return;
    }

    if (selectedMediaType === "image") {
      const image = document.createElement("img");
      image.src = URL.createObjectURL(file);
      image.alt = "Selected image preview";
      filePreview.appendChild(image);
      filePreview.hidden = false;
      return;
    }

    if (selectedMediaType === "video") {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(file);
      video.controls = true;
      filePreview.appendChild(video);
      filePreview.hidden = false;
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

    const code = eventCodeInput.value.trim().toUpperCase();

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
    const messageText = document
      .getElementById("joinMessageText")
      ?.value.trim();
    const file = document.getElementById("joinMediaFile")?.files?.[0];

    try {
      if (!eventCode) {
        setResult("Please enter event code.", "error");
        return;
      }

      if (!guestName) {
        setResult("Please enter your name.", "error");
        return;
      }

      if (selectedMediaType === "message" && !messageText) {
        setResult("Please write a message.", "error");
        return;
      }

      if (selectedMediaType !== "message" && !file) {
        setResult("Please choose a file.", "error");
        return;
      }

      setLoading(true);
      setResult("Preparing upload...", "info");

      const eventData = selectedEvent || (await findEventByCode(eventCode));
      selectedEvent = eventData;
      renderEventPreview(eventData);

      const guest = await createGuest(eventData.event_id, guestName);

      if (selectedMediaType === "message") {
        await sendMessage(eventData.event_id, guest.guest_id, messageText);
      } else {
        await uploadMedia(
          eventData.event_id,
          guest.guest_id,
          file,
          messageText,
        );
      }

      setResult("Memory sent successfully!", "success");
      resetFormAfterSuccess();
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
      closeModal();
    }
  });
}

export function initJoinUploadModal() {
  initOpenClose();
  initMediaTypeButtons();
  initFilePreview();
  initEventCodeLookup();
  initFormSubmit();
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
