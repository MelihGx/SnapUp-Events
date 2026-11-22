"use strict";
// Isolated execution of the current frontend functions; no external requests.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.resolve(__dirname, "../js/event-detail.js"), "utf8");
const helper = import("data:text/javascript;base64," + Buffer.from(fs.readFileSync(path.resolve(__dirname, "../js/upload-error-message.js"))).toString("base64"));
const guestKey = "snapup_guest_event_guest";
function storage(values) {
  return Object.defineProperties({ ...values }, {
    getItem: { value(key) { return this[key] ?? null; } },
    setItem: { value(key, value) { this[key] = String(value); } },
    removeItem: { value(key) { delete this[key]; } },
  });
}
async function fixture({ status = 401, code = "INVALID_GUEST_SESSION", guestToken = "rejected-token",
  accountStatus = 200, accountFailure = false, cachedToken = guestToken } = {}) {
  const calls = [];
  const localStorage = storage({ snapup_token: "synthetic-account", snapup_user: "synthetic-user" });
  const sessionStorage = storage({
    [guestKey]: JSON.stringify({ guest_id: "guest", guest_access_token: cachedToken }),
    snapup_guest_other_guest: JSON.stringify({ guest_access_token: guestToken }),
    snapup_guest_event_other: JSON.stringify({ guest_access_token: "other-token" }),
    snapup_guest_event_malformed: "not-json",
  });
  const data = status < 300 ? { success: true, media: { media_id: "synthetic-message" },
    guest: { guest_id: "guest" }, guest_access_token: "refreshed-token", uploaded_count: 1 } :
    { success: false, code, message: "Safe backend error" };
  const context = vm.createContext({
    API_BASE_URL: "https://synthetic.invalid", eventId: "event", token: "synthetic-account",
    localStorage, sessionStorage, window: { location: { href: "event-detail.html" } },
    getUploadErrorMessage: (await helper).getUploadErrorMessage,
    uploadMediaBtn: null, t: value => value, setUploadMessage() {},
    beginEventUploadProgress: () => 1, markEventUploadFailed() {}, markEventUploadComplete() {}, setEventUploadProgress() {},
    FormData: class { append() {} },
    XMLHttpRequest: class {
      constructor() { this.listeners = {}; this.upload = { addEventListener() {} }; this.status = status; this.responseText = JSON.stringify(data); }
      open(method, url) { calls.push({ method, url, headers: this.headers = {} }); }
      setRequestHeader(key, value) { this.headers[key] = value; }
      addEventListener(name, fn) { this.listeners[name] = fn; }
      send() { queueMicrotask(() => this.listeners.load()); }
    },
    async fetch(url, options = {}) {
      calls.push({ url, ...options });
      if (url.endsWith("/api/auth/logout")) return { status: 200 };
      if (url.endsWith("/api/users/me")) {
        if (accountFailure) throw new Error("Synthetic network failure");
        return { status: accountStatus };
      }
      return { status, ok: status < 300, async json() { return data; } };
    },
  });
  const names = ["getAuthHeaders", "logout", "createApiError", "handleGuestUploadUnauthorized", "createGuestForUpload", "uploadFilesToEvent", "sendMessageToEvent"];
  for (const name of names) {
    const found = source.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n\\}`));
    assert.ok(found, name); vm.runInContext(found[0], context);
  }
  return { calls, localStorage, sessionStorage, context, data,
    run(kind) {
      if (kind === "guest") return context.createGuestForUpload("guest", "synthetic-turnstile");
      if (kind === "media") return context.uploadFilesToEvent("guest", guestToken, [{ size: 1 }]);
      return context.sendMessageToEvent("guest", guestToken, "hello");
    },
    assertAccountKept() {
      assert.equal(localStorage.snapup_token, "synthetic-account");
      assert.equal(localStorage.snapup_user, "synthetic-user");
      assert.equal(context.window.location.href, "event-detail.html");
      assert.equal(calls.filter(c => c.url.endsWith("/api/auth/logout")).length, 0);
    },
  };
}

for (const kind of ["guest", "message", "media"]) {
  for (const [label, code] of [["invalid", "INVALID_GUEST_SESSION"], ["expired", "INVALID_GUEST_SESSION"], ["revoked", "GUEST_SESSION_REVOKED"]]) {
    test(kind + ": valid account survives " + label + " guest credential; request remains rejected", async () => {
      const f = await fixture({ code, guestToken: label + "-token" });
      await assert.rejects(f.run(kind), error => error.code === code && error.status === 401);
      f.assertAccountKept(); assert.equal(f.sessionStorage.getItem(guestKey), null);
      assert.ok(f.sessionStorage.getItem("snapup_guest_other_guest")); assert.ok(f.sessionStorage.getItem("snapup_guest_event_other"));
      assert.equal(f.calls.filter(c => c.url.endsWith("/api/users/me")).length, 0);
    });
  }
  test(kind + ": invalid account confirmed by account-auth endpoint logs out", async () => {
    const f = await fixture({ code: "REGISTERED_USERS_ONLY", accountStatus: 401 });
    await assert.rejects(f.run(kind), error => error.status === 401);
    assert.equal(f.localStorage.getItem("snapup_token"), null); assert.equal(f.localStorage.getItem("snapup_user"), null);
    assert.equal(f.context.window.location.href, "login.html");
    assert.equal(f.calls.filter(c => c.url.endsWith("/api/auth/logout")).length, 1);
    assert.equal(f.calls.find(c => c.url.endsWith("/api/users/me")).headers.Authorization, "Bearer synthetic-account");
  });
  test(kind + ": successful guest request and refresh still work", async () => {
    const f = await fixture({ status: 201 }); const result = await f.run(kind); f.assertAccountKept();
    assert.ok(result);
    if (kind === "guest") assert.equal(JSON.parse(f.sessionStorage.getItem(guestKey)).guest_access_token, "refreshed-token");
  });
  for (const [status, code] of [[400, "GUEST_UPLOAD_LIMIT_EXCEEDED"], [413, "GUEST_STORAGE_QUOTA_EXCEEDED"]]) {
    test(kind + ": quota " + status + " does not change either session", async () => {
      const f = await fixture({ status, code }); const cached = f.sessionStorage.getItem(guestKey);
      await assert.rejects(f.run(kind), error => error.status === status && error.code === code);
      f.assertAccountKept(); assert.equal(f.sessionStorage.getItem(guestKey), cached);
    });
  }
}

for (const options of [{ accountStatus: 200 }, { accountStatus: 403 }, { accountStatus: 500 }, { accountFailure: true }]) {
  test("ambiguous guest-endpoint 401 never logs out without confirmed account 401: " + JSON.stringify(options), async () => {
    const f = await fixture({ code: "UNKNOWN_401", ...options });
    await assert.rejects(f.run("message"), error => error.status === 401); f.assertAccountKept();
  });
}
test("a newer cached guest credential is not removed by a late rejection", async () => {
  const f = await fixture({ cachedToken: "newer-token" });
  await assert.rejects(f.run("message")); f.assertAccountKept();
  assert.equal(JSON.parse(f.sessionStorage.getItem(guestKey)).guest_access_token, "newer-token");
});
test("existing account-profile 401 still clears the account and redirects", async () => {
  const f = await fixture();
  f.context.applyAccountNameToUpload = () => {};
  f.context.readStoredUploaderUser = () => null;
  f.context.fetch = async (url, options) => {
    f.calls.push({ url, ...options });
    return { status: url.endsWith("/api/users/me") ? 401 : 200, async json() { return {}; } };
  };
  vm.runInContext(source.match(/async function hydrateAccountNameForUpload\([^]*?\n\}/)[0], f.context);
  await f.context.hydrateAccountNameForUpload();
  assert.equal(f.localStorage.getItem("snapup_token"), null);
  assert.equal(f.context.window.location.href, "login.html");
  assert.equal(f.calls.filter(c => c.url.endsWith("/api/auth/logout")).length, 1);
});
test("unavailable guest storage cannot turn a rejected request into success or trigger account logout", async () => {
  const f = await fixture();
  f.context.sessionStorage = new Proxy({}, { ownKeys() { throw new Error("Storage unavailable"); } });
  await assert.rejects(f.run("message"), error => error.code === "INVALID_GUEST_SESSION");
  f.assertAccountKept();
});
