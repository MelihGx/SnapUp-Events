function safeHostname(value) {
  try {
    return new URL(String(value || "").trim()).hostname.toLowerCase();
  } catch (_error) {
    return null;
  }
}

function getAllowedMediaHosts() {
  const hosts = new Set(["res.cloudinary.com"]);

  const displayHost = safeHostname(process.env.R2_DISPLAY_PUBLIC_BASE_URL);
  if (displayHost) hosts.add(displayHost);

  const explicitR2Host = safeHostname(process.env.R2_S3_ENDPOINT);
  if (explicitR2Host) hosts.add(explicitR2Host);

  const accountId = String(process.env.R2_ACCOUNT_ID || "")
    .trim()
    .toLowerCase();

  if (/^[a-z0-9]+$/.test(accountId)) {
    hosts.add(`${accountId}.r2.cloudflarestorage.com`);
    hosts.add(`${accountId}.eu.r2.cloudflarestorage.com`);
    hosts.add(`${accountId}.us.r2.cloudflarestorage.com`);
  }

  return hosts;
}

function assertAllowedMediaUrl(urlValue) {
  let parsedUrl;

  try {
    parsedUrl = new URL(String(urlValue || ""));
  } catch (_error) {
    const error = new Error("Media address is invalid.");
    error.code = "MEDIA_URL_INVALID";
    throw error;
  }

  if (parsedUrl.protocol !== "https:") {
    const error = new Error("Media address must use HTTPS.");
    error.code = "MEDIA_URL_PROTOCOL_INVALID";
    throw error;
  }

  const allowedHosts = getAllowedMediaHosts();
  if (!allowedHosts.has(parsedUrl.hostname.toLowerCase())) {
    const error = new Error("Media address is not an allowed delivery host.");
    error.code = "MEDIA_URL_HOST_INVALID";
    throw error;
  }

  return parsedUrl;
}

function isCloudinaryUrl(urlValue) {
  try {
    const parsedUrl = new URL(String(urlValue || ""));
    return (
      parsedUrl.protocol === "https:" &&
      parsedUrl.hostname.toLowerCase() === "res.cloudinary.com"
    );
  } catch (_error) {
    return false;
  }
}

module.exports = {
  assertAllowedMediaUrl,
  getAllowedMediaHosts,
  isCloudinaryUrl,
};
