function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[character];
  });
}

function getRecipients() {
  return String(process.env.FEEDBACK_RECEIVER_EMAIL || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

async function sendFeedbackNotification(feedback) {
  const apiKey = String(process.env.RESEND_API_KEY || "").trim();
  const from = String(process.env.EMAIL_FROM || "").trim();
  const recipients = getRecipients();

  if (!apiKey)
    throw new Error("RESEND_API_KEY environment variable is missing.");
  if (!from) throw new Error("EMAIL_FROM environment variable is missing.");
  if (recipients.length === 0) {
    throw new Error("FEEDBACK_RECEIVER_EMAIL environment variable is missing.");
  }

  const category = String(feedback.category || "other");
  const contact = feedback.contact_email || "Not provided";
  const userId = feedback.user_id || "Guest";
  const pagePath = feedback.page_path || "/";
  const language = feedback.language_code || "en";
  const createdAt = feedback.created_at || new Date().toISOString();
  const message = String(feedback.message || "");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: recipients,
      reply_to: feedback.contact_email || undefined,
      subject: `[SnapUp Feedback] ${category.toUpperCase()} · ${pagePath}`,
      text: [
        `Category: ${category}`,
        `Page: ${pagePath}`,
        `Language: ${language}`,
        `Contact: ${contact}`,
        `User: ${userId}`,
        `Created: ${createdAt}`,
        `Feedback ID: ${feedback.feedback_id}`,
        "",
        message,
      ].join("\n"),
      html: `
        <!doctype html>
        <html lang="en">
          <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
          <body style="margin:0;padding:28px;background:#100a24;color:#21183a;font-family:Arial,Helvetica,sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;">
              <tr><td style="height:7px;background:linear-gradient(90deg,#7c3aed,#ec4899,#ff6b4a);"></td></tr>
              <tr>
                <td style="padding:30px;">
                  <p style="margin:0 0 8px;color:#ec4899;font-size:12px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;">SnapUp Events feedback</p>
                  <h1 style="margin:0 0 24px;font-size:28px;line-height:1.2;color:#21183a;">${escapeHtml(category)}</h1>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="8" border="0" style="margin-bottom:22px;background:#f7f3ff;border-radius:14px;color:#5f5670;font-size:13px;">
                    <tr><td><strong>Page</strong></td><td>${escapeHtml(pagePath)}</td></tr>
                    <tr><td><strong>Language</strong></td><td>${escapeHtml(language)}</td></tr>
                    <tr><td><strong>Contact</strong></td><td>${escapeHtml(contact)}</td></tr>
                    <tr><td><strong>User</strong></td><td>${escapeHtml(userId)}</td></tr>
                    <tr><td><strong>Created</strong></td><td>${escapeHtml(createdAt)}</td></tr>
                    <tr><td><strong>ID</strong></td><td>${escapeHtml(feedback.feedback_id)}</td></tr>
                  </table>
                  <div style="white-space:pre-wrap;word-break:break-word;border:1px solid #e9e1f4;border-radius:16px;padding:20px;color:#2f2840;font-size:15px;line-height:1.65;">${escapeHtml(message)}</div>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result?.message ||
        result?.error?.message ||
        "Feedback notification email could not be sent.",
    );
  }

  return result;
}

module.exports = { sendFeedbackNotification };
