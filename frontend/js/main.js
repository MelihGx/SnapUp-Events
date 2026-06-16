"use strict";

import { initNav } from "./navbar.js";
import { initReveal } from "./reveal.js";
import { initPhoneTilt } from "./phone-tilt.js";
import { initQRPreview } from "./qr-preview.js";
import { initCopyCode } from "./copy-code.js";
import { initUploadSimulation } from "./upload-simulation.js";
import { testBackendConnection } from "./events-api.js";
import { initJoinUploadModal } from "./join-upload-modal.js";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("snapup_user") || "null");
  } catch (error) {
    return null;
  }
}

function logoutUser() {
  localStorage.removeItem("snapup_token");
  localStorage.removeItem("snapup_user");
  window.location.href = "index.html";
}

function renderAuthArea(container, isMobile = false) {
  if (!container) {
    return;
  }

  const token = localStorage.getItem("snapup_token");
  const user = getStoredUser();

  if (!token || !user) {
    container.innerHTML = `
      <a href="login.html" class="btn btn-ghost">Login</a>
      <a href="register.html" class="btn btn-hot">Register</a>
    `;
    return;
  }

  container.innerHTML = `
    <a href="account.html" class="btn btn-ghost nav-account-btn">
      <span class="nav-account-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M4 20a8 8 0 0 1 16 0"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>

      <span class="nav-account-text">
        ${isMobile ? "My Account" : user.user_name || "My Account"}
      </span>
    </a>

    <button type="button" class="btn btn-ghost nav-logout-btn">
      Logout
    </button>
  `;

  const logoutButton = container.querySelector(".nav-logout-btn");

  if (logoutButton) {
    logoutButton.addEventListener("click", logoutUser);
  }
}

function initAuthNavbar() {
  const navAuth = document.getElementById("navAuth");
  const mobileNavAuth = document.getElementById("mobileNavAuth");

  renderAuthArea(navAuth, false);
  renderAuthArea(mobileNavAuth, true);
}

function initApp() {
  initAuthNavbar();

  initNav();
  initReveal();
  initPhoneTilt();
  initQRPreview();
  initCopyCode();
  initUploadSimulation();
  initJoinUploadModal();
  testBackendConnection();
}

document.addEventListener("DOMContentLoaded", initApp);
