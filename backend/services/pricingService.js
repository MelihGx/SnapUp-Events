"use strict";

const PACKAGE_PRICING = Object.freeze({
  TR: Object.freeze({
    market: "TR",
    currency: "TRY",
    locale: "tr-TR",
    packages: Object.freeze({
      free: Object.freeze({ amount: 0, minorAmount: 0, storageMb: 100, allFeatures: false, uploadDays: 7, albumDays: 30, unlimitedGuests: false }),
      mini: Object.freeze({ amount: 749, minorAmount: 74_900, storageMb: 5_120, allFeatures: true, uploadDays: 30, albumDays: 365, unlimitedGuests: true }),
      plus: Object.freeze({ amount: 1_499, minorAmount: 149_900, storageMb: 10_240, allFeatures: true, uploadDays: 30, albumDays: 365, unlimitedGuests: true }),
      premium: Object.freeze({ amount: 2_499, minorAmount: 249_900, storageMb: 20_480, allFeatures: true, uploadDays: 30, albumDays: 365, unlimitedGuests: true }),
    }),
  }),
  GLOBAL: Object.freeze({
    market: "GLOBAL",
    currency: "USD",
    locale: "en-US",
    packages: Object.freeze({
      free: Object.freeze({ amount: 0, minorAmount: 0, storageMb: 100, allFeatures: false, uploadDays: 7, albumDays: 30, unlimitedGuests: false }),
      mini: Object.freeze({ amount: 29, minorAmount: 2_900, storageMb: 5_120, allFeatures: true, uploadDays: 30, albumDays: 365, unlimitedGuests: true }),
      plus: Object.freeze({ amount: 49, minorAmount: 4_900, storageMb: 10_240, allFeatures: true, uploadDays: 30, albumDays: 365, unlimitedGuests: true }),
      premium: Object.freeze({ amount: 79, minorAmount: 7_900, storageMb: 20_480, allFeatures: true, uploadDays: 30, albumDays: 365, unlimitedGuests: true }),
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
      storage_mb: value.storageMb,
      all_features: value.allFeatures,
      upload_days: value.uploadDays,
      album_days: value.albumDays,
      unlimited_guests: value.unlimitedGuests,
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


function getPackageStorageLimitBytes(packageName) {
  const packageKey = normalizePackageKey(packageName);
  const storageMb = Number(PACKAGE_PRICING.TR.packages[packageKey]?.storageMb || 0);
  return Math.max(0, Math.round(storageMb * 1024 * 1024));
}

function buildStorageUsage(packageName, usedBytes = 0) {
  const packageKey = normalizePackageKey(packageName);
  const limitBytes = getPackageStorageLimitBytes(packageKey);
  const normalizedUsedBytes = Math.max(0, Number(usedBytes) || 0);
  const remainingBytes = Math.max(0, limitBytes - normalizedUsedBytes);
  const percentage =
    limitBytes > 0
      ? Math.min(100, Math.max(0, (normalizedUsedBytes / limitBytes) * 100))
      : 0;

  return {
    package_key: packageKey,
    used_bytes: Math.round(normalizedUsedBytes),
    limit_bytes: limitBytes,
    remaining_bytes: Math.round(remainingBytes),
    percentage: Number(percentage.toFixed(2)),
  };
}

module.exports = {
  PACKAGE_PRICING,
  buildPricingPayload,
  buildStorageUsage,
  getPackagePricing,
  getPackageStorageLimitBytes,
  normalizeCountryCode,
  normalizePackageKey,
  resolveMarket,
};
