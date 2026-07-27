const token = localStorage.getItem("snapup_token");

const API_BASE_URL = "https://snapup-events-api.onrender.com";

const detailLoading = document.getElementById("detailLoading");
const detailError = document.getElementById("detailError");
const detailErrorText = document.getElementById("detailErrorText");
const detailContent = document.getElementById("detailContent");

const eventCover = document.getElementById("eventCover");
const eventTitle = document.getElementById("eventTitle");
const eventDescription = document.getElementById("eventDescription");
const eventCode = document.getElementById("eventCode");
const qrBox = document.getElementById("qrBox");

const eventLocation = document.getElementById("eventLocation");
const eventDate = document.getElementById("eventDate");
const eventTime = document.getElementById("eventTime");
const eventCreatedAt = document.getElementById("eventCreatedAt");
const eventStatus = document.getElementById("eventStatus");
const eventPrivacy = document.getElementById("eventPrivacy");

const settingsList = document.getElementById("settingsList");
const mediaGallery = document.getElementById("mediaGallery");

const guestList = document.getElementById("guestList");
const guestSearchInput = document.getElementById("guestSearchInput");
const guestResultCount = document.getElementById("guestResultCount");
const guestTotalBadge = document.getElementById("guestTotalBadge");

const galleryLightbox = document.getElementById("galleryLightbox");
const galleryLightboxBackdrop = document.getElementById(
  "galleryLightboxBackdrop",
);
const galleryLightboxClose = document.getElementById("galleryLightboxClose");
const galleryLightboxPrev = document.getElementById("galleryLightboxPrev");
const galleryLightboxNext = document.getElementById("galleryLightboxNext");
const galleryLightboxImage = document.getElementById("galleryLightboxImage");
const galleryLightboxTitle = document.getElementById("galleryLightboxTitle");
const galleryLightboxMeta = document.getElementById("galleryLightboxMeta");

const copyCodeButton = document.getElementById("copyCodeButton");
const copyJoinLinkButton = document.getElementById("copyJoinLinkButton");
const downloadQrButton = document.getElementById("downloadQrButton");
const approveAllImagesButton = document.getElementById(
  "approveAllImagesButton",
);
const downloadSlideshowButton = document.getElementById(
  "downloadSlideshowButton",
);

const openSettingsButton = document.getElementById("openSettingsButton");
const settingsModal = document.getElementById("settingsModal");
const settingsModalClose = document.getElementById("settingsModalClose");
const settingsForm = document.getElementById("settingsForm");
const settingsSaveButton = document.getElementById("settingsSaveButton");
const settingsResult = document.getElementById("settingsResult");
const deleteEventButton = document.getElementById("deleteEventButton");

const settingAllowUpload = document.getElementById("settingAllowUpload");
const settingOnlyUsers = document.getElementById("settingOnlyUsers");
const settingAllowComments = document.getElementById("settingAllowComments");
const settingAllowLikes = document.getElementById("settingAllowLikes");
const settingRequireApproval = document.getElementById(
  "settingRequireApproval",
);
const settingAllowGalleryView = document.getElementById(
  "settingAllowGalleryView",
);
const settingMaxStorage = document.getElementById("settingMaxStorage");
const settingMaxUpload = document.getElementById("settingMaxUpload");

const guestNameInput = document.getElementById("guestName");
const photoInput = document.getElementById("photoInput");
const uploadPhotoBtn = document.getElementById("uploadPhotoBtn");
const uploadMessage = document.getElementById("uploadMessage");
const photoPreviewBox = document.getElementById("photoPreviewBox");
const photoPreview = document.getElementById("photoPreview");

const params = new URLSearchParams(window.location.search);
const eventId = params.get("event_id");

let currentEvent = null;
let currentSettings = null;
let currentRenderedMediaList = [];

let galleryLightboxItems = [];
let activeGalleryIndex = 0;

let allMediaItems = [];
let activeMediaFilter = "all";

let allGuests = [];
let guestSearchTerm = "";

if (!token) {
  window.location.href = "login.html";
}

if (!eventId) {
  showError("Event ID bulunamadı. Account sayfasından tekrar giriş yap.");
}

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function logout() {
  localStorage.removeItem("snapup_token");
  localStorage.removeItem("snapup_user");
  window.location.href = "login.html";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "-";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split("-");
    return `${day}.${month}.${year}`;
  }

  return new Date(dateValue).toLocaleDateString("tr-TR");
}

