import { API_URL } from "./config.js?v=runtime-api-2";
import {
  getEventCoverUrl,
  getImageDeliveryUrl,
  getImageSrcSet,
  getVideoPlaybackUrl,
  getVideoPosterUrl,
} from "./media-delivery.js?v=cloudinary-bandwidth-1";

const API_BASE_URL = API_URL;

const galleryLoading = document.getElementById("galleryLoading");
const galleryError = document.getElementById("galleryError");
const galleryErrorText = document.getElementById("galleryErrorText");
const galleryContent = document.getElementById("galleryContent");

const galleryHero = document.getElementById("galleryHero");
const galleryHeroMedia = document.getElementById("galleryHeroMedia");
const galleryEventTitle = document.getElementById("galleryEventTitle");
const galleryEventMeta = document.getElementById("galleryEventMeta");
const galleryEventDescription = document.getElementById(
  "galleryEventDescription",
);
const guestCountTitle = document.getElementById("guestCountTitle");
const participantList = document.getElementById("participantList");
const memoryCountBadge = document.getElementById("memoryCountBadge");
const approvedGalleryGrid = document.getElementById("approvedGalleryGrid");

const publicLightbox = document.getElementById("publicLightbox");
const publicLightboxBackdrop = document.getElementById(
  "publicLightboxBackdrop",
);
const publicLightboxClose = document.getElementById("publicLightboxClose");
const publicLightboxPrev = document.getElementById("publicLightboxPrev");
const publicLightboxNext = document.getElementById("publicLightboxNext");
const publicLightboxImage = document.getElementById("publicLightboxImage");
const publicLightboxTitle = document.getElementById("publicLightboxTitle");
const publicLightboxMeta = document.getElementById("publicLightboxMeta");

const params = new URLSearchParams(window.location.search);
const eventCode = params.get("code");

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
  hi: "hi-IN",
  ur: "ur-PK",
  fa: "fa-IR",
  ja: "ja-JP",
  zh: "zh-CN",
  ko: "ko-KR",
  ...Object.fromEntries(
    Object.entries(window.SnapUpAdditionalLanguages || {}).map(
      ([code, metadata]) => [code, metadata.locale],
    ),
  ),
};

let approvedPhotos = [];
let activePhotoIndex = 0;
let lightboxReturnTarget = null;
let touchStartX = null;
let gallerySettings = {
  allow_likes: true,
};

function getLanguage() {
  return window.SnapUpI18n?.language || "en";
}

