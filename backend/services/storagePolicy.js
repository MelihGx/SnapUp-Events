"use strict";

const STORAGE_PROVIDERS = Object.freeze({
  R2: "r2",
  CLOUDINARY: "cloudinary",
  DATABASE: "database",
});

const MEDIA_STORAGE_POLICY = Object.freeze({
  image: STORAGE_PROVIDERS.R2,
  video: STORAGE_PROVIDERS.R2,
  message: STORAGE_PROVIDERS.DATABASE,
});

const EVENT_COVER_STORAGE_PROVIDER = STORAGE_PROVIDERS.R2;

function getMediaStorageProvider(mediaKind) {
  const provider = MEDIA_STORAGE_POLICY[String(mediaKind || "").toLowerCase()];

  if (!provider) {
    const error = new Error(`Unsupported media kind: ${mediaKind}`);
    error.code = "UNSUPPORTED_MEDIA_STORAGE_KIND";
    throw error;
  }

  return provider;
}

module.exports = {
  EVENT_COVER_STORAGE_PROVIDER,
  MEDIA_STORAGE_POLICY,
  STORAGE_PROVIDERS,
  getMediaStorageProvider,
};
