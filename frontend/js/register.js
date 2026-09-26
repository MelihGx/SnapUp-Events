import { API_URL as API_BASE_URL } from "./config.js?v=runtime-api-2";
import { mountTurnstile } from "./turnstile.js?v=turnstile-visible-2";
import { mountCountryCombobox } from "./countries.js?v=searchable-country-1";

const registerForm = document.getElementById("registerForm");

const userNameInput = document.getElementById("userName");
const userMailInput = document.getElementById("userMail");
const userPhoneInput = document.getElementById("userPhone");
const userCountryInput = document.getElementById("userCountry");
const userCountrySearchInput = document.getElementById("userCountrySearch");
const userCountryCombobox = document.getElementById("userCountryCombobox");
const userCountryList = document.getElementById("userCountryList");
const userCountryToggle = document.getElementById("userCountryToggle");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");

const userNameError = document.getElementById("userNameError");
const userMailError = document.getElementById("userMailError");
const userPhoneError = document.getElementById("userPhoneError");
const userCountryError = document.getElementById("userCountryError");
const passwordError = document.getElementById("passwordError");
const confirmPasswordError = document.getElementById("confirmPasswordError");

const registerSubmit = document.getElementById("registerSubmit");
const registerResult = document.getElementById("registerResult");
const togglePassword = document.getElementById("togglePassword");

const API_URL = `${API_BASE_URL}/api/auth/register`;

const countryCombobox = mountCountryCombobox({
  root: userCountryCombobox,
  searchInput: userCountrySearchInput,
  hiddenInput: userCountryInput,
  menu: userCountryList,
  toggleButton: userCountryToggle,
  placeholder:
    window.SnapUpI18n?.t?.("Select your country") || "Select your country",
  noResultsText:
    window.SnapUpI18n?.t?.("No countries found") || "No countries found",
});

const registerTurnstile = mountTurnstile({
  fieldId: "registerTurnstileField",
  widgetId: "registerTurnstileWidget",
  messageId: "registerTurnstileMessage",
  action: "register",
});

function clearErrors() {
  userNameError.textContent = "";
  userMailError.textContent = "";
  userPhoneError.textContent = "";
  userCountryError.textContent = "";
  passwordError.textContent = "";
  confirmPasswordError.textContent = "";
  registerResult.textContent = "";
}

function showResult(message, type) {
  registerResult.textContent = message;

  if (type === "success") {
    registerResult.style.color = "#21c55d";
  } else {
    registerResult.style.color = "#ff4d4d";
  }
}

togglePassword.addEventListener("click", () => {
  const isPasswordHidden = passwordInput.type === "password";

  passwordInput.type = isPasswordHidden ? "text" : "password";
  togglePassword.textContent = isPasswordHidden ? "Hide" : "Show";
});

userCountrySearchInput?.addEventListener("input", () => {
  userCountrySearchInput.setCustomValidity("");
  userCountryError.textContent = "";
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearErrors();

  const user_name = userNameInput.value.trim();
  const user_mail = userMailInput.value.trim();
  const user_phone = userPhoneInput.value.trim();
  const user_country_code = userCountryInput.value.trim().toUpperCase();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  let hasError = false;

  if (!user_name) {
    userNameError.textContent = "Full name is required.";
    hasError = true;
  }

  if (!user_mail) {
    userMailError.textContent = "Email address is required.";
    hasError = true;
  }

  if (!user_country_code) {
    userCountryError.textContent = "Country is required.";
    userCountrySearchInput.setCustomValidity(
      "Please select a country from the list.",
    );
    hasError = true;
  } else {
    userCountrySearchInput.setCustomValidity("");
  }

  if (!password) {
    passwordError.textContent = "Password is required.";
    hasError = true;
  }

  if (
    password &&
    (password.length < 6 || new TextEncoder().encode(password).length > 72)
  ) {
    passwordError.textContent =
      "Password must be at least 6 characters and at most 72 UTF-8 bytes.";
    hasError = true;
  }

  if (!confirmPassword) {
    confirmPasswordError.textContent = "Please confirm your password.";
    hasError = true;
  }

  if (password !== confirmPassword) {
    confirmPasswordError.textContent = "Passwords do not match.";
    hasError = true;
  }

  if (hasError) {
    return;
  }

  let turnstileController = null;
  let turnstileTokenWasUsed = false;

  try {
    turnstileController = await registerTurnstile;
    const turnstile_token = turnstileController.getToken();
    turnstileTokenWasUsed = Boolean(turnstile_token);

    registerSubmit.disabled = true;
    registerSubmit.textContent = "Creating account...";

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_name,
        user_mail,
        user_phone,
        user_country_code,
        password,
        language_code: window.SnapUpI18n?.language || "en",
        turnstile_token,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      if (response.status === 409) {
        userMailError.textContent = "This email address is already registered.";
        showResult(
          "This email address is already registered. Please login or use another email.",
          "error",
        );
        userMailInput.focus();
        return;
      }

      showResult(data.message || "Register failed.", "error");
      return;
    }

    localStorage.setItem("snapup_token", data.token);
    localStorage.setItem("snapup_user", JSON.stringify(data.user));

    const verificationEmailSent = data.verification_email_sent !== false;

    showResult(
      verificationEmailSent
        ? "Account created. Check your inbox to verify your email."
        : "Account created, but the verification email could not be sent. You can resend it on the next page.",
      "success",
    );

    setTimeout(() => {
      window.location.href = `verify-email.html?sent=${verificationEmailSent ? "1" : "0"}`;
    }, 900);
  } catch (error) {
    console.error("Register error:", error);
    showResult(error.message || "Backend connection error.", "error");
  } finally {
    if (turnstileTokenWasUsed) turnstileController?.reset();
    registerSubmit.disabled = false;
    registerSubmit.textContent = "Create Account";
  }
});
