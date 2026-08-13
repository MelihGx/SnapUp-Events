const supabase = require("../config/supabaseClient");
const { securityEvent } = require("../middlewares/security");
const {
  sendFeedbackNotification,
} = require("../services/feedbackNotificationService");
const { validateFeedbackPayload } = require("../utils/feedbackValidation");

async function submitFeedback(req, res, next) {
  try {
    const { category, message, contactEmail, pagePath, languageCode } =
      validateFeedbackPayload(req.body);

    const { data: feedback, error } = await supabase
      .from("feedback")
      .insert({
        user_id: req.user?.user_id ? String(req.user.user_id) : null,
        category,
        message,
        contact_email: contactEmail,
        page_path: pagePath,
        language_code: languageCode,
        request_id: req.requestId || null,
        turnstile_hostname: req.turnstile?.hostname || null,
      })
      .select(
        "feedback_id, user_id, category, message, contact_email, page_path, language_code, created_at",
      )
      .single();

    if (error) {
      const databaseError = new Error("Feedback could not be saved.");
      databaseError.code = "FEEDBACK_SAVE_FAILED";
      throw databaseError;
    }

    try {
      await sendFeedbackNotification(feedback);

      const { error: notificationUpdateError } = await supabase
        .from("feedback")
        .update({ notification_sent_at: new Date().toISOString() })
        .eq("feedback_id", feedback.feedback_id);

      if (notificationUpdateError) {
        securityEvent("feedback_notification_status_update_failed", req, {
          feedback_id: feedback.feedback_id,
        });
      }
    } catch (notificationError) {
      securityEvent("feedback_notification_failed", req, {
        feedback_id: feedback.feedback_id,
        reason: notificationError?.message || "unknown",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Feedback received.",
      feedback_id: feedback.feedback_id,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { submitFeedback };
