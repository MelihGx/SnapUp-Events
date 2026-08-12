"use strict";

const PAGE_SIZE = 500;
const LIKE_MEDIA_CHUNK_SIZE = 75;

class EventHighlightsError extends Error {
  constructor(message, code = "EVENT_HIGHLIGHTS_FAILED", statusCode = 500) {
    super(message);
    this.name = "EventHighlightsError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function normalizeGuestName(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("tr-TR");
}

function displayGuestName(value) {
  const name = String(value || "").trim();
  return name || null;
}

function uniqueParticipantCount(guests = []) {
  const participants = new Set();

  guests.forEach((guest) => {
    const normalizedName = normalizeGuestName(guest?.guest_name);
    const fallbackId = String(guest?.guest_id || "").trim();
    const identity = normalizedName || fallbackId;

    if (identity) participants.add(identity);
  });

  return participants.size;
}

function countLikesByMedia(likes = []) {
  const counts = new Map();

  likes.forEach((like) => {
    const mediaId = String(like?.media_id || "").trim();
    if (!mediaId) return;
    counts.set(mediaId, (counts.get(mediaId) || 0) + 1);
  });

  return counts;
}

function compareDateDescending(left, right) {
  return (
    Date.parse(String(right?.media_created_at || "")) -
    Date.parse(String(left?.media_created_at || ""))
  );
}

function findMostLikedPhoto(approvedMedia = [], likes = []) {
  const likesByMediaId = countLikesByMedia(likes);
  const photos = approvedMedia
    .filter(
      (item) =>
        item?.media_type === "image" &&
        item?.media_status === "approved" &&
        Boolean(item?.media_url),
    )
    .map((item) => ({
      ...item,
      likes_count: likesByMediaId.get(String(item.media_id)) || 0,
    }))
    .sort((left, right) => {
      const likeDifference = right.likes_count - left.likes_count;
      return likeDifference || compareDateDescending(left, right);
    });

  if (!photos.length || photos[0].likes_count < 1) return null;
  return photos[0];
}

function findTopPhotoUploader(approvedMedia = []) {
  const uploaders = new Map();

  approvedMedia.forEach((item) => {
    if (item?.media_type !== "image" || item?.media_status !== "approved") {
      return;
    }

    const name = displayGuestName(item.guest_name);
    const normalizedName = normalizeGuestName(name);
    const fallbackId = String(item?.guest_id || "").trim();
    const identity = normalizedName || fallbackId;

    if (!identity) return;

    const existing = uploaders.get(identity) || {
      guest_id: fallbackId || null,
      guest_name: name,
      photo_count: 0,
      latest_upload_at: null,
    };

    existing.photo_count += 1;
    if (!existing.guest_name && name) existing.guest_name = name;

    const currentDate = Date.parse(String(item.media_created_at || ""));
    const previousDate = Date.parse(String(existing.latest_upload_at || ""));
    if (!existing.latest_upload_at || currentDate > previousDate) {
      existing.latest_upload_at = item.media_created_at || null;
    }

    uploaders.set(identity, existing);
  });

  return (
    Array.from(uploaders.values()).sort((left, right) => {
      const countDifference = right.photo_count - left.photo_count;
      if (countDifference) return countDifference;

      const dateDifference =
        Date.parse(String(right.latest_upload_at || "")) -
        Date.parse(String(left.latest_upload_at || ""));
      if (dateDifference) return dateDifference;

      return String(left.guest_name || "").localeCompare(
        String(right.guest_name || ""),
        "tr",
      );
    })[0] || null
  );
}

function buildHighlights({ event, guests = [], media = [], likes = [] }) {
  const approvedMedia = media.filter(
    (item) => item?.media_status === "approved",
  );

  return {
    event,
    summary: {
      participants_count: uniqueParticipantCount(guests),
      photos_count: approvedMedia.filter((item) => item.media_type === "image")
        .length,
      videos_count: approvedMedia.filter((item) => item.media_type === "video")
        .length,
      comments_count: approvedMedia.filter(
        (item) => item.media_type === "message",
      ).length,
    },
    most_liked_photo: findMostLikedPhoto(approvedMedia, likes),
    top_photo_uploader: findTopPhotoUploader(approvedMedia),
  };
}

async function loadPagedRows(createQuery, errorMessage, errorCode) {
  const rows = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await createQuery().range(
      from,
      from + PAGE_SIZE - 1,
    );

    if (error) {
      throw new EventHighlightsError(errorMessage, errorCode, 500);
    }

    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  return rows;
}

async function loadEventHighlightsData(supabase, event) {
  const guests = await loadPagedRows(
    () =>
      supabase
        .from("event_guests")
        .select("guest_id, guest_name")
        .eq("event_id", event.event_id)
        .order("joined_at", { ascending: true }),
    "Event participants could not be loaded.",
    "HIGHLIGHTS_GUESTS_QUERY_FAILED",
  );

  const media = await loadPagedRows(
    () =>
      supabase
        .from("events_media")
        .select(
          "media_id, event_id, guest_id, guest_name, media_type, media_url, message, media_status, media_created_at",
        )
        .eq("event_id", event.event_id)
        .eq("media_status", "approved")
        .in("media_type", ["image", "video", "message"])
        .order("media_created_at", { ascending: false }),
    "Approved event content could not be loaded.",
    "HIGHLIGHTS_MEDIA_QUERY_FAILED",
  );

  const imageIds = media
    .filter((item) => item.media_type === "image" && item.media_url)
    .map((item) => item.media_id)
    .filter(Boolean);
  const likes = [];

  for (let index = 0; index < imageIds.length; index += LIKE_MEDIA_CHUNK_SIZE) {
    const mediaIdChunk = imageIds.slice(index, index + LIKE_MEDIA_CHUNK_SIZE);
    const chunkLikes = await loadPagedRows(
      () =>
        supabase
          .from("media_likes")
          .select("media_like_id, media_id")
          .in("media_id", mediaIdChunk)
          .order("media_id", { ascending: true })
          .order("media_like_id", { ascending: true }),
      "Photo likes could not be loaded.",
      "HIGHLIGHTS_LIKES_QUERY_FAILED",
    );
    likes.push(...chunkLikes);
  }

  return buildHighlights({ event, guests, media, likes });
}

module.exports = {
  EventHighlightsError,
  buildHighlights,
  countLikesByMedia,
  findMostLikedPhoto,
  findTopPhotoUploader,
  loadEventHighlightsData,
  normalizeGuestName,
  uniqueParticipantCount,
};
