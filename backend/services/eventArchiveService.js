const crypto = require("crypto");
const fs = require("fs");
const https = require("https");
const path = require("path");
const { once } = require("events");
const { ZipArchive } = require("archiver");
const jwt = require("jsonwebtoken");
const PDFDocument = require("pdfkit");

const ARCHIVE_TICKET_AUDIENCE = "snapup-event-archive";
const ARCHIVE_TICKET_ISSUER = "snapup-events";
const ARCHIVE_TICKET_TTL = "5m";
const REMOTE_REQUEST_TIMEOUT_MS = 60_000;
const MAX_REDIRECTS = 3;

const MIME_EXTENSIONS = Object.freeze({
  "image/avif": ".avif",
  "image/gif": ".gif",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
});

const SAFE_MEDIA_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".heic",
  ".heif",
  ".jpeg",
  ".jpg",
  ".mov",
  ".mp4",
  ".png",
  ".webm",
  ".webp",
]);

class EventArchiveError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message);
    this.name = "EventArchiveError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function normalizeArchiveOptions(value = {}) {
  const includeValue = value.include || {};
  const options = {
    quality: value.quality === "original" ? "original" : "optimized",
    include: {
      photos: includeValue.photos !== false,
      videos: includeValue.videos !== false,
      messages: includeValue.messages !== false,
      eventInfo: includeValue.eventInfo !== false,
    },
  };

  if (!Object.values(options.include).some(Boolean)) {
    throw new EventArchiveError(
      "Select at least one archive content type.",
      "ARCHIVE_CONTENT_REQUIRED",
      400,
    );
  }

  return options;
}

function createArchiveTicket({ userId, eventId, options }) {
  if (!process.env.JWT_SECRET) {
    throw new EventArchiveError(
      "Archive ticket service is not configured.",
      "ARCHIVE_TICKET_NOT_CONFIGURED",
      500,
    );
  }

  return jwt.sign(
    {
      purpose: "event_archive",
      user_id: userId,
      event_id: eventId,
      options: normalizeArchiveOptions(options),
    },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      audience: ARCHIVE_TICKET_AUDIENCE,
      expiresIn: ARCHIVE_TICKET_TTL,
      issuer: ARCHIVE_TICKET_ISSUER,
      jwtid: crypto.randomUUID(),
    },
  );
}

function verifyArchiveTicket(token, eventId) {
  if (!token || !process.env.JWT_SECRET) {
    throw new EventArchiveError(
      "Archive download ticket is missing.",
      "ARCHIVE_TICKET_REQUIRED",
      401,
    );
  }

  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      audience: ARCHIVE_TICKET_AUDIENCE,
      issuer: ARCHIVE_TICKET_ISSUER,
    });
  } catch (_error) {
    throw new EventArchiveError(
      "Archive download ticket is invalid or expired.",
      "ARCHIVE_TICKET_INVALID",
      401,
    );
  }

  if (
    payload.purpose !== "event_archive" ||
    String(payload.event_id || "") !== String(eventId || "") ||
    !payload.user_id
  ) {
    throw new EventArchiveError(
      "Archive download ticket does not match this event.",
      "ARCHIVE_TICKET_MISMATCH",
      403,
    );
  }

  return {
    userId: payload.user_id,
    eventId: payload.event_id,
    options: normalizeArchiveOptions(payload.options),
  };
}

function sanitizeFileSegment(value, fallback = "file", maxLength = 90) {
  const normalized = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\.{2,}/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "")
    .slice(0, maxLength)
    .trim();

  return normalized || fallback;
}

function createArchiveBaseName(event) {
  const eventName = sanitizeFileSegment(event?.event_name, "Event", 70);
  const eventCode = sanitizeFileSegment(event?.event_code, "SnapUp", 20);
  return `SnapUp-${eventName}-${eventCode}`;
}

function createEventArchiveFileName(event) {
  return `${createArchiveBaseName(event)}.zip`;
}

