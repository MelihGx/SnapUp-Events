"use strict";

import { API_URL } from "./config.js";

export async function testBackendConnection() {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    const data = await response.json();

    console.log("Backend connection successful:", data);
    return data;
  } catch (error) {
    console.error("Backend connection error:", error);
    return null;
  }
}

export async function createEvent(payload) {
  const requestBody = typeof payload === "string" ? { eventName: payload } : payload;

  const response = await fetch(`${API_URL}/api/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Event could not be created");
  }

  return data;
}
