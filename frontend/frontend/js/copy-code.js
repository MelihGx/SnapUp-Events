"use strict";

import { $ } from "./utils.js";

export function initCopyCode() {
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
}
