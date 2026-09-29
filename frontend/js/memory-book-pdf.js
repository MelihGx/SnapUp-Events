"use strict";

import { API_URL } from "./config.js?v=runtime-api-2";

function safeText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
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

function getEventId(event) {
  const direct = String(event?.event_id || "").trim();

  if (direct) {
    return direct;
  }

  return String(
    new URLSearchParams(window.location.search).get("event_id") || "",
  ).trim();
}

function getAuthHeaders() {
  const token = localStorage.getItem("snapup_token");

  return {
    Accept: "application/pdf",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getDownloadFileName(response, fallbackName) {
  const disposition = String(
    response.headers.get("content-disposition") || "",
  );

  const utf8Match = disposition.match(
    /filename\*\s*=\s*UTF-8''([^;]+)/i,
  );

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(
        utf8Match[1].trim().replace(/^"|"$/g, ""),
      );
    } catch (_error) {
      // Fall through to the normal filename parser.
    }
  }

  const basicMatch = disposition.match(
    /filename\s*=\s*"([^"]+)"|filename\s*=\s*([^;]+)/i,
  );

  const basicName = basicMatch?.[1] || basicMatch?.[2];

  return basicName
    ? basicName.trim().replace(/^"|"$/g, "")
    : fallbackName;
}

async function readErrorMessage(response) {
  const contentType = String(
    response.headers.get("content-type") || "",
  ).toLowerCase();

  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => ({}));
    return (
      data.message ||
      data.error ||
      `Memory Book request failed with status ${response.status}.`
    );
  }

  const text = await response.text().catch(() => "");

  return (
    text.trim() ||
    `Memory Book request failed with status ${response.status}.`
  );
}

export async function createMemoryBookPdf({
  event,
  mediaItems,
  onProgress,
}) {
  const sourceItems = Array.isArray(mediaItems) ? mediaItems : [];

  if (!sourceItems.length) {
    throw new Error("There are no approved photos for the Memory Book.");
  }

  const eventId = getEventId(event);

  if (!eventId) {
    throw new Error("Event ID is missing. Reload the event and try again.");
  }

  onProgress?.({
    completed: 0,
    total: sourceItems.length,
  });

  const response = await fetch(
    `${API_URL}/api/events/detail/${encodeURIComponent(
      eventId,
    )}/memory-book-v3`,
    {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
      credentials: "omit",
    },
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const contentType = String(
    response.headers.get("content-type") || "",
  ).toLowerCase();

  if (!contentType.includes("application/pdf")) {
    throw new Error("The server did not return a PDF file.");
  }

  const blob = await response.blob();

  if (!blob.size) {
    throw new Error("The generated PDF file is empty.");
  }

  const includedCount = Math.max(
    0,
    Number(
      response.headers.get("x-memory-book-photos") ||
        sourceItems.length,
    ) || 0,
  );

  const skippedCount = Math.max(
    0,
    Number(response.headers.get("x-memory-book-skipped") || 0) || 0,
  );

  onProgress?.({
    completed: includedCount,
    total: sourceItems.length,
  });

  const nameSource =
    event?.event_code ||
    event?.event_name ||
    "event";

  return {
    blob,
    fileName: getDownloadFileName(
      response,
      `snapup-${slugify(nameSource)}-memory-book.pdf`,
    ),
    includedCount,
    skippedCount,
  };
}
