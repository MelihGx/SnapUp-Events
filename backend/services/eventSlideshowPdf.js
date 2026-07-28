const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const PDF_WIDTH = 960;
const PDF_HEIGHT = 540;
const IMAGE_TIMEOUT_MS = 15_000;
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const DOWNLOAD_CONCURRENCY = 4;

const COLORS = {
  ink: "#070B18",
  surface: "#0D1428",
  surfaceSoft: "#151E38",
  white: "#F8FAFC",
  muted: "#CBD5E1",
  purple: "#7C3AED",
  pink: "#EC4899",
  cyan: "#22D3EE",
  line: "#263352",
};

const FONT_DIR = path.join(__dirname, "..", "assets", "fonts");
const FONT_REGULAR = path.join(FONT_DIR, "DejaVuSans.ttf");
const FONT_BOLD = path.join(FONT_DIR, "DejaVuSans-Bold.ttf");

class SlideshowPdfError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "SlideshowPdfError";
    this.code = code;
  }
}

function assertFontsExist() {
  if (!fs.existsSync(FONT_REGULAR) || !fs.existsSync(FONT_BOLD)) {
    throw new SlideshowPdfError(
      "PDF font files are missing from assets/fonts.",
      "PDF_FONTS_MISSING",
    );
  }
}

function cleanText(value, fallback = "") {
  const text = String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return text || fallback;
}

function cleanFileName(value) {
  return cleanText(value, "snapup-event")
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function formatEventDate(value) {
  if (!value) {
    return "";
  }

  const rawValue = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawValue)
    ? new Date(`${rawValue}T12:00:00`)
    : new Date(rawValue);

  if (Number.isNaN(date.getTime())) {
    return cleanText(value);
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatPhotoDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatTime(value) {
  const match = String(value || "").match(/^(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
}

function createSlideshowFileName(event) {
  const name = cleanFileName(event?.event_name);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(event?.event_date || ""))
    ? event.event_date
    : "";
  const code = cleanFileName(event?.event_code).toUpperCase();

  return [name, date, code, "slideshow"].filter(Boolean).join("-") + ".pdf";
}

function getCloudinaryJpgUrl(imageUrl) {
  if (!imageUrl || !imageUrl.includes("/upload/")) {
    return imageUrl;
  }

  return imageUrl.replace(
    "/upload/",
    "/upload/f_jpg,q_auto,w_1920,h_1080,c_limit/",
  );
}

function isSupportedImage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return false;
  }

  const isJpeg =
    buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  return isJpeg || isPng;
}

async function downloadImage(imageUrl, fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== "function") {
    throw new Error("The Node.js fetch API is not available.");
  }

  const transformedUrl = getCloudinaryJpgUrl(imageUrl);
  const parsedUrl = new URL(transformedUrl);

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Only HTTP and HTTPS image URLs are supported.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);

  try {
    const response = await fetchImpl(parsedUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "image/jpeg,image/png,image/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Image request failed with status ${response.status}.`);
    }

    const contentType = String(response.headers.get("content-type") || "");
    if (
      contentType &&
      !contentType.startsWith("image/") &&
      contentType !== "application/octet-stream"
    ) {
      throw new Error(`Unsupported image content type: ${contentType}.`);
    }

    const declaredLength = Number(response.headers.get("content-length") || 0);
    if (declaredLength > MAX_IMAGE_BYTES) {
      throw new Error("Image is larger than the PDF download limit.");
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new Error("Image is larger than the PDF download limit.");
    }

    if (!isSupportedImage(buffer)) {
      throw new Error("The downloaded file is not a supported JPEG or PNG.");
    }

    return buffer;
  } finally {
    clearTimeout(timeout);
  }
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workerCount = Math.min(concurrency, Math.max(items.length, 1));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return results;
}

async function prepareSlideshowAssets({
  event,
  media,
  fetchImpl = globalThis.fetch,
  logger = console,
}) {
  const approvedImages = Array.isArray(media) ? media : [];

  const downloaded = await mapWithConcurrency(
    approvedImages,
    DOWNLOAD_CONCURRENCY,
    async (item) => {
      try {
        const imageBuffer = await downloadImage(item.media_url, fetchImpl);
        return { item, imageBuffer };
      } catch (error) {
        logger.warn("PDF slideshow skipped an image.", {
          media_id: item.media_id,
          error: error.message,
        });
        return null;
      }
    },
  );

  const slides = downloaded.filter(Boolean);

  if (slides.length === 0) {
    throw new SlideshowPdfError(
      "None of the approved photos could be prepared for the PDF.",
      "NO_RENDERABLE_IMAGES",
    );
  }

  let coverBuffer = slides[0].imageBuffer;

  if (event?.event_cover_url) {
    try {
      coverBuffer = await downloadImage(event.event_cover_url, fetchImpl);
    } catch (error) {
      logger.warn("PDF slideshow could not load the event cover.", {
        error: error.message,
      });
    }
  }

  return {
    slides,
    coverBuffer,
    skippedCount: approvedImages.length - slides.length,
  };
}

