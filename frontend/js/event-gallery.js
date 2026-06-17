const API_BASE_URL = "https://snapup-events-api.onrender.com";

const galleryLoading = document.getElementById("galleryLoading");
const galleryError = document.getElementById("galleryError");
const galleryErrorText = document.getElementById("galleryErrorText");
const galleryContent = document.getElementById("galleryContent");

const galleryHero = document.getElementById("galleryHero");
const galleryEventTitle = document.getElementById("galleryEventTitle");
const galleryEventMeta = document.getElementById("galleryEventMeta");
const galleryEventDescription = document.getElementById(
  "galleryEventDescription",
);
const guestCountTitle = document.getElementById("guestCountTitle");
const participantList = document.getElementById("participantList");
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

let approvedPhotos = [];
let activePhotoIndex = 0;
let gallerySettings = {
  allow_likes: true,
};

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

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}.${month}.${year}`;
  }

  return new Date(value).toLocaleDateString("tr-TR");
}

function formatDateTime(value) {
  if (!value) return "";

  return new Date(value).toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function showError(message) {
  galleryLoading.hidden = true;
  galleryContent.hidden = true;
  galleryError.hidden = false;
  galleryErrorText.textContent = message;
}

function showContent() {
  galleryLoading.hidden = true;
  galleryError.hidden = true;
  galleryContent.hidden = false;
}

function renderEvent(event) {
  galleryEventTitle.textContent = event.event_name || "Untitled Event";

  const metaParts = [
    event.event_location || "",
    formatDate(event.event_date),
    event.event_code || "",
  ].filter(Boolean);

  galleryEventMeta.textContent = metaParts.join(" · ");
  galleryEventDescription.textContent =
    event.description || "Approved memories from this event.";

  if (event.event_cover_url) {
    galleryHero.classList.add("has-image");
    galleryHero.style.backgroundImage = `url("${event.event_cover_url}")`;
  }
}

function renderGuests(guests) {
  const list = guests || [];
  guestCountTitle.textContent = `Event guests (${list.length})`;

  if (list.length === 0) {
    participantList.innerHTML = `
      <div class="empty-box">No guests have joined this event yet.</div>
    `;
    return;
  }

  participantList.innerHTML = list
    .map((guest) => {
      const guestName = guest.guest_name || "Unknown Guest";
      const firstLetter = guestName.charAt(0).toUpperCase();

      return `
        <span class="participant-chip">
          <i>${escapeHtml(firstLetter)}</i>
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

  return `
    <button
      type="button"
      class="public-like-button ${userLiked ? "liked" : ""}"
      data-like-media-id="${escapeHtml(item.media_id)}"
      aria-pressed="${userLiked ? "true" : "false"}"
      aria-label="${userLiked ? "Unlike this photo" : "Like this photo"}"
    >
      <span>${userLiked ? "♥" : "♡"}</span>
      <strong>${likesCount}</strong>
    </button>
  `;
}

function renderApprovedPhotos(media) {
  approvedPhotos = media || [];

  if (approvedPhotos.length === 0) {
    approvedGalleryGrid.innerHTML = `
      <div class="empty-box">
        No approved photos yet. Photos will appear here after admin approval.
      </div>
    `;
    return;
  }

  approvedGalleryGrid.innerHTML = approvedPhotos
    .map((item, index) => {
      const guestName = item.guest_name || "Unknown Guest";
      const message = item.message || "Approved photo";
      const uploadedAt = item.media_created_at
        ? formatDateTime(item.media_created_at)
        : "";

      return `
        <article class="approved-card">
          <button
            type="button"
            data-photo-index="${index}"
            aria-label="Open approved photo uploaded by ${escapeHtml(
              guestName,
            )}"
          >
            <img src="${escapeHtml(item.media_url)}" alt="Uploaded by ${escapeHtml(
              guestName,
            )}" />
          </button>

          <div class="approved-card-body">
            <strong>Uploaded by ${escapeHtml(guestName)}</strong>
            <p>${escapeHtml(message)}</p>
            ${uploadedAt ? `<p>${escapeHtml(uploadedAt)}</p>` : ""}

            <div class="approved-card-actions">
              ${getLikeButtonHtml(item)}
            </div>
          </div>
        </article>
      `;
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
  const guestName = item.guest_name || "Unknown Guest";
  const uploadedAt = item.media_created_at
    ? formatDateTime(item.media_created_at)
    : "";

  publicLightboxImage.src = item.media_url;
  publicLightboxImage.alt = `Uploaded by ${guestName}`;
  publicLightboxTitle.textContent = `Uploaded by ${guestName}`;

  const likeText = gallerySettings.allow_likes
    ? `♥ ${Number(item.likes_count || 0)}`
    : "";

  const metaParts = [item.message || "", uploadedAt, likeText].filter(Boolean);
  publicLightboxMeta.textContent = metaParts.join(" · ");

  const hasMultiplePhotos = approvedPhotos.length > 1;
  publicLightboxPrev.hidden = !hasMultiplePhotos;
  publicLightboxNext.hidden = !hasMultiplePhotos;
}

function openLightbox(index) {
  showLightboxItem(index);

  publicLightbox.classList.add("active");
  publicLightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  publicLightbox.classList.remove("active");
  publicLightbox.setAttribute("aria-hidden", "true");
  publicLightboxImage.src = "";
  document.body.style.overflow = "";
}

function updateLikeButtons(mediaId, liked, likesCount) {
  const buttons = document.querySelectorAll(
    `[data-like-media-id="${CSS.escape(mediaId)}"]`,
  );

  buttons.forEach((button) => {
    button.classList.toggle("liked", liked);
    button.setAttribute("aria-pressed", liked ? "true" : "false");
    button.setAttribute(
      "aria-label",
      liked ? "Unlike this photo" : "Like this photo",
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
      if (item.media_id !== mediaId) {
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
      approvedPhotos[activePhotoIndex]?.media_id === mediaId
    ) {
      showLightboxItem(activePhotoIndex);
    }
  } catch (error) {
    console.error("Like error:", error);
    alert(error.message || "Like action failed.");
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

    renderEvent(data.event);
    renderGuests(data.guests || []);
    renderApprovedPhotos(data.media || []);
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

  openLightbox(Number(button.dataset.photoIndex));
});

publicLightboxClose.addEventListener("click", closeLightbox);
publicLightboxBackdrop.addEventListener("click", closeLightbox);

publicLightboxPrev.addEventListener("click", () => {
  showLightboxItem(activePhotoIndex - 1);
});

publicLightboxNext.addEventListener("click", () => {
  showLightboxItem(activePhotoIndex + 1);
});

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