function formatDateTime(dateValue) {
  if (!dateValue) {
    return "-";
  }

  return new Date(dateValue).toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatTime(timeValue) {
  if (!timeValue) {
    return null;
  }

  return String(timeValue).slice(0, 5);
}

function getEventTimeText(event) {
  const start = formatTime(event.event_start_time);
  const finish = formatTime(event.event_finish_time);

  if (start && finish) {
    return `${start} - ${finish}`;
  }

  if (start) {
    return start;
  }

  return "-";
}

function getJoinUrl(event) {
  if (!event?.event_code) {
    return "";
  }

  const joinUrl = new URL("index.html", window.location.href);
  joinUrl.searchParams.set("code", event.event_code);

  return joinUrl.toString();
}

function getQrImageUrl(event) {
  const joinUrl = getJoinUrl(event);

  if (!joinUrl) {
    return "";
  }

  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
    joinUrl,
  )}`;
}

function showError(message) {
  detailLoading.hidden = true;
  detailContent.hidden = true;
  detailError.hidden = false;
  detailErrorText.textContent = message;
}

function showContent() {
  detailLoading.hidden = true;
  detailError.hidden = true;
  detailContent.hidden = false;
}

function renderEventInfo(event) {
  currentEvent = event;

  eventTitle.textContent = event.event_name || "Untitled Event";
  eventDescription.textContent =
    event.description || "No description added for this event.";

  eventCode.textContent = event.event_code || "------";

  eventLocation.textContent = event.event_location || "-";
  eventDate.textContent = formatDate(event.event_date);
  eventTime.textContent = getEventTimeText(event);
  eventCreatedAt.textContent = formatDateTime(event.event_created_at);
  eventStatus.textContent = event.is_event_active ? "Active" : "Passive";
  eventPrivacy.textContent = event.is_event_private ? "Private" : "Public";

  if (event.event_cover_url) {
    eventCover.classList.add("has-image");
    eventCover.style.backgroundImage = `url("${event.event_cover_url}")`;
  }

  const joinUrl = getJoinUrl(event);
  const qrImageUrl = getQrImageUrl(event);

  if (qrImageUrl) {
    qrBox.innerHTML = `
      <a
        href="${escapeHtml(joinUrl)}"
        class="qr-click-link"
        target="_blank"
        rel="noopener"
        title="Open guest upload page"
      >
        <img src="${escapeHtml(qrImageUrl)}" alt="Event QR code" />
      </a>
      <small class="qr-helper-text">Scan or click to join this event</small>
    `;
  } else {
    qrBox.innerHTML = `
      <span>QR code not found.</span>
    `;
  }
}

function fillSettingsForm(settings) {
  if (
    !settingAllowUpload ||
    !settingOnlyUsers ||
    !settingAllowComments ||
    !settingAllowLikes ||
    !settingRequireApproval ||
    !settingAllowGalleryView ||
    !settingMaxStorage ||
    !settingMaxUpload
  ) {
    return;
  }

  if (!settings) {
    settingAllowUpload.checked = true;
    settingOnlyUsers.checked = false;
    settingAllowComments.checked = true;
    settingAllowLikes.checked = true;
    settingRequireApproval.checked = false;
    settingAllowGalleryView.checked = true;
    settingMaxStorage.value = 500;
    settingMaxUpload.value = 20;
    return;
  }

  settingAllowUpload.checked = Boolean(settings.allow_upload);
  settingOnlyUsers.checked = Boolean(settings.only_users);
  settingAllowComments.checked = Boolean(settings.allow_comments);
  settingAllowLikes.checked = Boolean(settings.allow_likes);
  settingRequireApproval.checked = Boolean(settings.require_approval);
  settingAllowGalleryView.checked = settings.allow_gallery_view !== false;
  settingMaxStorage.value = settings.max_storage_per_guest || 500;
  settingMaxUpload.value = settings.max_upload_per_guest || 20;
}

function renderSettings(settings) {
  currentSettings = settings;
  fillSettingsForm(settings);

  if (!settings) {
    settingsList.innerHTML = `
      <div class="setting-row">
        <strong>No settings found</strong>
        <span class="off">Empty</span>
      </div>
    `;
    return;
  }

  const settingItems = [
    {
      label: "Allow Upload",
      value: settings.allow_upload,
    },
    {
      label: "Only Registered Users",
      value: settings.only_users,
    },
    {
      label: "Allow Comments",
      value: settings.allow_comments,
    },
    {
      label: "Allow Likes",
      value: settings.allow_likes,
    },
    {
      label: "Require Approval",
      value: settings.require_approval,
    },
    {
      label: "Public Gallery",
      value: settings.allow_gallery_view !== false,
    },
    {
      label: "Max Storage / Guest",
      customValue: `${settings.max_storage_per_guest || 0} MB`,
    },
    {
      label: "Max Upload / Guest",
      customValue: `${settings.max_upload_per_guest || 0}`,
    },
  ];

  settingsList.innerHTML = settingItems
    .map((item) => {
      if (item.customValue) {
        return `
          <div class="setting-row">
            <strong>${escapeHtml(item.label)}</strong>
            <span class="on">${escapeHtml(item.customValue)}</span>
          </div>
        `;
      }

      return `
        <div class="setting-row">
          <strong>${escapeHtml(item.label)}</strong>
          <span class="${item.value ? "on" : "off"}">
            ${item.value ? "On" : "Off"}
          </span>
        </div>
      `;
    })
    .join("");
}

function getMediaUrl(media) {
  return media.media_url || media.url || media.file_url || "";
}

function getMediaType(media) {
  return String(
    media.media_type || media.type || media.media_type_name || "",
  ).toLowerCase();
}

function getMediaStatus(media) {
  return String(media.media_status || media.status || "approved").toLowerCase();
}

function isImageMedia(media) {
  const mediaType = getMediaType(media);
  const mediaUrl = getMediaUrl(media);

  return Boolean(mediaUrl) && mediaType.includes("image");
}

function shouldShowApproveAllImagesButton(mediaList) {
  if (!approveAllImagesButton) {
    return false;
  }

  if (activeMediaFilter !== "pending") {
    return false;
  }

  if (!mediaList || mediaList.length === 0) {
    return false;
  }

  return mediaList.some(
    (media) => getMediaStatus(media) === "pending" && isImageMedia(media),
  );
}

function updateApproveAllImagesButtonVisibility(mediaList) {
  if (!approveAllImagesButton) {
    return;
  }

  approveAllImagesButton.hidden = !shouldShowApproveAllImagesButton(mediaList);
}

function getMediaKind(media) {
  const mediaType = getMediaType(media);
  const mediaUrl = getMediaUrl(media);

  if (mediaType.includes("video")) {
    return "video";
  }

  if (mediaType.includes("image")) {
    return "image";
  }

  if (mediaType.includes("message") || mediaType.includes("text")) {
    return "message";
  }

  if (mediaUrl) {
    return "image";
  }

  return "message";
}

function getFilteredMediaList() {
  if (activeMediaFilter === "all") {
    return allMediaItems;
  }

  if (activeMediaFilter === "pending") {
    return allMediaItems.filter((media) => getMediaStatus(media) === "pending");
  }

  return allMediaItems.filter(
    (media) => getMediaKind(media) === activeMediaFilter,
  );
}

function getFilterCount(filterKey) {
  if (filterKey === "all") {
    return allMediaItems.length;
  }

  if (filterKey === "pending") {
    return allMediaItems.filter((media) => getMediaStatus(media) === "pending")
      .length;
  }

  return allMediaItems.filter((media) => getMediaKind(media) === filterKey)
    .length;
}

function ensureMediaFilterBar() {
  if (!mediaGallery || !mediaGallery.parentElement) {
    return null;
  }

  let filterBar = document.getElementById("mediaFilterBar");

  if (!filterBar) {
    filterBar = document.createElement("div");
    filterBar.id = "mediaFilterBar";
    filterBar.className = "media-filter-bar";
    mediaGallery.parentElement.insertBefore(filterBar, mediaGallery);
  }

  return filterBar;
}

function renderMediaFilters() {
  const filterBar = ensureMediaFilterBar();

  if (!filterBar) {
    return;
  }

  const filters = [
    { key: "all", label: "All" },
    { key: "image", label: "Images" },
    { key: "video", label: "Videos" },
    { key: "message", label: "Messages" },
    { key: "pending", label: "Pending" },
  ];

  filterBar.innerHTML = filters
    .map((filter) => {
      const count = getFilterCount(filter.key);

      return `
        <button
          type="button"
          class="${activeMediaFilter === filter.key ? "active" : ""}"
          data-media-filter="${filter.key}"
        >
          ${escapeHtml(filter.label)}
          <span>${count}</span>
        </button>
      `;
    })
    .join("");

  filterBar.querySelectorAll("[data-media-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeMediaFilter = button.dataset.mediaFilter || "all";
      renderMediaFilters();
      renderMediaCards();
    });
  });
}

function getStatusLabel(status) {
  if (status === "pending") {
    return "Pending";
  }

  if (status === "rejected") {
    return "Rejected";
  }

  return "Approved";
}

function getTypeLabel(type) {
  if (type === "image") {
    return "Image";
  }

  if (type === "video") {
    return "Video";
  }

  return "Message";
}

function renderAdminActions(mediaId, status) {
  const approveButton =
    status !== "approved"
      ? `
        <button
          type="button"
          class="media-admin-btn approve"
          data-media-action="approve"
          data-media-id="${escapeHtml(mediaId)}"
        >
          Approve
        </button>
      `
      : "";

  const rejectButton =
    status !== "rejected"
      ? `
        <button
          type="button"
          class="media-admin-btn reject"
          data-media-action="reject"
          data-media-id="${escapeHtml(mediaId)}"
        >
          Reject
        </button>
      `
      : "";

  return `
    <div class="media-admin-actions">
      ${approveButton}
      ${rejectButton}
      <button
        type="button"
        class="media-admin-btn delete"
        data-media-action="delete"
        data-media-id="${escapeHtml(mediaId)}"
      >
        Delete
      </button>
    </div>
  `;
}

function renderMediaCards() {
  galleryLightboxItems = [];

  const mediaList = getFilteredMediaList();

  currentRenderedMediaList = mediaList || [];
  updateApproveAllImagesButtonVisibility(currentRenderedMediaList);

  if (!mediaList || mediaList.length === 0) {
    mediaGallery.innerHTML = `
      <div class="empty-gallery">
        <div>
          <h3>No media found.</h3>
          <p>
            There are no uploaded memories for this filter yet.
          </p>
        </div>
      </div>
    `;
    return;
  }

  mediaGallery.innerHTML = mediaList
    .map((media) => {
      const mediaId = media.media_id || media.id || "";
      const mediaUrl = getMediaUrl(media);
      const mediaKind = getMediaKind(media);
      const status = getMediaStatus(media);
      const message = media.message || media.media_message || "";
      const guestName =
        media.guest_name ||
        media.guestName ||
        media.user_name ||
        media.userName ||
        "Unknown Guest";

      const uploadedAt = media.media_created_at
        ? formatDateTime(media.media_created_at)
        : "";

      const uploaderHtml = `
        <div class="media-uploader">
          <span>Uploaded by</span>
          <strong>${escapeHtml(guestName)}</strong>
          ${uploadedAt ? `<small>${escapeHtml(uploadedAt)}</small>` : ""}
        </div>
      `;

      const badgeHtml = `
        <div class="media-badge-row">
          <span class="media-type-badge ${escapeHtml(mediaKind)}">
            ${escapeHtml(getTypeLabel(mediaKind))}
          </span>
          <span class="media-status-badge ${escapeHtml(status)}">
            ${escapeHtml(getStatusLabel(status))}
          </span>
        </div>
      `;

      if (mediaUrl && mediaKind === "video") {
        return `
          <article class="media-card admin-media-card">
            <div class="media-preview-wrap">
              ${badgeHtml}
              <video src="${escapeHtml(mediaUrl)}" controls></video>
            </div>

            <div class="media-card-body">
              ${uploaderHtml}
              <p>${escapeHtml(message || "Video memory")}</p>
              ${renderAdminActions(mediaId, status)}
            </div>
          </article>
        `;
      }

      if (mediaUrl && mediaKind === "image") {
        const galleryIndex = galleryLightboxItems.length;

        galleryLightboxItems.push({
          url: mediaUrl,
          guestName,
          uploadedAt,
          message: message || "Photo memory",
        });

        return `
          <article class="media-card admin-media-card">
            <div class="media-preview-wrap">
              ${badgeHtml}
              <button
                type="button"
                class="media-lightbox-trigger"
                data-gallery-index="${galleryIndex}"
                aria-label="Open photo uploaded by ${escapeHtml(guestName)}"
              >
                <img src="${escapeHtml(mediaUrl)}" alt="Uploaded by ${escapeHtml(
                  guestName,
                )}" />
              </button>
            </div>

            <div class="media-card-body">
              ${uploaderHtml}
              <p>${escapeHtml(message || "Photo memory")}</p>
              ${renderAdminActions(mediaId, status)}
            </div>
          </article>
        `;
      }

      return `
        <article class="media-card admin-media-card text-memory-card">
          <div class="media-card-body">
            ${badgeHtml}
            ${uploaderHtml}
            <p>${escapeHtml(message || "Text memory")}</p>
            ${renderAdminActions(mediaId, status)}
          </div>
        </article>
      `;
    })
    .join("");

  bindGalleryLightboxButtons();
}

function renderMedia(mediaList) {
  allMediaItems = Array.isArray(mediaList) ? mediaList : [];
  currentRenderedMediaList = getFilteredMediaList();

  updateApproveAllImagesButtonVisibility(currentRenderedMediaList);

  renderMediaFilters();
  renderMediaCards();
}

function showGalleryLightboxItem(index) {
  if (
    !galleryLightboxItems.length ||
    !galleryLightboxImage ||
    !galleryLightboxTitle ||
    !galleryLightboxMeta
  ) {
    return;
  }

  if (index < 0) {
    activeGalleryIndex = galleryLightboxItems.length - 1;
  } else if (index >= galleryLightboxItems.length) {
    activeGalleryIndex = 0;
  } else {
    activeGalleryIndex = index;
  }

  const item = galleryLightboxItems[activeGalleryIndex];

  galleryLightboxImage.src = item.url;
  galleryLightboxImage.alt = `Uploaded by ${item.guestName}`;
  galleryLightboxTitle.textContent = `Uploaded by ${item.guestName}`;

  const metaParts = [item.message, item.uploadedAt].filter(Boolean);
  galleryLightboxMeta.textContent = metaParts.join(" · ");

  const hasMultipleItems = galleryLightboxItems.length > 1;

  if (galleryLightboxPrev) {
    galleryLightboxPrev.hidden = !hasMultipleItems;
  }

  if (galleryLightboxNext) {
    galleryLightboxNext.hidden = !hasMultipleItems;
  }
}

function openGalleryLightbox(index) {
  if (!galleryLightbox || !galleryLightboxImage) {
    return;
  }

  showGalleryLightboxItem(index);

  galleryLightbox.classList.add("active");
  galleryLightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("gallery-lightbox-open");
}

function closeGalleryLightbox() {
  if (!galleryLightbox || !galleryLightboxImage) {
    return;
  }

  galleryLightbox.classList.remove("active");
  galleryLightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("gallery-lightbox-open");

  galleryLightboxImage.src = "";
}

function bindGalleryLightboxButtons() {
  const buttons = document.querySelectorAll("[data-gallery-index]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.galleryIndex);
      openGalleryLightbox(index);
    });
  });
}

function getFilteredGuests() {
  const searchValue = guestSearchTerm.trim().toLocaleLowerCase("tr-TR");

  if (!searchValue) {
    return allGuests;
  }

  return allGuests.filter((guest) => {
    const guestName = guest.guest_name || "";

    return guestName.toLocaleLowerCase("tr-TR").includes(searchValue);
  });
}

function renderGuestTotalBadge(totalCount) {
  if (!guestTotalBadge) {
    return;
  }

  guestTotalBadge.textContent = `${totalCount} guest${
    totalCount === 1 ? "" : "s"
  }`;
}

function renderGuestResultCount(visibleCount, totalCount) {
  if (!guestResultCount) {
    return;
  }

  if (totalCount === 0) {
    guestResultCount.textContent = "No guests have joined this event yet.";
    return;
  }

  if (guestSearchTerm.trim() !== "") {
    guestResultCount.textContent = `${visibleCount} of ${totalCount} guests found.`;
    return;
  }

  guestResultCount.textContent = `${totalCount} guest${
    totalCount === 1 ? "" : "s"
  } joined this event.`;
}

function renderGuests() {
  if (!guestList) {
    return;
  }

  const filteredGuests = getFilteredGuests();

  renderGuestTotalBadge(allGuests.length);
  renderGuestResultCount(filteredGuests.length, allGuests.length);

  if (!allGuests || allGuests.length === 0) {
    guestList.innerHTML = `
      <div class="guest-empty">
        No guests have joined this event yet.
      </div>
    `;
    return;
  }

  if (filteredGuests.length === 0) {
    guestList.innerHTML = `
      <div class="guest-empty">
        No guests matched your search.
      </div>
    `;
    return;
  }

  guestList.innerHTML = filteredGuests
    .map((guest) => {
      const guestName = guest.guest_name || "Unknown Guest";
      const totalUploads = guest.total_uploads || 0;
      const pendingUploads = guest.pending_uploads || 0;
      const approvedUploads = guest.approved_uploads || 0;
      const rejectedUploads = guest.rejected_uploads || 0;

      return `
        <article class="guest-card">
          <div class="guest-avatar">
            ${escapeHtml(guestName.charAt(0).toUpperCase())}
          </div>

          <div class="guest-main">
            <strong>${escapeHtml(guestName)}</strong>
            <span>${totalUploads} upload${totalUploads === 1 ? "" : "s"}</span>
          </div>

          <div class="guest-stats">
            <span class="approved">${approvedUploads} approved</span>
            <span class="pending">${pendingUploads} pending</span>
            <span class="rejected">${rejectedUploads} rejected</span>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadEventGuests() {
  if (!eventId || !guestList) {
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/events/detail/${eventId}/guests`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || data.message || "Guests could not be loaded.",
      );
    }

    allGuests = data.guests || [];
    renderGuests();
  } catch (error) {
    console.error("Guest list error:", error);

    allGuests = [];
    renderGuestTotalBadge(0);

    if (guestResultCount) {
      guestResultCount.textContent =
        error.message || "Guests could not be loaded.";
    }

    guestList.innerHTML = `
      <div class="guest-empty error">
        ${escapeHtml(error.message || "Guests could not be loaded.")}
      </div>
    `;
  }
}

async function loadEventDetail() {
  if (!eventId) {
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/events/detail/${eventId}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok || !data.success) {
      showError(data.message || "Event detail could not be loaded.");
      return;
    }

    renderEventInfo(data.event);
    renderSettings(data.settings);
    renderMedia(data.media || []);
    await loadEventGuests();
    showContent();
  } catch (error) {
    console.error("Event detail error:", error);
    showError("Backend connection error.");
  }
}

function openSettingsModal() {
  if (!settingsModal) {
    return;
  }

  fillSettingsForm(currentSettings);

  if (settingsResult) {
    settingsResult.textContent = "";
  }

  settingsModal.classList.add("active");
  settingsModal.setAttribute("aria-hidden", "false");
}

function closeSettingsModal() {
  if (!settingsModal) {
    return;
  }

  settingsModal.classList.remove("active");
  settingsModal.setAttribute("aria-hidden", "true");
}

function getSettingsPayload() {
  return {
    allow_upload: settingAllowUpload.checked,
    only_users: settingOnlyUsers.checked,
    allow_comments: settingAllowComments.checked,
    allow_likes: settingAllowLikes.checked,
    require_approval: settingRequireApproval.checked,
    allow_gallery_view: settingAllowGalleryView.checked,
    max_storage_per_guest: Number(settingMaxStorage.value) || 500,
    max_upload_per_guest: Number(settingMaxUpload.value) || 20,
  };
}

async function updateEventSettings(payload) {
  const response = await fetch(
    `${API_BASE_URL}/api/events/detail/${eventId}/settings`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  const data = await response.json();

  if (response.status === 401) {
    logout();
    return null;
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Settings could not be updated.");
  }

  return data.settings;
}

async function deleteCurrentEvent() {
  const response = await fetch(`${API_BASE_URL}/api/events/detail/${eventId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (response.status === 401) {
    logout();
    return;
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Event could not be deleted.");
  }

  window.location.href = "account.html";
}

function setUploadMessage(message, type = "info") {
  if (!uploadMessage) {
    return;
  }

  uploadMessage.textContent = message;
  uploadMessage.className = `upload-message ${type}`;
}

async function createGuestForUpload(guestName) {
  const response = await fetch(`${API_BASE_URL}/api/media/guests`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      event_id: eventId,
      guest_name: guestName,
    }),
  });

  const data = await response.json();

  if (response.status === 401) {
    logout();
    return null;
  }

  if (!response.ok || !data.success) {
    throw new Error(
      data.error || data.message || "Guest could not be created.",
    );
  }

  return data.guest;
}