function t(value, replacements = {}) {
  const translated = window.SnapUpI18n?.t(value) || value;

  return Object.entries(replacements).reduce(
    (result, [key, replacement]) =>
      result.replaceAll(`{${key}}`, String(replacement)),
    translated,
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getLikeKey() {
  const storageKey = "snapup_like_key";
  let likeKey = localStorage.getItem(storageKey);

  if (!likeKey) {
    if (window.crypto?.randomUUID) {
      likeKey = window.crypto.randomUUID();
    } else {
      likeKey = `snapup-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    localStorage.setItem(storageKey, likeKey);
  }

  return likeKey;
}

function formatDate(value) {
  if (!value) return "";

  const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T12:00:00`
    : value;
  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    localeByLanguage[getLanguage()] || "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  ).format(date);
}

function formatDateTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    localeByLanguage[getLanguage()] || "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function showError(message) {
  galleryLoading.hidden = true;
  galleryLoading.setAttribute("aria-busy", "false");
  galleryContent.hidden = true;
  galleryError.hidden = false;
  galleryErrorText.textContent = t(message);
}

function showContent() {
  galleryLoading.hidden = true;
  galleryLoading.setAttribute("aria-busy", "false");
  galleryError.hidden = true;
  galleryContent.hidden = false;
}

function renderEvent(event) {
  galleryEventTitle.textContent = event.event_name || t("Untitled Event");

  const locationText = [event.event_location, event.event_address]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");
  const metaParts = [
    locationText,
    formatDate(event.event_date),
    event.event_code || "",
  ].filter(Boolean);

  galleryEventMeta.textContent = metaParts.join(" · ");
  galleryEventDescription.textContent =
    event.description || t("Approved memories from this event.");

  const coverUrl = getEventCoverUrl(event, "display");

  if (coverUrl) {
    galleryHero.classList.add("has-image");
    galleryHero.style.removeProperty("background-image");
    galleryHeroMedia.style.backgroundImage = `url(${JSON.stringify(
      coverUrl,
    )})`;
  } else {
    galleryHero.classList.remove("has-image");
    galleryHero.style.removeProperty("background-image");
    galleryHeroMedia.style.removeProperty("background-image");
  }
}

function renderGuests(guests) {
  const list = guests || [];
  guestCountTitle.textContent = `${t("Event guests")} (${list.length})`;

  if (list.length === 0) {
    participantList.innerHTML = `
      <div class="empty-box">${escapeHtml(
        t("No guests have joined this event yet."),
      )}</div>
    `;
    return;
  }

  participantList.innerHTML = list
    .map((guest) => {
      const guestName = guest.guest_name || t("Unknown Guest");
      const firstLetter = guestName.trim().charAt(0).toLocaleUpperCase(
        localeByLanguage[getLanguage()] || "en-US",
      );

      return `
        <span class="participant-chip">
          <i aria-hidden="true">${escapeHtml(firstLetter || "?")}</i>
          ${escapeHtml(guestName)}
        </span>
      `;
    })
    .join("");
}

function getLikeButtonHtml(item) {
  if (!gallerySettings.allow_likes) {
    return "";
  }

  const likesCount = Number(item.likes_count || 0);
  const userLiked = Boolean(item.user_liked);
  const label = userLiked ? t("Unlike this memory") : t("Like this memory");

  return `
    <button
      type="button"
      class="public-like-button ${userLiked ? "liked" : ""}"
      data-like-media-id="${escapeHtml(item.media_id)}"
      aria-pressed="${userLiked ? "true" : "false"}"
      aria-label="${escapeHtml(label)}"
    >
      <span aria-hidden="true">${userLiked ? "♥" : "♡"}</span>
      <strong>${likesCount}</strong>
    </button>
  `;
}

function getCreatedAtTime(item) {
  const timestamp = new Date(item?.media_created_at || 0).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getMessageCardHtml(item) {
  const guestName = item.guest_name || t("Unknown Guest");
  const uploadedAt = item.media_created_at
    ? formatDateTime(item.media_created_at)
    : "";
  const guestInitial =
    guestName
      .trim()
      .charAt(0)
      .toLocaleUpperCase(localeByLanguage[getLanguage()] || "en-US") || "?";

  return `
    <article class="approved-message-card approved-feed-message">
      <div class="approved-message-quote" aria-hidden="true">“</div>
      <p>${escapeHtml(item.message.trim())}</p>

      <footer class="approved-message-author">
        <span class="approved-message-avatar" aria-hidden="true">
          ${escapeHtml(guestInitial)}
        </span>
        <span>
          <strong>${escapeHtml(guestName)}</strong>
          ${
            uploadedAt
              ? `<time datetime="${escapeHtml(
                  item.media_created_at,
                )}">${escapeHtml(uploadedAt)}</time>`
              : ""
          }
        </span>
      </footer>
    </article>
  `;
}

function getPhotoCardHtml(item, photoIndex) {
  const guestName = item.guest_name || t("Unknown Guest");
  const message = item.message || t("Approved photo");
  const uploadedAt = item.media_created_at
    ? formatDateTime(item.media_created_at)
    : "";
  const uploadedBy = t("Uploaded by {name}", { name: guestName });
  const openLabel = t("Open approved photo uploaded by {name}", {
    name: guestName,
  });
  const guestInitial =
    guestName
      .trim()
      .charAt(0)
      .toLocaleUpperCase(localeByLanguage[getLanguage()] || "en-US") || "?";
  const feedUrl = getImageDeliveryUrl(item, "feed");
  const feedSrcSet = getImageSrcSet(item);
  const srcSetAttribute = feedSrcSet
    ? `srcset="${escapeHtml(feedSrcSet)}"`
    : "";

  return `
    <article class="approved-card">
      <header class="approved-card-head">
        <span class="approved-card-avatar" aria-hidden="true">
          ${escapeHtml(guestInitial)}
        </span>
        <span class="approved-card-identity">
          <strong>${escapeHtml(guestName)}</strong>
          ${
            uploadedAt
              ? `<time datetime="${escapeHtml(
                  item.media_created_at,
                )}">${escapeHtml(uploadedAt)}</time>`
              : ""
          }
        </span>
      </header>

      <button
        type="button"
        class="approved-media-button"
        data-photo-index="${photoIndex}"
        aria-label="${escapeHtml(openLabel)}"
      >
        <img
          src="${escapeHtml(feedUrl)}"
          ${srcSetAttribute}
          sizes="(max-width: 760px) calc(100vw - 32px), (max-width: 1180px) calc(50vw - 36px), 560px"
          alt="${escapeHtml(uploadedBy)}"
          loading="lazy"
          decoding="async"
        />
        <span class="approved-media-overlay" aria-hidden="true">
          <span class="approved-overlay-author">
            <i>${escapeHtml(guestInitial)}</i>
            <span>
              <strong>${escapeHtml(guestName)}</strong>
              ${uploadedAt ? `<small>${escapeHtml(uploadedAt)}</small>` : ""}
            </span>
          </span>
          <span class="approved-overlay-open">
            <svg viewBox="0 0 24 24">
              <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"></path>
            </svg>
          </span>
        </span>
      </button>

      <div class="approved-card-body">
        <div class="approved-card-actions">
          ${getLikeButtonHtml(item)}
          <button
            type="button"
            class="public-expand-button"
            data-photo-index="${photoIndex}"
            aria-label="${escapeHtml(openLabel)}"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"></path>
            </svg>
          </button>
        </div>

        <p class="approved-card-caption">
          <strong>${escapeHtml(guestName)}</strong>
          <span>${escapeHtml(message)}</span>
        </p>
      </div>
    </article>
  `;
}

function getVideoCardHtml(item) {
  const guestName = item.guest_name || t("Unknown Guest");
  const message = item.message || t("Approved video");
  const uploadedAt = item.media_created_at
    ? formatDateTime(item.media_created_at)
    : "";
  const uploadedBy = t("Uploaded by {name}", { name: guestName });
  const guestInitial =
    guestName
      .trim()
      .charAt(0)
      .toLocaleUpperCase(localeByLanguage[getLanguage()] || "en-US") || "?";
  const videoUrl = getVideoPlaybackUrl(item);
  const posterUrl = getVideoPosterUrl(item);
  const posterAttribute = posterUrl
    ? `poster="${escapeHtml(posterUrl)}"`
    : "";

  return `
    <article class="approved-card approved-video-card">
      <header class="approved-card-head approved-video-head">
        <span class="approved-card-avatar" aria-hidden="true">
          ${escapeHtml(guestInitial)}
        </span>
        <span class="approved-card-identity">
          <strong>${escapeHtml(guestName)}</strong>
          ${
            uploadedAt
              ? `<time datetime="${escapeHtml(
                  item.media_created_at,
                )}">${escapeHtml(uploadedAt)}</time>`
              : ""
          }
        </span>
      </header>

      <div class="approved-video-frame">
        <video
          controls
          playsinline
          preload="none"
          ${posterAttribute}
          aria-label="${escapeHtml(t("Approved video uploaded by {name}", { name: guestName }))}"
        >
          <source src="${escapeHtml(videoUrl)}" />
          ${escapeHtml(t("Your browser does not support video playback."))}
        </video>

        <span class="approved-video-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="m9 7 8 5-8 5Z"></path>
          </svg>
          ${escapeHtml(t("Video"))}
        </span>
      </div>

      <div class="approved-card-body approved-video-body">
        <div class="approved-card-actions approved-video-actions">
          ${getLikeButtonHtml(item)}
        </div>

        <p class="approved-card-caption approved-video-caption">
          <strong>${escapeHtml(guestName)}</strong>
          <span>${escapeHtml(message)}</span>
        </p>
      </div>
    </article>
  `;
}

function renderApprovedFeed(media, messages) {
  const approvedVisualMedia = (media || []).filter(
    (item) =>
      ["image", "video"].includes(item.media_type) && Boolean(item.media_url),
  );

  approvedPhotos = approvedVisualMedia.filter(
    (item) => item.media_type === "image",
  );

  const photoIndexById = new Map(
    approvedPhotos.map((item, index) => [String(item.media_id), index]),
  );

  const messageItems = [];
  const seenMessageIds = new Set();

  [...(messages || []), ...(media || [])]
    .filter(
      (item) =>
        item.media_type === "message" &&
        typeof item.message === "string" &&
        item.message.trim() !== "",
    )
    .forEach((item) => {
      const key = item.media_id
        ? String(item.media_id)
        : `${item.guest_id || "guest"}-${item.media_created_at || ""}-${item.message}`;

      if (!seenMessageIds.has(key)) {
        seenMessageIds.add(key);
        messageItems.push(item);
      }
    });

  const approvedFeed = [
    ...approvedVisualMedia.map((item) => ({
      ...item,
      feed_type: item.media_type,
    })),
    ...messageItems.map((item) => ({ ...item, feed_type: "message" })),
  ].sort((a, b) => getCreatedAtTime(b) - getCreatedAtTime(a));

  memoryCountBadge.textContent = t(
    approvedFeed.length === 1 ? "{count} memory" : "{count} memories",
    { count: approvedFeed.length },
  );

  if (approvedFeed.length === 0) {
    approvedGalleryGrid.innerHTML = `
      <div class="empty-box">
        ${escapeHtml(
          t(
            "No approved memories yet. Photos, videos and messages will appear here after admin approval.",
          ),
        )}
      </div>
    `;
    return;
  }

  approvedGalleryGrid.innerHTML = approvedFeed
    .map((item) => {
      if (item.feed_type === "message") {
        return getMessageCardHtml(item);
      }

      if (item.feed_type === "video") {
        return getVideoCardHtml(item);
      }

      return getPhotoCardHtml(
        item,
        photoIndexById.get(String(item.media_id)) ?? 0,
      );
    })
    .join("");
}

function showLightboxItem(index) {
  if (!approvedPhotos.length) return;

  if (index < 0) {
    activePhotoIndex = approvedPhotos.length - 1;
  } else if (index >= approvedPhotos.length) {
    activePhotoIndex = 0;
  } else {
    activePhotoIndex = index;
  }

  const item = approvedPhotos[activePhotoIndex];
  const guestName = item.guest_name || t("Unknown Guest");
  const uploadedAt = item.media_created_at
    ? formatDateTime(item.media_created_at)
    : "";
  const uploadedBy = t("Uploaded by {name}", { name: guestName });

  publicLightboxImage.src = getImageDeliveryUrl(item, "display");
  publicLightboxImage.alt = uploadedBy;
  publicLightboxTitle.textContent = uploadedBy;

  const likeText = gallerySettings.allow_likes
    ? `♥ ${Number(item.likes_count || 0)}`
    : "";

  const metaParts = [item.message || "", uploadedAt, likeText].filter(Boolean);
  publicLightboxMeta.textContent = metaParts.join(" · ");

  const hasMultiplePhotos = approvedPhotos.length > 1;
  publicLightboxPrev.hidden = !hasMultiplePhotos;
  publicLightboxNext.hidden = !hasMultiplePhotos;
}

function openLightbox(index, trigger) {
  lightboxReturnTarget = trigger || document.activeElement;
  showLightboxItem(index);

  publicLightbox.classList.add("active");
  publicLightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  publicLightboxClose.focus();
}

function closeLightbox() {
  publicLightbox.classList.remove("active");
  publicLightbox.setAttribute("aria-hidden", "true");
  publicLightboxImage.src = "";
  document.body.style.overflow = "";

  if (lightboxReturnTarget instanceof HTMLElement) {
    lightboxReturnTarget.focus();
  }
}

function updateLikeButtons(mediaId, liked, likesCount) {
  const escapedId = CSS.escape(String(mediaId));
  const buttons = document.querySelectorAll(
    `[data-like-media-id="${escapedId}"]`,
  );

  buttons.forEach((button) => {
    button.classList.toggle("liked", liked);
    button.setAttribute("aria-pressed", liked ? "true" : "false");
    button.setAttribute(
      "aria-label",
      liked ? t("Unlike this memory") : t("Like this memory"),
    );

    const icon = button.querySelector("span");
    const count = button.querySelector("strong");

    if (icon) {
      icon.textContent = liked ? "♥" : "♡";
    }

    if (count) {
      count.textContent = likesCount;
    }
  });
}

async function handleLikeClick(button) {
  const mediaId = button.dataset.likeMediaId;

  if (!mediaId) {
    return;
  }

  try {
    button.disabled = true;

    const response = await fetch(`${API_BASE_URL}/api/media/${mediaId}/like`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        like_key: getLikeKey(),
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || data.message || "Like action failed.");
    }

    approvedPhotos = approvedPhotos.map((item) => {
      if (String(item.media_id) !== String(mediaId)) {
        return item;
      }

      return {
        ...item,
        likes_count: data.likes_count,
        user_liked: data.liked,
      };
    });

    updateLikeButtons(mediaId, data.liked, data.likes_count);

    if (
      publicLightbox.classList.contains("active") &&
      String(approvedPhotos[activePhotoIndex]?.media_id) === String(mediaId)
    ) {
      showLightboxItem(activePhotoIndex);
    }
  } catch (error) {
    console.error("Like error:", error);
    alert(t(error.message || "Like action failed."));
  } finally {
    button.disabled = false;
  }
}

async function loadGallery() {
  if (!eventCode) {
    showError("Event code not found.");
    return;
  }

  try {
    const galleryUrl = new URL(
      `${API_BASE_URL}/api/events/${encodeURIComponent(eventCode)}/gallery`,
    );

    galleryUrl.searchParams.set("like_key", getLikeKey());

    const response = await fetch(galleryUrl.toString());
    const data = await response.json();

    if (!response.ok || !data.success) {
      showError(data.error || data.message || "Gallery could not be loaded.");
      return;
    }

    gallerySettings = {
      allow_likes: data.settings?.allow_likes !== false,
    };

    renderEvent(data.event || {});
    renderGuests(data.guests || []);
    renderApprovedFeed(data.media || [], data.messages || []);
    showContent();
  } catch (error) {
    console.error("Public gallery error:", error);
    showError("Backend connection error.");
  }
}

approvedGalleryGrid.addEventListener("click", async (event) => {
  const likeButton = event.target.closest("[data-like-media-id]");

  if (likeButton) {
    event.preventDefault();
    event.stopPropagation();
    await handleLikeClick(likeButton);
    return;
  }

  const button = event.target.closest("[data-photo-index]");

  if (!button) {
    return;
  }

  openLightbox(Number(button.dataset.photoIndex), button);
});

publicLightboxClose.addEventListener("click", closeLightbox);
publicLightboxBackdrop.addEventListener("click", closeLightbox);

publicLightboxPrev.addEventListener("click", () => {
  showLightboxItem(activePhotoIndex - 1);
});

publicLightboxNext.addEventListener("click", () => {
  showLightboxItem(activePhotoIndex + 1);
});

publicLightbox.addEventListener(
  "touchstart",
  (event) => {
    touchStartX = event.changedTouches[0]?.clientX ?? null;
  },
  { passive: true },
);

publicLightbox.addEventListener(
  "touchend",
  (event) => {
    if (touchStartX === null || approvedPhotos.length < 2) return;

    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
    const distance = touchEndX - touchStartX;
    touchStartX = null;

    if (Math.abs(distance) < 50) return;
    showLightboxItem(
      distance > 0 ? activePhotoIndex - 1 : activePhotoIndex + 1,
    );
  },
  { passive: true },
);

window.addEventListener("keydown", (event) => {
  if (!publicLightbox.classList.contains("active")) {
    return;
  }

  if (event.key === "Escape") {
    closeLightbox();
  }

  if (event.key === "ArrowLeft") {
    showLightboxItem(activePhotoIndex - 1);
  }

  if (event.key === "ArrowRight") {
    showLightboxItem(activePhotoIndex + 1);
  }
});

loadGallery();
