"use strict";

const PACKAGE_PRICING = Object.freeze({
  TR: Object.freeze({
    market: "TR",
    currency: "TRY",
    locale: "tr-TR",
    packages: Object.freeze({
      free: Object.freeze({ amount: 0, minorAmount: 0 }),
      mini: Object.freeze({ amount: 749, minorAmount: 74_900 }),
      plus: Object.freeze({ amount: 1_499, minorAmount: 149_900 }),
      premium: Object.freeze({ amount: 2_499, minorAmount: 249_900 }),
    }),
  }),
  GLOBAL: Object.freeze({
    market: "GLOBAL",
    currency: "USD",
    locale: "en-US",
    packages: Object.freeze({
      free: Object.freeze({ amount: 0, minorAmount: 0 }),
      mini: Object.freeze({ amount: 29, minorAmount: 2_900 }),
      plus: Object.freeze({ amount: 49, minorAmount: 4_900 }),
      premium: Object.freeze({ amount: 79, minorAmount: 7_900 }),
    }),
  }),
});

const PACKAGE_ALIASES = Object.freeze({
  starter: "free",
  standard: "plus",
});

function normalizeCountryCode(value) {
  const country = String(value || "")
    .trim()
    .toUpperCase();

  return /^[A-Z]{2}$/.test(country) ? country : null;
}

function normalizePackageKey(value) {
  const packageKey = String(value || "free")
    .trim()
    .toLowerCase();

  const normalized = PACKAGE_ALIASES[packageKey] || packageKey;
  return Object.prototype.hasOwnProperty.call(
    PACKAGE_PRICING.TR.packages,
    normalized,
  )
    ? normalized
    : "free";
}

function resolveMarket(countryCode) {
  return normalizeCountryCode(countryCode) === "TR" ? "TR" : "GLOBAL";
}

function getTrustedCountryFromRequest(req) {
  const headerCandidates = [
    req.get("cf-ipcountry"),
    req.get("x-vercel-ip-country"),
    req.get("x-country-code"),
  ];

  for (const candidate of headerCandidates) {
    const country = normalizeCountryCode(candidate);
    if (country) {
      return country;
    }
  }

  return null;
}

function resolvePricingContext(req, countryHint = null) {
  const trustedCountry = getTrustedCountryFromRequest(req);
  const hintedCountry = normalizeCountryCode(countryHint);
  const country = trustedCountry || hintedCountry;
  const market = resolveMarket(country);

  return {
    country,
    market,
    source: trustedCountry ? "edge" : hintedCountry ? "client_hint" : "default",
    marketVerified: Boolean(trustedCountry),
  };
}

function formatPrice(amount, currency, locale) {
  if (Number(amount) === 0) {
    return "Free";
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getMarketPricing(market) {
  return PACKAGE_PRICING[market] || PACKAGE_PRICING.GLOBAL;
}

function buildPricingPayload(req, countryHint = null) {
  const context = resolvePricingContext(req, countryHint);
  const pricing = getMarketPricing(context.market);
  const packages = {};

  for (const [key, value] of Object.entries(pricing.packages)) {
    packages[key] = {
      amount: value.amount,
      minor_amount: value.minorAmount,
      currency: pricing.currency,
      display: formatPrice(value.amount, pricing.currency, pricing.locale),
    };
  }

  return {
    ...context,
    currency: pricing.currency,
    locale: pricing.locale,
    packages,
  };
}

function getPackagePricing(req, packageName, countryHint = null) {
  const payload = buildPricingPayload(req, countryHint);
  const packageKey = normalizePackageKey(packageName);

  return {
    package: packageKey,
    market: payload.market,
    country: payload.country,
    source: payload.source,
    marketVerified: payload.marketVerified,
    ...payload.packages[packageKey],
  };
}

module.exports = {
  PACKAGE_PRICING,
  buildPricingPayload,
  getPackagePricing,
  normalizeCountryCode,
  normalizePackageKey,
  resolveMarket,
};
