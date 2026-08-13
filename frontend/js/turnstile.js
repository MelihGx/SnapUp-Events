import { API_URL } from "./config.js?v=runtime-api-2";

const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SUPPORTED_WIDGET_LANGUAGES = new Set([
  "ar",
  "bg",
  "zh",
  "zh-tw",
  "hr",
  "cs",
  "da",
  "nl",
  "en",
  "fa",
  "fi",
  "fr",
  "de",
  "el",
  "he",
  "hi",
  "hu",
  "id",
  "it",
  "ja",
  "ko",
  "lt",
  "ms",
  "nb",
  "pl",
  "pt",
  "ro",
  "ru",
  "sr",
  "sk",
  "sl",
  "es",
  "sv",
  "tl",
  "th",
  "tr",
  "uk",
  "vi",
]);

let configPromise = null;
let scriptPromise = null;

export function getTurnstileErrorMessage(data, fallback = "") {
  const code = String(data?.code || "");

  if (code.startsWith("TURNSTILE_")) {
    return "Security verification could not be completed. Please try again.";
  }

  return data?.message || fallback;
}

function getWidgetLanguage() {
  const selected = String(
    window.SnapUpI18n?.language || document.documentElement.lang || "auto",
  ).toLowerCase();
  const normalized =
    selected === "fil" ? "tl" : selected === "pt-pt" ? "pt" : selected;

  return SUPPORTED_WIDGET_LANGUAGES.has(normalized) ? normalized : "auto";
}

function getWidgetTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

async function getTurnstileConfig() {
  if (!configPromise) {
    configPromise = fetch(`${API_URL}/api/security/turnstile-config`, {
      headers: { Accept: "application/json" },
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Security verification configuration could not be loaded.",
        );
      }

      return {
        enabled: data.enabled === true,
        siteKey: String(data.site_key || "").trim(),
      };
    });
  }

  return configPromise;
}

function loadTurnstileScript() {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${TURNSTILE_SCRIPT_URL}"]`,
    );
    const script = existing || document.createElement("script");

    const handleLoad = () => {
      if (window.turnstile) {
        window.turnstile.ready(() => resolve(window.turnstile));
      } else {
        reject(new Error("Cloudflare Turnstile could not be initialized."));
      }
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Cloudflare Turnstile could not be loaded.")),
      { once: true },
    );

    if (!existing) {
      script.src = TURNSTILE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

  return scriptPromise;
}

function disabledController(container) {
  container.hidden = true;

  return {
    enabled: false,
    getToken: () => "",
    reset: () => {},
    destroy: () => {},
  };
}

export async function createTurnstileController({
  container,
  action,
  onChange,
}) {
  const element =
    typeof container === "string"
      ? document.querySelector(container)
      : container;

  if (!element) {
    throw new Error("Turnstile container could not be found.");
  }

  if (!/^[a-z0-9_-]{1,32}$/i.test(String(action || ""))) {
    throw new Error("A valid Turnstile action is required.");
  }

  const config = await getTurnstileConfig();

  if (!config.enabled) {
    return disabledController(element);
  }

  if (!config.siteKey) {
    throw new Error("Turnstile Site Key is missing.");
  }

  const turnstile = await loadTurnstileScript();
  let widgetId = null;
  let token = "";
  let destroyed = false;

  const updateToken = (nextToken = "") => {
    token = String(nextToken || "");
    element.classList.toggle("is-verified", Boolean(token));
    onChange?.(token);
  };

  const render = () => {
    if (destroyed) return;

    element.hidden = false;
    element.replaceChildren();
    updateToken("");
    widgetId = turnstile.render(element, {
      sitekey: config.siteKey,
      action,
      theme: getWidgetTheme(),
      language: getWidgetLanguage(),
      size:
        element.clientWidth > 0 && element.clientWidth < 300
          ? "compact"
          : "flexible",
      appearance: "always",
      retry: "auto",
      "refresh-expired": "auto",
      callback: (nextToken) => updateToken(nextToken),
      "expired-callback": () => updateToken(""),
      "timeout-callback": () => updateToken(""),
      "error-callback": () => updateToken(""),
    });
  };

  render();

  const themeObserver = new MutationObserver((records) => {
    if (!records.some((record) => record.attributeName === "data-theme")) {
      return;
    }

    if (widgetId !== null) {
      turnstile.remove(widgetId);
      widgetId = null;
    }

    render();
  });

  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  return {
    enabled: true,
    getToken: () => token,
    reset() {
      updateToken("");
      if (widgetId !== null) turnstile.reset(widgetId);
    },
    destroy() {
      destroyed = true;
      themeObserver.disconnect();
      updateToken("");
      if (widgetId !== null) turnstile.remove(widgetId);
      widgetId = null;
    },
  };
}
