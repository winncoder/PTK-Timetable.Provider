# PTK ตารางเรียน — website and APK release backend

This is the unified PTK site: promotional homepage at `/`, download page at `/download`, and protected release dashboard at `/admin`.

## Release and download flow

- `GET /api/releases/latest` keeps the public contract `{ version, releaseNotes, publishedAt, downloadUrl }`; `downloadUrl` remains `/download/latest`.
- The legacy `GET /api/release` route remains for clients that also need file size, filename, platform, or architecture.
- D1 stores the metadata for the currently published release. The APK binary stays as a public asset in the approved GitHub repository, `winncoder/PTK-Timetable.Provider`.
- `/download/latest` streams the asset from GitHub and forwards byte-range requests. It remains the stable public download endpoint; the Worker does not store or buffer a second APK copy.
- The protected `/admin` dashboard registers release metadata after validating the matching GitHub release and exact asset name. It does not upload APK files.
- Release tags use `v<version>` (for example, `v1.9.0`) and include the exact ARM64 asset `PTK-Schedule-<version>-arm64-v8a.apk`. The approved 1.9.0 filename is `PTK-Schedule-1.9.0-arm64-v8a.apk`.
- `/api/admin/upload` is retired and responds with `410 Gone`; use GitHub Releases for APK files, then register the version in `/admin`.

Before registering the approved 1.9.0 APK, make sure that public asset has been attached to a `v1.9.0` GitHub Release in the approved repository. The dashboard checks for the release and exact asset before changing D1 metadata.

## Routes

| Route | Purpose |
|---|---|
| `/` | PTK promotional homepage |
| `/download` | Public APK details and install steps |
| `/download/latest` | Stable, range-capable current APK download |
| `/admin` | Private release management interface |
| `/api/releases/latest` | Public latest-release contract |
| `/api/release` | Legacy public latest-release metadata |
| `/api/admin/release` | Protected current metadata (`GET`) and GitHub release registration (`POST`) |

## Local development and checks

```sh
npm install
npm test
cp .dev.vars.example .dev.vars
# Replace the local-only ADMIN_TOKEN value in .dev.vars
npx wrangler d1 migrations apply ptk-release-metadata --local
npm run dev
```

The Wrangler configuration contains a local placeholder D1 database ID. Before any future Cloudflare deployment, create the D1 database with Wrangler and replace that placeholder with the database ID returned by Cloudflare; then apply migrations remotely. Do not use the placeholder ID in a deployed environment. Set `ADMIN_TOKEN` as a Worker secret, and do not commit `.dev.vars` or use its local test token in production.

## App behavior validation

The GitHub asset download could not be smoke-tested against a real release because the approved repository currently has no public Releases. The 1.9.0 APK was not launched on Android: this environment has no Android device, emulator, SDK, or ADB. Do not claim that timetable scanning, OCR, or notifications were runtime-tested until those behaviors are observed on an Android device with a sample timetable.
