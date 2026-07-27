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

const API_BASE_URL = "https://snapup-events-api.onrender.com";

if (!token) {
  window.location.href = "login.html";
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

  return new Date(dateValue).toLocaleDateString("tr-TR");
}

function logout() {
  localStorage.removeItem("snapup_token");
  localStorage.removeItem("snapup_user");
  window.location.href = "login.html";
}

function setActivePanel(panelName) {
  sidebarButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.panel === panelName);
  });

  eventsPanel.classList.toggle("active", panelName === "events");
  detailsPanel.classList.toggle("active", panelName === "details");

  accountTitle.textContent =
    panelName === "events" ? "My Events" : "Account Details";
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
      accountResult.textContent =
        data.message || "Profile could not be loaded.";
      accountResult.style.color = "#ff4d4d";
      return;
    }

    const user = data.user;

    localStorage.setItem("snapup_user", JSON.stringify(user));

    sidebarUserName.textContent = user.user_name || "User";
    sidebarUserMail.textContent = user.user_mail || "-";
    sidebarUserInitial.textContent = user.user_name
      ? user.user_name.charAt(0).toUpperCase()
      : "S";

    accountName.value = user.user_name || "";
    accountMail.value = user.user_mail || "";
    accountPhone.value = user.user_phone || "";

    summaryStatus.textContent = user.is_user_active ? "Active" : "Passive";
    summaryCreatedAt.textContent = formatDate(user.user_created_at);
  } catch (error) {
    console.error("Profile error:", error);
    accountResult.textContent = "Backend connection error.";
    accountResult.style.color = "#ff4d4d";
  }
}

function renderNoEventsMessage() {
  eventsList.innerHTML = `
    <div class="account-empty">
      <h3>No existing events found.</h3>
      <p>
        Your first memory wall is one click away â€” create your first SnapUp event now.
      </p>
      <a href="create-event.html" class="topbar-create-btn">
        Create Your First Event
      </a>
    </div>
  `;
}

function renderEvents(events) {
  summaryEvents.textContent = events.length;

  if (!events || events.length === 0) {
    renderNoEventsMessage();
    return;
  }

  eventsList.innerHTML = events
    .map((event) => {
      const eventId = encodeURIComponent(event.event_id);
      const eventName = event.event_name || "Untitled Event";
      const eventLocation = event.event_location || "No location";
      const eventDate = event.event_date
        ? formatDate(event.event_date)
        : "No date";
      const createdAt = formatDate(event.event_created_at);
      const eventCode = event.event_code || "------";
      const eventStatus = event.is_event_active ? "Active" : "Passive";
      const statusClass = event.is_event_active ? "active" : "passive";

      return `
        <a 
          href="event-detail.html?event_id=${eventId}" 
          class="event-item event-item-link sweet-event-card"
          aria-label="Open ${eventName} gallery"
        >
          <div class="sweet-event-cover">
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
                  <strong>${eventLocation}</strong>
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
    accountResult.textContent = "Full name and email are required.";
    accountResult.style.color = "#ff4d4d";
    return;
  }

  try {
    accountSaveButton.disabled = true;
    accountSaveButton.textContent = "Saving...";

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
      accountResult.textContent = data.message || "Update failed.";
      accountResult.style.color = "#ff4d4d";
      return;
    }

    localStorage.setItem("snapup_user", JSON.stringify(data.user));

    sidebarUserName.textContent = data.user.user_name || "User";
    sidebarUserMail.textContent = data.user.user_mail || "-";
    sidebarUserInitial.textContent = data.user.user_name
      ? data.user.user_name.charAt(0).toUpperCase()
      : "S";

    accountResult.textContent = "Account updated successfully.";
    accountResult.style.color = "#21c55d";
  } catch (error) {
    console.error("Update error:", error);

    accountResult.textContent = "Backend connection error.";
    accountResult.style.color = "#ff4d4d";
  } finally {
    accountSaveButton.disabled = false;
    accountSaveButton.textContent = "Save changes";
  }
});

passwordForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const current_password = currentPassword.value.trim();
  const new_password = newPassword.value.trim();
  const confirm_new_password = confirmNewPassword.value.trim();

  passwordResult.textContent = "";

  if (!current_password || !new_password || !confirm_new_password) {
    passwordResult.textContent = "All password fields are required.";
    passwordResult.style.color = "#ff4d4d";
    return;
  }

  if (new_password.length < 6) {
    passwordResult.textContent = "New password must be at least 6 characters.";
    passwordResult.style.color = "#ff4d4d";
    return;
  }

  if (new_password !== confirm_new_password) {
    passwordResult.textContent = "New passwords do not match.";
    passwordResult.style.color = "#ff4d4d";
    return;
  }

  try {
    passwordSaveButton.disabled = true;
    passwordSaveButton.textContent = "Changing...";

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
      if (data.message === "Mevcut ÅŸifre hatalÄ±.") {
        passwordResult.textContent = data.message;
        passwordResult.style.color = "#ff4d4d";
        return;
      }

      logout();
      return;
    }

    if (!response.ok || !data.success) {
      passwordResult.textContent = data.message || "Password update failed.";
      passwordResult.style.color = "#ff4d4d";
      return;
    }

    passwordResult.textContent = "Password changed successfully.";
    passwordResult.style.color = "#21c55d";

    currentPassword.value = "";
    newPassword.value = "";
    confirmNewPassword.value = "";
  } catch (error) {
    console.error("Password update error:", error);

    passwordResult.textContent = "Backend connection error.";
    passwordResult.style.color = "#ff4d4d";
  } finally {
    passwordSaveButton.disabled = false;
    passwordSaveButton.textContent = "Change password";
  }
});

setActivePanel("events");
loadProfile();
loadEvents();
