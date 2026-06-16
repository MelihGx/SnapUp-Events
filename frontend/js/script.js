/* =========================================================
   SnapUp Events — Camera Landing Page Interactions
   ========================================================= */

"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/* NAV */
(function initNav() {
  const header = $("#siteHeader");
  const burger = $("#burger");
  const menu = $("#mobileMenu");
  const links = $$(".nav-links a, .mobile-menu a[href^='#']");

  function onScroll() {
    header?.classList.toggle("scrolled", window.scrollY > 24);
  }

  function closeMenu() {
    burger?.classList.remove("open");
    burger?.setAttribute("aria-expanded", "false");
    menu?.classList.remove("open");
    menu?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("menu-open");
  }

  function toggleMenu() {
    const open = !menu.classList.contains("open");
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("open", open);
    menu.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("menu-open", open);
  }

  burger?.addEventListener("click", toggleMenu);
  links.forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1100) closeMenu();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
  const navShell = $(".nav-shell");

  navShell?.addEventListener("mousemove", (event) => {
    const rect = navShell.getBoundingClientRect();
    navShell.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    navShell.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  });

  navShell?.addEventListener("mouseleave", () => {
    navShell.style.setProperty("--spot-x", `120px`);
    navShell.style.setProperty("--spot-y", `36px`);
  });

  onScroll();

  const sections = $$("main section[id]");
  const navItems = $$(".nav-links a");

  function setActiveLink() {
    const y = window.scrollY + 150;
    let current = "home";

    sections.forEach((section) => {
      if (section.offsetTop <= y) current = section.id;
    });

    navItems.forEach((link) => {
      link.classList.toggle(
        "active",
        link.getAttribute("href") === `#${current}`,
      );
    });
  }

  window.addEventListener("scroll", setActiveLink, { passive: true });
  setActiveLink();
})();

/* REVEAL */
(function initReveal() {
  const items = $$(".reveal");

  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -50px 0px" },
  );

  items.forEach((item) => observer.observe(item));
})();

/* PHONE TILT */
(function initPhoneTilt() {
  const phone = $("#phoneTilt");
  if (!phone) return;

  phone.addEventListener("mousemove", (event) => {
    if (window.innerWidth < 900) return;

    const rect = phone.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    phone.style.transform = `
      perspective(900px)
      rotateY(${x * 12}deg)
      rotateX(${-y * 9}deg)
      translateY(-8px)
    `;
  });

  phone.addEventListener("mouseleave", () => {
    phone.style.transform = "";
  });
})();

/* DECORATIVE QR GENERATOR */
(function initQR() {
  const qr = $("#qrCode");
  if (!qr) return;

  const size = 15;
  const finder = (row, col) => {
    const inTopLeft = row < 5 && col < 5;
    const inTopRight = row < 5 && col > 9;
    const inBottomLeft = row > 9 && col < 5;

    if (!(inTopLeft || inTopRight || inBottomLeft)) return null;

    const r = inTopRight ? row : inBottomLeft ? row - 10 : row;
    const c = inTopRight ? col - 10 : col;

    return (
      r === 0 ||
      r === 4 ||
      c === 0 ||
      c === 4 ||
      (r >= 2 && r <= 2 && c >= 2 && c <= 2)
    );
  };

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const cell = document.createElement("span");
      const isFinder = finder(row, col);
      const isOn =
        isFinder === true || (isFinder === null && Math.random() > 0.48);
      cell.classList.toggle("on", isOn);
      qr.appendChild(cell);
    }
  }

  setInterval(() => {
    const cells = $$(".qr-code span:not(.on)");
    const active = $$(".qr-code span.on");
    if (!cells.length || !active.length) return;

    const randomOff = cells[Math.floor(Math.random() * cells.length)];
    const randomOn = active[Math.floor(Math.random() * active.length)];

    randomOff.classList.add("on");
    randomOn.classList.remove("on");
  }, 1800);
})();

/* COPY CODE */
(function initCopyCode() {
  const button = $("#copyCode");
  const code = $("#eventCode");
  if (!button || !code) return;

  button.addEventListener("click", async () => {
    const value = code.textContent.trim();

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    const oldText = button.textContent;
    button.textContent = "Copied!";
    setTimeout(() => {
      button.textContent = oldText;
    }, 1600);
  });
})();

