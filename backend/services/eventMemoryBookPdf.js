const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const PAGE_WIDTH = 1080;
const PAGE_HEIGHT = 607.5;
const IMAGE_TIMEOUT_MS = 15_000;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const DOWNLOAD_CONCURRENCY = 3;

const COLORS = {
  ink: "#0B0714",
  inkSoft: "#151024",
  panel: "#1C1530",
  panelLight: "#F8F5FF",
  white: "#FFFFFF",
  paper: "#F8F5FF",
  muted: "#C7BED7",
  mutedDark: "#726680",
  line: "#312544",
  purple: "#7C3AED",
  purpleDeep: "#5B21B6",
  pink: "#EC4899",
  teal: "#14B8A6",
  tealLight: "#5EEAD4",
};

const FONT_DIR = path.join(__dirname, "..", "assets", "fonts");
const FONT_REGULAR = path.join(FONT_DIR, "DejaVuSans.ttf");
const FONT_BOLD = path.join(FONT_DIR, "DejaVuSans-Bold.ttf");

class MemoryBookPdfError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "MemoryBookPdfError";
    this.code = code;
  }
}

function assertFontsExist() {
  if (!fs.existsSync(FONT_REGULAR) || !fs.existsSync(FONT_BOLD)) {
    throw new MemoryBookPdfError(
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
    .slice(0, 60);
}

function createMemoryBookFileName(event) {
  const name = cleanFileName(event?.event_name);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(event?.event_date || ""))
    ? event.event_date
    : "";
  const code = cleanFileName(event?.event_code).toUpperCase();

  return [name, date, code, "memory-book"].filter(Boolean).join("-") + ".pdf";
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

function getCloudinaryJpgUrl(imageUrl) {
  if (!imageUrl || !imageUrl.includes("/upload/")) {
    return imageUrl;
  }

  return imageUrl.replace(
    "/upload/",
    "/upload/f_jpg,q_auto:good,w_1800,h_1400,c_limit/",
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

async function prepareMemoryBookAssets({
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
        logger.warn("Memory Book skipped an image.", {
          media_id: item?.media_id,
          error: error.message,
        });
        return null;
      }
    },
  );

  const moments = downloaded.filter(Boolean);

  if (moments.length === 0) {
    throw new MemoryBookPdfError(
      "None of the approved photos could be prepared for the PDF.",
      "NO_RENDERABLE_IMAGES",
    );
  }

  let coverBuffer = moments[0].imageBuffer;

  if (event?.event_cover_url) {
    try {
      coverBuffer = await downloadImage(event.event_cover_url, fetchImpl);
    } catch (error) {
      logger.warn("Memory Book could not load the event cover.", {
        error: error.message,
      });
    }
  }

  return {
    moments,
    coverBuffer,
    skippedCount: approvedImages.length - moments.length,
  };
}

function registerFonts(doc) {
  assertFontsExist();
  doc.registerFont("SnapUp", FONT_REGULAR);
  doc.registerFont("SnapUp-Bold", FONT_BOLD);
}

function drawAccentGradient(doc, x, y, width, height) {
  const gradient = doc.linearGradient(x, y, x + width, y);
  gradient.stop(0, COLORS.purple);
  gradient.stop(0.55, COLORS.pink);
  gradient.stop(1, COLORS.teal);
  doc.roundedRect(x, y, width, height, height / 2).fill(gradient);
}

function drawDarkBackground(doc) {
  const gradient = doc.linearGradient(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  gradient.stop(0, COLORS.ink);
  gradient.stop(0.58, COLORS.inkSoft);
  gradient.stop(1, "#10262B");
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(gradient);

  doc.save();
  doc.fillOpacity(0.13).circle(1010, 30, 220).fill(COLORS.teal);
  doc.fillOpacity(0.1).circle(80, 580, 180).fill(COLORS.purple);
  doc.restore();

  drawAccentGradient(doc, 0, 0, PAGE_WIDTH, 7);
}

function drawBrand(doc, x, y, color = COLORS.white) {
  doc
    .font("SnapUp-Bold")
    .fontSize(13)
    .fillColor(color)
    .text("SNAPUP EVENTS", x, y, {
      characterSpacing: 1.35,
      lineBreak: false,
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

function drawFittedTitle(
  doc,
  text,
  x,
  y,
  width,
  height,
  options = {},
) {
  const safeText = cleanText(text, "Untitled Event");
  const maxFontSize = options.maxFontSize || 58;
  const minFontSize = options.minFontSize || 28;
  let fontSize = maxFontSize;

  doc.font("SnapUp-Bold");

  while (fontSize > minFontSize) {
    doc.fontSize(fontSize);

    if (
      doc.heightOfString(safeText, {
        width,
        lineGap: options.lineGap || 1,
      }) <= height
    ) {
      break;
    }

    fontSize -= 2;
  }

  doc
    .fontSize(fontSize)
    .fillColor(options.color || COLORS.white)
    .text(safeText, x, y, {
      width,
      height,
      lineGap: options.lineGap || 1,
      ellipsis: true,
    });
}

function drawPill(doc, text, x, y, width, options = {}) {
  const fill = options.fill || COLORS.panel;
  const textColor = options.textColor || COLORS.white;
  const borderColor = options.borderColor || null;

  doc.save();
  doc.roundedRect(x, y, width, 31, 15.5).fill(fill);

  if (borderColor) {
    doc
      .roundedRect(x, y, width, 31, 15.5)
      .lineWidth(1)
      .strokeColor(borderColor)
      .stroke();
  }

  doc.restore();
  doc.font("SnapUp-Bold").fontSize(options.fontSize || 10);

  const label = ellipsizeToWidth(doc, text, width - 24);

  doc
    .fillColor(textColor)
    .text(label, x + 12, y + 9, {
      width: width - 24,
      align: "center",
      lineBreak: false,
    });
}

function drawImageFrame(doc, imageBuffer, x, y, width, height, radius = 22) {
  doc.save();
  doc.roundedRect(x, y, width, height, radius).clip();

  doc.save();
  doc.opacity(0.22);
  doc.image(imageBuffer, x, y, {
    cover: [width, height],
    align: "center",
    valign: "center",
  });
  doc.restore();

  doc.save();
  doc.fillOpacity(0.48).rect(x, y, width, height).fill("#05030A");
  doc.restore();

  doc.image(imageBuffer, x + 22, y + 20, {
    fit: [width - 44, height - 40],
    align: "center",
    valign: "center",
  });
  doc.restore();

  doc
    .roundedRect(x, y, width, height, radius)
    .lineWidth(1)
    .strokeColor(COLORS.line)
    .stroke();
}

function drawStackedCoverImage(
  doc,
  imageBuffer,
  x,
  y,
  width,
  height,
  angle,
  accentColor,
) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  doc.save();
  doc.rotate(angle, { origin: [centerX, centerY] });
  doc.save();
  doc.fillOpacity(0.28);
  doc.roundedRect(x + 12, y + 17, width, height, 22).fill("#000000");
  doc.restore();
  doc.roundedRect(x, y, width, height, 22).fill(accentColor);
  doc.save();
  doc.roundedRect(x + 7, y + 7, width - 14, height - 14, 17).clip();
  doc.image(imageBuffer, x + 7, y + 7, {
    cover: [width - 14, height - 14],
    align: "center",
    valign: "center",
  });
  doc.restore();
  doc
    .roundedRect(x, y, width, height, 22)
    .lineWidth(1.2)
    .strokeColor("#FFFFFF")
    .opacity(0.2)
    .stroke();
  doc.opacity(1);
  doc.restore();
}

function drawCoverPage(doc, event, moments, coverBuffer) {
  doc.addPage();
  drawDarkBackground(doc);

  drawBrand(doc, 58, 43);

  doc
    .font("SnapUp-Bold")
    .fontSize(11)
    .fillColor(COLORS.tealLight)
    .text("MEMORY BOOK / SHARED EVENT ALBUM", 58, 124, {
      characterSpacing: 1.1,
    });

  drawFittedTitle(doc, event.event_name, 58, 153, 475, 155, {
    maxFontSize: 62,
    minFontSize: 32,
  });

  const description = cleanText(
    event.description,
    "The moments your guests captured, collected in one place.",
  );

  doc.font("SnapUp").fontSize(13);
  doc
    .fillColor(COLORS.muted)
    .text(ellipsizeToHeight(doc, description, 455, 48, { lineGap: 3 }), 58, 327, {
      width: 455,
      height: 48,
      lineGap: 3,
    });

  const date = formatEventDate(event.event_date);
  const location = cleanText(
    [event.event_location, event.event_address].filter(Boolean).join(", "),
  );
  const startTime = formatTime(event.event_start_time);
  const finishTime = formatTime(event.event_finish_time);
  const eventTime = [startTime, finishTime].filter(Boolean).join(" - ");

  let metaY = 404;

  [date, eventTime, location].filter(Boolean).forEach((value) => {
    doc.font("SnapUp-Bold").fontSize(10);
    const width = Math.min(280, Math.max(116, doc.widthOfString(value) + 34));

    drawPill(doc, value, 58, metaY, width, {
      fill: COLORS.panel,
      textColor: COLORS.white,
      borderColor: COLORS.line,
    });

    metaY += 39;
  });

  doc
    .font("SnapUp-Bold")
    .fontSize(29)
    .fillColor(COLORS.white)
    .text(String(moments.length).padStart(2, "0"), 58, 535, {
      width: 58,
      lineBreak: false,
    });
  doc
    .font("SnapUp-Bold")
    .fontSize(10)
    .fillColor(COLORS.pink)
    .text(moments.length === 1 ? "APPROVED MEMORY" : "APPROVED MEMORIES", 113, 546, {
      characterSpacing: 0.7,
    });

  const coverImages = [
    moments[2]?.imageBuffer || moments[0].imageBuffer,
    moments[1]?.imageBuffer || coverBuffer,
    coverBuffer,
  ];

  drawStackedCoverImage(
    doc,
    coverImages[0],
    655,
    88,
    320,
    430,
    8,
    COLORS.teal,
  );
  drawStackedCoverImage(
    doc,
    coverImages[1],
    627,
    77,
    320,
    430,
    -7,
    COLORS.pink,
  );
  drawStackedCoverImage(
    doc,
    coverImages[2],
    640,
    72,
    320,
    430,
    0,
    COLORS.purple,
  );

  if (event.event_code) {
    drawPill(doc, `CODE ${event.event_code}`, 793, 535, 168, {
      fill: COLORS.white,
      textColor: COLORS.purpleDeep,
    });
  }
}

function drawMomentInfoPanel(doc, moment, index, total, event, x, y, width, height) {
  const isEven = index % 2 === 0;
  const accentColor = isEven ? COLORS.pink : COLORS.teal;
  const name = cleanText(moment.item.guest_name, "Guest");
  const message = cleanText(
    moment.item.message,
    "Shared a moment from the event.",
  );
  const createdAt = formatPhotoDate(moment.item.media_created_at);
  const initial = Array.from(name)[0]?.toLocaleUpperCase("tr-TR") || "G";

  doc.roundedRect(x, y, width, height, 25).fill(COLORS.panel);
  doc
    .roundedRect(x, y, width, height, 25)
    .lineWidth(1)
    .strokeColor(COLORS.line)
    .stroke();

  doc
    .font("SnapUp-Bold")
    .fontSize(70)
    .fillColor("#2B2140")
    .text(String(index + 1).padStart(2, "0"), x + 24, y + 18, {
      width: width - 48,
      align: "right",
      lineBreak: false,
    });

  doc
    .font("SnapUp-Bold")
    .fontSize(10)
    .fillColor(accentColor)
    .text(`MOMENT ${String(index + 1).padStart(2, "0")}`, x + 28, y + 38, {
      characterSpacing: 1,
    });

  const avatarGradient = doc.linearGradient(x + 27, y + 112, x + 73, y + 158);
  avatarGradient.stop(0, COLORS.purple);
  avatarGradient.stop(0.55, COLORS.pink);
  avatarGradient.stop(1, COLORS.teal);
  doc.circle(x + 50, y + 135, 23).fill(avatarGradient);
  doc
    .font("SnapUp-Bold")
    .fontSize(16)
    .fillColor(COLORS.white)
    .text(initial, x + 28, y + 125, {
      width: 44,
      align: "center",
    });

  doc
    .font("SnapUp-Bold")
    .fontSize(16)
    .fillColor(COLORS.white)
    .text(ellipsizeToWidth(doc, name, width - 108), x + 84, y + 115, {
      width: width - 108,
      height: 23,
      lineBreak: false,
    });

  if (createdAt) {
    doc
      .font("SnapUp")
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text(createdAt, x + 84, y + 141, {
        width: width - 108,
        lineBreak: false,
      });
  }

  doc.font("SnapUp").fontSize(14);
  const caption = ellipsizeToHeight(doc, message, width - 56, 177, {
    lineGap: 5,
  });

  doc
    .fillColor(COLORS.white)
    .text(caption, x + 28, y + 202, {
      width: width - 56,
      height: 177,
      lineGap: 5,
    });

  drawAccentGradient(doc, x + 28, y + height - 75, width - 56, 5);

  const footer = [
    cleanText(event.event_code),
    `${index + 1} / ${total}`,
  ].filter(Boolean);

  doc
    .font("SnapUp-Bold")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(footer.join("  /  "), x + 28, y + height - 48, {
      width: width - 56,
      align: "right",
      lineBreak: false,
    });
}

function drawMomentPage(doc, moment, index, total, event) {
  doc.addPage();
  drawDarkBackground(doc);

  const margin = 36;
  const gap = 22;
  const imageWidth = 696;
  const panelWidth = PAGE_WIDTH - margin * 2 - gap - imageWidth;
  const contentY = 45;
  const contentHeight = PAGE_HEIGHT - 82;
  const imageOnLeft = index % 2 === 0;
  const imageX = imageOnLeft ? margin : margin + panelWidth + gap;
  const panelX = imageOnLeft ? margin + imageWidth + gap : margin;

  drawImageFrame(
    doc,
    moment.imageBuffer,
    imageX,
    contentY,
    imageWidth,
    contentHeight,
    25,
  );

  drawMomentInfoPanel(
    doc,
    moment,
    index,
    total,
    event,
    panelX,
    contentY,
    panelWidth,
    contentHeight,
  );

  drawBrand(
    doc,
    imageOnLeft ? imageX + 24 : imageX + imageWidth - 168,
    contentY + 19,
  );
}

function drawEndPage(doc, event, moments) {
  doc.addPage();
  drawDarkBackground(doc);

  const mosaic = [
    moments[0],
    moments[Math.floor((moments.length - 1) / 2)],
    moments[moments.length - 1],
  ].filter(Boolean);

  const frameWidth = 292;
  const frameHeight = 390;
  const startX = 70;

  mosaic.forEach((moment, index) => {
    const x = startX + index * 318;
    const y = index === 1 ? 74 : 98;

    doc.save();
    doc.fillOpacity(0.3);
    doc.roundedRect(x + 10, y + 14, frameWidth, frameHeight, 21).fill("#000000");
    doc.restore();

    doc.save();
    doc.roundedRect(x, y, frameWidth, frameHeight, 21).clip();
    doc.image(moment.imageBuffer, x, y, {
      cover: [frameWidth, frameHeight],
      align: "center",
      valign: "center",
    });
    doc.restore();

    doc
      .roundedRect(x, y, frameWidth, frameHeight, 21)
      .lineWidth(1)
      .strokeColor(COLORS.line)
      .stroke();
  });

  doc.save();
  doc.fillOpacity(0.82);
  doc.roundedRect(232, 194, 616, 220, 28).fill(COLORS.ink);
  doc.restore();
  doc
    .roundedRect(232, 194, 616, 220, 28)
    .lineWidth(1)
    .strokeColor(COLORS.line)
    .stroke();

  doc
    .font("SnapUp-Bold")
    .fontSize(11)
    .fillColor(COLORS.tealLight)
    .text("EVERY ANGLE / ONE SHARED STORY", 270, 229, {
      width: 540,
      align: "center",
      characterSpacing: 1,
    });

  drawFittedTitle(doc, event.event_name, 282, 263, 516, 78, {
    maxFontSize: 39,
    minFontSize: 25,
    color: COLORS.white,
  });

  doc
    .font("SnapUp")
    .fontSize(12)
    .fillColor(COLORS.muted)
    .text(
      `${moments.length} ${
        moments.length === 1 ? "memory" : "memories"
      } collected with SnapUp Events.`,
      282,
      349,
      {
        width: 516,
        align: "center",
      },
    );

  drawAccentGradient(doc, 380, 445, 320, 6);
  drawBrand(doc, 471, 489);
}

function renderMemoryBookPdf({ event, moments, coverBuffer }) {
  assertFontsExist();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [PAGE_WIDTH, PAGE_HEIGHT],
      margin: 0,
      autoFirstPage: false,
      compress: true,
      info: {
        Title: `${cleanText(event.event_name, "SnapUp Event")} - Memory Book`,
        Author: "SnapUp Events",
        Subject: "Approved event photo album",
        Creator: "SnapUp Events Memory Book",
      },
    });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    try {
      registerFonts(doc);
      drawCoverPage(doc, event, moments, coverBuffer);

      moments.forEach((moment, index) => {
        drawMomentPage(doc, moment, index, moments.length, event);
      });

      drawEndPage(doc, event, moments);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

async function buildEventMemoryBookPdf({
  event,
  media,
  fetchImpl = globalThis.fetch,
  logger = console,
}) {
  assertFontsExist();

  const { moments, coverBuffer, skippedCount } =
    await prepareMemoryBookAssets({
      event,
      media,
      fetchImpl,
      logger,
    });

  const buffer = await renderMemoryBookPdf({
    event,
    moments,
    coverBuffer,
  });

  return {
    buffer,
    includedCount: moments.length,
    skippedCount,
  };
}

module.exports = {
  MemoryBookPdfError,
  buildEventMemoryBookPdf,
  createMemoryBookFileName,
  renderMemoryBookPdf,
};