function registerFonts(doc) {
  assertFontsExist();
  doc.registerFont("SnapUp", FONT_REGULAR);
  doc.registerFont("SnapUp-Bold", FONT_BOLD);
}

function drawPageBackground(doc) {
  const gradient = doc.linearGradient(0, 0, PDF_WIDTH, PDF_HEIGHT);
  gradient.stop(0, COLORS.ink);
  gradient.stop(0.55, COLORS.surface);
  gradient.stop(1, "#101936");
  doc.rect(0, 0, PDF_WIDTH, PDF_HEIGHT).fill(gradient);

  const accent = doc.linearGradient(0, 0, PDF_WIDTH, 0);
  accent.stop(0, COLORS.purple);
  accent.stop(0.52, COLORS.pink);
  accent.stop(1, COLORS.cyan);
  doc.rect(0, 0, PDF_WIDTH, 6).fill(accent);
}

function drawBrand(doc, x, y, color = COLORS.white) {
  doc
    .font("SnapUp-Bold")
    .fontSize(13)
    .fillColor(color)
    .text("SNAPUP EVENTS", x, y, { characterSpacing: 1.4 });
}

function drawPill(doc, text, x, y, width, options = {}) {
  const {
    fill = COLORS.white,
    textColor = COLORS.ink,
    borderColor = null,
    fontSize = 11,
  } = options;

  doc.save();
  doc.roundedRect(x, y, width, 30, 15).fill(fill);
  if (borderColor) {
    doc
      .roundedRect(x, y, width, 30, 15)
      .lineWidth(1)
      .strokeColor(borderColor)
      .stroke();
  }
  doc.restore();

  doc.font("SnapUp-Bold").fontSize(fontSize);
  const fittedText = ellipsizeToWidth(doc, cleanText(text), width - 24);

  doc
    .fillColor(textColor)
    .text(fittedText, x + 12, y + 9, {
      width: width - 24,
      align: "center",
      lineBreak: false,
    });
}

function drawFittedTitle(doc, text, x, y, width, height) {
  const safeText = cleanText(text, "Untitled Event");
  let fontSize = 48;

  doc.font("SnapUp-Bold");

  while (fontSize > 28) {
    doc.fontSize(fontSize);
    const textHeight = doc.heightOfString(safeText, {
      width,
      lineGap: 2,
    });

    if (textHeight <= height) {
      break;
    }

    fontSize -= 2;
  }

  doc
    .fontSize(fontSize)
    .fillColor(COLORS.white)
    .text(safeText, x, y, {
      width,
      height,
      lineGap: 2,
      ellipsis: true,
    });
}

