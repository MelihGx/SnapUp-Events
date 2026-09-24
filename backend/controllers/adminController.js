const bcrypt = require("bcryptjs");
const QRCode = require("qrcode");
const supabase = require("../config/supabaseClient");
const { cleanText, normalizeEmail, validatePassword } = require("../utils/validation");
const { generateEventCode } = require("../utils/eventCode");
const { generateUniqueEventSlug } = require("../utils/eventSlug");
const {
  normalizePackageKey,
  getPackageStorageLimitBytes,
  getEffectiveStorageLimitBytes,
} = require("../services/pricingService");
const { recordAdminAudit } = require("../services/adminAuditService");

const PAGE_SIZE = 1000;
const PACKAGE_WEIGHT = Object.freeze({
  none: 0,
  free: 1,
  mini: 2,
  plus: 3,
  premium: 4,
});

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanOptionalText(value, maxLength) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return cleanText(value, {
    min: 0,
    max: maxLength,
    field: "text",
  }) || null;
}

function normalizeEventDate(value) {
  const text = String(value || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const error = new Error("A valid event date is required.");
    error.statusCode = 400;
    error.code = "INVALID_EVENT_DATE";
    throw error;
  }

  const parsed = new Date(`${text}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    const error = new Error("A valid event date is required.");
    error.statusCode = 400;
    error.code = "INVALID_EVENT_DATE";
    throw error;
  }

  return text;
}

async function generateUniqueAdminEventCode() {
  let eventCode = generateEventCode();

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await supabase
      .from("event")
      .select("event_id")
      .eq("event_code", eventCode)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return eventCode;
    }

    eventCode = generateEventCode();
  }

  throw new Error("A unique event code could not be generated.");
}

async function getPacketLevelId(packageName) {
  const normalizedPackage = normalizePackageKey(packageName);
  let packetName = "Free";

  if (normalizedPackage === "mini" || normalizedPackage === "plus") {
    packetName = "Plus";
  }

  if (normalizedPackage === "premium") {
    packetName = "Premium";
  }

  const { data, error } = await supabase
    .from("packet_level")
    .select("packet_level_id")
    .eq("packet_name", packetName)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Package capability level could not be found.");
  }

  return data.packet_level_id;
}

async function createAdminQrCodeUrl(eventCode) {
  const frontendUrl = String(
    process.env.FRONTEND_URL || "http://127.0.0.1:5500/frontend",
  ).replace(/\/+$/, "");

  const joinUrl = `${frontendUrl}/index.html?code=${encodeURIComponent(
    eventCode,
  )}`;

  return QRCode.toDataURL(joinUrl, {
    width: 260,
    margin: 1,
    errorCorrectionLevel: "M",
  });
}

function auditActionTitle(action) {
  const titles = {
    CREATE_USER: "Created user account",
    CREATE_EVENT_FOR_USER: "Created event for user",
    DELETE_USER_ACCOUNT: "Deleted user account",
    SUSPEND_USER: "Suspended user account",
    REACTIVATE_USER: "Reactivated user account",
    SUSPEND_EVENT: "Suspended event",
    REACTIVATE_EVENT: "Reactivated event",
    CHANGE_EVENT_PACKAGE: "Changed event package",
    SET_EVENT_STORAGE_OVERRIDE: "Set event storage override",
    CLEAR_EVENT_STORAGE_OVERRIDE: "Cleared event storage override",
  };

  return titles[action] || String(action || "Admin action");
}

function adminRoleLabel(role) {
  return role === "super_admin" ? "Super Admin" : "Admin";
}

function titleCase(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "None";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatBytes(bytes) {
  const value = Math.max(0, Number(bytes) || 0);

  if (value >= 1024 ** 4) {
    return `${(value / 1024 ** 4).toFixed(2)} TB`;
  }

  if (value >= 1024 ** 3) {
    return `${(value / 1024 ** 3).toFixed(2)} GB`;
  }

  if (value >= 1024 ** 2) {
    return `${(value / 1024 ** 2).toFixed(1)} MB`;
  }

  if (value >= 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${Math.round(value)} B`;
}

async function loadAllRows(createQuery) {
  const rows = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await createQuery().range(
      from,
      from + PAGE_SIZE - 1,
    );

    if (error) {
      throw error;
    }

    const page = data || [];
    rows.push(...page);

    if (page.length < PAGE_SIZE) {
      break;
    }
  }

  return rows;
}

function highestPackage(events = []) {
  let winner = "none";
  let winnerWeight = 0;

  events.forEach((event) => {
    const key = String(event?.package_key || "free").toLowerCase();
    const weight = PACKAGE_WEIGHT[key] ?? PACKAGE_WEIGHT.free;

    if (weight > winnerWeight) {
      winner = key;
      winnerWeight = weight;
    }
  });

  return titleCase(winner);
}

function userStatus(user) {
  if (user?.is_user_active === false) return "Suspended";
  if (user?.is_email_verified !== true) return "Unverified";
  return "Active";
}

function eventStatus(event) {
  if (event?.admin_suspended === true) return "Suspended";
  return event?.is_event_active === false ? "Inactive" : "Active";
}

function buildUserView(user, ownedEvents = []) {
  const usedBytes = ownedEvents.reduce(
    (sum, event) => sum + Math.max(0, Number(event.storage_consumed_bytes) || 0),
    0,
  );

  return {
    id: user.user_id,
    name: user.user_name || "Unnamed user",
    email: user.user_mail || "",
    phone: user.user_phone || "",
    role: user.user_role || "user",
    plan: highestPackage(ownedEvents),
    events: ownedEvents.length,
    storage: formatBytes(usedBytes),
    storage_bytes: usedBytes,
    status: userStatus(user),
    joined_at: user.user_created_at || null,
    verified: user.is_email_verified === true,
    active: user.is_user_active !== false,
  };
}

function buildEventView(event, owner, settings = null) {
  return {
    id: event.event_id,
    ownerId: event.user_id,
    ownerName: owner?.user_name || "Unknown",
    ownerEmail: owner?.user_mail || "",
    name: event.event_name || "Untitled event",
    createdAt: event.event_created_at || null,
    code: event.event_code || "",
    plan: titleCase(event.package_key || "free"),
    date: event.event_date || null,
    location: event.event_location || event.event_address || "",
    status: eventStatus(event),
    storage: formatBytes(event.storage_consumed_bytes),
    storage_bytes: Math.max(0, Number(event.storage_consumed_bytes) || 0),
    admin_suspended: event.admin_suspended === true,
    storage_limit_override_bytes:
      event.storage_limit_override_bytes === null ||
      event.storage_limit_override_bytes === undefined
        ? null
        : Math.max(0, Number(event.storage_limit_override_bytes) || 0),
    storage_limit_override_display:
      event.storage_limit_override_bytes === null ||
      event.storage_limit_override_bytes === undefined
        ? null
        : formatBytes(event.storage_limit_override_bytes),
    storage_limit_bytes: getEffectiveStorageLimitBytes(
      event.package_key || "free",
      event.storage_limit_override_bytes,
    ),
    storage_limit_display: formatBytes(
      getEffectiveStorageLimitBytes(
        event.package_key || "free",
        event.storage_limit_override_bytes,
      ),
    ),
    package_storage_limit_bytes: getPackageStorageLimitBytes(
      event.package_key || "free",
    ),
    package_storage_limit_display: formatBytes(
      getPackageStorageLimitBytes(event.package_key || "free"),
    ),
    guests: null,
    photos: null,
    videos: null,
    messages: null,
    approval: settings?.require_approval === true ? "Required" : "Not required",
    video: "Allowed",
    archiveUntil: null,
  };
}

