import { API_URL as API_BASE_URL } from "./config.js?v=runtime-api-2";

const params = new URLSearchParams(window.location.search);
const rawToken = String(params.get("token") || "").trim();
if (params.has("token")) {
  params.delete("token");
  const cleanUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
  window.history.replaceState(null, document.title, cleanUrl);
}

const statusBox = document.getElementById("resetPasswordStatus");
const form = document.getElementById("resetPasswordForm");
const invalidActions = document.getElementById("passwordResetInvalid");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmNewPassword");
const newPasswordError = document.getElementById("newPasswordError");
const confirmPasswordError = document.getElementById("confirmNewPasswordError");
const submitButton = document.getElementById("resetPasswordSubmit");
const resultBox = document.getElementById("resetPasswordResult");
const toggleNewPassword = document.getElementById("toggleNewPassword");
const toggleConfirmNewPassword = document.getElementById("toggleConfirmNewPassword");

const VALIDATE_URL = `${API_BASE_URL}/api/auth/validate-reset-token`;
const RESET_URL = `${API_BASE_URL}/api/auth/reset-password`;

function t(value) {
  return window.SnapUpI18n?.t?.(value) || value;
}

function setStatus(message, type) {
  statusBox.textContent = t(message);
  statusBox.className = `auth-result show ${type}`;
}

function showInvalidState(message) {
  setStatus(message, "error");
  form.classList.add("is-hidden");
  invalidActions.classList.remove("is-hidden");
}

function clearFormErrors() {
  newPasswordError.textContent = "";
  confirmPasswordError.textContent = "";
  resultBox.textContent = "";
  resultBox.className = "auth-result";
}

function showResult(message, type) {
  resultBox.textContent = t(message);
  resultBox.className = `auth-result show ${type}`;
}

function bindPasswordToggle(button, input) {
  button.addEventListener("click", () => {
    const hidden = input.type === "password";
    input.type = hidden ? "text" : "password";
    button.textContent = t(hidden ? "Hide" : "Show");
  });
}

bindPasswordToggle(toggleNewPassword, newPasswordInput);
bindPasswordToggle(toggleConfirmNewPassword, confirmPasswordInput);

async function validateToken() {
  if (!/^[a-f0-9]{64}$/i.test(rawToken)) {
    showInvalidState("Password reset link is invalid or has already been used.");
    return;
  }

  try {
    const response = await fetch(VALIDATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: rawToken }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success || !data.valid) {
      throw new Error(
        data.message || "Password reset link is invalid or has already been used.",
      );
    }

    setStatus("Your reset link is valid. Create your new password below.", "success");
    form.classList.remove("is-hidden");
    invalidActions.classList.add("is-hidden");
    newPasswordInput.focus();
  } catch (error) {
    showInvalidState(
      error.message || "Password reset link is invalid or has already been used.",
    );
  }
}

form.addEventListener("submit", async (event) => {
  let completedSuccessfully = false;
  event.preventDefault();
  clearFormErrors();

  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  let hasError = false;

  if (!newPassword) {
    newPasswordError.textContent = t("New password is required.");
    hasError = true;
  } else if (newPassword.length < 12 || new TextEncoder().encode(newPassword).length > 72) {
    newPasswordError.textContent = t("Password must be between 6 and 72 characters.");
    hasError = true;
  }

  if (!confirmPassword) {
    confirmPasswordError.textContent = t("Please confirm your new password.");
    hasError = true;
  } else if (newPassword !== confirmPassword) {
    confirmPasswordError.textContent = t("Passwords do not match.");
    hasError = true;
  }

  if (hasError) return;

  try {
    submitButton.disabled = true;
    submitButton.textContent = t("Updating password...");

    const response = await fetch(RESET_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: rawToken,
        new_password: newPassword,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Password could not be updated.");
    }

    localStorage.removeItem("snapup_token");
    localStorage.removeItem("snapup_user");
    sessionStorage.removeItem("snapup_after_login");

    setStatus("Your password has been updated successfully.", "success");
    showResult("You can now login with your new password.", "success");
    form.reset();
    submitButton.disabled = true;
    completedSuccessfully = true;

    setTimeout(() => {
      window.location.replace("login.html?passwordReset=1");
    }, 1800);
  } catch (error) {
    console.error("Reset password error:", error);

    if (
      error.message.includes("expired") ||
      error.message.includes("invalid") ||
      error.message.includes("used")
    ) {
      showInvalidState(error.message);
      return;
    }

    showResult(error.message || "Password could not be updated.", "error");
  } finally {
    if (!completedSuccessfully) {
      submitButton.disabled = false;
      submitButton.textContent = t("Update password");
    }
  }
});

validateToken();
