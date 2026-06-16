"use strict";

import { $ } from "./utils.js";

export function initPhoneTilt() {
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
}
