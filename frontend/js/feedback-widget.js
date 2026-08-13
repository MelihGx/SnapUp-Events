import { API_URL } from "./config.js?v=runtime-api-2";
import {
  createTurnstileController,
  getTurnstileErrorMessage,
} from "./turnstile.js?v=turnstile-1";
import {
  feedbackText,
  getFeedbackDirection,
  getFeedbackLanguage,
} from "./feedback-i18n.js?v=feedback-1";

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}$/;

function addStylesheet() {
  const existing = document.querySelector("link[data-snap-feedback-style]");
  if (existing?.sheet) return Promise.resolve();

  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", resolve, { once: true });
    });
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "css/feedback.css?v=feedback-1";
  link.dataset.snapFeedbackStyle = "";
  document.head.appendChild(link);

  return new Promise((resolve) => {
    link.addEventListener("load", resolve, { once: true });
    link.addEventListener("error", resolve, { once: true });
  });
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("snapup_user") || "null");
  } catch (_error) {
    return null;
  }
}

function createMarkup(language) {
  const t = (key) => feedbackText(key, language);
  return `
    <button class="snap-feedback__trigger" type="button" aria-haspopup="dialog" aria-controls="snapFeedbackDialog">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5h14v10H9l-4 3v-13Z"></path><path d="M8.5 9.5h7M8.5 12.5h4"></path></svg>
      <span>${t("feedback")}</span>
    </button>
    <div class="snap-feedback__layer" hidden>
      <button class="snap-feedback__backdrop" type="button" tabindex="-1" aria-label="${t("close")}"></button>
      <section class="snap-feedback__dialog" id="snapFeedbackDialog" role="dialog" aria-modal="true" aria-labelledby="snapFeedbackTitle" aria-describedby="snapFeedbackSubtitle">
        <button class="snap-feedback__close" type="button" aria-label="${t("close")}">×</button>
        <p class="snap-feedback__eyebrow">${t("feedback")}</p>
        <h2 id="snapFeedbackTitle">${t("title")}</h2>
        <p class="snap-feedback__subtitle" id="snapFeedbackSubtitle">${t("subtitle")}</p>

        <form class="snap-feedback__form" novalidate>
          <fieldset class="snap-feedback__categories">
            <legend>${t("category")}</legend>
            <div class="snap-feedback__category-grid">
              <label class="snap-feedback__category"><input type="radio" name="feedback_category" value="bug" /><span>${t("bug")}</span></label>
              <label class="snap-feedback__category"><input type="radio" name="feedback_category" value="suggestion" /><span>${t("suggestion")}</span></label>
              <label class="snap-feedback__category"><input type="radio" name="feedback_category" value="complaint" /><span>${t("complaint")}</span></label>
              <label class="snap-feedback__category"><input type="radio" name="feedback_category" value="other" /><span>${t("other")}</span></label>
            </div>
          </fieldset>

          <label class="snap-feedback__field">
            <span class="snap-feedback__label">${window.SnapUpI18n?.t("Message") || "Message"}</span>
            <span class="snap-feedback__message-wrap">
              <textarea name="feedback_message" minlength="10" maxlength="2000" required placeholder="${t("placeholder")}"></textarea>
              <span class="snap-feedback__counter" aria-live="polite">0/2000</span>
            </span>
          </label>

          <label class="snap-feedback__field">
            <span class="snap-feedback__label">${t("emailOptional")}</span>
            <input name="feedback_email" type="email" inputmode="email" autocomplete="email" maxlength="254" placeholder="name@example.com" />
          </label>

          <div class="snap-feedback__turnstile" aria-label="Security verification"></div>
          <button class="snap-feedback__submit" type="submit">${window.SnapUpI18n?.t("Send") || "Send"}</button>
          <p class="snap-feedback__status" role="status" aria-live="polite"></p>
        </form>
      </section>
    </div>
  `;
}

