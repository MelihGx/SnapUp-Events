import { API_URL } from "./config.js?v=runtime-api-2";

const token = localStorage.getItem("snapup_token");

const sidebarUserInitial = document.getElementById("sidebarUserInitial");
const sidebarUserName = document.getElementById("sidebarUserName");
const sidebarUserMail = document.getElementById("sidebarUserMail");

const accountTitle = document.getElementById("accountTitle");

const sidebarButtons = document.querySelectorAll("[data-panel]");
const eventsPanel = document.getElementById("eventsPanel");
const detailsPanel = document.getElementById("detailsPanel");

const accountForm = document.getElementById("accountForm");
const accountName = document.getElementById("accountName");
const accountMail = document.getElementById("accountMail");
const accountPhone = document.getElementById("accountPhone");
const accountSaveButton = document.getElementById("accountSaveButton");
const accountResult = document.getElementById("accountResult");

const emailVerificationCard = document.getElementById(
  "emailVerificationCard",
);
const emailVerificationTitle = document.getElementById(
  "emailVerificationTitle",
);
const emailVerificationDescription = document.getElementById(
  "emailVerificationDescription",
);
const emailVerificationStatus = document.getElementById(
  "emailVerificationStatus",
);
const summaryEmailStatus = document.getElementById("summaryEmailStatus");
const resendVerificationButton = document.getElementById(
  "resendVerificationButton",
);
const emailVerificationResult = document.getElementById(
  "emailVerificationResult",
);

const summaryEvents = document.getElementById("summaryEvents");
const summaryStatus = document.getElementById("summaryStatus");
const summaryCreatedAt = document.getElementById("summaryCreatedAt");

const eventsList = document.getElementById("eventsList");
const accountLogout = document.getElementById("accountLogout");

const passwordForm = document.getElementById("passwordForm");
const currentPassword = document.getElementById("currentPassword");
const newPassword = document.getElementById("newPassword");
const confirmNewPassword = document.getElementById("confirmNewPassword");
const passwordSaveButton = document.getElementById("passwordSaveButton");
const passwordResult = document.getElementById("passwordResult");


const deleteAccountOpenButton = document.getElementById(
  "deleteAccountOpenButton",
);
const deleteAccountModal = document.getElementById("deleteAccountModal");
const deleteAccountCloseButton = document.getElementById(
  "deleteAccountCloseButton",
);
const deleteAccountCancelButton = document.getElementById(
  "deleteAccountCancelButton",
);
const deleteAccountForm = document.getElementById("deleteAccountForm");
const deleteAccountPassword = document.getElementById(
  "deleteAccountPassword",
);
const deleteAccountConfirmation = document.getElementById(
  "deleteAccountConfirmation",
);
const deleteAccountConfirmButton = document.getElementById(
  "deleteAccountConfirmButton",
);
const deleteAccountResult = document.getElementById("deleteAccountResult");

const API_BASE_URL = API_URL;

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
};

function t(value) {
  return window.SnapUpI18n?.t?.(value) || value;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setResult(element, message = "", state = "") {
  element.textContent = message ? t(message) : "";

  if (state) {
    element.dataset.state = state;
  } else {
    delete element.dataset.state;
  }
}

if (!token) {
  window.location.replace("login.html");
}



let deleteAccountRequestPending = false;
let deleteAccountLastFocusedElement = null;

function setDeleteAccountResult(message = "", state = "") {
  deleteAccountResult.textContent = message ? t(message) : "";

  if (state) {
    deleteAccountResult.dataset.state = state;
  } else {
    delete deleteAccountResult.dataset.state;
  }
}

function updateDeleteAccountButtonState() {
  const hasPassword = deleteAccountPassword.value.trim().length > 0;
  const hasConfirmation =
    deleteAccountConfirmation.value.trim().toUpperCase() === "DELETE";

  deleteAccountConfirmButton.disabled =
    deleteAccountRequestPending || !hasPassword || !hasConfirmation;
}

function openDeleteAccountModal() {
  deleteAccountLastFocusedElement = document.activeElement;
  deleteAccountForm.reset();
  setDeleteAccountResult();
  deleteAccountRequestPending = false;
  updateDeleteAccountButtonState();

  deleteAccountModal.classList.add("is-open");
  deleteAccountModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("account-modal-open");

  window.setTimeout(() => deleteAccountPassword.focus(), 60);
}

function closeDeleteAccountModal() {
  if (deleteAccountRequestPending) {
    return;
  }

  deleteAccountModal.classList.remove("is-open");
  deleteAccountModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("account-modal-open");
  deleteAccountForm.reset();
  setDeleteAccountResult();
  updateDeleteAccountButtonState();

  deleteAccountLastFocusedElement?.focus?.();
}

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "-";
  }

  const language = window.SnapUpI18n?.language || "en";
  const locale = localeByLanguage[language] || "en-US";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

