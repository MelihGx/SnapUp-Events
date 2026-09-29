(() => {
  const LOOP_SPEED_PX_PER_SECOND = 29;
  const EXTRA_COVERAGE_PX = 240;
  const RESIZE_DEBOUNCE_MS = 180;

  function getFrameKey(frame) {
    return [...frame.classList]
      .filter((className) => className !== "frame")
      .sort()
      .join(" ");
  }

  function getSeedFrames(track) {
    const frames = [...track.querySelectorAll(":scope > .frame")];

    if (!frames.length) {
      return [];
    }

    const seed = [];
    const seen = new Set();

    for (const frame of frames) {
      const key = getFrameKey(frame) || frame.outerHTML;

      // The existing markup already contains a repeated set (f1..f6 twice).
      // Stop at the first repeated frame so the seed stays one logical cycle.
      if (seen.has(key)) {
        break;
      }

      seen.add(key);
      seed.push(frame.cloneNode(true));
    }

    return seed.length ? seed : frames.map((frame) => frame.cloneNode(true));
  }

  function appendSeed(sequence, seedFrames) {
    const fragment = document.createDocumentFragment();

    seedFrames.forEach((frame) => {
      fragment.appendChild(frame.cloneNode(true));
    });

    sequence.appendChild(fragment);
  }

  function buildLoop(strip, track, seedFrames) {
    track.classList.remove("is-loop-ready");
    track.replaceChildren();

    const firstSequence = document.createElement("div");
    firstSequence.className = "film-sequence";

    appendSeed(firstSequence, seedFrames);
    track.appendChild(firstSequence);

    const requiredWidth = Math.max(
      strip.clientWidth + EXTRA_COVERAGE_PX,
      window.innerWidth + EXTRA_COVERAGE_PX,
    );

    // Grow one exact cycle until it is wider than the visible viewport.
    // This prevents an empty tail even on ultrawide/4K screens.
    let guard = 0;
    while (firstSequence.scrollWidth < requiredWidth && guard < 24) {
      appendSeed(firstSequence, seedFrames);
      guard += 1;
    }

    // The second sequence is byte-for-byte the same visual cycle.
    // When sequence #1 leaves the screen, sequence #2 is already in its place.
    const secondSequence = firstSequence.cloneNode(true);
    secondSequence.setAttribute("aria-hidden", "true");
    track.appendChild(secondSequence);

    const loopDistance = firstSequence.getBoundingClientRect().width;
    const duration = Math.max(
      20,
      loopDistance / LOOP_SPEED_PX_PER_SECOND,
    );

    track.style.setProperty("--film-loop-offset", `${-loopDistance}px`);
    track.style.setProperty("--film-duration", `${duration.toFixed(2)}s`);

    // Force the browser to commit the rebuilt geometry before animation starts.
    void track.offsetWidth;
    track.classList.add("is-loop-ready");
  }

  function initFilmStripLoop() {
    const strip = document.querySelector(".film-strip");
    const track = strip?.querySelector(".film-track");

    if (!strip || !track) {
      return;
    }

    const seedFrames = getSeedFrames(track);

    if (!seedFrames.length) {
      return;
    }

    let resizeTimer = null;

    const rebuild = () => buildLoop(strip, track, seedFrames);

    rebuild();

    window.addEventListener(
      "resize",
      () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(rebuild, RESIZE_DEBOUNCE_MS);
      },
      { passive: true },
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFilmStripLoop, {
      once: true,
    });
  } else {
    initFilmStripLoop();
  }
})();
