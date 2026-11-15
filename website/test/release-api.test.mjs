import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/index.js";

const ADMIN_TOKEN = "local-test-token";
const RELEASE_BYTES = new TextEncoder().encode("PTK-APK-BYTES");
const ASSET_URL = "https://github.com/winncoder/PTK-Timetable.Provider/releases/download/v1.9.0/PTK-Schedule-1.9.0-arm64-v8a.apk";

class MemoryD1 {
  constructor() {
    this.release = null;
  }

  prepare(query) {
    return new MemoryStatement(this, query);
  }
}

class MemoryStatement {
  constructor(db, query) {
    this.db = db;
    this.query = query;
    this.values = [];
  }

  bind(...values) {
    this.values = values;
    return this;
  }

  async first() {
    if (!this.query.includes("SELECT") || !this.query.includes("FROM releases")) {
      throw new Error("Unexpected D1 query in test mock.");
    }
    return this.db.release ? { ...this.db.release } : null;
  }

  async run() {
    if (!this.query.includes("INSERT INTO releases")) {
      throw new Error("Unexpected D1 write in test mock.");
    }
    const [version, tag_name, file_name, size_bytes, release_notes, published_at, download_url, html_url] = this.values;
    this.db.release = {
      version,
      tag_name,
      file_name,
      size_bytes,
      release_notes,
      published_at,
      download_url,
      html_url,
    };
    return { success: true };
  }
}

function makeEnv(db = new MemoryD1()) {
  return {
    ADMIN_TOKEN,
    DB: db,
    ASSETS: { fetch: async () => new Response("static asset", { status: 200 }) },
  };
}

function makeRequest(path, options = {}) {
  return new Request(`https://ptk.test${path}`, options);
}

function seedRelease(db, bytes = RELEASE_BYTES) {
  const publishedAt = "2026-11-15T05:00:00.000Z";
  db.release = {
    version: "1.9.0",
    tag_name: "v1.9.0",
    file_name: "PTK-Schedule-1.9.0-arm64-v8a.apk",
    size_bytes: bytes.byteLength,
    release_notes: "แก้ไขข้อผิดพลาดและปรับปรุงความเสถียร",
    published_at: publishedAt,
    download_url: ASSET_URL,
    html_url: "https://github.com/winncoder/PTK-Timetable.Provider/releases/tag/v1.9.0",
  };
  return db.release;
}

function githubRelease(version = "1.9.1", bytes = RELEASE_BYTES) {
  const fileName = `PTK-Schedule-${version}-arm64-v8a.apk`;
  const tagName = `v${version}`;
  return {
    tag_name: tagName,
    body: "โน้ตจาก GitHub Release",
    published_at: "2026-11-15T05:00:00.000Z",
    html_url: `https://github.com/winncoder/PTK-Timetable.Provider/releases/tag/${tagName}`,
    assets: [{
      name: fileName,
      size: bytes.byteLength,
      browser_download_url: `https://github.com/winncoder/PTK-Timetable.Provider/releases/download/${tagName}/${fileName}`,
    }],
  };
}

test("GET /api/releases/latest returns the exact public contract", async () => {
  const db = new MemoryD1();
  const release = seedRelease(db);
  const response = await worker.fetch(makeRequest("/api/releases/latest"), makeEnv(db));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    version: release.version,
    releaseNotes: release.release_notes,
    publishedAt: release.published_at,
    downloadUrl: "/download/latest",
  });
});

test("legacy GET /api/release remains available for existing clients", async () => {
  const db = new MemoryD1();
  const release = seedRelease(db);
  const response = await worker.fetch(makeRequest("/api/release"), makeEnv(db));
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.version, release.version);
  assert.equal(data.releasedAt, release.published_at);
  assert.equal(data.fileName, release.file_name);
  assert.equal(data.sizeBytes, RELEASE_BYTES.byteLength);
});

test("latest metadata returns 404 until a release is registered", async () => {
  const response = await worker.fetch(makeRequest("/api/releases/latest"), makeEnv());
  assert.equal(response.status, 404);
  assert.match((await response.json()).error, /No release published/);
});

test("GET /download/latest streams a valid byte range from GitHub", async (t) => {
  const db = new MemoryD1();
  seedRelease(db);
  let requestedRange = null;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(String(url), ASSET_URL);
    requestedRange = new Headers(init.headers).get("range");
    return new Response(RELEASE_BYTES.slice(2, 6), {
      status: 206,
      headers: {
        "content-range": `bytes 2-5/${RELEASE_BYTES.byteLength}`,
        "content-length": "4",
        "accept-ranges": "bytes",
        etag: '"github-asset-etag"',
      },
    });
  });

  const response = await worker.fetch(
    makeRequest("/download/latest", { headers: { range: "bytes=2-5" } }),
    makeEnv(db),
  );

  assert.equal(requestedRange, "bytes=2-5");
  assert.equal(response.status, 206);
  assert.equal(response.headers.get("accept-ranges"), "bytes");
  assert.equal(response.headers.get("content-range"), `bytes 2-5/${RELEASE_BYTES.byteLength}`);
  assert.equal(response.headers.get("content-length"), "4");
  assert.equal(response.headers.get("content-type"), "application/vnd.android.package-archive");
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), RELEASE_BYTES.slice(2, 6));
});

