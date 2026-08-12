"use strict";

const {
  findMostLikedPhoto,
  normalizeGuestName,
  uniqueParticipantCount,
} = require("./eventHighlightsService");

const PAGE_SIZE = 500;
const LIKE_MEDIA_CHUNK_SIZE = 75;

class EventStatisticsError extends Error {
  constructor(message, code = "EVENT_STATISTICS_FAILED", statusCode = 500) {
    super(message);
    this.name = "EventStatisticsError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function findTopPhotoUploader(media = []) {
  const uploaders = new Map();

  media.forEach((item) => {
    if (item?.media_type !== "image") return;

    const guestName = String(item?.guest_name || "").trim() || null;
    const guestId = String(item?.guest_id || "").trim();
    const identity = normalizeGuestName(guestName) || guestId;

    if (!identity) return;

    const existing = uploaders.get(identity) || {
      guest_id: guestId || null,
      guest_name: guestName,
      photo_count: 0,
      latest_upload_at: null,
    };

    existing.photo_count += 1;
    if (!existing.guest_name && guestName) existing.guest_name = guestName;

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

function buildEventStatistics({
  event,
  guests = [],
  media = [],
  likes = [],
  storageRows = [],
}) {
  const eventMedia = media.filter((item) =>
    ["image", "video", "message"].includes(item?.media_type),
  );
  const approvedMedia = eventMedia.filter(
    (item) => item?.media_status === "approved",
  );
  const usedStorageBytes = storageRows.reduce((total, row) => {
    const bytes = Number(row?.bytes || 0);
    return total + (Number.isFinite(bytes) && bytes > 0 ? bytes : 0);
  }, 0);

  return {
    event,
    summary: {
      participants_count: uniqueParticipantCount(guests),
      photos_count: eventMedia.filter((item) => item.media_type === "image")
        .length,
      videos_count: eventMedia.filter((item) => item.media_type === "video")
        .length,
      comments_count: eventMedia.filter(
        (item) => item.media_type === "message",
      ).length,
      total_uploads_count: eventMedia.length,
      used_storage_bytes: usedStorageBytes,
    },
    most_liked_photo: findMostLikedPhoto(approvedMedia, likes),
    top_photo_uploader: findTopPhotoUploader(eventMedia),
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
      throw new EventStatisticsError(errorMessage, errorCode, 500);
    }

    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  return rows;
}

async function loadEventStatisticsData(supabase, event) {
  const [guests, media, storageRows] = await Promise.all([
    loadPagedRows(
      () =>
        supabase
          .from("event_guests")
          .select("guest_id, guest_name")
          .eq("event_id", event.event_id)
          .order("joined_at", { ascending: true }),
      "Event participants could not be loaded.",
      "EVENT_STATISTICS_GUESTS_QUERY_FAILED",
    ),
    loadPagedRows(
      () =>
        supabase
          .from("events_media")
          .select(
            "media_id, event_id, guest_id, guest_name, media_type, media_url, message, media_status, media_created_at",
          )
          .eq("event_id", event.event_id)
          .in("media_type", ["image", "video", "message"])
          .order("media_created_at", { ascending: false }),
      "Event uploads could not be loaded.",
      "EVENT_STATISTICS_MEDIA_QUERY_FAILED",
    ),
    loadPagedRows(
      () =>
        supabase
          .from("media")
          .select("media_id, bytes")
          .eq("event_id", event.event_id)
          .order("media_id", { ascending: true }),
      "Event storage usage could not be loaded.",
      "EVENT_STATISTICS_STORAGE_QUERY_FAILED",
    ),
  ]);

  const approvedImageIds = media
    .filter(
      (item) =>
        item.media_type === "image" &&
        item.media_status === "approved" &&
        item.media_url,
    )
    .map((item) => item.media_id)
    .filter(Boolean);
  const likes = [];

  for (
    let index = 0;
    index < approvedImageIds.length;
    index += LIKE_MEDIA_CHUNK_SIZE
  ) {
    const mediaIdChunk = approvedImageIds.slice(
      index,
      index + LIKE_MEDIA_CHUNK_SIZE,
    );
    const chunkLikes = await loadPagedRows(
      () =>
        supabase
          .from("media_likes")
          .select("media_like_id, media_id")
          .in("media_id", mediaIdChunk)
          .order("media_id", { ascending: true })
          .order("media_like_id", { ascending: true }),
      "Photo likes could not be loaded.",
      "EVENT_STATISTICS_LIKES_QUERY_FAILED",
    );
    likes.push(...chunkLikes);
  }

  return buildEventStatistics({ event, guests, media, likes, storageRows });
}

module.exports = {
  EventStatisticsError,
  buildEventStatistics,
  findTopPhotoUploader,
  loadEventStatisticsData,
};
