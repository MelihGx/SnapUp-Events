import { API_URL } from "./config.js?v=runtime-api-2";
import {
  getEventCoverUrl,
  getImageDeliveryUrl,
} from "./media-delivery.js?v=cloudinary-bandwidth-1";

const API_BASE_URL = API_URL;
const token = localStorage.getItem("snapup_token") || "";
const params = new URLSearchParams(window.location.search);
const eventId = String(params.get("event_id") || "").trim();
const eventCode = String(params.get("code") || "")
  .trim()
  .toUpperCase();

const highlightsLoading = document.getElementById("highlightsLoading");
const highlightsError = document.getElementById("highlightsError");
const highlightsErrorText = document.getElementById("highlightsErrorText");
const highlightsContent = document.getElementById("highlightsContent");
const highlightsHeroMedia = document.getElementById("highlightsHeroMedia");
const highlightsEventName = document.getElementById("highlightsEventName");
const highlightsEventDate = document.getElementById("highlightsEventDate");
const highlightsAccessBadge = document.getElementById("highlightsAccessBadge");
const highlightsPreviewNotice = document.getElementById(
  "highlightsPreviewNotice",
);
const highlightsBackLink = document.getElementById("highlightsBackLink");
const shareHighlightsButton = document.getElementById("shareHighlightsButton");
const shareHighlightsText = document.getElementById("shareHighlightsText");
const highlightsToast = document.getElementById("highlightsToast");

const participantsCount = document.getElementById("participantsCount");
const photosCount = document.getElementById("photosCount");
const videosCount = document.getElementById("videosCount");
const commentsCount = document.getElementById("commentsCount");

const mostLikedPhoto = document.getElementById("mostLikedPhoto");
const mostLikedPhotoEmpty = document.getElementById("mostLikedPhotoEmpty");
const mostLikedPhotoCaption = document.getElementById("mostLikedPhotoCaption");
const mostLikedPhotoGuest = document.getElementById("mostLikedPhotoGuest");
const mostLikedPhotoLikes = document.getElementById("mostLikedPhotoLikes");

const topUploaderAvatar = document.getElementById("topUploaderAvatar");
const topUploaderName = document.getElementById("topUploaderName");
const topUploaderDescription = document.getElementById(
  "topUploaderDescription",
);
const topUploaderPhotoCount = document.getElementById("topUploaderPhotoCount");

let currentHighlights = null;
let toastTimer = null;

function t(value, replacements = {}) {
  const translated = window.SnapUpI18n?.t?.(value) || value;

  return Object.entries(replacements).reduce(
    (result, [key, replacement]) =>
      result.replaceAll(`{${key}}`, String(replacement)),
    translated,
  );
}

function getLanguage() {
  return window.SnapUpI18n?.language || document.documentElement.lang || "en";
}