function initializeFeedbackWidget() {
  if (document.querySelector(".snap-feedback")) return;
  if (/\/live-slideshow\.html$/i.test(window.location.pathname)) return;

  const stylesReady = addStylesheet();
  const language = getFeedbackLanguage();
  const t = (key) => feedbackText(key, language);
  const root = document.createElement("div");
  root.className = "snap-feedback";
  root.dir = getFeedbackDirection(language);
  root.innerHTML = createMarkup(language);
  root.hidden = true;
  document.body.appendChild(root);
  stylesReady.finally(() => {
    root.hidden = false;
  });

  const trigger = root.querySelector(".snap-feedback__trigger");
  const layer = root.querySelector(".snap-feedback__layer");
  const dialog = root.querySelector(".snap-feedback__dialog");
  const closeButton = root.querySelector(".snap-feedback__close");
  const backdrop = root.querySelector(".snap-feedback__backdrop");
  const form = root.querySelector(".snap-feedback__form");
  const message = form.elements.feedback_message;
  const email = form.elements.feedback_email;
  const counter = root.querySelector(".snap-feedback__counter");
  const turnstileContainer = root.querySelector(".snap-feedback__turnstile");
  const submitButton = root.querySelector(".snap-feedback__submit");
  const status = root.querySelector(".snap-feedback__status");
  const initialSubmitLabel = submitButton.textContent;
  let turnstileController = null;
  let turnstileLoading = null;
  let lastFocused = null;

  const setStatus = (text = "", success = false) => {
    status.textContent = text;
    status.classList.toggle("is-success", success);
  };

  const updateCounter = () => {
    counter.textContent = `${message.value.length}/2000`;
  };

  const loadTurnstile = async () => {
    if (turnstileController) return turnstileController;
    if (!turnstileLoading) {
      turnstileLoading = createTurnstileController({
        container: turnstileContainer,
        action: "feedback",
      })
        .then((controller) => {
          turnstileController = controller;
          return controller;
        })
        .catch((error) => {
          turnstileLoading = null;
          setStatus(error.message || t("verificationError"));
          throw error;
        });
    }
    return turnstileLoading;
  };

  const close = () => {
    layer.classList.remove("is-open");
    document.body.classList.remove("snap-feedback-open");
    window.setTimeout(() => {
      layer.hidden = true;
      lastFocused?.focus?.();
    }, 190);
  };

  const open = () => {
    lastFocused = document.activeElement;
    layer.hidden = false;
    document.body.classList.add("snap-feedback-open");
    requestAnimationFrame(() => layer.classList.add("is-open"));
    setStatus();

    const storedEmail = getStoredUser()?.user_mail;
    if (!email.value && storedEmail) email.value = storedEmail;

    closeButton.focus();
    loadTurnstile().catch(() => {});
  };

  const getFocusable = () =>
    [
      ...dialog.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ),
    ].filter((element) => !element.hidden && element.offsetParent !== null);

  trigger.addEventListener("click", open);
  closeButton.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  message.addEventListener("input", updateCounter);

  layer.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = getFocusable();
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus();

    const category = form.elements.feedback_category.value;
    const messageValue = message.value.trim();
    const emailValue = email.value.trim();

    if (!category) {
      setStatus(t("categoryError"));
      form.querySelector('[name="feedback_category"]')?.focus();
      return;
    }

    if (messageValue.length < 10) {
      setStatus(t("messageError"));
      message.focus();
      return;
    }

    if (emailValue && !EMAIL_RE.test(emailValue)) {
      setStatus(t("emailError"));
      email.focus();
      return;
    }

    let controller;
    try {
      controller = await loadTurnstile();
    } catch (_error) {
      setStatus(t("verificationError"));
      return;
    }

    if (controller.enabled && !controller.getToken()) {
      setStatus(t("verificationError"));
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = t("sending");

    try {
      const token = localStorage.getItem("snapup_token");
      const headers = { "Content-Type": "application/json" };
      if (token && token !== "cookie")
        headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/feedback`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          category,
          message: messageValue,
          contact_email: emailValue || null,
          page_path: window.location.pathname || "/",
          language_code: language,
          turnstile_token: controller.getToken(),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        const messageText = getTurnstileErrorMessage(data, t("failed"));
        throw new Error(
          String(data?.code || "").startsWith("TURNSTILE_")
            ? t("verificationError")
            : messageText,
        );
      }

      form.reset();
      updateCounter();
      controller.reset();
      setStatus(t("success"), true);
    } catch (error) {
      controller.reset();
      setStatus(error.message || t("failed"));
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = initialSubmitLabel;
    }
  });

  updateCounter();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeFeedbackWidget, {
    once: true,
  });
} else {
  initializeFeedbackWidget();
}