function createAsciiDownloadName(fileName) {
  const asciiName = String(fileName || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[<>:"/\\|?*]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 150)
    .replace(/^[.-]+|[. -]+$/g, "");

  return asciiName.toLowerCase().endsWith(".zip")
    ? asciiName
    : `${asciiName || "SnapUp-Event-Archive"}.zip`;
}

function getMediaKind(media) {
  const mediaType = String(media?.media_type || "").toLowerCase();

  if (mediaType.includes("video")) return "video";
  if (mediaType.includes("image")) return "image";
  return "message";
}

function countArchiveMedia(mediaItems) {
  return (mediaItems || []).reduce(
    (counts, item) => {
      const kind = getMediaKind(item);
      counts[kind] += 1;
      return counts;
    },
    { image: 0, video: 0, message: 0 },
  );
}

function escapeCsvCell(value) {
  const text = String(value ?? "").replace(/\r\n?/g, "\n");
  return `"${text.replaceAll('"', '""')}"`;
}

function buildGuestMessagesCsv(messages) {
  const header = ["Guest Name", "Message", "Created At"];
  const rows = (messages || []).map((item) => [
    item.guest_name || "Guest",
    item.message || "",
    item.media_created_at || "",
  ]);

  return `\uFEFF${[header, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n")}\r\n`;
}

function addPdfField(document, label, value) {
  const safeValue = String(value || "-");
  document.font("SnapUpBold").fontSize(9).fillColor("#6d5b85").text(label);
  document
    .font("SnapUpRegular")
    .fontSize(11)
    .fillColor("#201631")
    .text(safeValue, { lineGap: 2 });
  document.moveDown(0.7);
}

function createEventInfoPdfStream(event, counts, quality) {
  const document = new PDFDocument({
    size: "A4",
    margins: { top: 52, right: 54, bottom: 52, left: 54 },
    info: {
      Title: `${event.event_name || "SnapUp Event"} — Event Info`,
      Author: "SnapUp Events",
      Creator: "SnapUp Events",
    },
  });
  const regularFont = path.join(
    __dirname,
    "../assets/fonts/DejaVuSans.ttf",
  );
  const boldFont = path.join(
    __dirname,
    "../assets/fonts/DejaVuSans-Bold.ttf",
  );

  if (fs.existsSync(regularFont) && fs.existsSync(boldFont)) {
    document.registerFont("SnapUpRegular", regularFont);
    document.registerFont("SnapUpBold", boldFont);
  } else {
    document.registerFont("SnapUpRegular", "Helvetica");
    document.registerFont("SnapUpBold", "Helvetica-Bold");
  }

  document
    .roundedRect(54, 48, 487, 108, 18)
    .fill("#f4effc");
  document
    .font("SnapUpBold")
    .fontSize(11)
    .fillColor("#7c3aed")
    .text("SNAPUP EVENT ARCHIVE", 76, 69, { characterSpacing: 1.2 });
  document
    .font("SnapUpBold")
    .fontSize(25)
    .fillColor("#201631")
    .text(event.event_name || "Untitled Event", 76, 93, {
      width: 440,
      ellipsis: true,
    });

  document.y = 184;
  addPdfField(document, "Event code", event.event_code);
  addPdfField(document, "Date", event.event_date);
  addPdfField(
    document,
    "Time",
    [event.event_start_time, event.event_finish_time]
      .filter(Boolean)
      .map((value) => String(value).slice(0, 5))
      .join(" – "),
  );
  addPdfField(document, "Venue", event.event_location);
  addPdfField(document, "Address", event.event_address);
  addPdfField(document, "Description", event.description);
  addPdfField(
    document,
    "Access",
    event.is_event_private ? "Private event" : "Public event",
  );
  addPdfField(
    document,
    "Event status",
    event.is_event_active === false ? "Inactive" : "Active",
  );

  document.moveDown(0.4);
  document
    .font("SnapUpBold")
    .fontSize(15)
    .fillColor("#201631")
    .text("Archive summary");
  document.moveDown(0.6);

  const summaryTop = document.y;
  const summaryItems = [
    ["Photos", counts.image],
    ["Videos", counts.video],
    ["Messages", counts.message],
    ["Quality", quality === "original" ? "Original" : "Optimized"],
  ];

  summaryItems.forEach(([label, value], index) => {
    const columnWidth = 116;
    const x = 54 + index * 122;
    document.roundedRect(x, summaryTop, columnWidth, 64, 11).fill("#faf8fd");
    document
      .font("SnapUpBold")
      .fontSize(16)
      .fillColor("#201631")
      .text(String(value), x + 12, summaryTop + 13, {
        width: columnWidth - 24,
      });
    document
      .font("SnapUpRegular")
      .fontSize(8)
      .fillColor("#766789")
      .text(label, x + 12, summaryTop + 39, {
        width: columnWidth - 24,
      });
  });

  document.y = summaryTop + 91;
  document
    .font("SnapUpRegular")
    .fontSize(8)
    .fillColor("#8b7d9a")
    .text(`Exported by SnapUp Events · ${new Date().toISOString()}`);
  document.end();

  return document;
}

function assertCloudinaryUrl(urlValue) {
  let parsedUrl;

  try {
    parsedUrl = new URL(String(urlValue || ""));
  } catch (_error) {
    throw new EventArchiveError(
      "Media address is invalid.",
      "ARCHIVE_MEDIA_URL_INVALID",
      422,
    );
  }

  if (
    parsedUrl.protocol !== "https:" ||
    parsedUrl.hostname !== "res.cloudinary.com"
  ) {
    throw new EventArchiveError(
      "Media address is not an allowed Cloudinary delivery URL.",
      "ARCHIVE_MEDIA_HOST_INVALID",
      422,
    );
  }

  return parsedUrl;
}

function openRemoteResponse(urlValue, redirectsRemaining = MAX_REDIRECTS) {
  const parsedUrl = assertCloudinaryUrl(urlValue);

  return new Promise((resolve, reject) => {
    const request = https.get(
      parsedUrl,
      {
        headers: {
          Accept: "image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,*/*;q=0.5",
          "User-Agent": "SnapUp-Event-Archive/1.0",
        },
      },
      (response) => {
        const statusCode = Number(response.statusCode || 0);

        if (
          statusCode >= 300 &&
          statusCode < 400 &&
          response.headers.location
        ) {
          response.resume();

          if (redirectsRemaining <= 0) {
            reject(
              new EventArchiveError(
                "Cloudinary returned too many redirects.",
                "ARCHIVE_MEDIA_REDIRECT_LIMIT",
                502,
              ),
            );
            return;
          }

          let redirectUrl;

          try {
            redirectUrl = new URL(response.headers.location, parsedUrl);
            assertCloudinaryUrl(redirectUrl.toString());
          } catch (error) {
            reject(error);
            return;
          }

          openRemoteResponse(redirectUrl.toString(), redirectsRemaining - 1)
            .then(resolve, reject);
          return;
        }

        if (statusCode < 200 || statusCode >= 300) {
          response.resume();
          reject(
            new EventArchiveError(
              `Cloudinary returned HTTP ${statusCode || "unknown"}.`,
              "ARCHIVE_MEDIA_FETCH_FAILED",
              502,
            ),
          );
          return;
        }

        resolve(response);
      },
    );

    request.setTimeout(REMOTE_REQUEST_TIMEOUT_MS, () => {
      request.destroy(
        new EventArchiveError(
          "Cloudinary media request timed out.",
          "ARCHIVE_MEDIA_TIMEOUT",
          504,
        ),
      );
    });
    request.once("error", reject);
  });
}

function getResponseExtension(response, sourceUrl, mediaKind) {
  const contentType = String(response.headers["content-type"] || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  const mimeExtension = MIME_EXTENSIONS[contentType];

  if (mimeExtension) return mimeExtension;

  const pathExtension = path.extname(new URL(sourceUrl).pathname).toLowerCase();

  if (SAFE_MEDIA_EXTENSIONS.has(pathExtension)) {
    return pathExtension === ".jpeg" ? ".jpg" : pathExtension;
  }

  return mediaKind === "video" ? ".mp4" : ".jpg";
}

function createMediaEntryBase(media, index) {
  const order = String(index + 1).padStart(4, "0");
  const guestName = sanitizeFileSegment(media.guest_name, "Guest", 48);
  const createdAt = String(media.media_created_at || "")
    .replace(/[^0-9]/g, "")
    .slice(0, 14);
  const mediaId = sanitizeFileSegment(media.media_id, "media", 12).slice(0, 12);

  return [order, guestName, createdAt || null, mediaId]
    .filter(Boolean)
    .join("-");
}

async function appendRemoteMedia({
  archive,
  media,
  mediaIndex,
  rootFolder,
  sourceUrl,
  mediaKind,
}) {
  const response = await openRemoteResponse(sourceUrl);
  const extension = getResponseExtension(response, sourceUrl, mediaKind);
  const folder = mediaKind === "video" ? "Videos" : "Photos";
  const entryName = `${rootFolder}/${folder}/${createMediaEntryBase(
    media,
    mediaIndex,
  )}${extension}`;

  archive.append(response, {
    name: entryName,
    store: true,
  });

  await once(response, "end");
  return entryName;
}

async function streamEventArchive({
  req,
  res,
  event,
  mediaItems,
  options,
  resolveMediaUrl,
  logger = console,
}) {
  const normalizedOptions = normalizeArchiveOptions(options);
  const counts = countArchiveMedia(mediaItems);
  const rootFolder = createArchiveBaseName(event);
  const fileName = createEventArchiveFileName(event);
  const selectedMedia = (mediaItems || []).filter((item) => {
    const kind = getMediaKind(item);
    return (
      (kind === "image" && normalizedOptions.include.photos) ||
      (kind === "video" && normalizedOptions.include.videos)
    );
  });
  const messages = (mediaItems || []).filter(
    (item) =>
      getMediaKind(item) === "message" &&
      normalizedOptions.include.messages &&
      String(item.message || "").trim(),
  );
  const includedCounts = {
    image: normalizedOptions.include.photos ? counts.image : 0,
    video: normalizedOptions.include.videos ? counts.video : 0,
    message: normalizedOptions.include.messages ? messages.length : 0,
  };

  if (
    selectedMedia.length === 0 &&
    messages.length === 0 &&
    !normalizedOptions.include.eventInfo
  ) {
    throw new EventArchiveError(
      "No approved content matches the selected archive options.",
      "ARCHIVE_EMPTY",
      404,
    );
  }

  const archive = new ZipArchive({
    forceZip64: true,
    zlib: { level: 1 },
  });
  const skippedFiles = [];
  let completed = false;

  archive.on("warning", (error) => {
    logger.warn("Event archive warning:", error.message);
  });
  archive.on("error", (error) => {
    logger.error("Event archive stream error:", error.message);
    if (!res.destroyed) res.destroy(error);
  });

  const abortArchive = () => {
    if (!completed && !res.writableEnded && !res.finished) archive.abort();
  };
  req.once("aborted", abortArchive);
  res.once("close", abortArchive);

  const encodedFileName = encodeURIComponent(fileName);
  res.status(200);
  res.setHeader("Content-Type", "application/zip");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${createAsciiDownloadName(fileName)}"; filename*=UTF-8''${encodedFileName}`,
  );
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-SnapUp-Archive-Quality", normalizedOptions.quality);
  res.setHeader("X-SnapUp-Archive-Assets", String(selectedMedia.length));
  archive.pipe(res);

  if (normalizedOptions.include.eventInfo) {
    archive.append(
      createEventInfoPdfStream(
        event,
        includedCounts,
        normalizedOptions.quality,
      ),
      { name: `${rootFolder}/Event-Info.pdf` },
    );
  }

  if (normalizedOptions.include.messages) {
    archive.append(buildGuestMessagesCsv(messages), {
      name: `${rootFolder}/Guest-Messages.csv`,
    });
  }

  for (let index = 0; index < selectedMedia.length; index += 1) {
    if (req.aborted || res.destroyed) {
      archive.abort();
      return;
    }

    const media = selectedMedia[index];
    const mediaKind = getMediaKind(media);

    try {
      const sourceUrl = resolveMediaUrl(
        media,
        mediaKind,
        normalizedOptions.quality,
      );

      if (!sourceUrl) {
        throw new EventArchiveError(
          "Media delivery URL could not be created.",
          "ARCHIVE_MEDIA_URL_MISSING",
          422,
        );
      }

      await appendRemoteMedia({
        archive,
        media,
        mediaIndex: index,
        rootFolder,
        sourceUrl,
        mediaKind,
      });
    } catch (error) {
      skippedFiles.push(
        `${media.media_id || `item-${index + 1}`} — ${error.code || error.message}`,
      );
      logger.warn("Event archive media skipped:", {
        event_id: event.event_id,
        media_id: media.media_id,
        code: error.code,
        message: error.message,
      });
    }
  }

  if (skippedFiles.length > 0) {
    archive.append(
      `Some files could not be added to this archive.\r\n\r\n${skippedFiles.join("\r\n")}\r\n`,
      { name: `${rootFolder}/Skipped-Files.txt` },
    );
  }

  await archive.finalize();
  completed = true;
}

module.exports = {
  EventArchiveError,
  countArchiveMedia,
  createArchiveTicket,
  createEventArchiveFileName,
  normalizeArchiveOptions,
  streamEventArchive,
  verifyArchiveTicket,
};
