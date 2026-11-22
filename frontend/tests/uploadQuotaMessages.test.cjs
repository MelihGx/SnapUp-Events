"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const js = path.resolve(__dirname, "../js");
const read = name => fs.readFileSync(path.join(js, name), "utf8");
// Import the actual pure ES module without changing this repository's package type.
const helper = import("data:text/javascript;base64," + Buffer.from(read("upload-error-message.js")).toString("base64"));
const codes = ["GUEST_UPLOAD_LIMIT_EXCEEDED", "GUEST_STORAGE_QUOTA_EXCEEDED", "EVENT_STORAGE_QUOTA_EXCEEDED"];
const keys = ["You have reached the upload count limit.", "You have reached the storage space limit.", "This event has reached its storage space limit."];
const generic = "Message could not be sent.";

function i18n(language = "en") {
  const context = vm.createContext({
    window: { location: { search: "" }, alert() {}, confirm() {} },
    document: { documentElement: {}, readyState: "loading", addEventListener() {} },
    localStorage: { getItem() { return language; }, setItem() {} }, URLSearchParams,
  });
  // Same script order as index.html; DOM initialization is deferred.
  for (const file of ["asian-i18n.js", "ui-additions-i18n.js", "upload-progress-i18n.js", "i18n.js"]) {
    vm.runInContext(read(file), context, { filename: file });
  }
  return context.window;
}

test("all three exact quota codes take priority over backend messages for message/photo/video", async () => {
  const { getUploadErrorMessage: select } = await helper;
  for (let i = 0; i < codes.length; i++) {
    for (const fallback of [generic, "Media could not be uploaded.", "Media upload failed."]) {
      assert.equal(select({ status: i ? 413 : 400 }, { code: codes[i], message: "Upload failed.", error: "PRIVATE_DETAILS" }, fallback), keys[i]);
    }
  }
});

test("precheck uses the count code without parsing English or inventing a count", async () => {
  const { getUploadErrorMessage: select } = await helper;
  for (const message of ["Upload limit exceeded. This guest can upload maximum 4 item(s).", "localized server text", undefined]) {
    assert.equal(select({ status: 400 }, { code: codes[0], message }, generic), keys[0]);
  }
});

test("unexpected message-save errors use the safe translatable generic phrase", async () => {
  const { getUploadErrorMessage: select } = await helper;
  for (const data of [{ code: "MESSAGE_SAVE_FAILED", message: "Message save failed." },
    { message: "PRIVATE_DATABASE_DETAILS", error: "PRIVATE_ERROR" }, {}]) {
    assert.equal(select({ status: 500 }, data, generic), generic);
  }
});

test("unrelated upload/auth/validation error messages and fallbacks remain unchanged", async () => {
  const { getUploadErrorMessage: select } = await helper;
  for (const [status, code] of [[401, "INVALID_GUEST_SESSION"], [403, "REGISTERED_USERS_ONLY"],
    [400, "INVALID_INPUT"], [409, "UPLOAD_IDEMPOTENCY_CONFLICT"], [429, "RATE_LIMITED"], [503, "VIDEO_PROCESS_FAILED"]]) {
    assert.equal(select({ status }, { code, message: "Existing safe message" }, "Media upload failed."), "Existing safe message");
  }
  assert.equal(select({ status: 500 }, { error: "Existing upload error" }, "Media upload failed."), "Existing upload error");
  assert.equal(select({ status: 500 }, {}, "Media upload failed."), "Media upload failed.");
  assert.equal(select({ status: 413 }, { code: "__proto__", message: "Existing" }, generic), "Existing");
});

