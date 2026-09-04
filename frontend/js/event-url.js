function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch (_error) {
    return value;
  }
}

export function isLocalFrontendHost() {
  return (
    window.location.protocol === "file:" ||
    /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)
  );
}

export function readEventGalleryIdentifier() {
  const params = new URLSearchParams(window.location.search);
  const eventCode = String(params.get("code") || "").trim().toUpperCase();
  let eventSlug = String(params.get("slug") || "").trim().toLowerCase();

  if (!eventSlug) {
    const pathMatch = window.location.pathname.match(/\/gallery\/([^/?#]+)\/?$/i);
    if (pathMatch?.[1]) {
      eventSlug = safeDecodeURIComponent(pathMatch[1]).trim().toLowerCase();
    }
  }

  return { eventCode, eventSlug };
}

export function buildEventGalleryUrl(event, baseHref = window.location.href) {
  const eventSlug = String(event?.event_slug || "").trim().toLowerCase();
  const eventCode = String(event?.event_code || "").trim().toUpperCase();
  const currentUrl = new URL(baseHref, window.location.href);
  const language = currentUrl.searchParams.get("lang");

  if (eventSlug) {
    if (isLocalFrontendHost()) {
      const galleryUrl = new URL("event-gallery.html", baseHref);
      galleryUrl.search = "";
      galleryUrl.searchParams.set("slug", eventSlug);
      if (language) galleryUrl.searchParams.set("lang", language);
      return galleryUrl.toString();
    }

    const galleryUrl = new URL(
      `/gallery/${encodeURIComponent(eventSlug)}`,
      window.location.origin,
    );
    if (language) galleryUrl.searchParams.set("lang", language);
    return galleryUrl.toString();
  }

  const fallbackUrl = isLocalFrontendHost()
    ? new URL("event-gallery.html", baseHref)
    : new URL("/event-gallery.html", window.location.origin);
  fallbackUrl.search = "";
  if (eventCode) fallbackUrl.searchParams.set("code", eventCode);
  if (language) fallbackUrl.searchParams.set("lang", language);
  return fallbackUrl.toString();
}

export function canonicalizeEventGalleryAddress(event) {
  const eventSlug = String(event?.event_slug || "").trim();
  if (!eventSlug) return;

  const targetUrl = buildEventGalleryUrl(event);
  const currentUrl = window.location.href;

  if (targetUrl !== currentUrl) {
    window.history.replaceState(window.history.state, "", targetUrl);
  }
}