function startOfTodayIso() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

async function exactCount(table, configure = (query) => query) {
  let query = supabase.from(table).select("*", {
    count: "exact",
    head: true,
  });

  query = configure(query);

  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return Number(count) || 0;
}


const ANALYTICS_PERIODS = new Set([7, 30, 90, 365]);
const DAY_MS = 24 * 60 * 60 * 1000;

function normalizeAnalyticsDays(value) {
  const days = Number(value);
  return ANALYTICS_PERIODS.has(days) ? days : 30;
}

function analyticsBucketDays(days) {
  if (days <= 7) return 1;
  if (days <= 30) return 3;
  if (days <= 90) return 7;
  return 30;
}

function analyticsStartDate(days, now = new Date()) {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return start;
}

function formatBucketLabel(date) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function buildAnalyticsTimeline({
  days,
  start,
  users = [],
  events = [],
  media = [],
}) {
  const bucketDays = analyticsBucketDays(days);
  const bucketCount = Math.ceil(days / bucketDays);
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = new Date(
      start.getTime() + index * bucketDays * DAY_MS,
    );

    return {
      label: formatBucketLabel(bucketStart),
      users: 0,
      events: 0,
      images: 0,
      videos: 0,
      messages: 0,
    };
  });

  const addRow = (value, field) => {
    const timestamp = Date.parse(String(value || ""));
    if (!Number.isFinite(timestamp) || timestamp < start.getTime()) return;

    const index = Math.floor(
      (timestamp - start.getTime()) / (bucketDays * DAY_MS),
    );

    if (index < 0 || index >= buckets.length) return;
    buckets[index][field] += 1;
  };

  users.forEach((row) => addRow(row.user_created_at, "users"));
  events.forEach((row) => addRow(row.event_created_at, "events"));

  media.forEach((row) => {
    const type = String(row.media_type || "").toLowerCase();

    if (type === "image") {
      addRow(row.media_created_at, "images");
    } else if (type === "video") {
      addRow(row.media_created_at, "videos");
    } else if (type === "message") {
      addRow(row.media_created_at, "messages");
    }
  });

  return buckets;
}

function analyticsPackageMix(events = []) {
  const mix = {
    free: 0,
    mini: 0,
    plus: 0,
    premium: 0,
  };

  events.forEach((event) => {
    const key = String(event.package_key || "free").toLowerCase();
    if (Object.prototype.hasOwnProperty.call(mix, key)) {
      mix[key] += 1;
    } else {
      mix.free += 1;
    }
  });

  return mix;
}

const getAdminMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    admin: {
      user_id: req.user.user_id,
      user_name: req.user.user_name,
      user_mail: req.user.user_mail,
      user_role: req.user.user_role,
      is_email_verified: req.user.is_email_verified,
    },
  });
};

const getAdminDashboard = async (req, res) => {
  try {
    const today = startOfTodayIso();

    const [
      totalUsers,
      totalEvents,
      activeEvents,
      totalMedia,
      pendingMedia,
      newUsersToday,
      eventsCreatedToday,
      mediaUploadedToday,
      storageRows,
    ] = await Promise.all([
      exactCount("users"),
      exactCount("event"),
      exactCount("event", (query) => query.eq("is_event_active", true)),
      exactCount("media"),
      exactCount("media", (query) => query.eq("media_status", "pending")),
      exactCount("users", (query) => query.gte("user_created_at", today)),
      exactCount("event", (query) => query.gte("event_created_at", today)),
      exactCount("media", (query) => query.gte("media_created_at", today)),
      loadAllRows(() =>
        supabase
          .from("event")
          .select("event_id, storage_consumed_bytes")
          .order("event_created_at", { ascending: true }),
      ),
    ]);

    const storageUsedBytes = storageRows.reduce(
      (sum, row) =>
        sum + Math.max(0, Number(row.storage_consumed_bytes) || 0),
      0,
    );

    return res.status(200).json({
      success: true,
      dashboard: {
        total_users: totalUsers,
        total_events: totalEvents,
        active_events: activeEvents,
        total_media: totalMedia,
        pending_media: pendingMedia,
        new_users_today: newUsersToday,
        events_created_today: eventsCreatedToday,
        media_uploaded_today: mediaUploadedToday,
        storage_used_bytes: storageUsedBytes,
        storage_used_display: formatBytes(storageUsedBytes),
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Admin dashboard data could not be loaded.",
      code: "ADMIN_DASHBOARD_FAILED",
    });
  }
};

const getAdminUsers = async (req, res) => {
  try {
    const [users, events] = await Promise.all([
      loadAllRows(() =>
        supabase
          .from("users")
          .select(
            "user_id, user_name, user_mail, user_phone, user_created_at, is_user_active, is_email_verified, user_role",
          )
          .order("user_created_at", { ascending: false }),
      ),
      loadAllRows(() =>
        supabase
          .from("event")
          .select(
            "event_id, user_id, package_key, storage_consumed_bytes, event_created_at",
          )
          .order("event_created_at", { ascending: false }),
      ),
    ]);

    const eventsByUser = new Map();

    events.forEach((event) => {
      const key = String(event.user_id || "");
      if (!key) return;

      const bucket = eventsByUser.get(key) || [];
      bucket.push(event);
      eventsByUser.set(key, bucket);
    });

    const result = users.map((user) =>
      buildUserView(
        user,
        eventsByUser.get(String(user.user_id)) || [],
      ),
    );

    return res.status(200).json({
      success: true,
      users: result,
    });
  } catch (error) {
    console.error("Admin users error:", error);

    return res.status(500).json({
      success: false,
      message: "Users could not be loaded.",
      code: "ADMIN_USERS_FAILED",
    });
  }
};

const getAdminUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error: userError } = await supabase
      .from("users")
      .select(
        "user_id, user_name, user_mail, user_phone, user_created_at, is_user_active, is_email_verified, user_role",
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
        code: "ADMIN_USER_NOT_FOUND",
      });
    }

    const [events, suspensionLogResult] = await Promise.all([
      loadAllRows(() =>
        supabase
          .from("event")
          .select(
            "event_id, user_id, event_name, event_code, event_created_at, event_date, event_location, event_address, is_event_active, admin_suspended, package_key, storage_consumed_bytes, storage_limit_override_bytes",
          )
          .eq("user_id", userId)
          .order("event_created_at", { ascending: false }),
      ),
      supabase
        .from("admin_audit_logs")
        .select(
          "audit_id, admin_user_id, details, created_at",
        )
        .eq("action", "SUSPEND_USER")
        .eq("target_type", "user")
        .eq("target_id", userId)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    if (suspensionLogResult.error) {
      throw suspensionLogResult.error;
    }

    const latestSuspension = suspensionLogResult.data?.[0] || null;
    const latestSuspensionDetails =
      latestSuspension?.details &&
      typeof latestSuspension.details === "object"
        ? latestSuspension.details
        : {};

    const userView = buildUserView(user, events);

    userView.last_suspension_reason =
      typeof latestSuspensionDetails.reason === "string"
        ? latestSuspensionDetails.reason
        : null;
    userView.last_suspension_at =
      latestSuspension?.created_at || null;

    return res.status(200).json({
      success: true,
      user: userView,
      events: events.map((event) =>
        buildEventView(event, user, null),
      ),
    });
  } catch (error) {
    console.error("Admin user detail error:", error);

    return res.status(500).json({
      success: false,
      message: "User detail could not be loaded.",
      code: "ADMIN_USER_DETAIL_FAILED",
    });
  }
};

