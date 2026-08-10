const cloudinary = require("../config/cloudinary");

const AUTH_TOKEN_BUCKET_SECONDS = 300;
const AUTH_TOKEN_CLOCK_SKEW_SECONDS = 30;
const AUTH_TOKEN_DURATION_SECONDS = 930;

const IMAGE_PRESETS = Object.freeze({
  thumbnail: Object.freeze({
    width: 480,
    height: 720,
    crop: "limit",
    quality: "auto:eco",
    fetch_format: "auto",
  }),
  feed_small: Object.freeze({
    width: 480,
    height: 960,
    crop: "limit",
    quality: "auto:eco",
    fetch_format: "auto",
  }),
  feed_medium: Object.freeze({
    width: 768,
    height: 1280,
    crop: "limit",
    quality: "auto:good",
    fetch_format: "auto",
  }),
  feed: Object.freeze({
    width: 1200,
    height: 1600,
    crop: "limit",
    quality: "auto:good",
    fetch_format: "auto",
  }),
  display: Object.freeze({
    width: 1920,
    height: 1920,
    crop: "limit",
    quality: "auto:good",
    fetch_format: "auto",
  }),
  slideshow_full_hd: Object.freeze({
    width: 1920,
    height: 1080,
    crop: "limit",
    quality: "auto:good",
    fetch_format: "auto",
  }),
  slideshow_qhd: Object.freeze({
    width: 2560,
    height: 1440,
    crop: "limit",
    quality: "auto:good",
    fetch_format: "auto",
  }),
  slideshow_uhd: Object.freeze({
    width: 3840,
    height: 2160,
    crop: "limit",
    quality: "auto:good",
    fetch_format: "auto",
  }),
  pdf: Object.freeze({
    width: 2000,
    height: 2000,
    crop: "limit",
    quality: "auto:good",
  }),
  cover_card: Object.freeze({
    width: 640,
    height: 640,
    crop: "limit",
    quality: "auto:eco",
    fetch_format: "auto",
  }),
  cover_display: Object.freeze({
    width: 1600,
    height: 1600,
    crop: "limit",
    quality: "auto:good",
    fetch_format: "auto",
  }),
});

const VIDEO_PRESETS = Object.freeze({
  poster: Object.freeze({
    width: 640,
    height: 640,
    crop: "limit",
    quality: "auto:eco",
    start_offset: "0",
  }),
  playback: Object.freeze({
    width: 1920,
    height: 1080,
    crop: "limit",
    quality: "auto:good",
    fetch_format: "auto",
  }),
});

function parseAsset(urlValue) {
  try {
    const url = new URL(String(urlValue || ""));
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") {
      return null;
    }

    const match = url.pathname.match(
      /\/(image|video)\/(upload|authenticated)\/(?:(s--[^/]+--)\/)?(?:v(\d+)\/)?(.+?)(?:\.([a-z0-9]+))?$/i,
    );

    if (!match) {
      return null;
    }

    return {
      resourceType: match[1],
      deliveryType: match[2],
      signature: match[3] || null,
      version: match[4] || null,
      publicId: decodeURIComponent(match[5]),
      format: match[6],
    };
  } catch (_error) {
    return null;
  }
}

