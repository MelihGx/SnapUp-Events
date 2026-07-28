"use strict";

const PRODUCTION_API_URL = "https://snapup-events-api.onrender.com";
const LOCAL_API_URL = "http://localhost:3000";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

function isLocalFrontend() {
  return (
    window.location.protocol === "file:" ||
    LOCAL_HOSTS.has(window.location.hostname)
  );
}

export const API_URL = isLocalFrontend()
  ? LOCAL_API_URL
  : PRODUCTION_API_URL;

export function apiUrl(path = "") {
  const normalizedPath = path
    ? `/${String(path).replace(/^\/+/, "")}`
    : "";

  return `${API_URL}${normalizedPath}`;
}