async function logout() {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, { method: "POST" });
  } catch (_error) {
    // Clear local state even when the backend cannot be reached.
  } finally {
    localStorage.removeItem("snapup_token");
    localStorage.removeItem("snapup_user");
    window.location.href = "login.html";
  }
}

function setActivePanel(panelName) {
  sidebarButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.panel === panelName);
  });

  eventsPanel.classList.toggle("active", panelName === "events");
  detailsPanel.classList.toggle("active", panelName === "details");

  accountTitle.textContent = t(
    panelName === "events" ? "My Events" : "Account Details",
  );
}

sidebarButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActivePanel(button.dataset.panel);
  });
});

accountLogout.addEventListener("click", logout);

async function loadProfile() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok || !data.success) {
      setResult(
        accountResult,
        data.message || "Profile could not be loaded.",
        "error",
      );
      return;
    }

    const user = data.user;

    localStorage.setItem("snapup_user", JSON.stringify(user));

    sidebarUserName.textContent = user.user_name || t("User");
    sidebarUserMail.textContent = user.user_mail || "-";
    sidebarUserInitial.textContent = user.user_name
      ? user.user_name.charAt(0).toUpperCase()
      : "S";

    accountName.value = user.user_name || "";
    accountMail.value = user.user_mail || "";
    accountPhone.value = user.user_phone || "";

    summaryStatus.textContent = t(user.is_user_active ? "Active" : "Passive");
    summaryCreatedAt.textContent = formatDate(user.user_created_at);
  } catch (error) {
    console.error("Profile error:", error);
    setResult(accountResult, "Backend connection error.", "error");
  }
}

function updateStoredVerificationStatus(user) {
  try {
    const storedUser = JSON.parse(localStorage.getItem("snapup_user") || "{}");
    localStorage.setItem(
      "snapup_user",
      JSON.stringify({ ...storedUser, ...user }),
    );
  } catch (_) {}
}

function renderEmailVerificationStatus(user) {
  const isVerified = Boolean(user?.is_email_verified);

  emailVerificationCard.classList.toggle("is-verified", isVerified);
  emailVerificationStatus.textContent = t(isVerified ? "Verified" : "Not verified");
  summaryEmailStatus.textContent = t(isVerified ? "Verified" : "Not verified");
  resendVerificationButton.hidden = isVerified;

  emailVerificationTitle.textContent = t(
    isVerified ? "Email verified" : "Verify your email",
  );
  emailVerificationDescription.textContent = t(
    isVerified
      ? "Your email address is verified and event creation is enabled."
      : "Verify your email address to create new events.",
  );

  updateStoredVerificationStatus(user);
}

async function loadEmailVerificationStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok || !data.success) {
      setResult(
        emailVerificationResult,
        data.message || "Email verification status could not be loaded.",
        "error",
      );
      return;
    }

    renderEmailVerificationStatus(data.user);
  } catch (error) {
    console.error("Email verification status error:", error);
    setResult(emailVerificationResult, "Backend connection error.", "error");
  }
}

async function resendVerificationEmail() {
  try {
    resendVerificationButton.disabled = true;
    resendVerificationButton.textContent = t("Sending...");
    setResult(emailVerificationResult);

    const response = await fetch(
      `${API_BASE_URL}/api/auth/resend-verification`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      },
    );

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok || !data.success) {
      setResult(
        emailVerificationResult,
        data.code === "VERIFICATION_EMAIL_COOLDOWN"
          ? "Please wait before requesting another verification email."
          : "Verification email could not be sent.",
        "error",
      );
      return;
    }

    if (data.already_verified) {
      renderEmailVerificationStatus({ is_email_verified: true });
      setResult(emailVerificationResult, "Email already verified.", "success");
      return;
    }

    setResult(emailVerificationResult, "Verification email sent.", "success");
  } catch (error) {
    console.error("Verification resend error:", error);
    setResult(emailVerificationResult, "Backend connection error.", "error");
  } finally {
    resendVerificationButton.disabled = false;
    resendVerificationButton.textContent = t("Resend verification email");
  }
}