const getAdminEvents = async (req, res) => {
  try {
    const [events, users, settings] = await Promise.all([
      loadAllRows(() =>
        supabase
          .from("event")
          .select(
            "event_id, user_id, event_name, event_code, event_created_at, event_date, event_location, event_address, is_event_active, admin_suspended, package_key, storage_consumed_bytes, storage_limit_override_bytes",
          )
          .order("event_created_at", { ascending: false }),
      ),
      loadAllRows(() =>
        supabase
          .from("users")
          .select("user_id, user_name, user_mail")
          .order("user_created_at", { ascending: false }),
      ),
      loadAllRows(() =>
        supabase
          .from("event_settings")
          .select("event_id, require_approval")
          .order("event_id", { ascending: true }),
      ),
    ]);

    const ownersById = new Map(
      users.map((user) => [String(user.user_id), user]),
    );
    const settingsByEventId = new Map(
      settings.map((item) => [String(item.event_id), item]),
    );

    const result = events.map((event) =>
      buildEventView(
        event,
        ownersById.get(String(event.user_id)),
        settingsByEventId.get(String(event.event_id)),
      ),
    );

    return res.status(200).json({
      success: true,
      events: result,
    });
  } catch (error) {
    console.error("Admin events error:", error);

    return res.status(500).json({
      success: false,
      message: "Events could not be loaded.",
      code: "ADMIN_EVENTS_FAILED",
    });
  }
};

const getAdminEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const { data: event, error: eventError } = await supabase
      .from("event")
      .select(
        "event_id, user_id, event_name, event_code, event_created_at, event_date, event_location, event_address, is_event_active, admin_suspended, package_key, storage_consumed_bytes, storage_limit_override_bytes",
      )
      .eq("event_id", eventId)
      .maybeSingle();

    if (eventError) {
      throw eventError;
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
        code: "ADMIN_EVENT_NOT_FOUND",
      });
    }

    const [
      ownerResult,
      settingsResult,
      guestsCount,
      photosCount,
      videosCount,
      messagesCount,
      suspensionLogResult,
    ] = await Promise.all([
      supabase
        .from("users")
        .select("user_id, user_name, user_mail")
        .eq("user_id", event.user_id)
        .maybeSingle(),
      supabase
        .from("event_settings")
        .select("event_id, require_approval")
        .eq("event_id", eventId)
        .maybeSingle(),
      exactCount("event_guests", (query) => query.eq("event_id", eventId)),
      exactCount("media", (query) =>
        query.eq("event_id", eventId).eq("media_type", "image"),
      ),
      exactCount("media", (query) =>
        query.eq("event_id", eventId).eq("media_type", "video"),
      ),
      exactCount("media", (query) =>
        query.eq("event_id", eventId).eq("media_type", "message"),
      ),
      supabase
        .from("admin_audit_logs")
        .select("audit_id, details, created_at")
        .eq("action", "SUSPEND_EVENT")
        .eq("target_type", "event")
        .eq("target_id", eventId)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    if (ownerResult.error) {
      throw ownerResult.error;
    }

    if (settingsResult.error) {
      throw settingsResult.error;
    }

    if (suspensionLogResult.error) {
      throw suspensionLogResult.error;
    }

    const result = buildEventView(
      event,
      ownerResult.data,
      settingsResult.data,
    );

    result.guests = guestsCount;
    result.photos = photosCount;
    result.videos = videosCount;
    result.messages = messagesCount;

    const suspensionLog = suspensionLogResult.data?.[0] || null;
    const suspensionDetails =
      suspensionLog?.details &&
      typeof suspensionLog.details === "object"
        ? suspensionLog.details
        : {};

    result.last_suspension_reason =
      typeof suspensionDetails.reason === "string"
        ? suspensionDetails.reason
        : null;
    result.last_suspension_at = suspensionLog?.created_at || null;

    return res.status(200).json({
      success: true,
      event: result,
    });
  } catch (error) {
    console.error("Admin event detail error:", error);

    return res.status(500).json({
      success: false,
      message: "Event detail could not be loaded.",
      code: "ADMIN_EVENT_DETAIL_FAILED",
    });
  }
};




