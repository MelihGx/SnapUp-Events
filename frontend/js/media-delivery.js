function asUrl(value) {
  return typeof value === "string" && value.trim() ? value : "";
}

export function getOriginalMediaUrl(media) {
  return asUrl(media?.media_url || media?.url || media?.file_url);
}

export function getImageDeliveryUrl(media, purpose = "feed") {
  const delivery = media?.delivery_urls || {};

  if (purpose === "feed_small") {
    return (
      asUrl(delivery.feed_srcset?.small) ||
      asUrl(delivery.thumbnail) ||
      getOriginalMediaUrl(media)
    );
  }

  if (purpose === "feed_medium") {
    return (
      asUrl(delivery.feed_srcset?.medium) ||
      asUrl(delivery.feed) ||
      getOriginalMediaUrl(media)
    );
  }

  return (
    asUrl(delivery[purpose]) ||
    (purpose === "feed" ? asUrl(delivery.feed_srcset?.large) : "") ||
    asUrl(delivery.feed) ||
    getOriginalMediaUrl(media)
  );
}

export function getImageSrcSet(media) {
  const source = media?.delivery_urls?.feed_srcset || {};
  const candidates = [
    [asUrl(source.small), 480],
    [asUrl(source.medium), 768],
    [asUrl(source.large), 1200],
  ].filter(([url]) => Boolean(url));

  return candidates.map(([url, width]) => `${url} ${width}w`).join(", ");
}

export function getVideoPosterUrl(media) {
  return asUrl(media?.delivery_urls?.poster);
}

export function getVideoPlaybackUrl(media) {
  return asUrl(media?.delivery_urls?.playback) || getOriginalMediaUrl(media);
}

export function getEventCoverUrl(event, purpose = "display") {
  const originalUrl = asUrl(event?.event_cover_url);
  if (!originalUrl) {
    return "";
  }

  const delivery = event?.event_cover_delivery_urls || {};
  return (
    asUrl(delivery[purpose]) ||
    asUrl(delivery.display) ||
    originalUrl
  );
}

export function getSlideshowImageUrl(media) {
  const slideshow = media?.delivery_urls?.slideshow || {};
  const pixelRatio = Math.min(Number(window.devicePixelRatio) || 1, 2);
  const viewportWidth = Number(window.innerWidth || window.screen?.width || 0);
  const viewportHeight = Number(
    window.innerHeight || window.screen?.height || 0,
  );
  const targetEdge = Math.max(viewportWidth, viewportHeight) * pixelRatio;

  if (targetEdge > 2560 && asUrl(slideshow.uhd)) {
    return slideshow.uhd;
  }

  if (targetEdge > 1920 && asUrl(slideshow.qhd)) {
    return slideshow.qhd;
  }

  return (
    asUrl(slideshow.full_hd) ||
    asUrl(slideshow.qhd) ||
    asUrl(slideshow.uhd) ||
    getImageDeliveryUrl(media, "display")
  );
}