function formatEventDate(event) {
  if (!event?.event_date) return t("Date not specified");

  const parsedDate = new Date(`${event.event_date}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return event.event_date;

  try {
    return new Intl.DateTimeFormat(getLanguage(), {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(parsedDate);
  } catch (_error) {
    return event.event_date;
  }
}

function showError(message) {
  highlightsLoading.hidden = true;
  highlightsContent.hidden = true;
  highlightsError.hidden = false;
  highlightsErrorText.textContent = t(
    message || "Please check the link and try again.",
  );
}

function showToast(message) {
  if (!highlightsToast) return;

  clearTimeout(toastTimer);
  highlightsToast.textContent = t(message);
  highlightsToast.classList.add("is-visible");
  toastTimer = setTimeout(() => {
    highlightsToast.classList.remove("is-visible");
  }, 2600);
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return (
    parts.map((part) => part.charAt(0).toLocaleUpperCase()).join("") || "?"
  );
}

function buildPublicShareUrl() {
  const code = currentHighlights?.access?.event_code || eventCode;
  const url = new URL("event-highlights.html", window.location.href);
  url.search = "";
  url.searchParams.set("code", code);

  const language = getLanguage();
  if (language && language !== "en") url.searchParams.set("lang", language);

  return url.href;
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("COPY_FAILED");
}

async function shareHighlights() {
  if (!currentHighlights?.access?.shareable) return;

  const shareUrl = buildPublicShareUrl();
  const shareData = {
    title: `${currentHighlights.event.event_name || t("Event")} — ${t("Event Highlights")}`,
    text: t("See the highlights from this event."),
    url: shareUrl,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    await copyText(shareUrl);
    showToast("Highlights link copied.");
  } catch (error) {
    if (error?.name === "AbortError") return;

    try {
      await copyText(shareUrl);
      showToast("Highlights link copied.");
    } catch (_copyError) {
      showToast("Highlights link could not be copied.");
    }
  }
}

function renderMostLikedPhoto(photo) {
  if (!photo) {
    mostLikedPhoto.hidden = true;
    mostLikedPhoto.removeAttribute("src");
    mostLikedPhotoCaption.hidden = true;
    mostLikedPhotoEmpty.hidden = false;
    return;
  }

  const photoUrl = getImageDeliveryUrl(photo, "display");
  if (!photoUrl) {
    renderMostLikedPhoto(null);
    return;
  }

  mostLikedPhoto.src = photoUrl;
  mostLikedPhoto.alt = t("Most liked event photo");
  mostLikedPhoto.hidden = false;
  mostLikedPhotoEmpty.hidden = true;
  mostLikedPhotoCaption.hidden = false;
  mostLikedPhotoGuest.textContent = photo.guest_name || t("Guest");
  mostLikedPhotoLikes.textContent = String(photo.likes_count || 0);
  mostLikedPhoto.onerror = () => renderMostLikedPhoto(null);
}

function renderTopUploader(uploader) {
  if (!uploader) {
    topUploaderAvatar.textContent = "?";
    topUploaderName.textContent = t("No uploader yet");
    topUploaderDescription.textContent = t(
      "Approved photo uploads will be counted here.",
    );
    topUploaderPhotoCount.textContent = "0";
    return;
  }

  const name = uploader.guest_name || t("Guest");
  const photoCount = Number(uploader.photo_count || 0);

  topUploaderAvatar.textContent = getInitials(name);
  topUploaderName.textContent = name;
  topUploaderDescription.textContent = t(
    "{name} shared the most approved photos from this event.",
    { name },
  );
  topUploaderPhotoCount.textContent = String(photoCount);
}

function renderHighlights(data) {
  currentHighlights = data;

  const event = data.event || {};
  const summary = data.summary || {};
  const access = data.access || {};
  const coverUrl = getEventCoverUrl(event, "display");

  document.title = `${event.event_name || t("Event")} — ${t("Event Highlights")}`;
  highlightsEventName.textContent = event.event_name || t("Untitled Event");
  highlightsEventDate.textContent = formatEventDate(event);

  if (coverUrl) {
    highlightsHeroMedia.style.backgroundImage = `url(${JSON.stringify(coverUrl)})`;
  }

  highlightsAccessBadge.textContent = access.is_public
    ? t("SHAREABLE")
    : t("PRIVATE PREVIEW");
  highlightsAccessBadge.classList.toggle(
    "is-public",
    Boolean(access.is_public),
  );
  highlightsPreviewNotice.hidden = !access.owner_preview || access.is_public;

  participantsCount.textContent = String(summary.participants_count || 0);
  photosCount.textContent = String(summary.photos_count || 0);
  videosCount.textContent = String(summary.videos_count || 0);
  commentsCount.textContent = String(summary.comments_count || 0);

  renderMostLikedPhoto(data.most_liked_photo);
  renderTopUploader(data.top_photo_uploader);

  shareHighlightsButton.disabled = !access.shareable;
  shareHighlightsText.textContent = access.shareable
    ? t("Share Highlights")
    : t("Share after event ends");

  if (access.owner_preview && eventId) {
    const detailUrl = new URL("event-detail.html", window.location.href);
    detailUrl.search = "";
    detailUrl.searchParams.set("event_id", eventId);
    highlightsBackLink.href = detailUrl.href;
    highlightsBackLink.querySelector("span").textContent = t("Event Detail");
  }

  highlightsLoading.hidden = true;
  highlightsError.hidden = true;
  highlightsContent.hidden = false;
}

async function requestHighlights(url, headers = {}) {
  const response = await fetch(url, {
    method: "GET",
    headers,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.success) {
    const error = new Error(
      data.message || "Event Highlights could not be loaded.",
    );
    error.status = response.status;
    error.code = data.code || "";
    throw error;
  }

  return data;
}

async function loadHighlights() {
  if (!eventId && !eventCode) {
    showError("A valid Highlights link is required.");
    return;
  }

  let ownerError = null;

  if (eventId && token) {
    try {
      const data = await requestHighlights(
        `${API_BASE_URL}/api/events/detail/${encodeURIComponent(eventId)}/highlights`,
        { Authorization: `Bearer ${token}` },
      );
      renderHighlights(data);
      return;
    } catch (error) {
      ownerError = error;
    }
  }

  if (eventCode) {
    try {
      const data = await requestHighlights(
        `${API_BASE_URL}/api/events/highlights/${encodeURIComponent(eventCode)}`,
      );
      renderHighlights(data);
      return;
    } catch (error) {
      if (error.code === "HIGHLIGHTS_NOT_PUBLIC") {
        showError(
          "Event Highlights becomes shareable after the event is ended.",
        );
        return;
      }

      showError(error.message);
      return;
    }
  }

  showError(ownerError?.message || "Event Highlights could not be loaded.");
}

shareHighlightsButton?.addEventListener("click", shareHighlights);

loadHighlights();