test("GET /download/latest supports suffix ranges and rejects unsatisfiable ranges", async (t) => {
  const db = new MemoryD1();
  seedRelease(db);
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    assert.equal(new Headers(init.headers).get("range"), `bytes=${RELEASE_BYTES.byteLength - 3}-${RELEASE_BYTES.byteLength - 1}`);
    return new Response(RELEASE_BYTES.slice(-3), {
      status: 206,
      headers: { "content-range": `bytes ${RELEASE_BYTES.byteLength - 3}-${RELEASE_BYTES.byteLength - 1}/${RELEASE_BYTES.byteLength}` },
    });
  });

  const suffix = await worker.fetch(
    makeRequest("/download/latest", { headers: { range: "bytes=-3" } }),
    makeEnv(db),
  );
  assert.equal(suffix.status, 206);
  assert.deepEqual(new Uint8Array(await suffix.arrayBuffer()), RELEASE_BYTES.slice(-3));

  const invalid = await worker.fetch(
    makeRequest("/download/latest", { headers: { range: `bytes=${RELEASE_BYTES.byteLength}-` } }),
    makeEnv(db),
  );
  assert.equal(invalid.status, 416);
  assert.equal(invalid.headers.get("content-range"), `bytes */${RELEASE_BYTES.byteLength}`);
});

test("HEAD /download/latest reports the asset length without a body", async (t) => {
  const db = new MemoryD1();
  seedRelease(db);
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    assert.equal(init.method, "HEAD");
    return new Response(null, { status: 200, headers: { "content-length": String(RELEASE_BYTES.byteLength) } });
  });

  const response = await worker.fetch(makeRequest("/download/latest", { method: "HEAD" }), makeEnv(db));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-length"), String(RELEASE_BYTES.byteLength));
  assert.equal(await response.text(), "");
});

test("admin release metadata requires the bearer token", async () => {
  const response = await worker.fetch(makeRequest("/api/admin/release"), makeEnv());
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("www-authenticate"), 'Bearer realm="PTK release dashboard"');
});

test("an authorized admin registers an exact GitHub release asset in D1", async (t) => {
  const db = new MemoryD1();
  const env = makeEnv(db);
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(String(url), "https://api.github.com/repos/winncoder/PTK-Timetable.Provider/releases/tags/v1.9.1");
    assert.equal(new Headers(init.headers).get("accept"), "application/vnd.github+json");
    return Response.json(githubRelease());
  });

  const response = await worker.fetch(makeRequest("/api/admin/release", {
    method: "POST",
    headers: { authorization: `Bearer ${ADMIN_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ version: "1.9.1", releaseNotes: "แก้ไขตารางเรียน" }),
  }), env);
  const data = await response.json();

  assert.equal(response.status, 201);
  assert.equal(data.release.version, "1.9.1");
  assert.equal(data.release.releaseNotes, "แก้ไขตารางเรียน");
  assert.equal(data.release.sizeBytes, RELEASE_BYTES.byteLength);
  assert.ok(Number.isFinite(Date.parse(data.release.releasedAt)));
  assert.equal(db.release.download_url, "https://github.com/winncoder/PTK-Timetable.Provider/releases/download/v1.9.1/PTK-Schedule-1.9.1-arm64-v8a.apk");

  const latest = await worker.fetch(makeRequest("/api/releases/latest"), env);
  assert.equal(latest.status, 200);
  assert.deepEqual(await latest.json(), {
    version: "1.9.1",
    releaseNotes: "แก้ไขตารางเรียน",
    publishedAt: data.release.releasedAt,
    downloadUrl: "/download/latest",
  });
});

test("admin registration rejects a GitHub release without the exact approved APK asset", async (t) => {
  const env = makeEnv();
  const release = githubRelease("1.9.1");
  release.assets[0].name = "other-file.apk";
  t.mock.method(globalThis, "fetch", async () => Response.json(release));

  const response = await worker.fetch(makeRequest("/api/admin/release", {
    method: "POST",
    headers: { authorization: `Bearer ${ADMIN_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ version: "1.9.1" }),
  }), env);
  assert.equal(response.status, 422);
  assert.match((await response.json()).error, /exact asset PTK-Schedule-1.9.1-arm64-v8a.apk/);
  assert.equal(env.DB.release, null);
});

test("legacy APK upload route no longer accepts file uploads", async () => {
  const response = await worker.fetch(makeRequest("/api/admin/upload", {
    method: "POST",
    headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
  }), makeEnv());
  assert.equal(response.status, 410);
  assert.match((await response.json()).error, /GitHub Release asset/);
});
