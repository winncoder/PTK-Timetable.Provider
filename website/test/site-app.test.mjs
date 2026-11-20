import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { makeReleaseView } from "../client/release-utils.js";
import { isDownloadPath } from "../client/route-utils.js";

const root = new URL("../", import.meta.url);

test("homepage and download shells mount the same React application", () => {
  for (const relativePath of ["promo-index.html", "index.html"]) {
    const html = readFileSync(new URL(relativePath, root), "utf8");
    assert.match(html, /id="app-root"/);
    assert.match(html, /src="\/assets\/site-app\.js"/);
    assert.doesNotMatch(html, /hero-scene\.js/);
  }
  const app = readFileSync(new URL("client/site.jsx", root), "utf8");
  assert.match(app, /import PtkScene from "\.\/hero-scene\.jsx"/);
  assert.match(app, /function HomePage\(\)/);
  assert.match(app, /function DownloadPage\(\)/);
});

test("React route selection recognizes download aliases without matching the homepage", () => {
  for (const pathname of ["/download", "/download/", "/Downloads", "/Downloads/"]) {
    assert.equal(isDownloadPath(pathname), true, `${pathname} should render the download page`);
  }
  for (const pathname of ["/", "/downloads", "/Downloads/extra", "/download/latest"]) {
    assert.equal(isDownloadPath(pathname), false, `${pathname} should not render the download page`);
  }
});

test("download navigation reaches installation steps and the mobile menu closes with Escape", () => {
  const app = readFileSync(new URL("client/site.jsx", root), "utf8");
  assert.match(app, /href="#install-title"/);
  assert.match(app, /event\.key !== "Escape"/);
  assert.match(app, /menuButtonRef\.current\?\.focus\(\)/);
});

test("release rendering accepts only the same-origin stable APK endpoint", () => {
  const view = makeReleaseView({
    version: "1.9.0",
    releaseNotes: "แก้ไขข้อผิดพลาด\nปรับปรุงความเสถียร",
    publishedAt: "2026-11-15T05:00:00.000Z",
    downloadUrl: "/download/latest",
  }, {
    platform: "Android",
    architecture: "ARM64",
    fileName: "PTK-Schedule-1.9.0-arm64-v8a.apk",
    sizeBytes: 2 * 1024 * 1024,
  }, "https://ptk.test");

  assert.equal(view.version, "1.9.0");
  assert.equal(view.downloadUrl, "/download/latest");
  assert.equal(view.platform, "Android");
  assert.equal(view.architecture, "ARM64");
  assert.equal(view.fileName, "PTK-Schedule-1.9.0-arm64-v8a.apk");
  assert.match(view.sizeText, /2/);
  assert.ok(view.dateText !== "ไม่ระบุ");
  assert.match(view.releaseNotes, /ปรับปรุงความเสถียร/);
});

test("release rendering falls back safely when legacy details are unavailable", () => {
  const view = makeReleaseView({ version: "1.9.1", downloadUrl: "/download/latest" }, null, "https://ptk.test");
  assert.equal(view.sizeText, "ไม่ระบุ");
  assert.equal(view.fileName, "ไฟล์ APK รุ่นล่าสุด");
  assert.equal(view.architecture, "ARM64");
  assert.equal(view.releaseNotes, "");
});

test("release rendering rejects external, wrong-path, and malformed download URLs", () => {
  for (const downloadUrl of [
    "https://attacker.example/latest.apk",
    "https://ptk.test/download/other.apk",
    "javascript:alert(1)",
    "",
  ]) {
    assert.throws(() => makeReleaseView({ version: "1.9.0", downloadUrl }, null, "https://ptk.test"));
  }
  assert.throws(() => makeReleaseView({ downloadUrl: "/download/latest" }, null, "https://ptk.test"));
});
