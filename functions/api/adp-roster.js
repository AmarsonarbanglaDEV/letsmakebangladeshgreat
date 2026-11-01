const ADP_ROSTER_PDF =
  "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-imed/2026/9/51732c2a-8082-469a-b02b-499e6aaa00b6.pdf";

export async function onRequestGet({ request }) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");

  // Same-site, fixed-source proxy. This is not an arbitrary URL fetch service.
  if (origin && origin !== requestUrl.origin) {
    return new Response("Cross-origin requests are not allowed.", {
      status: 403,
      headers: { "X-Content-Type-Options": "nosniff" }
    });
  }

  const range = request.headers.get("Range");
  const headers = new Headers({ Accept: "application/pdf" });
  if (range) headers.set("Range", range);

  try {
    const upstream = await fetch(ADP_ROSTER_PDF, {
      headers,
      ...(range ? {} : { cf: { cacheEverything: true, cacheTtl: 86400 } })
    });

    if (!upstream.ok && upstream.status !== 206) {
      return new Response("The official ADP PDF source returned HTTP " +
        upstream.status + ".", {
        status: 502,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff"
        }
      });
    }

    const responseHeaders = new Headers({
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=\"bangladesh-adp-2026-27.pdf\"",
      "Cache-Control": range ? "public, max-age=300" :
        "public, max-age=3600, s-maxage=86400",
      "X-Content-Type-Options": "nosniff",
      "X-ADP-Source": "IMED ADP 2026-27 list, published 14 October 2026"
    });

    for (const name of ["Content-Length", "Content-Range", "Accept-Ranges", "ETag", "Last-Modified"]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders
    });
  } catch (error) {
    return new Response("Could not retrieve the official ADP roster: " +
      String(error && error.message || error), {
      status: 502,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  }
}
