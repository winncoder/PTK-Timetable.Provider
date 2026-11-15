const SITE = "https://ptk-timetable.tangible-sweatpants.workers.dev";

export default {
  fetch(request) {
    const { pathname, search } = new URL(request.url);
    let destination = `${SITE}/download`;
    if (pathname === "/download/latest" || pathname === "/latest.apk") {
      destination = `${SITE}/download/latest`;
    } else if (pathname.startsWith("/api/")) {
      destination = `${SITE}${pathname}${search}`;
    } else if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      destination = `${SITE}/admin`;
    }
    return new Response(null, {
      status: 302,
      headers: {
        location: destination,
        "cache-control": "no-store",
      },
    });
  },
};
