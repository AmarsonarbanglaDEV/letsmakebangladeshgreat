const GOOGLE_NEWS_RSS = "https://news.google.com/rss/search";

export async function onRequestGet({ request }) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");

  // Only serve same-site project-profile requests. No arbitrary URL proxying.
  if (origin && origin !== requestUrl.origin) {
    return new Response("Cross-origin requests are not allowed.", {
      status: 403,
      headers: { "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store" }
    });
  }

  const query = (requestUrl.searchParams.get("q") || "").trim().slice(0, 180);
  if (query.length < 4) {
    return new Response("A project search phrase is required.", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
    });
  }

  const feedUrl = new URL(GOOGLE_NEWS_RSS);
  feedUrl.searchParams.set("q", query);
  feedUrl.searchParams.set("hl", "en-BD");
  feedUrl.searchParams.set("gl", "BD");
  feedUrl.searchParams.set("ceid", "BD:en");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const upstream = await fetch(feedUrl.toString(), {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9",
        "User-Agent": "BangladeshPublicAtlas/1.0 (project evidence lookup)"
      },
      signal: controller.signal,
      cf: { cacheEverything: true, cacheTtl: 1800 }
    });

    if (!upstream.ok) {
      return new Response("Google News RSS returned HTTP " + upstream.status + ".", {
        status: 502,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
      });
    }

    const body = await upstream.text();
    if (!body.includes("<rss") && !body.includes("<feed")) {
      return new Response("The news provider did not return an RSS feed.", {
        status: 502,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
      });
    }

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=1800, stale-while-revalidate=7200",
        "X-Content-Type-Options": "nosniff",
        "X-Atlas-Source": "Google News RSS · Bangladesh"
      }
    });
  } catch (error) {
    const message = error && error.name === "AbortError"
      ? "The news search timed out."
      : "The news search is temporarily unavailable.";
    return new Response(message, {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
    });
  } finally {
    clearTimeout(timeout);
  }
}
