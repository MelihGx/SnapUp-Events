const supabase = require("../config/supabaseClient");

function normalizeIp(req) {
  return String(req.ip || req.socket?.remoteAddress || "")
    .split(",")[0]
    .trim()
    .slice(0, 128);
}

async function recordAdminAudit(
  req,
  {
    action,
    category,
    targetType = null,
    targetId = null,
    targetLabel = null,
    description,
    details = {},
  },
) {
  const { data, error } = await supabase
    .from("admin_audit_logs")
    .insert({
      admin_user_id: req.user.user_id,
      action: String(action || "").slice(0, 80),
      category: String(category || "").slice(0, 32),
      target_type: targetType ? String(targetType).slice(0, 32) : null,
      target_id: targetId ? String(targetId).slice(0, 160) : null,
      target_label: targetLabel ? String(targetLabel).slice(0, 254) : null,
      description: String(description || "").slice(0, 1000),
      details: details && typeof details === "object" ? details : {},
      ip_address: normalizeIp(req) || null,
      request_id: req.requestId ? String(req.requestId).slice(0, 128) : null,
    })
    .select(
      "audit_id, admin_user_id, action, category, target_type, target_id, target_label, description, details, ip_address, request_id, created_at",
    )
    .single();

  if (error) {
    throw new Error(`Admin audit log could not be written: ${error.message}`);
  }

  return data;
}

module.exports = {
  recordAdminAudit,
};
