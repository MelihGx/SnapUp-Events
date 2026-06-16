"use strict";

import { $, $$ } from "./utils.js";
import { createEvent } from "./events-api.js";

export function initCreateEvent() {
  const popup = $("#createEventPopup");
  const form = $("#createEventPopupForm");
  const input = $("#popupEventNameInput");
  const inputError = $("#createEventNameError");
  const result = $("#createEventPopupResult");
  const backButton = $("#createEventPopupBack");
  const nextButton = $("#createEventPopupNext");
  const submitButton = $("#createEventPopupSubmit");
  const openButtons = $$('[data-open-create-event-popup]');
  const closeButtons = $$('[data-close-create-event-popup]');
  const panels = $$('[data-create-event-panel]');
  const stepIndicators = $$('[data-step-indicator]');
  const packageInfoButton = $("#createEventPackageInfoBtn");
  const paymentSummary = $("#createEventPaymentSummary");
  const demoCardName = $("#demoCardName");
  const demoCardNumber = $("#demoCardNumber");
  const demoCardExpiry = $("#demoCardExpiry");
  const demoCardCvc = $("#demoCardCvc");
  const paymentCardPreviewName = $("#paymentCardPreviewName");
  const paymentCardPreviewNumber = $("#paymentCardPreviewNumber");
  const paymentCardPreviewDate = $("#paymentCardPreviewDate");

  if (!popup || !form || !input || !result || !backButton || !nextButton || !submitButton) return;

  const stepCount = panels.length;
  let currentStep = 0;
  let maxVisitedStep = 0;

  const packageLabels = {
    starter: "Starter",
    standard: "Standard",
    premium: "Premium",
  };

  const packageDetails = {
    starter: "Free · 50 guests · 500 MB",
    standard: "₺149 · 150 guests · 2 GB",
    premium: "₺299 · Unlimited guests · 10 GB",
  };

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function resetResult() {
    result.className = "create-event-popup-result";
    result.innerHTML = "";
  }

  function showResult(type, html) {
    result.className = `create-event-popup-result show ${type}`;
    result.innerHTML = html;
  }

  function updatePreviewCode(eventCode) {
    const previewCode = $("#eventCode");
    if (previewCode) previewCode.textContent = eventCode;
  }

  function showInputError(message) {
    if (inputError) inputError.textContent = message;
    input.classList.add("input-error");
    input.focus();
  }

  function clearInputError() {
    if (inputError) inputError.textContent = "";
    input.classList.remove("input-error");
  }

  function setStep(step) {
    currentStep = Math.max(0, Math.min(step, stepCount - 1));
    maxVisitedStep = Math.max(maxVisitedStep, currentStep);

    panels.forEach((panel, index) => {
      panel.classList.toggle("active", index === currentStep);
    });

    stepIndicators.forEach((indicator, index) => {
      indicator.classList.toggle("active", index === currentStep);
      indicator.classList.toggle("completed", index < currentStep);
      indicator.disabled = index > maxVisitedStep || currentStep === stepCount - 1;
      indicator.setAttribute("aria-current", index === currentStep ? "step" : "false");
    });

    const resultStep = stepCount - 1;
    const paymentStep = resultStep - 1;

    backButton.style.display = currentStep > 0 && currentStep < resultStep ? "inline-flex" : "none";
    nextButton.style.display = currentStep < paymentStep ? "inline-flex" : "none";
    submitButton.style.display = currentStep === paymentStep ? "inline-flex" : "none";
    if (!submitButton.disabled) {
      submitButton.textContent = currentStep === paymentStep ? "Confirm & Generate Code" : "Generate Code";
    }

    if (currentStep === 0) setTimeout(() => input.focus(), 80);
    if (currentStep === paymentStep) {
      updatePaymentSummary();
      setTimeout(() => demoCardName?.focus(), 80);
    }
  }

  function goToPricingSection() {
    closePopup();

    requestAnimationFrame(() => {
      const pricingSection = $("#pricing");
      if (!pricingSection) return;

      pricingSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      history.replaceState(null, "", "#pricing");
    });
  }

  function resetWizard() {
    form.reset();
    clearInputError();
    resetResult();
    submitButton.disabled = false;
    submitButton.textContent = "Generate Code";
    backButton.textContent = "Back";
    maxVisitedStep = 0;
    setStep(0);
  }

  function selectPackage(packageName) {
    if (!packageName) return;

    const packageInput = form.querySelector(`input[name="eventPackage"][value="${packageName}"]`);
    if (packageInput) packageInput.checked = true;
  }

  function openPopup(event) {
    event?.preventDefault();

    const trigger = event?.currentTarget;
    selectPackage(trigger?.dataset?.package);

    popup.classList.add("open");
    popup.setAttribute("aria-hidden", "false");
    document.body.classList.add("create-event-popup-open");

    setTimeout(() => input.focus(), 120);
  }

  function closePopup() {
    popup.classList.remove("open");
    popup.setAttribute("aria-hidden", "true");
    document.body.classList.remove("create-event-popup-open");
    resetWizard();
  }

  function validateEventStep() {
    const eventName = input.value.trim();

    if (!eventName) {
      showInputError("Please enter an event name.");
      return false;
    }

    clearInputError();
    return true;
  }

  function getNumberSetting(name, fallbackValue) {
    const value = Number(form.elements[name]?.value);
    return Number.isFinite(value) && value > 0 ? value : fallbackValue;
  }

  function getSelectedSettings() {
    return {
      allow_upload: form.elements.allow_upload?.checked ?? true,
      allow_comments: form.elements.allow_comments?.checked ?? true,
      allow_likes: form.elements.allow_likes?.checked ?? true,
      require_approval: form.elements.require_approval?.checked ?? false,
      max_storage_per_guest: getNumberSetting("max_storage_per_guest", 500),
      max_upload_per_guest: getNumberSetting("max_upload_per_guest", 20),
      only_users: form.elements.only_users?.checked ?? false,
    };
  }

  function getSelectedPackage() {
    const selected = form.querySelector('input[name="eventPackage"]:checked');
    return selected?.value || "standard";
  }

  function getSettingsSummary(settings) {
    return [
      settings.allow_upload ? "Uploads enabled" : "Uploads disabled",
      settings.allow_comments ? "Comments enabled" : "Comments disabled",
      settings.allow_likes ? "Likes enabled" : "Likes disabled",
      settings.require_approval ? "Approval required" : "Approval not required",
      settings.only_users ? "Registered users only" : "All guests can join",
      `${settings.max_storage_per_guest} MB / guest`,
      `${settings.max_upload_per_guest} upload / guest`,
    ];
  }

  function generateQRPreview(eventCode) {
    const size = 13;
    let seed = 0;

    for (let index = 0; index < eventCode.length; index++) {
      seed = (seed * 31 + eventCode.charCodeAt(index)) % 9973;
    }

    function isFinder(row, col) {
      const areas = [
        row < 4 && col < 4,
        row < 4 && col > size - 5,
        row > size - 5 && col < 4,
      ];

      if (!areas.some(Boolean)) return null;

      const localRow = row > size - 5 ? row - (size - 4) : row;
      const localCol = col > size - 5 ? col - (size - 4) : col;

      return localRow === 0 || localRow === 3 || localCol === 0 || localCol === 3 || (localRow === 1 && localCol === 1) || (localRow === 1 && localCol === 2) || (localRow === 2 && localCol === 1) || (localRow === 2 && localCol === 2);
    }

    let html = '<div class="create-event-result-qr" aria-label="QR preview">';

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const finder = isFinder(row, col);
        const pseudoRandom = (row * 17 + col * 29 + seed) % 7;
        const active = finder === true || (finder === null && pseudoRandom > 2);
        html += `<span class="${active ? "on" : ""}"></span>`;
      }
    }

    html += "</div>";
    return html;
  }

  function updatePaymentSummary() {
    if (!paymentSummary) return;

    const selectedPackage = getSelectedPackage();
    const label = packageLabels[selectedPackage] || "Standard";
    const details = packageDetails[selectedPackage] || packageDetails.standard;

    paymentSummary.innerHTML = `
      <span>Selected package</span>
      <strong>${escapeHTML(label)}</strong>
      <small>${escapeHTML(details)}</small>
    `;
  }

  function formatCardNumber(value) {
    return value
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  }

  function formatExpiry(value) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  function updatePaymentPreview() {
    if (paymentCardPreviewName) {
      paymentCardPreviewName.textContent = demoCardName?.value.trim().toUpperCase() || "CARD HOLDER";
    }

    if (paymentCardPreviewNumber) {
      paymentCardPreviewNumber.textContent = demoCardNumber?.value.trim() || "•••• •••• •••• ••••";
    }

    if (paymentCardPreviewDate) {
      paymentCardPreviewDate.textContent = demoCardExpiry?.value.trim() || "MM/YY";
    }
  }

  async function copyText(value, button) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    const oldText = button.textContent;
    button.textContent = "Copied!";

    setTimeout(() => {
      button.textContent = oldText;
    }, 1400);
  }

  openButtons.forEach((button) => {
    button.addEventListener("click", openPopup);
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", closePopup);
  });

  stepIndicators.forEach((indicator) => {
    indicator.addEventListener("click", () => {
      const targetStep = Number(indicator.dataset.stepIndicator);

      if (targetStep <= maxVisitedStep && targetStep < stepCount - 1) {
        setStep(targetStep);
      }
    });
  });

  input.addEventListener("input", clearInputError);

  packageInfoButton?.addEventListener("click", goToPricingSection);

  backButton.addEventListener("click", () => {
    setStep(currentStep - 1);
  });

  nextButton.addEventListener("click", () => {
    if (currentStep === 0 && !validateEventStep()) return;
    setStep(currentStep + 1);
  });

  popup.addEventListener("click", (event) => {
    if (event.target === popup) closePopup();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && popup.classList.contains("open")) {
      closePopup();
    }
  });

  result.addEventListener("click", (event) => {
    const copyButton = event.target.closest("[data-copy-created-code]");
    if (!copyButton) return;

    const eventCode = copyButton.dataset.copyCreatedCode;
    if (eventCode) copyText(eventCode, copyButton);
  });

  demoCardName?.addEventListener("input", updatePaymentPreview);

  demoCardNumber?.addEventListener("input", () => {
    demoCardNumber.value = formatCardNumber(demoCardNumber.value);
    updatePaymentPreview();
  });

  demoCardExpiry?.addEventListener("input", () => {
    demoCardExpiry.value = formatExpiry(demoCardExpiry.value);
    updatePaymentPreview();
  });

  demoCardCvc?.addEventListener("input", () => {
    demoCardCvc.value = demoCardCvc.value.replace(/\D/g, "").slice(0, 3);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateEventStep()) {
      setStep(0);
      return;
    }

    const eventName = input.value.trim();
    const settings = getSelectedSettings();
    const selectedPackage = getSelectedPackage();

    setStep(4);
    submitButton.disabled = true;
    submitButton.textContent = "Generating...";
    showResult("loading", "Demo payment confirmed. Creating your event and preparing the code and QR...");

    try {
      const data = await createEvent({
        eventName,
        packageName: selectedPackage,
        settings,
      });
      const createdEvent = data.event;

      const safeEventName = escapeHTML(createdEvent.eventName);
      const safeEventCode = escapeHTML(createdEvent.eventCode);
      const safePackage = escapeHTML(packageLabels[selectedPackage]);
      const safePackageDetails = escapeHTML(packageDetails[selectedPackage]);
      const settingsSummary = getSettingsSummary(settings)
        .map((item) => `<li>${escapeHTML(item)}</li>`)
        .join("");

      updatePreviewCode(createdEvent.eventCode);

      showResult(
        "success",
        `
          <strong class="create-event-result-title">Event created successfully.</strong>
          <span>Event name: ${safeEventName}</span>

          <div class="create-event-result-body">
            ${generateQRPreview(createdEvent.eventCode)}

            <div class="create-event-result-details">
              <small>Event Code</small>
              <div class="create-event-result-code-row">
                <span class="create-event-result-code">${safeEventCode}</span>
                <button
                  class="create-event-copy-code"
                  type="button"
                  data-copy-created-code="${safeEventCode}"
                >
                  Copy Code
                </button>
              </div>

              <div class="create-event-result-summary">
                <b>${safePackage}</b>
                <span>${safePackageDetails}</span>
              </div>
            </div>
          </div>

          <ul class="create-event-settings-summary">
            ${settingsSummary}
          </ul>

          <small>Share this code and QR area with your guests.</small>
        `,
      );
    } catch (error) {
      showResult(
        "error",
        error.message || "Backend connection error occurred.",
      );
      backButton.style.display = "inline-flex";
      backButton.textContent = "Back";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Confirm & Generate Code";
    }
  });

  resetWizard();
}