const getAdminStorage = async (req, res) => {
  try {
    const [events, media, users] = await Promise.all([
      loadAllRows(() =>
        supabase
          .from("event")
          .select(
            "event_id, user_id, event_name, event_code, package_key, is_event_active, admin_suspended, storage_consumed_bytes, storage_limit_override_bytes, event_created_at",
          )
          .order("event_created_at", { ascending: false }),
      ),
      loadAllRows(() =>
        supabase
          .from("media")
          .select("media_id, event_id, media_type, bytes, media_created_at")
          .order("media_created_at", { ascending: false }),
      ),
      loadAllRows(() =>
        supabase
          .from("users")
          .select("user_id, user_name, user_mail")
          .order("user_created_at", { ascending: false }),
      ),
    ]);

    const userById = new Map(
      users.map((user) => [String(user.user_id), user]),
    );

    const mediaByType = {
      image: { bytes: 0, count: 0 },
      video: { bytes: 0, count: 0 },
      message: { bytes: 0, count: 0 },
      other: { bytes: 0, count: 0 },
    };

    let currentMediaBytes = 0;

    media.forEach((item) => {
      const bytes = Math.max(0, Number(item.bytes) || 0);
      const type = String(item.media_type || "").toLowerCase();
      const key = Object.prototype.hasOwnProperty.call(mediaByType, type)
        ? type
        : "other";

      mediaByType[key].bytes += bytes;
      mediaByType[key].count += 1;
      currentMediaBytes += bytes;
    });

    const packageUsage = {
      free: {
        package_key: "free",
        event_count: 0,
        consumed_bytes: 0,
        allocated_bytes: 0,
      },
      mini: {
        package_key: "mini",
        event_count: 0,
        consumed_bytes: 0,
        allocated_bytes: 0,
      },
      plus: {
        package_key: "plus",
        event_count: 0,
        consumed_bytes: 0,
        allocated_bytes: 0,
      },
      premium: {
        package_key: "premium",
        event_count: 0,
        consumed_bytes: 0,
        allocated_bytes: 0,
      },
    };

    const usersUsage = new Map();

    let totalConsumedBytes = 0;
    let totalAllocatedBytes = 0;

    events.forEach((event) => {
      const packageKey = normalizePackageKey(event.package_key);
      const consumedBytes = Math.max(
        0,
        Number(event.storage_consumed_bytes) || 0,
      );
      const allocatedBytes = getEffectiveStorageLimitBytes(
        packageKey,
        event.storage_limit_override_bytes,
      );

      totalConsumedBytes += consumedBytes;
      totalAllocatedBytes += allocatedBytes;

      const packageRow = packageUsage[packageKey];
      packageRow.event_count += 1;
      packageRow.consumed_bytes += consumedBytes;
      packageRow.allocated_bytes += allocatedBytes;

      const ownerId = String(event.user_id || "");
      if (ownerId) {
        const current = usersUsage.get(ownerId) || {
          user_id: ownerId,
          event_count: 0,
          consumed_bytes: 0,
        };

        current.event_count += 1;
        current.consumed_bytes += consumedBytes;
        usersUsage.set(ownerId, current);
      }
    });

    const utilization =
      totalAllocatedBytes > 0
        ? Number(
            Math.min(
              100,
              Math.max(0, (totalConsumedBytes / totalAllocatedBytes) * 100),
            ).toFixed(2),
          )
        : 0;

    const quotaGapBytes = Math.max(
      0,
      totalConsumedBytes - currentMediaBytes,
    );

    const formattedMediaByType = Object.fromEntries(
      Object.entries(mediaByType).map(([key, value]) => [
        key,
        {
          ...value,
          display: formatBytes(value.bytes),
        },
      ]),
    );

    const formattedPackageUsage = Object.values(packageUsage).map((row) => {
      const percentage =
        row.allocated_bytes > 0
          ? Number(
              Math.min(
                100,
                Math.max(
                  0,
                  (row.consumed_bytes / row.allocated_bytes) * 100,
                ),
              ).toFixed(2),
            )
          : 0;

      return {
        ...row,
        package_name: titleCase(row.package_key),
        consumed_display: formatBytes(row.consumed_bytes),
        allocated_display: formatBytes(row.allocated_bytes),
        percentage,
      };
    });

    const topEvents = [...events]
      .sort(
        (left, right) =>
          (Number(right.storage_consumed_bytes) || 0) -
          (Number(left.storage_consumed_bytes) || 0),
      )
      .slice(0, 10)
      .map((event) => ({
        event_id: event.event_id,
        event_name: event.event_name || "Untitled event",
        event_code: event.event_code || "",
        package_key: normalizePackageKey(event.package_key),
        is_event_active: event.is_event_active !== false,
        consumed_bytes: Math.max(
          0,
          Number(event.storage_consumed_bytes) || 0,
        ),
        consumed_display: formatBytes(event.storage_consumed_bytes),
        allocated_bytes: getEffectiveStorageLimitBytes(
          event.package_key,
          event.storage_limit_override_bytes,
        ),
        allocated_display: formatBytes(
          getEffectiveStorageLimitBytes(
            event.package_key,
            event.storage_limit_override_bytes,
          ),
        ),
        storage_limit_override_bytes:
          event.storage_limit_override_bytes ?? null,
        storage_limit_override_display:
          event.storage_limit_override_bytes == null
            ? null
            : formatBytes(event.storage_limit_override_bytes),
      }));

    const topUsers = [...usersUsage.values()]
      .sort((left, right) => right.consumed_bytes - left.consumed_bytes)
      .slice(0, 10)
      .map((item) => {
        const owner = userById.get(String(item.user_id));

        return {
          ...item,
          user_name: owner?.user_name || "Unknown user",
          user_mail: owner?.user_mail || "",
          consumed_display: formatBytes(item.consumed_bytes),
        };
      });

    return res.status(200).json({
      success: true,
      storage: {
        source: "live_database",
        generated_at: new Date().toISOString(),
        total_events: events.length,
        total_media_records: media.length,
        total_consumed_bytes: totalConsumedBytes,
        total_consumed_display: formatBytes(totalConsumedBytes),
        current_media_bytes: currentMediaBytes,
        current_media_display: formatBytes(currentMediaBytes),
        quota_gap_bytes: quotaGapBytes,
        quota_gap_display: formatBytes(quotaGapBytes),
        total_allocated_bytes: totalAllocatedBytes,
        total_allocated_display: formatBytes(totalAllocatedBytes),
        utilization_percentage: utilization,
        media_by_type: formattedMediaByType,
        package_usage: formattedPackageUsage,
        top_events: topEvents,
        top_users: topUsers,
      },
    });
  } catch (error) {
    console.error("Admin storage error:", error);

    return res.status(500).json({
      success: false,
      message: "Storage data could not be loaded.",
      code: "ADMIN_STORAGE_FAILED",
    });
  }
};

