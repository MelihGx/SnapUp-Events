const { S3Client } = require("@aws-sdk/client-s3");

function requiredEnv(name) {
  const value = String(process.env[name] || "").trim();

  if (!value) {
    const error = new Error(`${name} is required for Cloudflare R2.`);
    error.code = "R2_CONFIG_MISSING";
    throw error;
  }

  return value;
}

let client = null;

function getR2Endpoint() {
  const explicitEndpoint = String(process.env.R2_S3_ENDPOINT || "").trim();
  if (explicitEndpoint) {
    return explicitEndpoint.replace(/\/+$/, "");
  }

  const accountId = requiredEnv("R2_ACCOUNT_ID");
  const jurisdiction = String(process.env.R2_JURISDICTION || "")
    .trim()
    .toLowerCase();

  if (["eu", "us"].includes(jurisdiction)) {
    return `https://${accountId}.${jurisdiction}.r2.cloudflarestorage.com`;
  }

  return `https://${accountId}.r2.cloudflarestorage.com`;
}

function getR2Client() {
  if (client) return client;

  const accessKeyId = requiredEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requiredEnv("R2_SECRET_ACCESS_KEY");

  client = new S3Client({
    region: "auto",
    endpoint: getR2Endpoint(),
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return client;
}

function getR2Buckets() {
  return {
    originals: requiredEnv("R2_ORIGINAL_BUCKET"),
    display: requiredEnv("R2_DISPLAY_BUCKET"),
  };
}

function getR2DisplayPublicBaseUrl() {
  return requiredEnv("R2_DISPLAY_PUBLIC_BASE_URL").replace(/\/+$/, "");
}

module.exports = {
  getR2Buckets,
  getR2Client,
  getR2DisplayPublicBaseUrl,
  getR2Endpoint,
};