resendVerificationButton.addEventListener("click", resendVerificationEmail);

function renderNoEventsMessage() {
  eventsList.innerHTML = `
    <div class="account-empty">
      <h3>No existing events found.</h3>
      <p>
        Your first memory wall is one click away — create your first SnapUp event now.
      </p>
      <a href="create-event.html" class="topbar-create-btn">
        Create Your First Event
      </a>
    </div>
  `;
}

function renderEvents(events) {
  const eventItems = Array.isArray(events) ? events : [];
  summaryEvents.textContent = eventItems.length;

  if (eventItems.length === 0) {
    renderNoEventsMessage();
    return;
  }

  eventsList.innerHTML = eventItems
    .map((event) => {
      const eventId = encodeURIComponent(event.event_id);
      const eventName = escapeHtml(event.event_name || t("Untitled Event"));
      const eventLocation =
        [event.event_location, event.event_address]
          .map((value) => String(value || "").trim())
          .filter(Boolean)
          .join(", ") || t("No location");
      const safeEventLocation = escapeHtml(eventLocation);
      const eventDate = event.event_date
        ? formatDate(event.event_date)
        : t("No date");
      const createdAt = formatDate(event.event_created_at);
      const eventCode = escapeHtml(event.event_code || "------");
      const eventStatus = escapeHtml(t(event.is_event_active ? "Active" : "Passive"));
      const statusClass = event.is_event_active ? "active" : "passive";
      let eventCoverUrl = "";
      try {
        const candidate = new URL(event.event_cover_url || "");
        if (candidate.protocol === "https:" && candidate.hostname === "res.cloudinary.com") {
          eventCoverUrl = candidate.href;
        }
      } catch (_error) {}
      const eventCoverImage = eventCoverUrl
        ? `
          <img
            class="sweet-event-cover-image"
            src="${escapeHtml(eventCoverUrl)}"
            alt="${escapeHtml(eventName)}"
            loading="lazy"
            decoding="async"
          />
        `
        : "";

      return `
        <a 
          href="event-detail.html?event_id=${eventId}" 
          class="event-item event-item-link sweet-event-card"
          aria-label="${escapeHtml(t("Open event gallery"))}: ${eventName}"
        >
          <div class="sweet-event-cover${eventCoverUrl ? " has-image" : ""}">
            ${eventCoverImage}

            <div class="sweet-camera-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                <path
                  d="M7.2 7.5L8.8 5.4C9.1 5 9.6 4.75 10.1 4.75H13.9C14.4 4.75 14.9 5 15.2 5.4L16.8 7.5H18.4C19.8 7.5 20.9 8.6 20.9 10V17.1C20.9 18.5 19.8 19.6 18.4 19.6H5.6C4.2 19.6 3.1 18.5 3.1 17.1V10C3.1 8.6 4.2 7.5 5.6 7.5H7.2Z"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linejoin="round"
                />
                <path
                  d="M12 16.4C13.8 16.4 15.25 14.95 15.25 13.15C15.25 11.35 13.8 9.9 12 9.9C10.2 9.9 8.75 11.35 8.75 13.15C8.75 14.95 10.2 16.4 12 16.4Z"
                  stroke="currentColor"
                  stroke-width="1.8"
                />
              </svg>
            </div>

            <span>Memory Wall</span>
          </div>

          <div class="sweet-event-body">
            <div class="sweet-event-head">
              <div>
                <span class="sweet-event-kicker">
                  <i></i>
                  SnapUp Event
                </span>

                <h3>${eventName}</h3>
              </div>

              <div class="sweet-event-code">
                <small>Event Code</small>
                <strong>${eventCode}</strong>
              </div>
            </div>

            <div class="sweet-event-info">
              <div class="sweet-info-chip">
                <span>
                  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                    <path
                      d="M12 21C12 21 18 15.8 18 10.5C18 7.2 15.3 4.5 12 4.5C8.7 4.5 6 7.2 6 10.5C6 15.8 12 21 12 21Z"
                      stroke="currentColor"
                      stroke-width="1.9"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M12 12.4C13.1 12.4 14 11.5 14 10.4C14 9.3 13.1 8.4 12 8.4C10.9 8.4 10 9.3 10 10.4C10 11.5 10.9 12.4 12 12.4Z"
                      stroke="currentColor"
                      stroke-width="1.9"
                    />
                  </svg>
                </span>

                <div>
                  <small>Location</small>
                  <strong>${safeEventLocation}</strong>
                </div>
              </div>

              <div class="sweet-info-chip">
                <span>
                  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                    <path
                      d="M7 4V7M17 4V7M4.5 9.5H19.5M6.5 5.8H17.5C18.6 5.8 19.5 6.7 19.5 7.8V18C19.5 19.1 18.6 20 17.5 20H6.5C5.4 20 4.5 19.1 4.5 18V7.8C4.5 6.7 5.4 5.8 6.5 5.8Z"
                      stroke="currentColor"
                      stroke-width="1.9"
                      stroke-linecap="round"
                    />
                  </svg>
                </span>

                <div>
                  <small>Date</small>
                  <strong>${eventDate}</strong>
                </div>
              </div>

              <div class="sweet-info-chip">
                <span>
                  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                    <path
                      d="M12 7.5V12L15 13.8M20 12C20 16.4 16.4 20 12 20C7.6 20 4 16.4 4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12Z"
                      stroke="currentColor"
                      stroke-width="1.9"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>

                <div>
                  <small>Created</small>
                  <strong>${createdAt}</strong>
                </div>
              </div>
            </div>

            <div class="sweet-event-bottom">
              <span class="sweet-status ${statusClass}">
                ${eventStatus}
              </span>

              <span class="sweet-gallery-btn">
                View Gallery
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                  <path
                    d="M5 12H19M19 12L13.5 6.5M19 12L13.5 17.5"
                    stroke="currentColor"
                    stroke-width="2.1"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>
        </a>
      `;
    })
    .join("");

  eventsList
    .querySelectorAll(".sweet-event-cover-image")
    .forEach((coverImage) => {
      coverImage.addEventListener(
        "error",
        () => {
          coverImage
            .closest(".sweet-event-cover")
            ?.classList.remove("has-image");
          coverImage.remove();
        },
        { once: true },
      );
    });
}

