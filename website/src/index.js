const APK_CONTENT_TYPE = "application/vnd.android.package-archive";
const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};
const encoder = new TextEncoder();
const GITHUB_REPOSITORY = "winncoder/PTK-Timetable.Provider";
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPOSITORY}`;
const RELEASE_SELECT = `
  SELECT version, tag_name, file_name, size_bytes, release_notes, published_at,
         download_url, html_url
  FROM releases
  WHERE id = 1
`;

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

function methodNotAllowed(allow) {
  return json({ error: "Method not allowed." }, 405, { allow });
}

function toRelease(row) {
  if (!row) return null;
  return {
    version: row.version,
    tagName: row.tag_name,
    fileName: row.file_name,
    sizeBytes: Number(row.size_bytes),
    releaseNotes: row.release_notes || "",
    publishedAt: row.published_at || "",
    downloadUrl: row.download_url,
    htmlUrl: row.html_url || "",
  };
}

async function readRelease(db) {
  const row = await db.prepare(RELEASE_SELECT).first();
  return toRelease(row);
}

function publicRelease(release) {
  return {
    version: release.version,
    platform: "Android",
    architecture: "ARM64",
    fileName: release.fileName,
    sizeBytes: release.sizeBytes,
    releaseNotes: release.releaseNotes,
    releasedAt: release.publishedAt,
  };
}

function publicLatestRelease(release) {
  return {
    version: release.version,
    releaseNotes: release.releaseNotes,
    publishedAt: release.publishedAt,
    downloadUrl: "/download/latest",
  };
}

async function isAuthorized(request, env) {
  const expected = env.ADMIN_TOKEN;
  const header = request.headers.get("authorization") || "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!expected || !supplied || supplied.length > 1024) return false;

  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(supplied)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  const left = new Uint8Array(a);
  const right = new Uint8Array(b);
  let difference = 0;
  for (let i = 0; i < left.length; i += 1) difference |= left[i] ^ right[i];
  return difference === 0 && supplied.length === expected.length;
}

function parseByteRange(header, size) {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return { invalid: true };

  let start;
  let end;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return { invalid: true };
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) {
      return { invalid: true };
    }
    end = Math.min(end, size - 1);
  }
  return { offset: start, length: end - start + 1, end };
}

function approvedAssetUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.origin === "https://github.com" && url.pathname.startsWith(`/winncoder/PTK-Timetable.Provider/releases/download/`);
  } catch {
    return false;
  }
}

async function serveLatestDownload(request, env) {
  const release = await readRelease(env.DB);
  if (!release) return json({ error: "No APK release has been published yet." }, 404);
  if (!approvedAssetUrl(release.downloadUrl)) {
    return json({ error: "The configured APK asset URL is not approved." }, 500);
  }

  const requestedRange = parseByteRange(request.headers.get("range"), release.sizeBytes);
  if (requestedRange?.invalid) {
    return new Response(null, {
      status: 416,
      headers: {
        "accept-ranges": "bytes",
        "content-range": `bytes */${release.sizeBytes}`,
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  }

  const upstreamHeaders = new Headers();
  if (requestedRange) {
    upstreamHeaders.set("range", `bytes=${requestedRange.offset}-${requestedRange.end}`);
  }
  const ifRange = request.headers.get("if-range");
  if (ifRange) upstreamHeaders.set("if-range", ifRange);

  const upstream = await fetch(release.downloadUrl, {
    method: request.method,
    headers: upstreamHeaders,
    redirect: "follow",
  });

  if (upstream.status === 416) {
    return new Response(null, {
      status: 416,
      headers: {
        "accept-ranges": "bytes",
        "content-range": upstream.headers.get("content-range") || `bytes */${release.sizeBytes}`,
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  }
  if (!upstream.ok) {
    return json({ error: "The GitHub Release APK asset could not be fetched." }, 502);
  }

  const headers = new Headers({
    "content-type": APK_CONTENT_TYPE,
    "content-disposition": `attachment; filename="${release.fileName}"`,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "accept-ranges": "bytes",
  });
  for (const name of ["content-length", "content-range", "etag", "last-modified"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (!headers.has("content-length")) {
    if (upstream.status === 206 && requestedRange) {
      headers.set("content-length", String(requestedRange.length));
    } else if (upstream.status === 200) {
      headers.set("content-length", String(release.sizeBytes));
    }
  }
  if (upstream.status === 206 && requestedRange && !headers.has("content-range")) {
    headers.set("content-range", `bytes ${requestedRange.offset}-${requestedRange.end}/${release.sizeBytes}`);
  }

  return new Response(request.method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    headers,
  });
}

async function publishRelease(request, env) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: "Send the release version and notes as JSON." }, 400);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return json({ error: "Send the release version and notes as a JSON object." }, 400);
  }

  const version = String(data.version || "").trim();
  const releaseNotesInput = data.releaseNotes;
  if (!/^\d{1,4}\.\d{1,4}\.\d{1,4}(?:-[0-9A-Za-z.-]{1,20})?$/.test(version)) {
    return json({ error: "Enter a version such as 1.9.0." }, 400);
  }
  if (releaseNotesInput !== undefined && typeof releaseNotesInput !== "string") {
    return json({ error: "Release notes must be text." }, 400);
  }
  const releaseNotes = String(releaseNotesInput ?? "").trim();
  if (releaseNotes.length > 5000) {
    return json({ error: "Release notes must be 5,000 characters or fewer." }, 400);
  }

  const tagName = `v${version}`;
  const fileName = `PTK-Schedule-${version}-arm64-v8a.apk`;
  const response = await fetch(`${GITHUB_API}/releases/tags/${encodeURIComponent(tagName)}`, {
    headers: {
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "PTK-release-worker",
    },
  });
  if (response.status === 404) {
    return json({ error: `GitHub Release ${tagName} was not found. Publish that release with ${fileName} attached, then try again.` }, 422);
  }
  if (!response.ok) {
    return json({ error: "Could not verify the release in the approved GitHub repository. Try again later." }, 502);
  }

  let githubRelease;
  try {
    githubRelease = await response.json();
  } catch {
    return json({ error: "GitHub returned invalid release metadata." }, 502);
  }
  if (githubRelease.tag_name !== tagName) {
    return json({ error: "The GitHub release tag did not match the requested version." }, 422);
  }
  const asset = Array.isArray(githubRelease.assets)
    ? githubRelease.assets.find((item) => item?.name === fileName)
    : null;
  if (!asset || !Number.isSafeInteger(asset.size) || asset.size <= 0 || !approvedAssetUrl(asset.browser_download_url)) {
    return json({ error: `The GitHub release must include the exact asset ${fileName}.` }, 422);
  }

  const publishedAt = githubRelease.published_at || githubRelease.created_at || new Date().toISOString();
  if (!Number.isFinite(Date.parse(publishedAt))) {
    return json({ error: "GitHub returned an invalid release publication date." }, 502);
  }
  const notes = releaseNotes || String(githubRelease.body || "").slice(0, 5000);
  const htmlUrl = typeof githubRelease.html_url === "string" ? githubRelease.html_url : "";

  await env.DB.prepare(`
    INSERT INTO releases
      (id, version, tag_name, file_name, size_bytes, release_notes, published_at, download_url, html_url)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      version = excluded.version,
      tag_name = excluded.tag_name,
      file_name = excluded.file_name,
      size_bytes = excluded.size_bytes,
      release_notes = excluded.release_notes,
      published_at = excluded.published_at,
      download_url = excluded.download_url,
      html_url = excluded.html_url
  `).bind(
    version,
    tagName,
    fileName,
    asset.size,
    notes,
    publishedAt,
    asset.browser_download_url,
    htmlUrl,
  ).run();

  const release = {
    version,
    tagName,
    fileName,
    sizeBytes: asset.size,
    releaseNotes: notes,
    publishedAt,
    downloadUrl: asset.browser_download_url,
    htmlUrl,
  };
  return json({ release: publicRelease(release) }, 201);
}

async function handleAdmin(request, env, pathname) {
  if (!(await isAuthorized(request, env))) {
    return json({ error: "Unauthorized. Check the dashboard token and try again." }, 401, {
      "www-authenticate": "Bearer realm=\"PTK release dashboard\"",
    });
  }

  if (pathname === "/api/admin/release") {
    if (request.method === "GET") {
      const release = await readRelease(env.DB);
      return json({ release: release ? publicRelease(release) : null });
    }
    if (request.method === "POST") return publishRelease(request, env);
    return methodNotAllowed("GET, POST");
  }

  if (pathname === "/api/admin/upload") {
    return json({ error: "APK uploads are no longer accepted here. Publish the APK as a GitHub Release asset, then register its version." }, 410);
  }

  return json({ error: "Not found." }, 404);
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    try {
      if (pathname === "/api/release") {
        if (request.method !== "GET") return methodNotAllowed("GET");
        const release = await readRelease(env.DB);
        return release ? json(publicRelease(release)) : json({ error: "No release published." }, 404);
      }

      if (pathname === "/api/releases/latest") {
        if (request.method !== "GET") return methodNotAllowed("GET");
        const release = await readRelease(env.DB);
        return release ? json(publicLatestRelease(release)) : json({ error: "No release published." }, 404);
      }

      if (pathname.startsWith("/api/admin/")) {
        return await handleAdmin(request, env, pathname);
      }

      if (pathname === "/download/latest") {
        if (request.method !== "GET" && request.method !== "HEAD") return methodNotAllowed("GET, HEAD");
        return await serveLatestDownload(request, env);
      }

      if ((pathname === "/download" || pathname === "/download/") && request.method === "GET") {
        const assetUrl = new URL(request.url);
        assetUrl.pathname = "/download.html";
        return env.ASSETS.fetch(new Request(assetUrl, { headers: request.headers }));
      }

      if ((pathname === "/admin" || pathname === "/admin/") && request.method === "GET") {
        const assetUrl = new URL(request.url);
        assetUrl.pathname = "/admin.html";
        return env.ASSETS.fetch(new Request(assetUrl, { headers: request.headers }));
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error("PTK release backend error", error);
      return json({ error: "The release service hit an unexpected error. Please try again." }, 500);
    }
  },
};