const getAdminAnalytics = async (req, res) => {
  try {
    const days = normalizeAnalyticsDays(req.query.days);
    const now = new Date();
    const start = analyticsStartDate(days, now);
    const startIso = start.toISOString();

    const [
      periodUsers,
      periodEvents,
      periodMedia,
      allEvents,
    ] = await Promise.all([
      loadAllRows(() =>
        supabase
          .from("users")
          .select("user_id, user_created_at")
          .gte("user_created_at", startIso)
          .order("user_created_at", { ascending: true }),
      ),
      loadAllRows(() =>
        supabase
          .from("event")
          .select("event_id, event_created_at")
          .gte("event_created_at", startIso)
          .order("event_created_at", { ascending: true }),
      ),
      loadAllRows(() =>
        supabase
          .from("events_media")
          .select(
            "media_id, event_id, media_type, media_status, media_created_at",
          )
          .gte("media_created_at", startIso)
          .in("media_type", ["image", "video", "message"])
          .order("media_created_at", { ascending: true }),
      ),
      loadAllRows(() =>
        supabase
          .from("event")
          .select(
            "event_id, event_name, event_code, package_key, is_event_active, storage_consumed_bytes",
          )
          .order("event_created_at", { ascending: false }),
      ),
    ]);

    const timeline = buildAnalyticsTimeline({
      days,
      start,
      users: periodUsers,
      events: periodEvents,
      media: periodMedia,
    });

    const activeEvents = allEvents.filter(
      (event) => event.is_event_active !== false,
    );
    const inactiveEvents = allEvents.length - activeEvents.length;

    const totalStorageBytes = allEvents.reduce(
      (sum, event) =>
        sum + Math.max(0, Number(event.storage_consumed_bytes) || 0),
      0,
    );

    const activeStorageBytes = activeEvents.reduce(
      (sum, event) =>
        sum + Math.max(0, Number(event.storage_consumed_bytes) || 0),
      0,
    );

    const averageStoragePerActiveEventBytes = activeEvents.length
      ? Math.round(activeStorageBytes / activeEvents.length)
      : 0;

    const packageMix = analyticsPackageMix(allEvents);
    const paidEvents =
      packageMix.mini + packageMix.plus + packageMix.premium;
    const paidEventShare = allEvents.length
      ? Number(((paidEvents / allEvents.length) * 100).toFixed(1))
      : 0;

    const mediaByType = {
      image: 0,
      video: 0,
      message: 0,
    };

    periodMedia.forEach((item) => {
      const type = String(item.media_type || "").toLowerCase();
      if (Object.prototype.hasOwnProperty.call(mediaByType, type)) {
        mediaByType[type] += 1;
      }
    });

    const topStorageEvents = [...allEvents]
      .sort(
        (left, right) =>
          (Number(right.storage_consumed_bytes) || 0) -
          (Number(left.storage_consumed_bytes) || 0),
      )
      .slice(0, 6)
      .map((event) => ({
        event_id: event.event_id,
        event_name: event.event_name || "Untitled event",
        event_code: event.event_code || "",
        package_key: event.package_key || "free",
        storage_bytes: Math.max(
          0,
          Number(event.storage_consumed_bytes) || 0,
        ),
        storage_display: formatBytes(event.storage_consumed_bytes),
      }));

    return res.status(200).json({
      success: true,
      analytics: {
        period_days: days,
        period_start: startIso,
        generated_at: now.toISOString(),
        kpis: {
          new_users: periodUsers.length,
          new_events: periodEvents.length,
          media_uploads: periodMedia.length,
          average_storage_per_active_event_bytes:
            averageStoragePerActiveEventBytes,
          average_storage_per_active_event_display: formatBytes(
            averageStoragePerActiveEventBytes,
          ),
          total_storage_bytes: totalStorageBytes,
          total_storage_display: formatBytes(totalStorageBytes),
          active_events: activeEvents.length,
          inactive_events: inactiveEvents,
          paid_event_share: paidEventShare,
        },
        package_mix: packageMix,
        media_by_type: mediaByType,
        timeline,
        top_storage_events: topStorageEvents,
      },
    });
  } catch (error) {
    console.error("Admin analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Analytics data could not be loaded.",
      code: "ADMIN_ANALYTICS_FAILED",
    });
  }
};

const createAdminUser = async (req, res) => {
  try {
    const name = cleanText(req.body?.name || req.body?.user_name, {
      min: 1,
      max: 100,
      field: "name",
    });
    const email = normalizeEmail(req.body?.email || req.body?.user_mail);
    const phone = cleanOptionalText(
      req.body?.phone || req.body?.user_phone,
      32,
    );
    const password = validatePassword(req.body?.password);

    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("user_id")
      .eq("user_mail", email)
      .maybeSingle();

    if (existingUserError) {
      throw existingUserError;
    }

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This email address is already registered.",
        code: "ADMIN_USER_ALREADY_EXISTS",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verifiedAt = new Date().toISOString();

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        user_name: name,
        user_mail: email,
        user_phone: phone,
        password_hash: passwordHash,
        is_user_active: true,
        is_email_verified: true,
        email_verified_at: verifiedAt,
        user_role: "user",
      })
      .select(
        "user_id, user_name, user_mail, user_phone, user_created_at, is_user_active, is_email_verified, email_verified_at, user_role",
      )
      .single();

    if (insertError) {
      throw insertError;
    }

    try {
      await recordAdminAudit(req, {
        action: "CREATE_USER",
        category: "USER",
        targetType: "user",
        targetId: newUser.user_id,
        targetLabel: newUser.user_mail,
        description: `Created verified customer account for ${newUser.user_name} (${newUser.user_mail}).`,
        details: {
          summary: "Customer account created · Email verified by admin",
          user_name: newUser.user_name,
          user_mail: newUser.user_mail,
          email_verified: true,
        },
      });
    } catch (auditError) {
      await supabase.from("users").delete().eq("user_id", newUser.user_id);
      throw auditError;
    }

    return res.status(201).json({
      success: true,
      message: "Verified user account created successfully.",
      user: buildUserView(newUser, []),
    });
  } catch (error) {
    const statusCode = Number(error.statusCode) || 500;

    console.error("Admin create user error:", error);

    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 400
          ? error.message
          : "User could not be created.",
      code:
        statusCode === 400
          ? error.code || "INVALID_INPUT"
          : "ADMIN_CREATE_USER_FAILED",
    });
  }
};

const createAdminEventForUser = async (req, res) => {
  let createdEventId = null;

  try {
    const userId = String(req.params.userId || "").trim();

    if (!UUID_RE.test(userId)) {
      return res.status(400).json({
        success: false,
        message: "A valid event owner is required.",
        code: "INVALID_EVENT_OWNER",
      });
    }

    const { data: eventOwner, error: ownerError } = await supabase
      .from("users")
      .select(
        "user_id, user_name, user_mail, is_user_active, is_email_verified",
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (ownerError) {
      throw ownerError;
    }

    if (!eventOwner) {
      return res.status(404).json({
        success: false,
        message: "Event owner could not be found.",
        code: "ADMIN_EVENT_OWNER_NOT_FOUND",
      });
    }

    if (!eventOwner.is_user_active) {
      return res.status(409).json({
        success: false,
        message: "An event cannot be created for a suspended account.",
        code: "ADMIN_EVENT_OWNER_SUSPENDED",
      });
    }

    const eventName = cleanText(
      req.body?.name || req.body?.eventName || req.body?.event_name,
      {
        min: 1,
        max: 160,
        field: "event_name",
      },
    );
    const eventDate = normalizeEventDate(
      req.body?.date || req.body?.event_date,
    );
    const eventLocation = cleanOptionalText(
      req.body?.location || req.body?.event_location,
      160,
    );
    const selectedPackage = normalizePackageKey(
      req.body?.plan || req.body?.package_key || req.body?.eventPackage,
    );
    const requireApproval =
      req.body?.require_approval === true ||
      String(req.body?.approval || "").toLowerCase() === "required";

    const packetLevelId = await getPacketLevelId(selectedPackage);
    const eventCode = await generateUniqueAdminEventCode();
    const eventSlug = await generateUniqueEventSlug(eventName);
    const qrCodeUrl = await createAdminQrCodeUrl(eventCode);

    const { data: newEvent, error: eventError } = await supabase
      .from("event")
      .insert({
        event_name: eventName,
        event_slug: eventSlug,
        event_location: eventLocation,
        user_id: userId,
        packet_level_id: packetLevelId,
        package_key: selectedPackage,
        event_date: eventDate,
        event_code: eventCode,
        qr_code_url: qrCodeUrl,
        event_cover_url: null,
        description: null,
        is_event_active: true,
        is_event_private: true,
      })
      .select(
        "event_id, user_id, event_name, event_code, event_created_at, event_date, event_location, event_address, is_event_active, package_key, storage_consumed_bytes",
      )
      .single();

    if (eventError) {
      throw eventError;
    }

    createdEventId = newEvent.event_id;

    const settingsPayload = {
      event_id: newEvent.event_id,
      allow_upload: true,
      only_users: false,
      allow_comments: true,
      allow_likes: true,
      require_approval: requireApproval,
      allow_gallery_view: true,
      max_storage_per_guest: 500,
      max_upload_per_guest: 20,
    };

    const { data: createdSettings, error: settingsError } = await supabase
      .from("event_settings")
      .insert(settingsPayload)
      .select("event_id, require_approval")
      .single();

    if (settingsError) {
      await supabase.from("event").delete().eq("event_id", newEvent.event_id);
      createdEventId = null;
      throw settingsError;
    }

    try {
      await recordAdminAudit(req, {
        action: "CREATE_EVENT_FOR_USER",
        category: "EVENT",
        targetType: "event",
        targetId: newEvent.event_id,
        targetLabel: `#${newEvent.event_code}`,
        description: `Created ${newEvent.event_name} for ${eventOwner.user_mail}.`,
        details: {
          summary: `Owner: ${eventOwner.user_mail} · Package: ${titleCase(selectedPackage)}`,
          event_code: newEvent.event_code,
          event_name: newEvent.event_name,
          owner_user_id: eventOwner.user_id,
          owner_email: eventOwner.user_mail,
          package_key: selectedPackage,
        },
      });
    } catch (auditError) {
      await supabase
        .from("event_settings")
        .delete()
        .eq("event_id", newEvent.event_id);
      await supabase.from("event").delete().eq("event_id", newEvent.event_id);
      createdEventId = null;
      throw auditError;
    }

    return res.status(201).json({
      success: true,
      message: "Event created for user.",
      event: buildEventView(newEvent, eventOwner, createdSettings),
    });
  } catch (error) {
    if (createdEventId) {
      await supabase
        .from("event_settings")
        .delete()
        .eq("event_id", createdEventId);
      await supabase.from("event").delete().eq("event_id", createdEventId);
    }

    const statusCode = Number(error.statusCode) || 500;
    console.error("Admin create event error:", error);

    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 400
          ? error.message
          : "Event could not be created for the user.",
      code:
        statusCode === 400
          ? error.code || "INVALID_INPUT"
          : "ADMIN_CREATE_EVENT_FAILED",
    });
  }
};