async function uploadPhotoToEvent(guestId, file) {
  const formData = new FormData();

  formData.append("media", file);
  formData.append("event_id", eventId);
  formData.append("guest_id", guestId);

  const response = await fetch(`${API_BASE_URL}/api/media/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || "Photo upload failed.");
  }

  return data.media;
}

async function updateMediaStatus(mediaId, status) {
  const response = await fetch(`${API_BASE_URL}/api/media/${mediaId}/status`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      media_status: status,
    }),
  });

  const data = await response.json();

  if (response.status === 401) {
    logout();
    return null;
  }

  if (!response.ok || !data.success) {
    throw new Error(
      data.error || data.message || "Media status could not be updated.",
    );
  }

  return data.media;
}

async function deleteMediaItem(mediaId) {
  const response = await fetch(`${API_BASE_URL}/api/media/${mediaId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (response.status === 401) {
    logout();
    return;
  }

  if (!response.ok || !data.success) {
    throw new Error(
      data.error || data.message || "Media could not be deleted.",
    );
  }
}

async function handleMediaAdminAction(action, mediaId) {
  if (!mediaId) {
    return;
  }

  try {
    if (action === "delete") {
      const confirmDelete = confirm(
        "This uploaded memory will be deleted. Are you sure?",
      );

      if (!confirmDelete) {
        return;
      }

      await deleteMediaItem(mediaId);
      await loadEventDetail();
      return;
    }

    if (action === "approve") {
      await updateMediaStatus(mediaId, "approved");
      await loadEventDetail();
      return;
    }

    if (action === "reject") {
      await updateMediaStatus(mediaId, "rejected");
      await loadEventDetail();
    }
  } catch (error) {
    console.error("Media admin action error:", error);
    alert(error.message || "Media action failed.");
  }
}

if (copyCodeButton) {
  copyCodeButton.addEventListener("click", async () => {
    if (!currentEvent?.event_code) {
      return;
    }

    await navigator.clipboard.writeText(currentEvent.event_code);
    copyCodeButton.textContent = "Copied!";

    setTimeout(() => {
      copyCodeButton.textContent = "Copy Code";
    }, 1300);
  });
}

if (copyJoinLinkButton) {
  copyJoinLinkButton.addEventListener("click", async () => {
    if (!currentEvent) {
      return;
    }

    await navigator.clipboard.writeText(getJoinUrl(currentEvent));
    copyJoinLinkButton.textContent = "Copied!";

    setTimeout(() => {
      copyJoinLinkButton.textContent = "Copy Join Link";
    }, 1300);
  });
}

if (downloadQrButton) {
  downloadQrButton.addEventListener("click", async () => {
    const qrImageUrl = getQrImageUrl(currentEvent);

    if (!qrImageUrl) {
      return;
    }

    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const downloadLink = document.createElement("a");
      downloadLink.href = objectUrl;
      downloadLink.download = `snapup-event-${currentEvent.event_code}.png`;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      window.open(qrImageUrl, "_blank");
    }
  });
}

if (downloadSlideshowButton) {
  downloadSlideshowButton.addEventListener("click", async () => {
    if (!eventId) {
      return;
    }

    try {
      downloadSlideshowButton.disabled = true;
      downloadSlideshowButton.textContent = "Preparing...";

      const response = await fetch(
        `${API_BASE_URL}/api/events/detail/${eventId}/slideshow`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.message ||
            errorData?.error ||
            "Slideshow could not be downloaded.",
        );
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const contentDisposition =
        response.headers.get("Content-Disposition") ||
        response.headers.get("content-disposition");

      let fileName = `snapup-${
        currentEvent?.event_code || "event"
      }-slideshow.pdf`;

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);

        if (fileNameMatch?.[1]) {
          fileName = fileNameMatch[1];
        }
      }

      const downloadLink = document.createElement("a");
      downloadLink.href = objectUrl;
      downloadLink.download = fileName;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      alert(error.message || "Slideshow could not be downloaded.");
    } finally {
      downloadSlideshowButton.disabled = false;
      downloadSlideshowButton.textContent = "Download Slideshow";
    }
  });
}

