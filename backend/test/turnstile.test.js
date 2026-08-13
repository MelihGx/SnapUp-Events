const assert = require("node:assert/strict");
const { afterEach, beforeEach, test } = require("node:test");

const requireTurnstile = require("../middlewares/turnstile");
const {
  getPublicTurnstileConfig,
  validateTurnstileToken,
} = require("../services/turnstileService");

const originalEnvironment = {
  NODE_ENV: process.env.NODE_ENV,
  TURNSTILE_ENABLED: process.env.TURNSTILE_ENABLED,
  TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  TURNSTILE_ALLOWED_HOSTNAMES: process.env.TURNSTILE_ALLOWED_HOSTNAMES,
};
const originalFetch = global.fetch;
const originalWarn = console.warn;

function configureTurnstile() {
  process.env.NODE_ENV = "production";
  process.env.TURNSTILE_ENABLED = "true";
  process.env.TURNSTILE_SITE_KEY = "test-site-key";
  process.env.TURNSTILE_SECRET_KEY = "test-secret-key";
  process.env.TURNSTILE_ALLOWED_HOSTNAMES =
    "snapupevents.com,www.snapupevents.com";
}

function restoreEnvironment() {
  Object.entries(originalEnvironment).forEach(([key, value]) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  });
}

function createRequest(body = {}) {
  return {
    body,
    ip: "203.0.113.10",
    method: "POST",
    originalUrl: "/api/auth/login",
    requestId: "test-request",
  };
}

function createResponse() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

beforeEach(() => {
  configureTurnstile();
  console.warn = () => {};
});

afterEach(() => {
  global.fetch = originalFetch;
  console.warn = originalWarn;
  restoreEnvironment();
});

test("public config exposes only the site key", { concurrency: false }, () => {
  assert.deepEqual(getPublicTurnstileConfig(), {
    enabled: true,
    siteKey: "test-site-key",
    ready: true,
  });
});

test("Siteverify retry reuses one idempotency key", { concurrency: false }, async () => {
  const bodies = [];

  global.fetch = async (_url, options) => {
    bodies.push(new URLSearchParams(String(options.body)));

    if (bodies.length === 1) {
      return {
        ok: true,
        json: async () => ({
          success: false,
          "error-codes": ["internal-error"],
        }),
      };
    }

    return {
      ok: true,
      json: async () => ({
        success: true,
        hostname: "snapupevents.com",
        action: "login",
        challenge_ts: "2026-08-13T08:00:00.000Z",
      }),
    };
  };

  const result = await validateTurnstileToken({
    token: "valid-token",
    remoteIp: "203.0.113.10",
  });

  assert.equal(result.success, true);
  assert.equal(bodies.length, 2);
  assert.equal(bodies[0].get("secret"), "test-secret-key");
  assert.equal(bodies[0].get("response"), "valid-token");
  assert.equal(bodies[0].get("remoteip"), "203.0.113.10");
  assert.equal(
    bodies[0].get("idempotency_key"),
    bodies[1].get("idempotency_key"),
  );
});

test("middleware rejects a missing token", { concurrency: false }, async () => {
  const middleware = requireTurnstile("login");
  const response = createResponse();
  let nextCalled = false;

  await middleware(createRequest(), response, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(response.statusCode, 400);
  assert.equal(response.payload.code, "TURNSTILE_REQUIRED");
});

test("middleware accepts a verified action and hostname", { concurrency: false }, async () => {
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      success: true,
      hostname: "www.snapupevents.com",
      action: "login",
      challenge_ts: "2026-08-13T08:00:00.000Z",
    }),
  });
  const middleware = requireTurnstile("login");
  const request = createRequest({ turnstile_token: "valid-token" });
  const response = createResponse();
  let nextCalled = false;

  await middleware(request, response, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(response.statusCode, 200);
  assert.equal(request.body.turnstile_token, undefined);
  assert.equal(request.turnstile.action, "login");
});

test("middleware rejects a token from another hostname", { concurrency: false }, async () => {
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      success: true,
      hostname: "attacker.example",
      action: "login",
    }),
  });
  const middleware = requireTurnstile("login");
  const response = createResponse();

  await middleware(
    createRequest({ turnstile_token: "valid-token" }),
    response,
    () => assert.fail("next must not be called"),
  );

  assert.equal(response.statusCode, 403);
  assert.equal(response.payload.code, "TURNSTILE_FAILED");
});
