const bcrypt = require("bcryptjs");
const QRCode = require("qrcode");
const supabase = require("../config/supabaseClient");
const { cleanText, normalizeEmail, validatePassword } = require("../utils/validation");
const { generateEventCode } = require("../utils/eventCode");
const { generateUniqueEventSlug } = require("../utils/eventSlug");
const { normalizePackageKey } = require("../services/pricingService");
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

    const events = await loadAllRows(() =>
      supabase
        .from("event")
        .select(
          "event_id, user_id, event_name, event_code, event_created_at, event_date, event_location, event_address, is_event_active, package_key, storage_consumed_bytes",
        )
        .eq("user_id", userId)
        .order("event_created_at", { ascending: false }),
    );

    return res.status(200).json({
      success: true,
      user: buildUserView(user, events),
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
            "event_id, user_id, event_name, event_code, event_created_at, event_date, event_location, event_address, is_event_active, package_key, storage_consumed_bytes",
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
        "event_id, user_id, event_name, event_code, event_created_at, event_date, event_location, event_address, is_event_active, package_key, storage_consumed_bytes",
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
    ]);

    if (ownerResult.error) {
      throw ownerResult.error;
    }

    if (settingsResult.error) {
      throw settingsResult.error;
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
          .from("media")
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
        source: "live_database",
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
        type: log.category === "EVENT" ? "EVENT" : "USER",
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
  getAdminAnalytics,
  getAdminUsers,
  getAdminUser,
  getAdminEvents,
  getAdminEvent,
  createAdminUser,
  createAdminEventForUser,
  deleteAdminUser,
  getAdminLogs,
};