for (const file of ["join-upload-modal.js", "event-detail.js"]) {
  test(file + " actual createApiError uses shared selection and preserves metadata", async () => {
    const { getUploadErrorMessage } = await helper;
    const source = read(file);
    assert.match(source, /import \{ getUploadErrorMessage \} from "\.\/upload-error-message\.js\?v=quota-errors-1"/);
    const declaration = source.match(/function createApiError\(response, data, fallbackMessage\) \{[\s\S]*?\n\}/);
    assert.ok(declaration);
    const context = vm.createContext({ getUploadErrorMessage });
    vm.runInContext(declaration[0] + "\nglobalThis.create = createApiError;", context);
    for (let i = 0; i < codes.length; i++) {
      const error = context.create({ status: i ? 413 : 400 }, { code: codes[i], message: "Upload failed.", request_id: "synthetic-request" }, generic);
      assert.equal(error.message, keys[i]); assert.equal(error.code, codes[i]); assert.equal(error.status, i ? 413 : 400);
      if (file === "join-upload-modal.js") assert.equal(error.requestId, "synthetic-request");
    }
    const error = context.create({ status: 500 }, { code: "MESSAGE_SAVE_FAILED", message: "PRIVATE_DETAILS" }, generic);
    assert.equal(error.message, generic);
  });

  test(file + " message sender keeps 201 success and selects safe quota/500 errors", async () => {
    const { getUploadErrorMessage } = await helper;
    const source = read(file);
    const modal = file === "join-upload-modal.js";
    const name = modal ? "sendMessage" : "sendMessageToEvent";
    const sender = source.match(new RegExp(`async function ${name}\\([^]*?\\n\\}`));
    assert.ok(sender);
    let response, sent, logouts = 0;
    const context = vm.createContext({
      getUploadErrorMessage, API_BASE_URL: "https://synthetic.invalid", eventId: "event",
      getUserAuthHeaders: () => ({}), getAuthHeaders: () => ({ "Content-Type": "application/json" }),
      async logout() { logouts++; },
      async fetch(url, options) {
        sent = { url, options };
        return { status: response.status, ok: response.status === 201, async json() { return response.data; } };
      },
    });
    const guestAuth = modal ? "" : source.match(/async function handleGuestUploadUnauthorized\([^]*?\n\}/)[0];
    vm.runInContext(guestAuth + "\n" + source.match(/function createApiError\(response, data, fallbackMessage\) \{[\s\S]*?\n\}/)[0] +
      "\n" + sender[0] + `\nglobalThis.send = ${name};`, context);
    const send = () => modal ? context.send("event", "guest", "synthetic-token", "hello") : context.send("guest", "synthetic-token", "hello");
    response = { status: 201, data: { success: true, media: { media_id: "synthetic-message" } } };
    assert.equal(await send(), modal ? response.data : response.data.media);
    assert.equal(sent.url, "https://synthetic.invalid/api/media/message");
    assert.equal(sent.options.method, "POST");
    assert.equal(sent.options.headers["X-Guest-Token"], "synthetic-token");
    assert.deepEqual(JSON.parse(sent.options.body), { event_id: "event", guest_id: "guest", message: "hello" });
    for (let i = 0; i < codes.length; i++) {
      response = { status: i ? 413 : 400, data: { success: false, code: codes[i], message: "Upload failed." } };
      await assert.rejects(send(), error => error.message === keys[i] && error.code === codes[i] && error.status === response.status);
    }
    response = { status: 500, data: { success: false, code: "MESSAGE_SAVE_FAILED", message: "PRIVATE_DETAILS" } };
    await assert.rejects(send(), error => error.message === generic);
    assert.equal(logouts, 0);
    response = { status: 401, data: { success: false, code: "INVALID_GUEST_SESSION", message: "Guest session is invalid or expired." } };
    await assert.rejects(send(), error => error.code === "INVALID_GUEST_SESSION");
    assert.equal(logouts, 0); // A guest credential rejection must not log out the account.
  });
}

test("real i18n translates all quota/generic keys in every supported language", () => {
  const window = i18n();
  const languages = ["en", "tr", "ar", "de", "fr", "es", "it", "nl", "bg", "ro", "el", "sr", "hr", "bs", "sq", "mk",
    ...Object.keys(window.SnapUpAdditionalLanguages)];
  assert.equal(new Set(languages).size, 50);
  for (const lang of languages) {
    for (const key of [...keys, generic]) {
      const translated = window.SnapUpI18n.t(key, lang);
      if (lang === "en") assert.equal(translated, key);
      else {
        assert.equal(typeof translated, "string"); assert.ok(translated.trim()); assert.notEqual(translated, key, lang + ": " + key);
        assert.equal(translated, window.SnapUpPagePhrases[key][lang]);
      }
    }
  }
});

test("Turkish messages match requested meaning; English and missing-language fallbacks are readable", () => {
  const window = i18n("tr");
  assert.equal(window.SnapUpI18n.t(keys[0]), "Yükleme adedi sınırına ulaştınız.");
  assert.equal(window.SnapUpI18n.t(keys[1]), "Depolama alanı sınırına ulaştınız.");
  assert.equal(window.SnapUpI18n.t(keys[2]), "Bu etkinliğin depolama alanı sınırına ulaşıldı.");
  assert.equal(window.SnapUpI18n.t(generic), "Mesaj gönderilemedi.");
  assert.equal(window.SnapUpI18n.t(keys[0], "en"), keys[0]);
  assert.equal(window.SnapUpI18n.t(keys[0], "unsupported"), keys[0]);
  assert.equal(i18n("unsupported").SnapUpI18n.language, "en");
});

test("index and event detail load the translation pack before the i18n registry", () => {
  for (const page of ["index.html", "event-detail.html"]) {
    const html = fs.readFileSync(path.join(js, "..", page), "utf8");
    const pack = html.indexOf('src="js/upload-progress-i18n.js');
    const registry = html.indexOf('src="js/i18n.js');
    assert.ok(pack >= 0 && registry > pack, page);
  }
});