const ADMIN_EVENT_PACKAGE_KEYS = new Set([
  "free",
  "mini",
  "plus",
  "premium",
]);

function adminRequestIp(req) {
  return String(req.ip || req.socket?.remoteAddress || "")
    .split(",")[0]
    .trim()
    .slice(0, 128);
}

function adminRequestId(req) {
  return req.requestId ? String(req.requestId).slice(0, 128) : null;
}

function validateAdminReason(value) {
  const reason = String(value || "").trim();

  if (reason.length < 3 || reason.length > 300) {
    const error = new Error(
      "Reason must be between 3 and 300 characters.",
    );
    error.statusCode = 400;
    error.code = "INVALID_ADMIN_REASON";
    throw error;
  }

  return reason;
}

const setAdminEventSuspension = async (req, res) => {
  try {
    const adminUserId = String(req.user.user_id || "").trim();
    const eventId = String(req.params.eventId || "").trim();
    const suspended = req.body?.suspended;
    const reason = validateAdminReason(req.body?.reason);

    if (!UUID_RE.test(eventId)) {
      return res.status(400).json({
        success: false,
        message: "A valid event is required.",
        code: "INVALID_EVENT_ID",
      });
    }

    if (typeof suspended !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "A valid event suspension state is required.",
        code: "INVALID_EVENT_STATUS",
      });
    }

    const { data: event, error: eventError } = await supabase
      .from("event")
      .select("event_id, admin_suspended")
      .eq("event_id", eventId)
      .maybeSingle();

    if (eventError) throw eventError;

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
        code: "ADMIN_EVENT_NOT_FOUND",
      });
    }

    if (Boolean(event.admin_suspended) === suspended) {
      return res.status(409).json({
        success: false,
        message: suspended
          ? "This event is already suspended by an admin."
          : "This event is not admin-suspended.",
        code: "EVENT_SUSPENSION_ALREADY_SET",
      });
    }

    const { data, error } = await supabase.rpc(
      "admin_set_event_suspension",
      {
        p_admin_user_id: adminUserId,
        p_event_id: eventId,
        p_suspended: suspended,
        p_reason: reason,
        p_request_id: adminRequestId(req),
        p_ip_address: adminRequestIp(req) || null,
      },
    );

    if (error) {
      console.error("Admin event suspension RPC error:", error);
      return res.status(500).json({
        success: false,
        message: "Event suspension could not be changed safely.",
        code: "ADMIN_EVENT_SUSPENSION_FAILED",
      });
    }

    return res.status(200).json({
      success: true,
      message: suspended
        ? "Event suspended. Join and upload access is now blocked."
        : "Event admin suspension removed.",
      event: data,
    });
  } catch (error) {
    const statusCode = Number(error.statusCode) || 500;

    console.error("Admin event suspension error:", error);

    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 400
          ? error.message
          : "Event suspension could not be changed.",
      code: error.code || "ADMIN_EVENT_SUSPENSION_FAILED",
    });
  }
};

const changeAdminEventPackage = async (req, res) => {
  try {
    const adminUserId = String(req.user.user_id || "").trim();
    const eventId = String(req.params.eventId || "").trim();
    const rawPackage = String(req.body?.package_key || "")
      .trim()
      .toLowerCase();
    const reason = validateAdminReason(req.body?.reason);

    if (!UUID_RE.test(eventId)) {
      return res.status(400).json({
        success: false,
        message: "A valid event is required.",
        code: "INVALID_EVENT_ID",
      });
    }

    if (!ADMIN_EVENT_PACKAGE_KEYS.has(rawPackage)) {
      return res.status(400).json({
        success: false,
        message: "Package must be Free, Mini, Plus, or Premium.",
        code: "INVALID_EVENT_PACKAGE",
      });
    }

    const { data: event, error: eventError } = await supabase
      .from("event")
      .select(
        "event_id, package_key, storage_consumed_bytes, storage_limit_override_bytes",
      )
      .eq("event_id", eventId)
      .maybeSingle();

    if (eventError) throw eventError;

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
        code: "ADMIN_EVENT_NOT_FOUND",
      });
    }

    const currentPackage = normalizePackageKey(event.package_key);

    if (currentPackage === rawPackage) {
      return res.status(409).json({
        success: false,
        message: "This event already uses the selected package.",
        code: "EVENT_PACKAGE_ALREADY_SET",
      });
    }

    const consumedBytes = Math.max(
      0,
      Number(event.storage_consumed_bytes) || 0,
    );
    const overrideBytes =
      event.storage_limit_override_bytes == null
        ? null
        : Math.max(0, Number(event.storage_limit_override_bytes) || 0);
    const nextPackageLimit = getPackageStorageLimitBytes(rawPackage);

    if (overrideBytes == null && consumedBytes > nextPackageLimit) {
      return res.status(409).json({
        success: false,
        message:
          "This event has already consumed more storage than the selected package allows. Add a storage override or choose a larger package.",
        code: "PACKAGE_LIMIT_BELOW_CONSUMED_STORAGE",
      });
    }

    const packetLevelId = await getPacketLevelId(rawPackage);

    const { data, error } = await supabase.rpc(
      "admin_change_event_package",
      {
        p_admin_user_id: adminUserId,
        p_event_id: eventId,
        p_package_key: rawPackage,
        p_packet_level_id: packetLevelId,
        p_reason: reason,
        p_request_id: adminRequestId(req),
        p_ip_address: adminRequestIp(req) || null,
      },
    );

    if (error) {
      console.error("Admin event package RPC error:", error);
      return res.status(500).json({
        success: false,
        message: "Event package could not be changed safely.",
        code: "ADMIN_EVENT_PACKAGE_FAILED",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Event package updated.",
      event: data,
    });
  } catch (error) {
    const statusCode = Number(error.statusCode) || 500;

    console.error("Admin event package error:", error);

    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 400
          ? error.message
          : "Event package could not be changed.",
      code: error.code || "ADMIN_EVENT_PACKAGE_FAILED",
    });
  }
};

