"use strict";

const EXTRA_STORAGE_GB = 5;
const EXTRA_STORAGE_BYTES = EXTRA_STORAGE_GB * 1024 ** 3;
const TURKEY_PRICE = 1000;
const GLOBAL_PRICE = 29;

let modalRoot = null;
let lastFocusedElement = null;

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

function normalizeCountry(value) {
  const country = String(value || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(country) ? country : null;
}

async function detectCountry() {
  try {
    const response = await fetch("/cdn-cgi/trace", {
      cache: "no-store",
      credentials: "same-origin",
    });

    if (response.ok) {
      const trace = await response.text();
      const line = trace.split("\n").find((item) => item.startsWith("loc="));
      const country = normalizeCountry(line?.slice(4));
      if (country) return country;
    }
  } catch (_error) {}

  try {
    if (Intl.DateTimeFormat().resolvedOptions().timeZone === "Europe/Istanbul") {
      return "TR";
    }
  } catch (_error) {}

  return null;
}

function packageLabel(packageKey) {
  const normalized = String(packageKey || "free").trim().toLowerCase();
  if (normalized === "premium") return "Premium";
  if (normalized === "plus") return "Plus";
  if (normalized === "mini") return "Mini";
  return "Free";
}

function packageBaseBytes(packageKey) {
  const normalized = String(packageKey || "free").trim().toLowerCase();
  if (normalized === "premium") return 20 * 1024 ** 3;
  if (normalized === "plus") return 10 * 1024 ** 3;
  if (normalized === "mini") return 5 * 1024 ** 3;
  return 100 * 1024 ** 2;
}

function formatStorage(bytes) {
  const safeBytes = Math.max(0, Number(bytes) || 0);
  const gb = safeBytes / 1024 ** 3;
  if (gb >= 1) {
    const value = Math.abs(gb - Math.round(gb)) < 0.01 ? Math.round(gb) : gb.toFixed(1);
    return `${value} GB`;
  }
  return `${Math.round(safeBytes / 1024 ** 2)} MB`;
}

function formatPrice(country) {
  if (country === "TR") {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(TURKEY_PRICE);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(GLOBAL_PRICE);
}

function ensureModal() {
  if (modalRoot) return modalRoot;

  const wrapper = document.createElement("div");
  wrapper.className = "snapup-extra-storage-modal";
  wrapper.hidden = true;
  wrapper.innerHTML = `
    <div class="snapup-extra-storage-modal__backdrop" data-extra-storage-close></div>
    <section
      class="snapup-extra-storage-modal__dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="snapupExtraStorageTitle"
    >
      <button
        type="button"
        class="snapup-extra-storage-modal__close"
        data-extra-storage-close
        aria-label="${escapeHtml(t("Close"))}"
      >×</button>

      <div class="snapup-extra-storage-modal__head">
        <span>${escapeHtml(t("Extra storage"))}</span>
        <h2 id="snapupExtraStorageTitle">+5 GB</h2>
        <p>${escapeHtml(t("Add more space to this event without changing its package."))}</p>
      </div>

      <div class="snapup-extra-storage-modal__plan" data-extra-storage-plan></div>

      <div class="snapup-extra-storage-modal__capacity">
        <div>
          <small>${escapeHtml(t("Current capacity"))}</small>
          <strong data-extra-storage-current>—</strong>
        </div>
        <span class="snapup-extra-storage-modal__arrow" aria-hidden="true">→</span>
        <div>
          <small>${escapeHtml(t("New capacity"))}</small>
          <strong data-extra-storage-new>—</strong>
        </div>
      </div>

      <div class="snapup-extra-storage-modal__offer">
        <div class="snapup-extra-storage-modal__offer-copy">
          <span>+5 GB</span>
          <small>${escapeHtml(t("One-time storage add-on for this event"))}</small>
        </div>
        <strong data-extra-storage-price>—</strong>
      </div>

      <div class="snapup-extra-storage-modal__note">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M12 10v6M12 7.5h.01"></path>
        </svg>
        <p>${escapeHtml(t("The extra 5 GB follows this event's existing archive period."))}</p>
      </div>

      <p class="snapup-extra-storage-modal__result" data-extra-storage-result aria-live="polite"></p>

      <div class="snapup-extra-storage-modal__actions">
        <button type="button" class="snapup-extra-storage-modal__cancel" data-extra-storage-close>
          ${escapeHtml(t("Cancel"))}
        </button>
        <button type="button" class="snapup-extra-storage-modal__continue" data-extra-storage-continue>
          ${escapeHtml(t("Add 5 GB"))}
        </button>
      </div>
    </section>
  `;

  document.body.appendChild(wrapper);

  wrapper.querySelectorAll("[data-extra-storage-close]").forEach((button) => {
    button.addEventListener("click", closeExtraStorage);
  });

  wrapper.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeExtraStorage();
  });

  modalRoot = wrapper;
  return wrapper;
}

export function closeExtraStorage() {
  if (!modalRoot) return;
  modalRoot.hidden = true;
  document.documentElement.classList.remove("snapup-extra-storage-open");
  if (lastFocusedElement?.focus) lastFocusedElement.focus();
  lastFocusedElement = null;
}

export async function openExtraStorage({
  packageKey = "free",
  limitBytes = 0,
  usedBytes = 0,
  eventName = "",
} = {}) {
  const normalizedPackage = String(packageKey || "free").trim().toLowerCase();
  if (normalizedPackage === "free") return;

  const modal = ensureModal();
  const plan = modal.querySelector("[data-extra-storage-plan]");
  const current = modal.querySelector("[data-extra-storage-current]");
  const next = modal.querySelector("[data-extra-storage-new]");
  const price = modal.querySelector("[data-extra-storage-price]");
  const result = modal.querySelector("[data-extra-storage-result]");
  const continueButton = modal.querySelector("[data-extra-storage-continue]");

  const currentLimit = Math.max(Number(limitBytes) || 0, packageBaseBytes(normalizedPackage));
  const newLimit = currentLimit + EXTRA_STORAGE_BYTES;
  const safeUsedBytes = Math.max(0, Number(usedBytes) || 0);

  plan.innerHTML = `
    <div>
      <small>${escapeHtml(t("Event package"))}</small>
      <strong>${escapeHtml(packageLabel(normalizedPackage))}</strong>
    </div>
    ${eventName ? `<span>${escapeHtml(eventName)}</span>` : ""}
  `;

  current.textContent = formatStorage(currentLimit);
  next.textContent = formatStorage(newLimit);
  price.textContent = t("Detecting price...");
  result.textContent = "";
  delete result.dataset.state;
  continueButton.disabled = false;
  continueButton.textContent = t("Add 5 GB");

  lastFocusedElement = document.activeElement;
  modal.hidden = false;
  document.documentElement.classList.add("snapup-extra-storage-open");
  modal.querySelector(".snapup-extra-storage-modal__close")?.focus();

  const country = await detectCountry();
  price.textContent = formatPrice(country);

  continueButton.onclick = () => {
    result.textContent = t(
      "Frontend preview only. Payment and storage activation will be connected in the next step.",
    );
    result.dataset.state = "info";
  };
}