async function loadEvents() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/me/events`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok || !data.success) {
      summaryEvents.textContent = "0";
      renderNoEventsMessage();
      return;
    }

    renderEvents(data.events || []);
  } catch (error) {
    console.error("Events error:", error);

    summaryEvents.textContent = "0";
    renderNoEventsMessage();
  }
}

accountForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const user_name = accountName.value.trim();
  const user_mail = accountMail.value.trim();
  const user_phone = accountPhone.value.trim();

  if (!user_name || !user_mail) {
    setResult(accountResult, "Full name and email are required.", "error");
    return;
  }

  try {
    accountSaveButton.disabled = true;
    accountSaveButton.textContent = t("Saving...");

    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        user_name,
        user_mail,
        user_phone,
      }),
    });

    const data = await response.json();

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok || !data.success) {
      setResult(accountResult, data.message || "Update failed.", "error");
      return;
    }

    localStorage.setItem("snapup_user", JSON.stringify(data.user));

    sidebarUserName.textContent = data.user.user_name || t("User");
    sidebarUserMail.textContent = data.user.user_mail || "-";
    sidebarUserInitial.textContent = data.user.user_name
      ? data.user.user_name.charAt(0).toUpperCase()
      : "S";

    setResult(accountResult, "Account updated successfully.", "success");
    await loadEmailVerificationStatus();
  } catch (error) {
    console.error("Update error:", error);

    setResult(accountResult, "Backend connection error.", "error");
  } finally {
    accountSaveButton.disabled = false;
    accountSaveButton.textContent = t("Save changes");
  }
});

passwordForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const current_password = currentPassword.value;
  const new_password = newPassword.value;
  const confirm_new_password = confirmNewPassword.value;

  setResult(passwordResult);

  if (!current_password || !new_password || !confirm_new_password) {
    setResult(passwordResult, "All password fields are required.", "error");
    return;
  }

  const newPasswordBytes = new TextEncoder().encode(new_password).length;
  if (new_password.length < 12 || newPasswordBytes > 72) {
    setResult(
      passwordResult,
      "New password must be at least 12 characters and at most 72 UTF-8 bytes.",
      "error",
    );
    return;
  }

  if (new_password !== confirm_new_password) {
    setResult(passwordResult, "New passwords do not match.", "error");
    return;
  }

  try {
    passwordSaveButton.disabled = true;
    passwordSaveButton.textContent = t("Changing...");

    const response = await fetch(`${API_BASE_URL}/api/users/me/password`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        current_password,
        new_password,
        confirm_new_password,
      }),
    });

    const data = await response.json();

    if (response.status === 401) {
      if (data.message === "Mevcut şifre hatalı.") {
        setResult(passwordResult, "Current password is incorrect.", "error");
        return;
      }

      logout();
      return;
    }

    if (!response.ok || !data.success) {
      setResult(
        passwordResult,
        data.message || "Password update failed.",
        "error",
      );
      return;
    }

    setResult(passwordResult, "Password changed successfully.", "success");

    currentPassword.value = "";
    newPassword.value = "";
    confirmNewPassword.value = "";

    window.setTimeout(() => {
      void logout();
    }, 1200);
  } catch (error) {
    console.error("Password update error:", error);

    setResult(passwordResult, "Backend connection error.", "error");
  } finally {
    passwordSaveButton.disabled = false;
    passwordSaveButton.textContent = t("Change password");
  }
});


deleteAccountOpenButton.addEventListener("click", openDeleteAccountModal);
deleteAccountCloseButton.addEventListener("click", closeDeleteAccountModal);
deleteAccountCancelButton.addEventListener("click", closeDeleteAccountModal);

deleteAccountModal
  .querySelector("[data-delete-account-close]")
  .addEventListener("click", closeDeleteAccountModal);

[deleteAccountPassword, deleteAccountConfirmation].forEach((input) => {
  input.addEventListener("input", () => {
    if (input === deleteAccountConfirmation) {
      input.value = input.value.toUpperCase();
    }

    setDeleteAccountResult();
    updateDeleteAccountButtonState();
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && deleteAccountModal.classList.contains("is-open")) {
    closeDeleteAccountModal();
  }
});

deleteAccountForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const current_password = deleteAccountPassword.value;
  const confirmation = deleteAccountConfirmation.value.trim().toUpperCase();

  setDeleteAccountResult();

  if (!current_password.trim()) {
    setDeleteAccountResult("Current password is required.", "error");
    deleteAccountPassword.focus();
    return;
  }

  if (confirmation !== "DELETE") {
    setDeleteAccountResult("Type DELETE to confirm account deletion.", "error");
    deleteAccountConfirmation.focus();
    return;
  }

  try {
    deleteAccountRequestPending = true;
    updateDeleteAccountButtonState();
    deleteAccountCloseButton.disabled = true;
    deleteAccountCancelButton.disabled = true;
    deleteAccountConfirmButton.textContent = t("Deleting account...");
    setDeleteAccountResult(
      "Deleting your account and connected content...",
      "loading",
    );

    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        current_password,
        confirmation,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      if (response.status === 401 && data.code !== "INVALID_PASSWORD") {
        logout();
        return;
      }

      setDeleteAccountResult(
        data.code === "INVALID_PASSWORD"
          ? "Current password is incorrect."
          : data.message || "Account could not be deleted.",
        "error",
      );
      return;
    }

    localStorage.removeItem("snapup_token");
    localStorage.removeItem("snapup_user");
    sessionStorage.removeItem("snapup_after_login");

    setDeleteAccountResult(
      "Your account was deleted successfully. Redirecting...",
      "success",
    );
    deleteAccountConfirmButton.textContent = t("Account deleted");

    window.setTimeout(() => {
      window.location.replace("index.html");
    }, 1400);
  } catch (error) {
    console.error("Account deletion error:", error);
    setDeleteAccountResult("Backend connection error.", "error");
  } finally {
    if (localStorage.getItem("snapup_token")) {
      deleteAccountRequestPending = false;
      deleteAccountCloseButton.disabled = false;
      deleteAccountCancelButton.disabled = false;
      deleteAccountConfirmButton.textContent = t(
        "Delete account permanently",
      );
      updateDeleteAccountButtonState();
    }
  }
});

setActivePanel("events");
loadProfile();
loadEmailVerificationStatus();
loadEvents();
