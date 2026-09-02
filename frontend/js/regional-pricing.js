"use strict";

import { API_URL } from "./config.js?v=runtime-api-2";

const FALLBACK_PRICING = Object.freeze({
  TR: Object.freeze({
    market: "TR",
    currency: "TRY",
    locale: "tr-TR",
    packages: Object.freeze({
      free: { amount: 0, display: "Free" },
      mini: { amount: 749, display: "₺749" },
      plus: { amount: 1499, display: "₺1.499" },
      premium: { amount: 2499, display: "₺2.499" },
    }),
  }),
  GLOBAL: Object.freeze({
    market: "GLOBAL",
    currency: "USD",
    locale: "en-US",
    packages: Object.freeze({
      free: { amount: 0, display: "Free" },
      mini: { amount: 29, display: "$29" },
      plus: { amount: 49, display: "$49" },
      premium: { amount: 79, display: "$79" },
    }),
  }),
});

let pricingState = getFallbackPricing(detectLocalFallbackCountry());
let pricingPromise = null;

function normalizeCountryCode(value) {
  const country = String(value || "")
    .trim()
    .toUpperCase();

  return /^[A-Z]{2}$/.test(country) ? country : null;
}

function detectLocalFallbackCountry() {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone === "Europe/Istanbul") {
      return "TR";
    }
  } catch (_error) {}

  return null;
}

function getFallbackPricing(country) {
  const market = normalizeCountryCode(country) === "TR" ? "TR" : "GLOBAL";
  return {
    success: true,
    country: normalizeCountryCode(country),
    source: "frontend_fallback",
    marketVerified: false,
    ...FALLBACK_PRICING[market],
  };
}

async function detectCountryFromCloudflare() {
  try {
    const response = await fetch("/cdn-cgi/trace", {
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!response.ok) {
      return null;
    }

    const trace = await response.text();
    const locationLine = trace
      .split("\n")
      .find((line) => line.startsWith("loc="));

    return normalizeCountryCode(locationLine?.slice(4));
  } catch (_error) {
    return null;
  }
}

async function loadPricingFromBackend(country) {
  const search = country ? `?country=${encodeURIComponent(country)}` : "";
  const response = await fetch(`${API_URL}/api/events/pricing${search}`, {
    headers: { Accept: "application/json" },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.success || !data.packages) {
    throw new Error(data.message || "Regional pricing could not be loaded.");
  }

  return data;
}

function applyRegionalPrices(root = document) {
  root.querySelectorAll("[data-regional-price]").forEach((element) => {
    const packageKey = String(element.dataset.regionalPrice || "")
      .trim()
      .toLowerCase();
    const packagePricing = pricingState.packages?.[packageKey];

    if (packagePricing?.display) {
      element.textContent = packagePricing.display;
    }
  });

  root.querySelectorAll("[data-pricing-currency]").forEach((element) => {
    element.textContent = pricingState.currency || "USD";
  });

  document.documentElement.dataset.pricingMarket =
    pricingState.market || "GLOBAL";
}

export async function initRegionalPricing(root = document) {
  if (!pricingPromise) {
    pricingPromise = (async () => {
      const edgeCountry =
        (await detectCountryFromCloudflare()) || detectLocalFallbackCountry();

      try {
        pricingState = await loadPricingFromBackend(edgeCountry);
      } catch (error) {
        console.warn("SnapUp regional pricing fallback is active:", error.message);
        pricingState = getFallbackPricing(edgeCountry);
      }

      applyRegionalPrices(root);
      window.dispatchEvent(
        new CustomEvent("snapup:pricing-ready", { detail: pricingState }),
      );

      return pricingState;
    })();
  } else {
    pricingPromise.then(() => applyRegionalPrices(root));
  }

  return pricingPromise;
}

export function getDisplayPrice(packageKey) {
  const normalized = String(packageKey || "free")
    .trim()
    .toLowerCase();

  return pricingState.packages?.[normalized]?.display || "Free";
}

export function getPricingState() {
  return pricingState;
}

export { applyRegionalPrices };