const setAdminEventStorageOverride = async (req, res) => {
  try {
    const adminUserId = String(req.user.user_id || "").trim();
    const eventId = String(req.params.eventId || "").trim();
    const reason = validateAdminReason(req.body?.reason);
    const clearOverride =
      req.body?.limit_gb === null ||
      req.body?.limit_gb === undefined ||
      req.body?.limit_gb === "";

    if (!UUID_RE.test(eventId)) {
      return res.status(400).json({
        success: false,
        message: "A valid event is required.",
        code: "INVALID_EVENT_ID",
      });
    }

    let limitBytes = null;

    if (!clearOverride) {
      const limitGb = Number(req.body.limit_gb);

      if (!Number.isFinite(limitGb) || limitGb < 0.1 || limitGb > 1024) {
        return res.status(400).json({
          success: false,
          message: "Custom storage must be between 0.1 GB and 1024 GB.",
          code: "INVALID_STORAGE_OVERRIDE",
        });
      }

      limitBytes = Math.round(limitGb * 1024 * 1024 * 1024);
    }

    const { data: event, error: eventError } = await supabase
      .from("event")
      .select(
        "event_id, package_key, storage_consumed_bytes, storage_limit_override_bytes",
      )
      .eq("event_id", eventId)
      .maybeSingle();

    if (eventError) throw eventError;

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
        code: "ADMIN_EVENT_NOT_FOUND",
      });
    }

    const consumedBytes = Math.max(
      0,
      Number(event.storage_consumed_bytes) || 0,
    );
    const existingOverride =
      event.storage_limit_override_bytes == null
        ? null
        : Math.max(0, Number(event.storage_limit_override_bytes) || 0);

    if (limitBytes === null) {
      if (existingOverride === null) {
        return res.status(409).json({
          success: false,
          message: "This event does not currently have a storage override.",
          code: "NO_STORAGE_OVERRIDE",
        });
      }

      const packageLimit = getPackageStorageLimitBytes(event.package_key);

      if (consumedBytes > packageLimit) {
        return res.status(409).json({
          success: false,
          message:
            "The package limit is below the event's consumed storage. Change the package before removing the override.",
          code: "PACKAGE_LIMIT_BELOW_CONSUMED_STORAGE",
        });
      }
    } else if (limitBytes < consumedBytes) {
      return res.status(409).json({
        success: false,
        message:
          "Custom storage cannot be lower than the event's already consumed storage.",
        code: "OVERRIDE_BELOW_CONSUMED_STORAGE",
      });
    }

    const { data, error } = await supabase.rpc(
      "admin_set_event_storage_override",
      {
        p_admin_user_id: adminUserId,
        p_event_id: eventId,
        p_limit_bytes: limitBytes,
        p_reason: reason,
        p_request_id: adminRequestId(req),
        p_ip_address: adminRequestIp(req) || null,
      },
    );

    if (error) {
      console.error("Admin event storage override RPC error:", error);
      return res.status(500).json({
        success: false,
        message: "Event storage override could not be changed safely.",
        code: "ADMIN_EVENT_STORAGE_OVERRIDE_FAILED",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        limitBytes === null
          ? "Storage override removed. Package limit restored."
          : "Custom event storage limit applied.",
      event: data,
    });
  } catch (error) {
    const statusCode = Number(error.statusCode) || 500;

    console.error("Admin event storage override error:", error);

    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 400
          ? error.message
          : "Event storage override could not be changed.",
      code: error.code || "ADMIN_EVENT_STORAGE_OVERRIDE_FAILED",
    });
  }
};

const setAdminUserActiveStatus = async (req, res) => {
  try {
    const adminUserId = String(req.user.user_id || "").trim();
    const targetUserId = String(req.params.userId || "").trim();
    const requestedActive = req.body?.active;
    const reason = String(req.body?.reason || "").trim();

    if (!UUID_RE.test(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "A valid target user is required.",
        code: "INVALID_TARGET_USER",
      });
    }

    if (typeof requestedActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "A valid account status is required.",
        code: "INVALID_USER_STATUS",
      });
    }

    if (reason.length < 3 || reason.length > 300) {
      return res.status(400).json({
        success: false,
        message: "Reason must be between 3 and 300 characters.",
        code: "INVALID_STATUS_REASON",
      });
    }

    if (adminUserId === targetUserId) {
      return res.status(409).json({
        success: false,
        message: "You cannot change your own admin account status here.",
        code: "CANNOT_CHANGE_OWN_STATUS",
      });
    }

    const { data: targetUser, error: targetError } = await supabase
      .from("users")
      .select(
        "user_id, user_name, user_mail, user_role, is_user_active",
      )
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (targetError) {
      throw targetError;
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
        code: "ADMIN_USER_NOT_FOUND",
      });
    }

    if (targetUser.user_role !== "user") {
      return res.status(409).json({
        success: false,
        message: "Admin accounts cannot be managed from this customer status flow.",
        code: "ADMIN_ACCOUNT_STATUS_BLOCKED",
      });
    }

    if (Boolean(targetUser.is_user_active) === requestedActive) {
      return res.status(409).json({
        success: false,
        message: requestedActive
          ? "This user is already active."
          : "This user is already suspended.",
        code: "USER_STATUS_ALREADY_SET",
      });
    }

    const ipAddress = String(
      req.ip || req.socket?.remoteAddress || "",
    )
      .split(",")[0]
      .trim()
      .slice(0, 128);

    const { data: result, error: rpcError } = await supabase.rpc(
      "admin_set_user_active_status",
      {
        p_admin_user_id: adminUserId,
        p_target_user_id: targetUserId,
        p_active: requestedActive,
        p_reason: reason,
        p_request_id: req.requestId
          ? String(req.requestId).slice(0, 128)
          : null,
        p_ip_address: ipAddress || null,
      },
    );

    if (rpcError) {
      console.error("Admin user status RPC error:", rpcError);

      return res.status(500).json({
        success: false,
        message: "User account status could not be changed safely.",
        code: "ADMIN_USER_STATUS_FAILED",
      });
    }

    return res.status(200).json({
      success: true,
      message: requestedActive
        ? "User account reactivated."
        : "User account suspended. Existing sessions were invalidated.",
      user: result,
    });
  } catch (error) {
    console.error("Admin user status error:", error);

    return res.status(500).json({
      success: false,
      message: "User account status could not be changed.",
      code: "ADMIN_USER_STATUS_FAILED",
    });
  }
};