/* UPLOAD SIMULATION */
(function initUpload() {
  const buttons = $$("[data-upload]");
  const dropZone = $("#dropZone");
  const progressBox = $("#progressBox");
  const progressFill = $("#progressFill");
  const progressStatus = $("#progressStatus");
  const fileName = $("#fileName");
  const fileIcon = $("#fileIcon");
  const messageBox = $("#messageBox");
  const textarea = $("#memoryMessage");
  const charCount = $("#charCount");
  const sendMessage = $("#sendMessage");

  let intervalId = null;

  const config = {
    photo: { icon: "📸", name: "memory_photo.jpg", speed: 28 },
    video: { icon: "🎥", name: "memory_video.mp4", speed: 20 },
    message: { icon: "💬", name: "guest_message.txt", speed: 42 },
  };

  function simulate(type = "photo") {
    const item = config[type] || config.photo;

    if (messageBox) messageBox.classList.remove("open");
    clearInterval(intervalId);

    fileIcon.textContent = item.icon;
    fileName.textContent = item.name;
    progressStatus.textContent = "Uploading...";
    progressFill.style.width = "0%";
    progressBox.classList.add("show");

    let percent = 0;
    intervalId = setInterval(() => {
      percent += Math.random() * 7 + 2;
      if (percent >= 100) {
        percent = 100;
        progressFill.style.width = "100%";
        progressStatus.textContent = "Uploaded!";
        clearInterval(intervalId);

        setTimeout(() => {
          progressBox.classList.remove("show");
          progressFill.style.width = "0%";
          progressStatus.textContent = "Uploading...";
        }, 2300);
      } else {
        progressFill.style.width = `${percent}%`;
      }
    }, item.speed);
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.upload;

      if (type === "message") {
        clearInterval(intervalId);
        progressBox?.classList.remove("show");
        messageBox?.classList.toggle("open");
        textarea?.focus();
      } else {
        simulate(type);
      }
    });
  });

  sendMessage?.addEventListener("click", () => {
    if (!textarea.value.trim()) {
      textarea.focus();
      textarea.style.outline = "2px solid var(--coral)";
      setTimeout(() => (textarea.style.outline = ""), 900);
      return;
    }

    textarea.value = "";
    charCount.textContent = "0 / 180";
    simulate("message");
  });

  textarea?.addEventListener("input", () => {
    charCount.textContent = `${textarea.value.length} / 180`;
  });

  ["dragenter", "dragover"].forEach((name) => {
    dropZone?.addEventListener(name, (event) => {
      event.preventDefault();
      dropZone.classList.add("active");
    });
  });

  ["dragleave", "drop"].forEach((name) => {
    dropZone?.addEventListener(name, (event) => {
      event.preventDefault();
      dropZone.classList.remove("active");

      if (name === "drop") {
        const file = event.dataTransfer?.files?.[0];
        const type = file?.type?.startsWith("video") ? "video" : "photo";
        simulate(type);
      }
    });
  });

  dropZone?.addEventListener("click", () => simulate("photo"));
})();

/* BACKEND CONNECTION TEST */
(async function testBackendConnection() {
  const API_URL = "http://localhost:3000";

  try {
    const response = await fetch(`${API_URL}/api/health`);
    const data = await response.json();

    console.log("Backend bağlantısı başarılı:", data);
  } catch (error) {
    console.error("Backend bağlantı hatası:", error);
  }
})();

/* CREATE EVENT FROM FRONTEND */
(function initCreateEvent() {
  const form = document.querySelector("#eventCreateForm");
  const input = document.querySelector("#eventNameInput");
  const result = document.querySelector("#eventCreateResult");

  const API_URL = "http://localhost:3000";

  if (!form || !input || !result) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const eventName = input.value.trim();

    if (!eventName) {
      result.className = "event-create-result error";
      result.textContent = "Lütfen event adı gir.";
      input.focus();
      return;
    }

    result.className = "event-create-result loading";
    result.textContent = "Event oluşturuluyor...";

    try {
      const response = await fetch(`${API_URL}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventName }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Event oluşturulamadı");
      }

      result.className = "event-create-result success";
      result.innerHTML = `
        <strong>Event oluşturuldu!</strong>
        <span>Event adı: ${data.event.eventName}</span>
        <b>${data.event.eventCode}</b>
        <small>Bu kodu misafirlerinle paylaşabilirsin.</small>
      `;

      input.value = "";
    } catch (error) {
      result.className = "event-create-result error";
      result.textContent = error.message || "Backend bağlantı hatası oluştu.";
    }
  });
})();

const navAuth = document.getElementById("navAuth");

function renderAuthNavbar() {
  if (!navAuth) {
    return;
  }

  const token = localStorage.getItem("snapup_token");
  const user = JSON.parse(localStorage.getItem("snapup_user") || "null");

  if (!token || !user) {
    navAuth.innerHTML = `
      <a href="login.html" class="nav-login-link">Login</a>
      <a href="register.html" class="nav-register-link">Register</a>
    `;
    return;
  }

  navAuth.innerHTML = `
    <a href="account.html" class="nav-account-link">
      ${user.user_name || "My Account"}
    </a>
    <button type="button" class="nav-logout-btn" id="logoutButton">
      Logout
    </button>
  `;

  const logoutButton = document.getElementById("logoutButton");

  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("snapup_token");
    localStorage.removeItem("snapup_user");
    window.location.href = "index.html";
  });
}

renderAuthNavbar();
