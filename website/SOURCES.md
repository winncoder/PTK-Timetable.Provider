# Implementation references

- Cloudflare, [D1 database configuration](https://developers.cloudflare.com/d1/configuration/) and [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/). These inform the D1 binding and the checked-in schema migration for current-release metadata.
- GitHub, [REST API: Get a release by tag name](https://docs.github.com/en/rest/releases/releases#get-a-release-by-tag-name) and [About releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases). The Worker verifies a release by its `v<version>` tag and requires the exact approved APK asset name before storing metadata.
- Cloudflare, [Fetch API](https://developers.cloudflare.com/workers/runtime-apis/fetch/). The download handler streams the upstream GitHub release asset and forwards byte-range requests through the Worker.
- Cloudflare, [Configuration and Bindings for Static Assets](https://developers.cloudflare.com/workers/static-assets/binding/). Static assets use an `assets.directory` and route patterns so API, download, and admin paths are handled by the Worker first.
- The approved repository's [v1.9.0 Release](https://github.com/winncoder/PTK-Timetable.Provider/releases/tag/v1.9.0) is the source of the public APK binary. The exact approved asset is attached, and the backend validates its tag and filename before updating D1 metadata.

The site uses the supplied PTK icons and CSS/SVG illustrations. No external image-search assets were selected.