if (openSettingsButton) {
  openSettingsButton.addEventListener("click", openSettingsModal);
}

if (settingsModalClose) {
  settingsModalClose.addEventListener("click", closeSettingsModal);
}

if (settingsModal) {
  settingsModal.addEventListener("click", (event) => {
    if (event.target === settingsModal) {
      closeSettingsModal();
    }
  });
}

if (settingsForm) {
  settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      settingsSaveButton.disabled = true;
      settingsSaveButton.textContent = "Saving...";

      settingsResult.textContent = "";

      const payload = getSettingsPayload();
      const updatedSettings = await updateEventSettings(payload);

      if (!updatedSettings) {
        return;
      }

      renderSettings(updatedSettings);

      settingsResult.textContent = "Settings updated successfully.";
      settingsResult.style.color = "#21c55d";
    } catch (error) {
      settingsResult.textContent = error.message;
      settingsResult.style.color = "#ff4d4d";
    } finally {
      settingsSaveButton.disabled = false;
      settingsSaveButton.textContent = "Save Settings";
    }
  });
}

if (deleteEventButton) {
  deleteEventButton.addEventListener("click", async () => {
    const confirmDelete = confirm(
      "This event will be permanently deleted. Are you sure?",
    );

    if (!confirmDelete) {
      return;
    }

    try {
      deleteEventButton.disabled = true;
      deleteEventButton.textContent = "Deleting...";

      if (settingsResult) {
        settingsResult.textContent = "";
      }

      await deleteCurrentEvent();
    } catch (error) {
      deleteEventButton.disabled = false;
      deleteEventButton.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
          <path
            d="M9 4H15M4.5 7H19.5M10 11V17M14 11V17M6.5 7L7.2 19C7.3 20.1 8.2 21 9.3 21H14.7C15.8 21 16.7 20.1 16.8 19L17.5 7"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Delete Event
      `;

      if (settingsResult) {
        settingsResult.textContent = error.message;
        settingsResult.style.color = "#ff4d4d";
      }
    }
  });
}

if (mediaGallery) {
  mediaGallery.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-media-action]");

    if (!actionButton) {
      return;
    }

    const action = actionButton.dataset.mediaAction;
    const mediaId = actionButton.dataset.mediaId;

    handleMediaAdminAction(action, mediaId);
  });
}

if (guestSearchInput) {
  guestSearchInput.addEventListener("input", () => {
    guestSearchTerm = guestSearchInput.value || "";
    renderGuests();
  });
}

if (galleryLightboxClose) {
  galleryLightboxClose.addEventListener("click", closeGalleryLightbox);
}

if (galleryLightboxBackdrop) {
  galleryLightboxBackdrop.addEventListener("click", closeGalleryLightbox);
}

if (galleryLightboxPrev) {
  galleryLightboxPrev.addEventListener("click", () => {
    showGalleryLightboxItem(activeGalleryIndex - 1);
  });
}

if (galleryLightboxNext) {
  galleryLightboxNext.addEventListener("click", () => {
    showGalleryLightboxItem(activeGalleryIndex + 1);
  });
}

window.addEventListener("keydown", (event) => {
  if (!galleryLightbox?.classList.contains("active")) {
    return;
  }

  if (event.key === "Escape") {
    closeGalleryLightbox();
  }

  if (event.key === "ArrowLeft") {
    showGalleryLightboxItem(activeGalleryIndex - 1);
  }

  if (event.key === "ArrowRight") {
    showGalleryLightboxItem(activeGalleryIndex + 1);
  }
});

if (photoInput) {
  photoInput.addEventListener("change", () => {
    const file = photoInput.files[0];

    if (!file) {
      if (photoPreviewBox) {
        photoPreviewBox.classList.add("hidden");
      }

      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setUploadMessage("Only JPG, PNG and WEBP images are allowed.", "error");
      photoInput.value = "";

      if (photoPreviewBox) {
        photoPreviewBox.classList.add("hidden");
      }

      return;
    }

    const imageUrl = URL.createObjectURL(file);

    if (photoPreview) {
      photoPreview.src = imageUrl;
    }

    if (photoPreviewBox) {
      photoPreviewBox.classList.remove("hidden");
    }

    setUploadMessage("", "info");
  });
}

if (uploadPhotoBtn) {
  uploadPhotoBtn.addEventListener("click", async () => {
    try {
      const guestName = guestNameInput?.value.trim();
      const file = photoInput?.files[0];

      if (!eventId) {
        setUploadMessage("Event ID not found in URL.", "error");
        return;
      }

      if (!guestName) {
        setUploadMessage("Please enter your name.", "error");
        return;
      }

      if (!file) {
        setUploadMessage("Please choose a photo first.", "error");
        return;
      }

      uploadPhotoBtn.disabled = true;
      uploadPhotoBtn.textContent = "Uploading...";
      setUploadMessage("Uploading photo, please wait...", "info");

      const guest = await createGuestForUpload(guestName);

      if (!guest) {
        return;
      }

      await uploadPhotoToEvent(guest.guest_id, file);

      setUploadMessage("Photo uploaded successfully!", "success");

      photoInput.value = "";

      if (photoPreview) {
        photoPreview.src = "";
      }

      if (photoPreviewBox) {
        photoPreviewBox.classList.add("hidden");
      }

      await loadEventDetail();
    } catch (error) {
      console.error("Upload error:", error);
      setUploadMessage(
        error.message || "Something went wrong while uploading.",
        "error",
      );
    } finally {
      uploadPhotoBtn.disabled = false;
      uploadPhotoBtn.textContent = "Upload Photo";
    }
  });
}

async function approveAllImages() {
  if (!eventId || !token || !approveAllImagesButton) {
    return;
  }

  const pendingImageCount = currentRenderedMediaList.filter(
    (media) => getMediaStatus(media) === "pending" && isImageMedia(media),
  ).length;

  if (pendingImageCount === 0) {
    approveAllImagesButton.hidden = true;
    return;
  }

  const confirmed = confirm(
    `Are you sure you want to approve ${pendingImageCount} pending photo(s)?`,
  );

  if (!confirmed) {
    return;
  }

  try {
    approveAllImagesButton.disabled = true;
    approveAllImagesButton.textContent = "Approving...";

    const response = await fetch(
      `${API_BASE_URL}/api/media/events/${eventId}/approve-images`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || data.message || "Photos could not be approved.",
      );
    }

    alert(data.message || "All pending photos approved successfully.");

    activeMediaFilter = "pending";
    await loadEventDetail();
  } catch (error) {
    alert(error.message || "Photos could not be approved.");
    console.error("Approve all photos error:", error);
  } finally {
    approveAllImagesButton.disabled = false;
    approveAllImagesButton.textContent = "Approve All Photos";
    updateApproveAllImagesButtonVisibility(currentRenderedMediaList);
  }
}
if (approveAllImagesButton) {
  approveAllImagesButton.addEventListener("click", approveAllImages);
}

loadEventDetail();
