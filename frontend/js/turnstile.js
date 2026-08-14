import { API_URL } from "./config.js?v=runtime-api-2";

const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let configPromise = null;
let scriptPromise = null;

function translate(message) {
  return window.SnapUpI18n?.t?.(message) || message;
}

function isLocalhost() {
  return ["localhost", "127.0.0.1", "::1"].includes(
    window.location.hostname.toLowerCase(),
  );
}

async function loadConfig() {
  if (!configPromise) {
    configPromise = fetch(`${API_URL}/api/security/turnstile`, {
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Security verification could not be loaded.",
          );
        }
        return data;
      })
      .catch((error) => {
        configPromise = null;
        throw error;
      });
  }

  return configPromise;
}

function loadScript() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${TURNSTILE_SCRIPT_URL}"]`,
    );

    const script = existing || document.createElement("script");

    const handleLoad = () => {
      if (window.turnstile) {
        resolve(window.turnstile);
      } else {
        reject(new Error("Security verification could not be initialized."));
      }
    };

    const handleError = () => {
      scriptPromise = null;
      reject(new Error("Security verification could not be loaded."));
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (!existing) {
      script.src = TURNSTILE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

  return scriptPromise;
}

function createDisabledController() {
  return {
    enabled: false,
    getToken() {
      return null;
    },
    reset() {},
  };
}

function createFailedController(error) {
  return {
    enabled: true,
    getToken() {
      throw error;
    },
    reset() {},
  };
}

export async function mountTurnstile({
  fieldId,
  widgetId,
  messageId,
  action,
}) {
  const field = document.getElementById(fieldId);
  const widget = document.getElementById(widgetId);
  const message = document.getElementById(messageId);

  if (!field || !widget) {
    throw new Error("Security verification container is missing.");
  }

  const setMessage = (value, type = "") => {
    if (!message) return;
    message.textContent = value ? translate(value) : "";
    message.className = `turnstile-message${type ? ` ${type}` : ""}`;
  };

  let config;
  try {
    config = await loadConfig();
  } catch (error) {
    field.hidden = false;
    field.classList.add("is-error");
    setMessage(
      error.message || "Security verification could not be loaded.",
      "error",
    );
    return createFailedController(error);
  }

  if (!config.enabled) {
    field.hidden = true;
    return createDisabledController();
  }

  if (!config.site_key) {
    const error = new Error("Security verification is not configured.");
    field.classList.add("is-error");
    setMessage(error.message, "error");
    return createFailedController(error);
  }

  field.hidden = false;
  field.classList.add("is-loading");
  setMessage("Checking browser security...", "info");

  let api;
  try {
    api = await loadScript();
  } catch (error) {
    field.classList.remove("is-loading");
    field.classList.add("is-error");
    setMessage(error.message, "error");
    return createFailedController(error);
  }
  let token = "";

  let widgetInstanceId;
  try {
    widgetInstanceId = api.render(widget, {
      sitekey: config.site_key,
      action,
      theme: "auto",
      size: "flexible",
      appearance: isLocalhost() ? "always" : "interaction-only",
      callback(value) {
        token = value;
        field.classList.remove("is-loading", "is-error", "needs-attention");
        field.classList.add("is-verified");
        setMessage("Security check completed.", "success");
      },
      "expired-callback"() {
        token = "";
        field.classList.remove("is-verified");
        field.classList.add("needs-attention");
        setMessage(
          "Security check expired. Please complete it again.",
          "error",
        );
      },
      "timeout-callback"() {
        token = "";
        field.classList.remove("is-verified");
        field.classList.add("needs-attention");
        setMessage("Security check timed out. Please try again.", "error");
      },
      "error-callback"() {
        token = "";
        field.classList.remove("is-loading", "is-verified");
        field.classList.add("is-error");
        setMessage(
          "Security verification failed to load. Please refresh the page.",
          "error",
        );
      },
    });
  } catch (error) {
    field.classList.remove("is-loading");
    field.classList.add("is-error");
    setMessage("Security verification could not be initialized.", "error");
    return createFailedController(error);
  }

  return {
    enabled: true,
    getToken() {
      const currentToken = api.getResponse(widgetInstanceId) || token;
      if (!currentToken) {
        field.classList.add("needs-attention");
        setMessage("Please complete the security verification.", "error");
        field.scrollIntoView({ behavior: "smooth", block: "center" });
        throw new Error("Please complete the security verification.");
      }
      return currentToken;
    },
    reset() {
      token = "";
      field.classList.remove("is-verified", "is-error", "needs-attention");
      field.classList.add("is-loading");
      setMessage("Checking browser security...", "info");
      api.reset(widgetInstanceId);
    },
  };
}