function getStableAuthToken() {
  if (!process.env.CLOUDINARY_AUTH_TOKEN_KEY) {
    return null;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const bucketStart = nowSeconds - (nowSeconds % AUTH_TOKEN_BUCKET_SECONDS);

  return {
    key: process.env.CLOUDINARY_AUTH_TOKEN_KEY,
    start_time: bucketStart - AUTH_TOKEN_CLOCK_SKEW_SECONDS,
    duration: AUTH_TOKEN_DURATION_SECONDS,
  };
}

function createDeliveryUrl(asset, { transformation, format } = {}) {
  if (!asset) {
    return null;
  }

  const options = {
    secure: true,
    sign_url: true,
    type: asset.deliveryType,
    resource_type: asset.resourceType,
    format: format || asset.format,
    urlAnalytics: false,
  };

  if (asset.version) {
    options.version = asset.version;
  }

  if (transformation) {
    options.transformation = [transformation];
  }

  const authToken = getStableAuthToken();
  if (authToken && asset.deliveryType === "authenticated") {
    options.auth_token = authToken;
  }

  return cloudinary.url(asset.publicId, options);
}

function signedDeliveryUrl(urlValue) {
  const asset = parseAsset(urlValue);
  if (!asset) {
    return urlValue;
  }

  // Public covers uploaded before authenticated delivery was enabled must keep
  // their original /upload/ address. Rewriting those URLs as /authenticated/
  // points to a different asset. Already-signed originals are also reusable.
  if (asset.deliveryType === "upload" || asset.signature) {
    return urlValue;
  }

  return createDeliveryUrl(asset);
}

function imageDeliveryUrl(urlValue, presetName) {
  const asset = parseAsset(urlValue);
  const preset = IMAGE_PRESETS[presetName];

  if (!asset || asset.resourceType !== "image" || !preset) {
    return signedDeliveryUrl(urlValue);
  }

  return createDeliveryUrl(asset, {
    transformation: preset,
    format: presetName === "pdf" ? "jpg" : asset.format,
  });
}

function videoDeliveryUrl(urlValue, presetName) {
  const asset = parseAsset(urlValue);
  const preset = VIDEO_PRESETS[presetName];

  if (!asset || asset.resourceType !== "video" || !preset) {
    return signedDeliveryUrl(urlValue);
  }

  return createDeliveryUrl(asset, {
    transformation: preset,
    format: presetName === "poster" ? "jpg" : asset.format,
  });
}

function buildImageDeliveryUrls(urlValue, profile = "full") {
  const asset = parseAsset(urlValue);
  if (!asset || asset.resourceType !== "image") {
    return null;
  }

  if (profile === "slideshow") {
    return {
      thumbnail: imageDeliveryUrl(urlValue, "thumbnail"),
      slideshow: {
        full_hd: imageDeliveryUrl(urlValue, "slideshow_full_hd"),
        qhd: imageDeliveryUrl(urlValue, "slideshow_qhd"),
        uhd: imageDeliveryUrl(urlValue, "slideshow_uhd"),
      },
    };
  }

  if (profile === "gallery") {
    return {
      feed: imageDeliveryUrl(urlValue, "feed"),
      feed_srcset: {
        small: imageDeliveryUrl(urlValue, "feed_small"),
        medium: imageDeliveryUrl(urlValue, "feed_medium"),
        large: imageDeliveryUrl(urlValue, "feed"),
      },
      display: imageDeliveryUrl(urlValue, "display"),
    };
  }

  if (profile === "card") {
    return {
      thumbnail: imageDeliveryUrl(urlValue, "thumbnail"),
    };
  }

  const deliveryUrls = {
    feed: imageDeliveryUrl(urlValue, "feed"),
    feed_srcset: {
      small: imageDeliveryUrl(urlValue, "feed_small"),
      medium: imageDeliveryUrl(urlValue, "feed_medium"),
      large: imageDeliveryUrl(urlValue, "feed"),
    },
    display: imageDeliveryUrl(urlValue, "display"),
    pdf: imageDeliveryUrl(urlValue, "pdf"),
  };

  if (profile === "full") {
    deliveryUrls.thumbnail = imageDeliveryUrl(urlValue, "thumbnail");
    deliveryUrls.slideshow = {
      full_hd: imageDeliveryUrl(urlValue, "slideshow_full_hd"),
      qhd: imageDeliveryUrl(urlValue, "slideshow_qhd"),
      uhd: imageDeliveryUrl(urlValue, "slideshow_uhd"),
    };
  }

  return deliveryUrls;
}

function buildVideoDeliveryUrls(urlValue) {
  const asset = parseAsset(urlValue);
  if (!asset || asset.resourceType !== "video") {
    return null;
  }

  return {
    poster: videoDeliveryUrl(urlValue, "poster"),
    playback: videoDeliveryUrl(urlValue, "playback"),
  };
}

function buildMediaDeliveryUrls(urlValue, profile = "full") {
  const asset = parseAsset(urlValue);
  if (!asset) {
    return null;
  }

  return asset.resourceType === "video"
    ? buildVideoDeliveryUrls(urlValue)
    : buildImageDeliveryUrls(urlValue, profile);
}

function buildCoverDeliveryUrls(urlValue, profile = "full") {
  const asset = parseAsset(urlValue);
  if (!asset || asset.resourceType !== "image") {
    return null;
  }

  if (profile === "card") {
    return { card: imageDeliveryUrl(urlValue, "cover_card") };
  }

  if (profile === "gallery") {
    return { display: imageDeliveryUrl(urlValue, "cover_display") };
  }

  if (profile === "slideshow") {
    return { card: imageDeliveryUrl(urlValue, "cover_card") };
  }

  const deliveryUrls = {
    display: imageDeliveryUrl(urlValue, "cover_display"),
    pdf: imageDeliveryUrl(urlValue, "pdf"),
  };

  if (profile === "full") {
    deliveryUrls.card = imageDeliveryUrl(urlValue, "cover_card");
  }

  return deliveryUrls;
}

function signAssetUrls(value, profile = "full") {
  if (Array.isArray(value)) {
    return value.map((item) => signAssetUrls(item, profile));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const result = {};

  for (const [key, item] of Object.entries(value)) {
    if (key === "media_url" || key === "event_cover_url") {
      result[key] = signedDeliveryUrl(item);
    } else {
      result[key] = signAssetUrls(item, profile);
    }
  }

  if (typeof value.media_url === "string" && value.media_url) {
    const deliveryUrls = buildMediaDeliveryUrls(value.media_url, profile);
    if (deliveryUrls) {
      result.delivery_urls = deliveryUrls;
    }
  }

  if (typeof value.event_cover_url === "string" && value.event_cover_url) {
    const coverDeliveryUrls = buildCoverDeliveryUrls(
      value.event_cover_url,
      profile,
    );
    if (coverDeliveryUrls) {
      result.event_cover_delivery_urls = coverDeliveryUrls;
    }
  }

  return result;
}

module.exports = {
  IMAGE_PRESETS,
  VIDEO_PRESETS,
  buildCoverDeliveryUrls,
  buildMediaDeliveryUrls,
  imageDeliveryUrl,
  parseAsset,
  signAssetUrls,
  signedDeliveryUrl,
  videoDeliveryUrl,
};
