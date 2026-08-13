import { API_URL as API_BASE_URL } from "./config.js?v=runtime-api-2";
import {
  createTurnstileController,
  getTurnstileErrorMessage,
} from "./turnstile.js?v=turnstile-1";

const loginForm = document.getElementById("loginForm");

const loginMailInput = document.getElementById("loginMail");
const loginPasswordInput = document.getElementById("loginPassword");

const loginMailError = document.getElementById("loginMailError");
const loginPasswordError = document.getElementById("loginPasswordError");

const loginSubmit = document.getElementById("loginSubmit");
const loginResult = document.getElementById("loginResult");
const toggleLoginPassword = document.getElementById("toggleLoginPassword");

const API_URL = `${API_BASE_URL}/api/auth/login`;
const turnstileControllerPromise = createTurnstileController({
  container: "#loginTurnstile",
  action: "login",
}).catch((error) => {
  console.error("Turnstile initialization error:", error);
  return null;
});

function clearLoginErrors() {
  loginMailError.textContent = "";
  loginPasswordError.textContent = "";
  loginResult.textContent = "";
  loginResult.className = "auth-result";
}

function showLoginResult(message, type) {
  const translatedMessage = window.SnapUpI18n?.t?.(message) || message;
  loginResult.textContent = translatedMessage;
  loginResult.className = `auth-result show ${type}`;
}

const loginParams = new URLSearchParams(window.location.search);
if (loginParams.get("passwordReset") === "1") {
  showLoginResult(
    "Password updated. You can now login with your new password.",
    "success",
  );
  window.history.replaceState({}, document.title, "login.html");
}

toggleLoginPassword.addEventListener("click", () => {
  const isHidden = loginPasswordInput.type === "password";

  loginPasswordInput.type = isHidden ? "text" : "password";
  toggleLoginPassword.textContent = isHidden ? "Hide" : "Show";
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearLoginErrors();

  const user_mail = loginMailInput.value.trim();
  const password = loginPasswordInput.value;

  let hasError = false;

  if (!user_mail) {
    loginMailError.textContent = "Email address is required.";
    hasError = true;
  }

  if (!password) {
    loginPasswordError.textContent = "Password is required.";
    hasError = true;
  }

  if (hasError) {
    return;
  }

  const turnstileController = await turnstileControllerPromise;

  if (!turnstileController) {
    showLoginResult(
      "Security verification could not be completed. Please try again.",
      "error",
    );
    return;
  }

  const turnstileToken = turnstileController.getToken();

  if (turnstileController.enabled && !turnstileToken) {
    showLoginResult("Please complete the security verification.", "error");
    return;
  }

  try {
    loginSubmit.disabled = true;
    loginSubmit.textContent = "Logging in...";

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_mail,
        password,
        turnstile_token: turnstileToken,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      turnstileController.reset();
      showLoginResult(getTurnstileErrorMessage(data, "Login failed."), "error");
      return;
    }

    localStorage.setItem("snapup_token", data.token);
    localStorage.setItem("snapup_user", JSON.stringify(data.user));

    showLoginResult("Login successful. Redirecting...", "success");

    const storedRedirect = sessionStorage.getItem("snapup_after_login");
    const isSafeRedirect =
      storedRedirect &&
      !storedRedirect.startsWith("//") &&
      !storedRedirect.includes(":") &&
      /^[a-zA-Z0-9._/?=&%#-]+$/.test(storedRedirect);

    sessionStorage.removeItem("snapup_after_login");

    setTimeout(() => {
      window.location.replace(isSafeRedirect ? storedRedirect : "account.html");
    }, 800);
  } catch (error) {
    console.error("Login error:", error);
    turnstileController.reset();
    showLoginResult("Backend connection error.", "error");
  } finally {
    loginSubmit.disabled = false;
    loginSubmit.textContent = "Login";
  }
});