const deleteAdminUser = async (req, res) => {
  try {
    const adminUserId = String(req.user.user_id || "").trim();
    const targetUserId = String(req.params.userId || "").trim();
    const currentPassword = String(req.body?.current_password || "");
    const confirmationEmail = normalizeEmail(req.body?.confirmation_email);

    if (!UUID_RE.test(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "A valid target user is required.",
        code: "INVALID_TARGET_USER",
      });
    }

    if (adminUserId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own super admin account here.",
        code: "CANNOT_DELETE_SELF",
      });
    }

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: "Your current admin password is required.",
        code: "ADMIN_PASSWORD_REQUIRED",
      });
    }

    const [
      { data: adminUser, error: adminError },
      { data: targetUser, error: targetError },
    ] = await Promise.all([
      supabase
        .from("users")
        .select("user_id, password_hash, user_role")
        .eq("user_id", adminUserId)
        .maybeSingle(),
      supabase
        .from("users")
        .select("user_id, user_name, user_mail, user_role")
        .eq("user_id", targetUserId)
        .maybeSingle(),
    ]);

    if (adminError || targetError) {
      throw adminError || targetError;
    }

    if (!adminUser || adminUser.user_role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Super admin permission is required.",
        code: "SUPER_ADMIN_REQUIRED",
      });
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
        code: "ADMIN_USER_NOT_FOUND",
      });
    }

    if (targetUser.user_role !== "user") {
      return res.status(409).json({
        success: false,
        message: "Admin accounts cannot be deleted from this customer flow.",
        code: "ADMIN_ACCOUNT_DELETE_BLOCKED",
      });
    }

    if (confirmationEmail !== normalizeEmail(targetUser.user_mail)) {
      return res.status(400).json({
        success: false,
        message: "The confirmation email does not match the selected user.",
        code: "DELETE_EMAIL_MISMATCH",
      });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      adminUser.password_hash,
    );

    if (!passwordMatches) {
      // Deliberately use 400 instead of 401 so a mistyped step-up password
      // does not invalidate the already-authenticated admin session.
      return res.status(400).json({
        success: false,
        message: "Your current admin password is incorrect.",
        code: "INVALID_ADMIN_PASSWORD",
      });
    }

    const ipAddress = String(
      req.ip || req.socket?.remoteAddress || "",
    )
      .split(",")[0]
      .trim()
      .slice(0, 128);

    const { data: deletionResult, error: deletionError } = await supabase.rpc(
      "admin_delete_user_account",
      {
        p_admin_user_id: adminUserId,
        p_target_user_id: targetUserId,
        p_confirmation_email: confirmationEmail,
        p_request_id: req.requestId ? String(req.requestId).slice(0, 128) : null,
        p_ip_address: ipAddress || null,
      },
    );

    if (deletionError) {
      console.error("Admin delete user RPC error:", deletionError);

      return res.status(500).json({
        success: false,
        message: "User account could not be deleted safely.",
        code: "ADMIN_DELETE_USER_FAILED",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User account and owned SnapUp data were permanently deleted.",
      deleted: deletionResult,
    });
  } catch (error) {
    console.error("Admin delete user error:", error);

    return res.status(500).json({
      success: false,
      message: "User account could not be deleted.",
      code: "ADMIN_DELETE_USER_FAILED",
    });
  }
};

const getAdminLogs = async (req, res) => {
  try {
    const { data: logs, error: logsError } = await supabase
      .from("admin_audit_logs")
      .select(
        "audit_id, admin_user_id, action, category, target_type, target_id, target_label, description, details, ip_address, request_id, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);

    if (logsError) {
      throw logsError;
    }

    const adminIds = [
      ...new Set(
        (logs || [])
          .map((log) => log.admin_user_id)
          .filter(Boolean)
          .map(String),
      ),
    ];

    let adminUsers = [];

    if (adminIds.length) {
      const { data, error } = await supabase
        .from("users")
        .select("user_id, user_name, user_mail, user_role")
        .in("user_id", adminIds);

      if (error) {
        throw error;
      }

      adminUsers = data || [];
    }

    const adminsById = new Map(
      adminUsers.map((user) => [String(user.user_id), user]),
    );

    const result = (logs || []).map((log) => {
      const admin = adminsById.get(String(log.admin_user_id || ""));
      const details =
        log.details && typeof log.details === "object" ? log.details : {};

      return {
        id: log.audit_id,
        type:
          String(log.target_type || "").toLowerCase() === "event"
            ? "EVENT"
            : "USER",
        category: log.category,
        title: auditActionTitle(log.action),
        text: log.description,
        timestamp: log.created_at,
        admin: admin?.user_mail || "Deleted admin",
        adminRole: adminRoleLabel(admin?.user_role),
        target: log.target_label || log.target_id || "-",
        targetMeta: titleCase(log.target_type || "record"),
        ip: log.ip_address || "-",
        requestId: log.request_id || "-",
        change: details.summary || log.description,
        reason:
          typeof details.reason === "string"
            ? details.reason
            : null,
        previousStatus:
          typeof details.previous_status === "string"
            ? details.previous_status
            : typeof details.previous_active === "boolean"
              ? details.previous_active
                ? "Active"
                : "Suspended"
              : null,
        newStatus:
          typeof details.new_status === "string"
            ? details.new_status
            : typeof details.new_active === "boolean"
              ? details.new_active
                ? "Active"
                : "Suspended"
              : null,
      };
    });

    return res.status(200).json({
      success: true,
      logs: result,
    });
  } catch (error) {
    console.error("Admin audit logs error:", error);

    return res.status(500).json({
      success: false,
      message: "Admin audit logs could not be loaded.",
      code: "ADMIN_AUDIT_LOGS_FAILED",
    });
  }
};

module.exports = {
  getAdminMe,
  getAdminDashboard,
  getAdminStorage,
  getAdminAnalytics,
  getAdminUsers,
  getAdminUser,
  getAdminEvents,
  getAdminEvent,
  createAdminUser,
  createAdminEventForUser,
  setAdminEventSuspension,
  changeAdminEventPackage,
  setAdminEventStorageOverride,
  setAdminUserActiveStatus,
  deleteAdminUser,
  getAdminLogs,
};
