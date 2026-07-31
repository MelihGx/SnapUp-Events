const DEFAULT_CENTER = [39.0, 35.0];
const DEFAULT_ZOOM = 6;
const SELECTED_ZOOM = 16;

function asCoordinate(value, minimum, maximum) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : null;
}

export function getEventCoordinates(event) {
  const latitude = asCoordinate(event?.event_latitude, -90, 90);
  const longitude = asCoordinate(event?.event_longitude, -180, 180);

  if (latitude === null || longitude === null) {
    return null;
  }

  return { latitude, longitude };
}

export function buildEventMapUrl(event) {
  const coordinates = getEventCoordinates(event);

  if (coordinates) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${coordinates.latitude},${coordinates.longitude}`,
    )}`;
  }

  const locationText = [event?.event_location, event?.event_address]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");

  return locationText
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        locationText,
      )}`
    : "";
}

export function createLocationMapPicker({
  mapElement,
  latitudeInput,
  longitudeInput,
  addressInput = null,
  clearButton,
  statusElement,
  translate = (value) => value,
  onChange = null,
}) {
  if (!mapElement || !latitudeInput || !longitudeInput) {
    return null;
  }

  const Leaflet = window.L;
  let map = null;
  let marker = null;
  let selectedCoordinates = null;
  let reverseGeocodeTimer = null;
  let reverseGeocodeController = null;
  let addressWasManuallyEdited = false;
  let addressIsBeingAutofilled = false;
  const reverseGeocodeCache = new Map();

  function handleAddressInput() {
    if (!addressIsBeingAutofilled) {
      addressWasManuallyEdited = true;
    }
  }

  addressInput?.addEventListener("input", handleAddressInput);

  function cancelReverseGeocode() {
    if (reverseGeocodeTimer) {
      window.clearTimeout(reverseGeocodeTimer);
      reverseGeocodeTimer = null;
    }

    reverseGeocodeController?.abort();
    reverseGeocodeController = null;
  }

  function setAutofilledAddress(value) {
    if (!addressInput || !value || addressWasManuallyEdited) {
      return;
    }

    addressIsBeingAutofilled = true;
    addressInput.value = value;
    addressInput.dispatchEvent(new Event("input", { bubbles: true }));
    addressIsBeingAutofilled = false;
  }

  async function reverseGeocode(coordinates) {
    if (!addressInput || addressWasManuallyEdited) {
      return;
    }

    const cacheKey = `${coordinates.latitude.toFixed(
      5,
    )},${coordinates.longitude.toFixed(5)}`;

    if (reverseGeocodeCache.has(cacheKey)) {
      setAutofilledAddress(reverseGeocodeCache.get(cacheKey));
      return;
    }

    reverseGeocodeController?.abort();
    reverseGeocodeController = new AbortController();

    const language =
      window.SnapUpI18n?.language || navigator.language || "en";
    const endpoint = new URL(
      "https://nominatim.openstreetmap.org/reverse",
    );
    endpoint.searchParams.set("format", "jsonv2");
    endpoint.searchParams.set("lat", String(coordinates.latitude));
    endpoint.searchParams.set("lon", String(coordinates.longitude));
    endpoint.searchParams.set("zoom", "18");
    endpoint.searchParams.set("addressdetails", "0");
    endpoint.searchParams.set("accept-language", language);

    try {
      const response = await fetch(endpoint, {
        headers: {
          Accept: "application/json",
        },
        signal: reverseGeocodeController.signal,
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const displayName = String(data?.display_name || "").trim();

      if (displayName) {
        reverseGeocodeCache.set(cacheKey, displayName);
        setAutofilledAddress(displayName);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.warn("Location address lookup failed:", error.message);
      }
    } finally {
      reverseGeocodeController = null;
    }
  }

  function scheduleReverseGeocode(coordinates) {
    cancelReverseGeocode();

    if (!addressInput || addressWasManuallyEdited) {
      return;
    }

    reverseGeocodeTimer = window.setTimeout(() => {
      reverseGeocodeTimer = null;
      reverseGeocode(coordinates);
    }, 1100);
  }

  function updateStatus() {
    if (!statusElement) {
      return;
    }

    statusElement.textContent = selectedCoordinates
      ? translate("Selected pin: {latitude}, {longitude}", {
          latitude: selectedCoordinates.latitude.toFixed(6),
          longitude: selectedCoordinates.longitude.toFixed(6),
        })
      : translate("No pin selected");
    statusElement.dataset.state = selectedCoordinates ? "selected" : "empty";
  }

  function writeCoordinates(coordinates) {
    selectedCoordinates = coordinates;
    latitudeInput.value = coordinates
      ? coordinates.latitude.toFixed(7)
      : "";
    longitudeInput.value = coordinates
      ? coordinates.longitude.toFixed(7)
      : "";

    if (clearButton) {
      clearButton.hidden = !coordinates;
    }

    updateStatus();
    onChange?.(coordinates);
  }

  function ensureMarker(coordinates) {
    if (!map || !Leaflet) {
      return;
    }

    const point = [coordinates.latitude, coordinates.longitude];

    if (!marker) {
      marker = Leaflet.marker(point, {
        draggable: true,
        keyboard: true,
        autoPan: true,
        title: translate("Selected event location"),
      }).addTo(map);

      marker.on("dragend", () => {
        const position = marker.getLatLng();
        setCoordinates(position.lat, position.lng, {
          center: false,
          reverseAddress: true,
        });
      });
    } else {
      marker.setLatLng(point);
    }
  }

  function setCoordinates(
    latitude,
    longitude,
    { center = true, reverseAddress = false } = {},
  ) {
    const parsedLatitude = asCoordinate(latitude, -90, 90);
    const parsedLongitude = asCoordinate(longitude, -180, 180);

    if (parsedLatitude === null || parsedLongitude === null) {
      clear();
      return;
    }

    const coordinates = {
      latitude: parsedLatitude,
      longitude: parsedLongitude,
    };

    ensureMarker(coordinates);
    writeCoordinates(coordinates);

    if (center && map) {
      map.setView(
        [coordinates.latitude, coordinates.longitude],
        Math.max(map.getZoom(), SELECTED_ZOOM),
      );
    }

    if (reverseAddress) {
      scheduleReverseGeocode(coordinates);
    }
  }

  function clear() {
    cancelReverseGeocode();

    if (marker && map) {
      map.removeLayer(marker);
    }

    marker = null;
    writeCoordinates(null);
  }

  if (!Leaflet) {
    mapElement.classList.add("is-unavailable");
    mapElement.textContent = translate("Map could not be loaded.");
    clearButton?.setAttribute("hidden", "");
    updateStatus();

    return {
      clear,
      destroy() {},
      getCoordinates: () => selectedCoordinates,
      resetAddressTracking() {
        addressWasManuallyEdited = false;
      },
      resize() {},
      setCoordinates,
    };
  }

  map = Leaflet.map(mapElement, {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    minZoom: 3,
    maxZoom: 19,
    scrollWheelZoom: false,
    zoomControl: true,
  });

  Leaflet.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    },
  ).addTo(map);

  map.on("click", (event) => {
    setCoordinates(event.latlng.lat, event.latlng.lng, {
      center: false,
      reverseAddress: true,
    });
  });

  clearButton?.addEventListener("click", clear);

  const initialLatitude = asCoordinate(latitudeInput.value, -90, 90);
  const initialLongitude = asCoordinate(longitudeInput.value, -180, 180);

  if (initialLatitude !== null && initialLongitude !== null) {
    setCoordinates(initialLatitude, initialLongitude);
  } else {
    writeCoordinates(null);
  }

  return {
    clear,
    destroy() {
      cancelReverseGeocode();
      addressInput?.removeEventListener("input", handleAddressInput);
      map?.remove();
      map = null;
      marker = null;
    },
    getCoordinates: () => selectedCoordinates,
    resetAddressTracking() {
      addressWasManuallyEdited = false;
    },
    resize() {
      map?.invalidateSize();
    },
    setCoordinates,
  };
}
