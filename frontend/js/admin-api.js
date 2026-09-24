import { API_URL } from "./config.js?v=runtime-api-2";

function getToken() {
  return localStorage.getItem("snapup_token") || "";
}

async function adminRequest(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_URL}/api/admin${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    localStorage.removeItem("snapup_token");
    localStorage.removeItem("snapup_user");
    sessionStorage.setItem("snapup_after_login", "admin.html");
    window.location.replace("login.html");
    throw new Error("Admin session expired.");
  }

  if (response.status === 403) {
    window.location.replace("account.html");
    throw new Error("Admin access denied.");
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Admin API failed (${response.status}).`);
  }

  return data;
}

export async function getAdminDashboard() {
  return adminRequest("/dashboard");
}

export async function getAdminStorage() {
  return adminRequest("/storage");
}

export async function getAdminAnalytics(days = 30) {
  const normalizedDays = [7, 30, 90, 365].includes(Number(days))
    ? Number(days)
    : 30;

  return adminRequest(`/analytics?days=${normalizedDays}`);
}

export async function getAdminUsers() {
  return adminRequest("/users");
}

export async function getAdminUser(userId) {
  return adminRequest(`/users/${encodeURIComponent(userId)}`);
}

export async function getAdminEvents() {
  return adminRequest("/events");
}

export async function getAdminEvent(eventId) {
  return adminRequest(`/events/${encodeURIComponent(eventId)}`);
}


export async function createAdminUser(payload) {
  return adminRequest("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createAdminEventForUser(userId, payload) {
  return adminRequest(`/users/${encodeURIComponent(userId)}/events`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAdminLogs() {
  return adminRequest("/logs");
}


export async function deleteAdminUser(userId, payload) {
  return adminRequest(`/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    body: JSON.stringify(payload),
  });
}


export async function setAdminUserActiveStatus(userId, payload) {
  return adminRequest(`/users/${encodeURIComponent(userId)}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}


export async function setAdminEventSuspension(eventId, payload) {
  return adminRequest(`/events/${encodeURIComponent(eventId)}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function changeAdminEventPackage(eventId, payload) {
  return adminRequest(`/events/${encodeURIComponent(eventId)}/package`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function setAdminEventStorageOverride(eventId, payload) {
  return adminRequest(
    `/events/${encodeURIComponent(eventId)}/storage-override`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}
