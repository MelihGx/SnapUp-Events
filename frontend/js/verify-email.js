import { API_URL } from "./config.js?v=runtime-api-2";

const params = new URLSearchParams(window.location.search);
const verificationToken = params.get("token")?.trim() || "";
const registrationSent = params.get("sent");
const verificationRequired = params.get("required") === "1";
const authToken = localStorage.getItem("snapup_token");

const verifyIcon = document.getElementById("verifyIcon");
const verifyTitle = document.getElementById("verifyTitle");
const verifyDescription = document.getElementById("verifyDescription");
const verifyResult = document.getElementById("verifyResult");
const resendVerificationButton = document.getElementById(
  "resendVerificationButton",
);
const verifyContinueLink = document.getElementById("verifyContinueLink");
const verifyLoginLink = document.getElementById("verifyLoginLink");

function t(value) {
  return window.SnapUpI18n?.t?.(value) || value;
}

function setResult(message = "", state = "") {
  verifyResult.textContent = message ? t(message) : "";

  if (state) {
    verifyResult.dataset.state = state;
  } else {
    delete verifyResult.dataset.state;
  }
}

function setIcon(state) {
  verifyIcon.className = `verify-state-icon is-${state}`;
}

function setText(title, description) {
  verifyTitle.textContent = t(title);
  verifyDescription.textContent = t(description);
}

function updateStoredUserAsVerified(verifiedUser = {}) {
  try {
    const currentUser = JSON.parse(localStorage.getItem("snapup_user") || "{}");
    localStorage.setItem(
      "snapup_user",
      JSON.stringify({
        ...currentUser,
        ...verifiedUser,
        is_email_verified: true,
      }),
    );
  } catch (_) {}
}

function getContinueTarget() {
  const storedTarget = sessionStorage.getItem("snapup_after_verification");

  if (storedTarget) {
    sessionStorage.removeItem("snapup_after_verification");
    return storedTarget;
  }

  return authToken ? "account.html" : "login.html";
}

function showPendingState() {
  setIcon("pending");
  setText(
    verificationRequired ? "Verify your email to create an event." : "Check your inbox",
    registrationSent === "0"
      ? "Your account was created, but the verification email could not be sent. Try sending it again."
      : "We sent a verification link to your email address. Open the link to activate event creation.",
  );

  resendVerificationButton.hidden = !authToken;
  verifyLoginLink.hidden = Boolean(authToken);
  verifyContinueLink.hidden = true;
}

function showErrorState(message, allowResend = true) {
  setIcon("error");
  setText(
    "Verification link is invalid or expired.",
    "Request a new verification email and use the latest link.",
  );
  setResult(message, "error");
  resendVerificationButton.hidden = !allowResend || !authToken;
  verifyLoginLink.hidden = Boolean(authToken);
  verifyContinueLink.hidden = true;
}

async function verifyEmail() {
  try {
    setIcon("loading");
    setText(
      "Verifying your email...",
      "Please wait while we check your verification link.",
    );

    const response = await fetch(`${API_URL}/api/auth/verify-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: verificationToken }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const messageByCode = {
        INVALID_VERIFICATION_TOKEN: "Verification link is invalid or expired.",
        VERIFICATION_TOKEN_ALREADY_USED:
          "This verification link has already been used.",
        VERIFICATION_TOKEN_EXPIRED: "Verification link is invalid or expired.",
      };

      showErrorState(
        messageByCode[data.code] || "Email verification failed.",
      );
      return;
    }

    updateStoredUserAsVerified(data.user);
    setIcon("success");
    setText(
      "Email verified successfully",
      "Your email address has been verified. You can now create events.",
    );
    setResult("Email verified successfully.", "success");

    verifyContinueLink.href = getContinueTarget();
    verifyContinueLink.textContent = t(authToken ? "Continue" : "Go to login");
    verifyContinueLink.hidden = false;
    resendVerificationButton.hidden = true;
    verifyLoginLink.hidden = true;
  } catch (error) {
    console.error("Email verification error:", error);
    showErrorState("Backend connection error.");
  }
}

async function resendVerificationEmail() {
  if (!authToken) {
    verifyLoginLink.hidden = false;
    return;
  }

  try {
    resendVerificationButton.disabled = true;
    resendVerificationButton.textContent = t("Sending...");
    setResult();

    const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await response.json();

    if (response.status === 401) {
      localStorage.removeItem("snapup_token");
      localStorage.removeItem("snapup_user");
      verifyLoginLink.hidden = false;
      resendVerificationButton.hidden = true;
      setResult("Please login again to resend the verification email.", "error");
      return;
    }

    if (!response.ok || !data.success) {
      setResult(
        data.code === "VERIFICATION_EMAIL_COOLDOWN"
          ? "Please wait before requesting another verification email."
          : "Verification email could not be sent.",
        "error",
      );
      return;
    }

    if (data.already_verified) {
      updateStoredUserAsVerified();
      setIcon("success");
      setText(
        "Email verified successfully",
        "Your email address has already been verified.",
      );
      verifyContinueLink.href = getContinueTarget();
      verifyContinueLink.hidden = false;
      resendVerificationButton.hidden = true;
      return;
    }

    setIcon("pending");
    setText(
      "Check your inbox",
      "A new verification link was sent to your email address.",
    );
    setResult("Verification email sent.", "success");
  } catch (error) {
    console.error("Resend verification error:", error);
    setResult("Backend connection error.", "error");
  } finally {
    resendVerificationButton.disabled = false;
    resendVerificationButton.textContent = t("Resend verification email");
  }
}

resendVerificationButton.addEventListener("click", resendVerificationEmail);

if (verificationToken) {
  verifyEmail();
} else if (registrationSent !== null || verificationRequired) {
  showPendingState();
} else {
  showErrorState("Verification token is missing.", false);
}
