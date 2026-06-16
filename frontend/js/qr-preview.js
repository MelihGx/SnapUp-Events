"use strict";

import { $, $$ } from "./utils.js";

export function initQRPreview() {
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
}
