"use strict";

import { $, $$ } from "./utils.js";

export function initUploadSimulation() {
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

    if (!fileIcon || !fileName || !progressStatus || !progressFill || !progressBox) {
      return;
    }

    messageBox?.classList.remove("open");
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
    if (!textarea?.value.trim()) {
      textarea?.focus();
      if (textarea) {
        textarea.style.outline = "2px solid var(--coral)";
        setTimeout(() => (textarea.style.outline = ""), 900);
      }
      return;
    }

    textarea.value = "";
    if (charCount) charCount.textContent = "0 / 180";
    simulate("message");
  });

  textarea?.addEventListener("input", () => {
    if (charCount) charCount.textContent = `${textarea.value.length} / 180`;
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
}
