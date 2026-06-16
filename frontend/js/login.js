const loginForm = document.getElementById("loginForm");

const loginMailInput = document.getElementById("loginMail");
const loginPasswordInput = document.getElementById("loginPassword");

const loginMailError = document.getElementById("loginMailError");
const loginPasswordError = document.getElementById("loginPasswordError");

const loginSubmit = document.getElementById("loginSubmit");
const loginResult = document.getElementById("loginResult");
const toggleLoginPassword = document.getElementById("toggleLoginPassword");

const API_URL = "https://snapup-events-api.onrender.com/api/auth/login";

function clearLoginErrors() {
  loginMailError.textContent = "";
  loginPasswordError.textContent = "";
  loginResult.textContent = "";
}

function showLoginResult(message, type) {
  loginResult.textContent = message;
  loginResult.style.color = type === "success" ? "#21c55d" : "#ff4d4d";
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
  const password = loginPasswordInput.value.trim();

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
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      showLoginResult(data.message || "Login failed.", "error");
      return;
    }

    localStorage.setItem("snapup_token", data.token);
    localStorage.setItem("snapup_user", JSON.stringify(data.user));

    showLoginResult("Login successful. Redirecting...", "success");

    setTimeout(() => {
      window.location.href = "account.html";
    }, 800);
  } catch (error) {
    console.error("Login error:", error);
    showLoginResult("Backend connection error.", "error");
  } finally {
    loginSubmit.disabled = false;
    loginSubmit.textContent = "Login";
  }
});
