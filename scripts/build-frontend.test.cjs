"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const stagingFixture = require("../backend/tests/fixtures/stagingPolicy");

test("staging artifact preserves public files and excludes development files", (t) => {
  const tempRoot = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(tempRoot, "snapup-frontend-build-"));
  t.after(() => {
    assert.equal(path.dirname(root), tempRoot);
    assert.match(path.basename(root), /^snapup-frontend-build-/);
    fs.rmSync(root, { recursive: true, force: true });
  });

  // Run the real builder with an isolated repository root and staging policy.
  for (const file of ["scripts/build-frontend.cjs", "backend/config/environmentSafety.js"]) {
    const destination = path.join(root, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(__dirname, "..", file), destination);
  }

  const headers = "/\n  Content-Security-Policy: connect-src 'self'; img-src 'self'; media-src 'self'\n";
  const publicFiles = [
    "index.html", "css/style.css", "js/main.js", "js/upload-error-message.js",
    "js/upload-progress-i18n.js", "assets/locales/tr.json", "assets/cover.png",
    "assets/fonts/public.woff2", "_redirects", ".well-known/security.txt",
  ];
  const privateFiles = [
    "tests/browser/message-session.spec.cjs", "tests/browser/package-lock.json",
    "tests/fixtures/ordinary-name.json", "tests/browser/node_modules/playwright/index.js",
    "js/NoDe_MoDuLeS/dependency/index.js", ".env", "js/.ENV.local",
    ".env.example", "assets/.envrc", "playwright-report/index.html",
    "assets/test-results/run/test-failed-1.png", "blob-report/run.zip",
    "assets/playwright-traces/run.zip", "assets/screenshots/capture.png",
    "assets/trace.zip", "assets/playwright-trace-1.zip", "test-report.json",
    "assets/screenshot-1.webp", "assets/test-failed-1.png",
    "js/standalone.spec.cjs", "js/helper.test.js",
    "playwright.config.cjs", ".vscode/settings.json", "assets/tmp/pending.png",
    "index.html.bak", "js/main.js~", "assets/draft.tmp", "assets/local.log",
  ];

  for (const file of [...publicFiles, ...privateFiles, "_headers", "js/deployment-policy.js"]) {
    const destination = path.join(root, "frontend", file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, file === "_headers" ? headers : `fixture for ${file}\n`);
  }

  const { buildFrontend } = require(path.join(root, "scripts/build-frontend.cjs"));
  const { policy } = stagingFixture();
  const output = buildFrontend({ mode: "staging", policy });
  const copied = fs.readdirSync(output, { recursive: true, withFileTypes: true })
    .filter((entry) => !entry.isDirectory())
    .map((entry) => path.relative(output, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"));

  assert.deepEqual(copied.sort(), [...publicFiles, "_headers", "js/deployment-policy.js"].sort());
  for (const file of publicFiles) {
    assert.equal(fs.readFileSync(path.join(output, file), "utf8"), `fixture for ${file}\n`, file);
  }
  assert.match(fs.readFileSync(path.join(output, "_headers"), "utf8"), /stage-api\.snapup\.test/);
  assert.match(fs.readFileSync(path.join(output, "js/deployment-policy.js"), "utf8"), /"mode": "staging"/);
});
