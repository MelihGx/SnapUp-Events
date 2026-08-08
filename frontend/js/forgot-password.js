import { API_URL as API_BASE_URL } from "./config.js?v=runtime-api-2";

const form = document.getElementById("forgotPasswordForm");
const mailInput = document.getElementById("forgotPasswordMail");
const mailError = document.getElementById("forgotPasswordMailError");
const submitButton = document.getElementById("forgotPasswordSubmit");
const resultBox = document.getElementById("forgotPasswordResult");

const API_URL = `${API_BASE_URL}/api/auth/forgot-password`;

function t(value) {
  return window.SnapUpI18n?.t?.(value) || value;
}

function clearState() {
  mailError.textContent = "";
  resultBox.textContent = "";
  resultBox.className = "auth-result";
}

function showResult(message, type) {
  resultBox.textContent = t(message);
  resultBox.className = `auth-result show ${type}`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearState();

  const userMail = mailInput.value.trim();

  if (!userMail) {
    mailError.textContent = t("Email address is required.");
    mailInput.focus();
    return;
  }

  try {
    submitButton.disabled = true;
    submitButton.textContent = t("Sending reset link...");

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_mail: userMail,
        language_code: window.SnapUpI18n?.language || "en",
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Password reset request could not be processed.");
    }

    showResult(
      "If an active account exists for this email address, a password reset link has been sent.",
      "success",
    );

    form.reset();
  } catch (error) {
    console.error("Forgot password error:", error);
    showResult(
      error.message || "Password reset request could not be processed.",
      "error",
    );
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = t("Send reset link");
  }
});
