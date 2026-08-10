"use strict";

import {
  getEventCoverUrl,
  getImageDeliveryUrl,
} from "./media-delivery.js?v=cloudinary-bandwidth-1";

const PAGE_WIDTH = 960;
const PAGE_HEIGHT = 540;
const IMAGE_MAX_EDGE = 2200;
const IMAGE_QUALITY = 0.86;

const COLORS = {
  ink: "#140D24",
  inkSoft: "#2B1B44",
  paper: "#FBF8FF",
  paperAlt: "#F1ECFA",
  white: "#FFFFFF",
  muted: "#746C80",
  purple: "#7C3AED",
  pink: "#EC4899",
  cyan: "#06B6D4",
};

function safeText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function shorten(value, limit) {
  const text = safeText(value);

  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, Math.max(0, limit - 1)).trim()}…`;
}

function getMediaUrl(media) {
  return getImageDeliveryUrl(media, "pdf");
}

function getGuestName(media) {
  return (
    media?.guest_name ||
    media?.guestName ||
    media?.user_name ||
    media?.userName ||
    "SnapUp Guest"
  );
}

function getMessage(media) {
  return media?.message || media?.media_message || "A moment from the event";
}

function getMediaDate(media) {
  return media?.media_created_at || media?.created_at || "";
}

function formatDate(value, locale, fallback = "") {
  if (!value) {
    return fallback;
  }

  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(locale || "en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
}

function slugify(value) {
  return (
    safeText(value, "event")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "event"
  );
}

function getPdfMake() {
  const pdfMake = window.pdfMake;

  if (!pdfMake?.createPdf) {
    throw new Error(
      "Memory Book PDF files could not be loaded. Refresh the page and try again.",
    );
  }

  return pdfMake;
}

function loadImageElement(blob) {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error("The photo could not be decoded."));
    };

    image.src = imageUrl;
  });
}

async function decodeImage(blob) {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(blob, {
        imageOrientation: "from-image",
      });
    } catch (_) {
      // Older browsers use the image element fallback below.
    }
  }

  return loadImageElement(blob);
}

async function imageUrlToJpegDataUrl(url) {
  const response = await fetch(url, {
    method: "GET",
    mode: "cors",
    credentials: "omit",
    cache: "force-cache",
  });

  if (!response.ok) {
    throw new Error(`Photo request failed (${response.status}).`);
  }

  const blob = await response.blob();

  if (!blob.type.startsWith("image/")) {
    throw new Error("The media URL did not return an image.");
  }

  const decodedImage = await decodeImage(blob);
  const sourceWidth = decodedImage.width || decodedImage.naturalWidth;
  const sourceHeight = decodedImage.height || decodedImage.naturalHeight;

  if (!sourceWidth || !sourceHeight) {
    decodedImage.close?.();
    throw new Error("The photo dimensions could not be read.");
  }

  const scale = Math.min(1, IMAGE_MAX_EDGE / Math.max(sourceWidth, sourceHeight));
  const outputWidth = Math.max(1, Math.round(sourceWidth * scale));
  const outputHeight = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });

  if (!context) {
    decodedImage.close?.();
    throw new Error("The browser could not prepare the photo.");
  }

  canvas.width = outputWidth;
  canvas.height = outputHeight;
  context.fillStyle = COLORS.paper;
  context.fillRect(0, 0, outputWidth, outputHeight);
  context.drawImage(decodedImage, 0, 0, outputWidth, outputHeight);
  decodedImage.close?.();

  return canvas.toDataURL("image/jpeg", IMAGE_QUALITY);
}

async function mapWithConcurrency(items, worker, concurrency = 3) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, Math.max(items.length, 1)) },
      runWorker,
    ),
  );

  return results;
}

async function prepareImages(mediaItems, eventCoverUrl, onProgress) {
  const imageCache = new Map();
  let completed = 0;

  async function getPreparedImage(url) {
    if (!url) {
      return null;
    }

    if (!imageCache.has(url)) {
      imageCache.set(
        url,
        imageUrlToJpegDataUrl(url).catch((error) => {
          console.warn("Memory Book skipped an image:", url, error);
          return null;
        }),
      );
    }

    return imageCache.get(url);
  }

  const preparedPhotos = await mapWithConcurrency(
    mediaItems,
    async (media, index) => {
      const dataUrl = await getPreparedImage(getMediaUrl(media));
      completed += 1;
      onProgress?.({ completed, total: mediaItems.length });

      if (!dataUrl) {
        return null;
      }

      return {
        media,
        dataUrl,
        imageKey: `memory_photo_${index + 1}`,
      };
    },
  );

  const validPhotos = preparedPhotos.filter(Boolean);
  const preparedCover = await getPreparedImage(eventCoverUrl);

  return {
    photos: validPhotos,
    cover: preparedCover || validPhotos[0]?.dataUrl || null,
    skippedCount: mediaItems.length - validPhotos.length,
  };
}

function pageBackground(color = COLORS.paper) {
  return {
    canvas: [
      {
        type: "rect",
        x: 0,
        y: 0,
        w: PAGE_WIDTH,
        h: PAGE_HEIGHT,
        color,
      },
    ],
    absolutePosition: { x: 0, y: 0 },
  };
}

function accentStrips() {
  return {
    canvas: [
      { type: "rect", x: 0, y: 0, w: 132, h: 9, color: COLORS.purple },
      { type: "rect", x: 132, y: 0, w: 112, h: 9, color: COLORS.pink },
      { type: "rect", x: 244, y: 0, w: 76, h: 9, color: COLORS.cyan },
      {
        type: "rect",
        x: PAGE_WIDTH - 96,
        y: PAGE_HEIGHT - 9,
        w: 96,
        h: 9,
        color: COLORS.cyan,
      },
      {
        type: "rect",
        x: PAGE_WIDTH - 210,
        y: PAGE_HEIGHT - 9,
        w: 114,
        h: 9,
        color: COLORS.pink,
      },
      {
        type: "rect",
        x: PAGE_WIDTH - 346,
        y: PAGE_HEIGHT - 9,
        w: 136,
        h: 9,
        color: COLORS.purple,
      },
    ],
    absolutePosition: { x: 0, y: 0 },
  };
}

function createCoverPage(event, coverImageKey, photoCount, locale) {
  const eventName = shorten(event?.event_name || "Untitled Event", 70);
  const eventDate = formatDate(event?.event_date, locale, "A shared moment");
  const location = shorten(
    [event?.event_location, event?.event_address]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join(", "),
    46,
  );
  const eventCode = safeText(event?.event_code);
  const meta = [eventDate, location].filter(Boolean).join("  ·  ");
  const photoCard = coverImageKey
    ? {
        table: {
          widths: [406],
          heights: [334],
          body: [
            [
              {
                image: coverImageKey,
                fit: [382, 310],
                alignment: "center",
                margin: [0, 10, 0, 10],
                fillColor: COLORS.inkSoft,
              },
            ],
          ],
        },
        layout: {
          hLineColor: () => COLORS.pink,
          vLineColor: () => COLORS.purple,
          hLineWidth: () => 3,
          vLineWidth: () => 3,
          paddingLeft: () => 8,
          paddingRight: () => 8,
          paddingTop: () => 8,
          paddingBottom: () => 8,
        },
        absolutePosition: { x: 492, y: 102 },
      }
    : null;

  return {
    stack: [
      pageBackground(COLORS.ink),
      accentStrips(),
      {
        canvas: [
          {
            type: "rect",
            x: 0,
            y: 0,
            w: 11,
            h: 72,
            color: COLORS.purple,
          },
          {
            type: "rect",
            x: 0,
            y: 72,
            w: 11,
            h: 72,
            color: COLORS.pink,
          },
          {
            type: "rect",
            x: 0,
            y: 144,
            w: 11,
            h: 72,
            color: COLORS.cyan,
          },
        ],
        absolutePosition: { x: 42, y: 94 },
      },
      {
        text: "SNAPUP  /  MEMORY BOOK",
        color: COLORS.cyan,
        fontSize: 11,
        bold: true,
        characterSpacing: 2.2,
        absolutePosition: { x: 73, y: 55 },
      },
      {
        table: {
          widths: [370],
          body: [
            [
              {
                text: eventName,
                color: COLORS.white,
                fontSize: 38,
                bold: true,
                lineHeight: 0.98,
              },
            ],
          ],
        },
        layout: "noBorders",
        absolutePosition: { x: 73, y: 112 },
      },
      {
        table: {
          widths: [350],
          body: [
            [
              {
                text: meta || "Created together. Kept forever.",
                color: "#CFC6DD",
                fontSize: 13,
                lineHeight: 1.35,
              },
            ],
          ],
        },
        layout: "noBorders",
        absolutePosition: { x: 73, y: 288 },
      },
      {
        text: `${photoCount} APPROVED PHOTOS`,
        color: COLORS.white,
        fontSize: 11,
        bold: true,
        characterSpacing: 1.4,
        absolutePosition: { x: 73, y: 365 },
      },
      {
        text: eventCode ? `EVENT CODE  ${eventCode}` : "SNAPUP EVENTS",
        color: COLORS.pink,
        fontSize: 10,
        bold: true,
        characterSpacing: 1.3,
        absolutePosition: { x: 73, y: 402 },
      },
      photoCard,
      {
        text: "A living album made from the moments your guests shared.",
        color: "#9E94AA",
        fontSize: 10,
        width: 380,
        absolutePosition: { x: 492, y: 464 },
      },
    ].filter(Boolean),
    pageBreak: "after",
  };
}

function createPhotoPage(photo, index, total, locale) {
  const isImageLeft = index % 2 === 0;
  const imageX = isImageLeft ? 44 : 316;
  const infoX = isImageLeft ? 690 : 44;
  const media = photo.media;
  const guestName = shorten(getGuestName(media), 44);
  const message = shorten(getMessage(media), 300);
  const uploadedAt = formatDate(
    getMediaDate(media),
    locale,
    "Shared at the event",
  );
  const number = String(index + 1).padStart(2, "0");

  return {
    stack: [
      pageBackground(index % 2 === 0 ? COLORS.paper : COLORS.paperAlt),
      accentStrips(),
      {
        text: `SNAPUP MEMORY BOOK  /  ${number}`,
        color: COLORS.purple,
        fontSize: 10,
        bold: true,
        characterSpacing: 1.5,
        absolutePosition: { x: 44, y: 32 },
      },
      {
        text: `${index + 1} / ${total}`,
        color: COLORS.muted,
        fontSize: 9,
        alignment: "right",
        width: 100,
        absolutePosition: { x: 816, y: 32 },
      },
      {
        canvas: [
          {
            type: "rect",
            x: 0,
            y: 0,
            w: 600,
            h: 400,
            r: 14,
            color: COLORS.ink,
          },
        ],
        absolutePosition: { x: imageX, y: 70 },
      },
      {
        table: {
          widths: [576],
          heights: [376],
          body: [
            [
              {
                image: photo.imageKey,
                fit: [552, 352],
                alignment: "center",
                margin: [0, 8, 0, 8],
                fillColor: COLORS.ink,
              },
            ],
          ],
        },
        layout: "noBorders",
        absolutePosition: { x: imageX + 12, y: 82 },
      },
      {
        canvas: [
          {
            type: "rect",
            x: 0,
            y: 0,
            w: 226,
            h: 338,
            r: 14,
            color: COLORS.white,
          },
          {
            type: "rect",
            x: 0,
            y: 0,
            w: 7,
            h: 112,
            color: COLORS.purple,
          },
          {
            type: "rect",
            x: 0,
            y: 112,
            w: 7,
            h: 112,
            color: COLORS.pink,
          },
          {
            type: "rect",
            x: 0,
            y: 224,
            w: 7,
            h: 114,
            color: COLORS.cyan,
          },
        ],
        absolutePosition: { x: infoX, y: 100 },
      },
      {
        text: "SHARED BY",
        color: COLORS.pink,
        fontSize: 9,
        bold: true,
        characterSpacing: 1.5,
        absolutePosition: { x: infoX + 26, y: 128 },
      },
      {
        table: {
          widths: [174],
          body: [
            [
              {
                text: guestName,
                color: COLORS.ink,
                fontSize: 23,
                bold: true,
                lineHeight: 1.05,
              },
            ],
          ],
        },
        layout: "noBorders",
        absolutePosition: { x: infoX + 22, y: 151 },
      },
      {
        text: "“",
        color: COLORS.cyan,
        fontSize: 30,
        bold: true,
        absolutePosition: { x: infoX + 24, y: 214 },
      },
      {
        table: {
          widths: [170],
          body: [
            [
              {
                text: message,
                color: COLORS.inkSoft,
                fontSize: 13,
                lineHeight: 1.35,
              },
            ],
          ],
        },
        layout: "noBorders",
        absolutePosition: { x: infoX + 24, y: 248 },
      },
      {
        table: {
          widths: [174],
          body: [
            [
              {
                text: uploadedAt,
                color: COLORS.muted,
                fontSize: 9,
              },
            ],
          ],
        },
        layout: "noBorders",
        absolutePosition: { x: infoX + 22, y: 400 },
      },
      {
        text: "CREATED TOGETHER  ·  KEPT FOREVER",
        color: COLORS.muted,
        fontSize: 8,
        characterSpacing: 1.2,
        absolutePosition: { x: 44, y: 500 },
      },
    ],
    pageBreak: "after",
  };
}

function createClosingPage(event, photoCount) {
  const eventName = shorten(event?.event_name || "Your Event", 70);
  const eventCode = safeText(event?.event_code);

  return {
    stack: [
      pageBackground(COLORS.ink),
      accentStrips(),
      {
        canvas: [
          {
            type: "rect",
            x: 0,
            y: 0,
            w: 116,
            h: 116,
            r: 18,
            color: COLORS.purple,
          },
          {
            type: "rect",
            x: 132,
            y: 0,
            w: 116,
            h: 116,
            r: 18,
            color: COLORS.pink,
          },
          {
            type: "rect",
            x: 264,
            y: 0,
            w: 116,
            h: 116,
            r: 18,
            color: COLORS.cyan,
          },
        ],
        absolutePosition: { x: 290, y: 70 },
      },
      {
        table: {
          widths: [116],
          body: [
            [
              {
                text: String(photoCount).padStart(2, "0"),
                color: COLORS.white,
                fontSize: 44,
                bold: true,
                alignment: "center",
              },
            ],
          ],
        },
        layout: "noBorders",
        absolutePosition: { x: 286, y: 97 },
      },
      {
        table: {
          widths: [116],
          body: [
            [
              {
                text: "PHOTOS",
                color: COLORS.white,
                fontSize: 12,
                bold: true,
                alignment: "center",
                characterSpacing: 1.2,
              },
            ],
          ],
        },
        layout: "noBorders",
        absolutePosition: { x: 418, y: 119 },
      },
      {
        table: {
          widths: [116],
          body: [
            [
              {
                text: "ONE\nSTORY",
                color: COLORS.ink,
                fontSize: 12,
                bold: true,
                alignment: "center",
                characterSpacing: 1.2,
                lineHeight: 1.15,
              },
            ],
          ],
        },
        layout: "noBorders",
        absolutePosition: { x: 550, y: 110 },
      },
      {
        text: "Thank you for making this memory.",
        color: COLORS.white,
        fontSize: 35,
        bold: true,
        alignment: "center",
        width: 700,
        absolutePosition: { x: 130, y: 238 },
      },
      {
        text: eventName,
        color: "#CEC5DB",
        fontSize: 16,
        alignment: "center",
        width: 700,
        absolutePosition: { x: 130, y: 315 },
      },
      {
        text: eventCode ? `EVENT CODE  ${eventCode}` : "SNAPUP EVENTS",
        color: COLORS.cyan,
        fontSize: 10,
        bold: true,
        alignment: "center",
        characterSpacing: 1.5,
        width: 700,
        absolutePosition: { x: 130, y: 372 },
      },
      {
        text: "snapup.events",
        color: COLORS.pink,
        fontSize: 10,
        bold: true,
        alignment: "center",
        characterSpacing: 1.4,
        width: 700,
        absolutePosition: { x: 130, y: 454 },
      },
    ],
  };
}

function buildDocumentDefinition(event, prepared, locale) {
  const images = {};

  prepared.photos.forEach((photo) => {
    images[photo.imageKey] = photo.dataUrl;
  });

  let coverImageKey = null;

  if (prepared.cover) {
    coverImageKey = "memory_cover";
    images[coverImageKey] = prepared.cover;
  }

  const photoPages = prepared.photos.map((photo, index) =>
    createPhotoPage(photo, index, prepared.photos.length, locale),
  );

  return {
    pageSize: {
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
    },
    pageMargins: [0, 0, 0, 0],
    info: {
      title: `${safeText(event?.event_name, "SnapUp Event")} Memory Book`,
      author: "SnapUp Events",
      subject: "Event Memory Book",
      creator: "SnapUp Events Browser PDF Engine",
    },
    defaultStyle: {
      font: "Roboto",
    },
    images,
    content: [
      createCoverPage(
        event,
        coverImageKey,
        prepared.photos.length,
        locale,
      ),
      ...photoPages,
      createClosingPage(event, prepared.photos.length),
    ],
  };
}

function createPdfBlob(pdfMake, documentDefinition) {
  return new Promise((resolve, reject) => {
    try {
      pdfMake.createPdf(documentDefinition).getBlob(resolve);
    } catch (error) {
      reject(error);
    }
  });
}

export async function createMemoryBookPdf({
  event,
  mediaItems,
  locale = "en-US",
  onProgress,
}) {
  const pdfMake = getPdfMake();
  const sourceItems = Array.isArray(mediaItems) ? mediaItems : [];

  if (!sourceItems.length) {
    throw new Error("There are no approved photos for the Memory Book.");
  }

  const prepared = await prepareImages(
    sourceItems,
    getEventCoverUrl(event, "pdf"),
    onProgress,
  );

  if (!prepared.photos.length) {
    throw new Error(
      "The approved photos could not be loaded. Check the image addresses and try again.",
    );
  }

  const documentDefinition = buildDocumentDefinition(
    event,
    prepared,
    locale,
  );
  const blob = await createPdfBlob(pdfMake, documentDefinition);

  if (!blob?.size) {
    throw new Error("The generated PDF file is empty.");
  }

  const nameSource = event?.event_code || event?.event_name || "event";

  return {
    blob,
    fileName: `snapup-${slugify(nameSource)}-memory-book.pdf`,
    includedCount: prepared.photos.length,
    skippedCount: prepared.skippedCount,
  };
}