function ellipsizeToHeight(doc, text, width, height, options = {}) {
  const safeText = cleanText(text);
  const measurementOptions = {
    width,
    lineGap: options.lineGap || 0,
  };

  if (doc.heightOfString(safeText, measurementOptions) <= height) {
    return safeText;
  }

  let low = 0;
  let high = safeText.length;
  let best = "...";

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const candidate = `${safeText.slice(0, middle).trimEnd()}...`;

    if (doc.heightOfString(candidate, measurementOptions) <= height) {
      best = candidate;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return best;
}

function ellipsizeToWidth(doc, text, maxWidth) {
  const safeText = cleanText(text);

  if (doc.widthOfString(safeText) <= maxWidth) {
    return safeText;
  }

  let low = 0;
  let high = safeText.length;
  let best = "...";

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const candidate = `${safeText.slice(0, middle).trimEnd()}...`;

    if (doc.widthOfString(candidate) <= maxWidth) {
      best = candidate;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return best;
}

function drawCoverPage(doc, event, coverBuffer, photoCount) {
  doc.addPage();

  doc.save();
  doc.rect(0, 0, PDF_WIDTH, PDF_HEIGHT).clip();
  doc.image(coverBuffer, 0, 0, {
    cover: [PDF_WIDTH, PDF_HEIGHT],
    align: "center",
    valign: "center",
  });
  doc.restore();

  doc.save();
  doc.fillOpacity(0.7).rect(0, 0, PDF_WIDTH, PDF_HEIGHT).fill(COLORS.ink);
  doc.restore();

  const overlay = doc.linearGradient(0, 0, PDF_WIDTH, 0);
  overlay.stop(0, COLORS.ink);
  overlay.stop(0.55, "#11152B");
  overlay.stop(1, COLORS.purple);
  doc.save();
  doc.fillOpacity(0.72).rect(0, 0, PDF_WIDTH, PDF_HEIGHT).fill(overlay);
  doc.restore();

  const accent = doc.linearGradient(0, 0, PDF_WIDTH, 0);
  accent.stop(0, COLORS.purple);
  accent.stop(0.5, COLORS.pink);
  accent.stop(1, COLORS.cyan);
  doc.rect(0, 0, PDF_WIDTH, 7).fill(accent);

  drawBrand(doc, 54, 42);

  if (event.event_code) {
    drawPill(doc, `CODE  ${event.event_code}`, 748, 34, 158, {
      fill: COLORS.white,
      textColor: COLORS.purple,
    });
  }

  doc
    .font("SnapUp-Bold")
    .fontSize(12)
    .fillColor(COLORS.cyan)
    .text("YOUR SHARED EVENT ALBUM", 54, 178, {
      characterSpacing: 1.2,
    });

  drawFittedTitle(doc, event.event_name, 54, 208, 720, 120);

  const description = cleanText(
    event.description,
    "The moments your guests captured, collected in one place.",
  );
  doc.font("SnapUp").fontSize(13);
  doc
    .fillColor(COLORS.muted)
    .text(ellipsizeToHeight(doc, description, 700, 44, { lineGap: 3 }), 54, 340, {
      width: 700,
      height: 44,
      lineGap: 3,
    });

  const date = formatEventDate(event.event_date);
  const location = cleanText(event.event_location);
  const startTime = formatTime(event.event_start_time);
  const finishTime = formatTime(event.event_finish_time);
  const time = [startTime, finishTime].filter(Boolean).join(" - ");
  const meta = [date, time, location].filter(Boolean);

  let metaX = 54;
  meta.forEach((value) => {
    const pillWidth = Math.min(
      250,
      Math.max(112, doc.widthOfString(value) + 32),
    );
    drawPill(doc, value, metaX, 413, pillWidth, {
      fill: COLORS.surfaceSoft,
      textColor: COLORS.white,
      borderColor: COLORS.line,
      fontSize: 10,
    });
    metaX += pillWidth + 10;
  });

  doc
    .font("SnapUp-Bold")
    .fontSize(30)
    .fillColor(COLORS.white)
    .text(String(photoCount).padStart(2, "0"), 54, 473, {
      width: 65,
      lineBreak: false,
    });
  doc
    .font("SnapUp-Bold")
    .fontSize(10)
    .fillColor(COLORS.pink)
    .text(photoCount === 1 ? "APPROVED MEMORY" : "APPROVED MEMORIES", 118, 486, {
      characterSpacing: 0.8,
    });
}

function drawPhotoPage(doc, slide, index, total, event) {
  doc.addPage();
  drawPageBackground(doc);

  const frame = { x: 32, y: 24, width: 896, height: 408 };

  doc.save();
  doc.roundedRect(frame.x, frame.y, frame.width, frame.height, 22).clip();

  doc.save();
  doc.opacity(0.22);
  doc.image(slide.imageBuffer, frame.x, frame.y, {
    cover: [frame.width, frame.height],
    align: "center",
    valign: "center",
  });
  doc.restore();

  doc.save();
  doc.fillOpacity(0.48).rect(frame.x, frame.y, frame.width, frame.height).fill("#020617");
  doc.restore();

  doc.image(slide.imageBuffer, frame.x + 28, frame.y + 22, {
    fit: [frame.width - 56, frame.height - 44],
    align: "center",
    valign: "center",
  });
  doc.restore();

  doc
    .roundedRect(frame.x, frame.y, frame.width, frame.height, 22)
    .lineWidth(1)
    .strokeColor(COLORS.line)
    .stroke();

  drawBrand(doc, 52, 44);

  if (event.event_code) {
    drawPill(doc, event.event_code, 806, 36, 102, {
      fill: COLORS.ink,
      textColor: COLORS.cyan,
      borderColor: COLORS.line,
      fontSize: 10,
    });
  }

  const name = cleanText(slide.item.guest_name, "Guest");
  const caption = cleanText(slide.item.message, "Shared a moment from the event.");
  const createdAt = formatPhotoDate(slide.item.media_created_at);
  const initial = Array.from(name)[0]?.toLocaleUpperCase("tr-TR") || "G";

  const avatarGradient = doc.linearGradient(45, 450, 83, 488);
  avatarGradient.stop(0, COLORS.purple);
  avatarGradient.stop(0.55, COLORS.pink);
  avatarGradient.stop(1, COLORS.cyan);
  doc.circle(64, 474, 20).fill(avatarGradient);
  doc
    .font("SnapUp-Bold")
    .fontSize(15)
    .fillColor(COLORS.white)
    .text(initial, 45, 466, { width: 38, align: "center" });

  doc
    .font("SnapUp-Bold")
    .fontSize(14)
    .fillColor(COLORS.white)
    .text(name, 96, 449, {
      width: 620,
      height: 20,
      ellipsis: true,
      lineBreak: false,
    });

  doc.font("SnapUp").fontSize(11);
  doc
    .fillColor(COLORS.muted)
    .text(ellipsizeToHeight(doc, caption, 620, 36, { lineGap: 2 }), 96, 475, {
      width: 620,
      height: 36,
      lineGap: 2,
    });

  if (createdAt) {
    doc
      .font("SnapUp")
      .fontSize(9)
      .fillColor("#94A3B8")
      .text(createdAt, 748, 451, {
        width: 160,
        align: "right",
      });
  }

  doc
    .font("SnapUp-Bold")
    .fontSize(16)
    .fillColor(COLORS.white)
    .text(`${index + 1} / ${total}`, 748, 481, {
      width: 160,
      align: "right",
    });

  const progressWidth = 160 * ((index + 1) / total);
  doc.roundedRect(748, 508, 160, 4, 2).fill(COLORS.line);
  const progressGradient = doc.linearGradient(748, 0, 908, 0);
  progressGradient.stop(0, COLORS.purple);
  progressGradient.stop(0.5, COLORS.pink);
  progressGradient.stop(1, COLORS.cyan);
  doc.roundedRect(748, 508, progressWidth, 4, 2).fill(progressGradient);
}

function drawEndPage(doc, event, photoCount) {
  doc.addPage();
  drawPageBackground(doc);

  doc.save();
  doc.fillOpacity(0.2).circle(130, 95, 150).fill(COLORS.purple);
  doc.fillOpacity(0.16).circle(850, 460, 190).fill(COLORS.pink);
  doc.fillOpacity(0.12).circle(865, 70, 100).fill(COLORS.cyan);
  doc.restore();

  drawBrand(doc, 54, 42);

  doc
    .font("SnapUp-Bold")
    .fontSize(46)
    .fillColor(COLORS.white)
    .text("Every angle.\nOne shared story.", 120, 150, {
      width: 720,
      align: "center",
      lineGap: 5,
    });

  const summary = `${photoCount} ${
    photoCount === 1 ? "memory" : "memories"
  } from ${cleanText(event.event_name, "your event")}.`;
  doc.font("SnapUp").fontSize(13);
  doc
    .fillColor(COLORS.muted)
    .text(ellipsizeToHeight(doc, summary, 660, 36, { lineGap: 2 }), 150, 290, {
      width: 660,
      height: 36,
      align: "center",
      lineGap: 2,
    });

  if (event.event_code) {
    drawPill(doc, `EVENT CODE  ${event.event_code}`, 355, 345, 250, {
      fill: COLORS.white,
      textColor: COLORS.purple,
    });
  }

  const accent = doc.linearGradient(0, 0, 350, 0);
  accent.stop(0, COLORS.purple);
  accent.stop(0.5, COLORS.pink);
  accent.stop(1, COLORS.cyan);
  doc.roundedRect(305, 425, 350, 6, 3).fill(accent);

  doc
    .font("SnapUp-Bold")
    .fontSize(12)
    .fillColor(COLORS.white)
    .text("Capture it. Share it. Keep it.", 250, 456, {
      width: 460,
      align: "center",
      characterSpacing: 0.4,
    });
}

function renderSlideshowPdf({ event, slides, coverBuffer }) {
  assertFontsExist();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [PDF_WIDTH, PDF_HEIGHT],
      margin: 0,
      autoFirstPage: false,
      info: {
        Title: `${cleanText(event.event_name, "SnapUp Event")} - Slideshow`,
        Author: "SnapUp Events",
        Subject: "Event photo slideshow",
        Creator: "SnapUp Events",
      },
    });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    try {
      registerFonts(doc);
      drawCoverPage(doc, event, coverBuffer, slides.length);

      slides.forEach((slide, index) => {
        drawPhotoPage(doc, slide, index, slides.length, event);
      });

      drawEndPage(doc, event, slides.length);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

async function buildEventSlideshowPdf({
  event,
  media,
  fetchImpl = globalThis.fetch,
  logger = console,
}) {
  assertFontsExist();

  const { slides, coverBuffer, skippedCount } = await prepareSlideshowAssets({
    event,
    media,
    fetchImpl,
    logger,
  });

  const buffer = await renderSlideshowPdf({
    event,
    slides,
    coverBuffer,
  });

  return {
    buffer,
    includedCount: slides.length,
    skippedCount,
  };
}

module.exports = {
  SlideshowPdfError,
  buildEventSlideshowPdf,
  createSlideshowFileName,
  renderSlideshowPdf,
};
