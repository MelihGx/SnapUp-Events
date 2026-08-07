const cloudinary = require("../config/cloudinary");

function parseAsset(urlValue) {
  try {
    const url = new URL(String(urlValue || ""));
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") return null;
    const match = url.pathname.match(/\/(image|video)\/(?:upload|authenticated)\/(?:v\d+\/)?(.+?)(?:\.([a-z0-9]+))?$/i);
    if (!match) return null;
    return { resourceType: match[1], publicId: decodeURIComponent(match[2]), format: match[3] };
  } catch (_error) { return null; }
}

function signedDeliveryUrl(urlValue) {
  const asset = parseAsset(urlValue);
  if (!asset) return urlValue;
  const options = {
    secure: true,
    sign_url: true,
    type: "authenticated",
    resource_type: asset.resourceType,
    format: asset.format,
  };
  if (process.env.CLOUDINARY_AUTH_TOKEN_KEY) {
    options.auth_token = { key: process.env.CLOUDINARY_AUTH_TOKEN_KEY, duration: 600 };
  }
  return cloudinary.url(asset.publicId, options);
}

function signAssetUrls(value) {
  if (Array.isArray(value)) return value.map(signAssetUrls);
  if (!value || typeof value !== "object") return value;
  const result = { ...value };
  for (const [key, item] of Object.entries(result)) {
    result[key] = (key === "media_url" || key === "event_cover_url")
      ? signedDeliveryUrl(item)
      : signAssetUrls(item);
  }
  return result;
}

module.exports = { signedDeliveryUrl, signAssetUrls };
