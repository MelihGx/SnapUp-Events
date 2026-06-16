const registerForm = document.getElementById("registerForm");

const userNameInput = document.getElementById("userName");
const userMailInput = document.getElementById("userMail");
const userPhoneInput = document.getElementById("userPhone");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");

const userNameError = document.getElementById("userNameError");
const userMailError = document.getElementById("userMailError");
const userPhoneError = document.getElementById("userPhoneError");
const passwordError = document.getElementById("passwordError");
const confirmPasswordError = document.getElementById("confirmPasswordError");

const registerSubmit = document.getElementById("registerSubmit");
const registerResult = document.getElementById("registerResult");
const togglePassword = document.getElementById("togglePassword");

const API_URL = "http://localhost:3000/api/auth/register";

function clearErrors() {
  userNameError.textContent = "";
  userMailError.textContent = "";
  userPhoneError.textContent = "";
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

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearErrors();

  const user_name = userNameInput.value.trim();
  const user_mail = userMailInput.value.trim();
  const user_phone = userPhoneInput.value.trim();
  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  let hasError = false;

  if (!user_name) {
    userNameError.textContent = "Full name is required.";
    hasError = true;
  }

  if (!user_mail) {
    userMailError.textContent = "Email address is required.";
    hasError = true;
  }

  if (!password) {
    passwordError.textContent = "Password is required.";
    hasError = true;
  }

  if (password && password.length < 6) {
    passwordError.textContent = "Password must be at least 6 characters.";
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

  try {
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
        password,
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

    showResult("Account created successfully. Redirecting...", "success");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  } catch (error) {
    console.error("Register error:", error);
    showResult("Backend connection error.", "error");
  } finally {
    registerSubmit.disabled = false;
    registerSubmit.textContent = "Create Account";
  }
});
