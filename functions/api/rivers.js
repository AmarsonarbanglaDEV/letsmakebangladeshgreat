const BOUNDS = { south: 19.75, west: 87.45, north: 27.45, east: 93.25 };
const MAX_RIVERS = 2200;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": status === 200
        ? "public, max-age=900, s-maxage=1800, stale-while-revalidate=3600"
        : "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function parseBounds(value) {
  const numbers = String(value || "").split(",").map(Number);
  if (numbers.length !== 4 || numbers.some(n => !Number.isFinite(n))) {
    throw new Error("A valid south,west,north,east map area is required.");
  }
  const [south, west, north, east] = numbers;
  if (!(south < north && west < east)) throw new Error("Invalid river map bounds.");
  if (south < BOUNDS.south || west < BOUNDS.west || north > BOUNDS.north || east > BOUNDS.east) {
    throw new Error("River requests must stay inside Bangladesh.");
  }
  return { south, west, north, east };
}

function buildQuery(box, zoom) {
  const b = [box.south, box.west, box.north, box.east].join(",");
  const waterTypes = zoom >= 9 ? "(river|canal|stream)" : "(river|canal)";
  return `[out:json][timeout:22][maxsize:67108864];
(
  way["waterway"~"^${waterTypes}$"](${b});
);
out geom qt ${MAX_RIVERS};
`;
}

async function queryOverpass(query) {
  const endpoints = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.nchc.org.tw/api/interpreter"
  ];
  let lastError = null;
  for (const endpoint of endpoints) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 26000);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        body: new URLSearchParams({ data: query }).toString(),
        signal: controller.signal
      });
      if (!response.ok) throw new Error(endpoint + " returned HTTP " + response.status);
      const body = await response.json();
      if (!Array.isArray(body.elements)) {
        throw new Error(body.remark || "River data response was not a feature list.");
      }
      if (body.remark && /runtime error|timed out|out of memory/i.test(body.remark)) {
        throw new Error(body.remark);
      }
      return body;
    } catch (error) {
      lastError = error?.name === "AbortError"
        ? new Error("A river data server timed out.")
        : error;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError || new Error("All river data servers are temporarily unavailable.");
}

export async function onRequestGet(context) {
  const request = context.request;
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (origin && origin !== url.origin) {
    return json({ error: "Cross-origin river requests are not allowed." }, 403);
  }

  const zoom = Number(url.searchParams.get("zoom"));
  if (!Number.isFinite(zoom) || zoom < 6) {
    return json({ error: "Zoom to Bangladesh to display its named rivers." }, 400);
  }

  let box;
  try {
    box = parseBounds(url.searchParams.get("bbox"));
  } catch (error) {
    return json({ error: error.message }, 400);
  }

  try {
    const raw = await queryOverpass(buildQuery(box, zoom));
    const seen = new Set();
    const rivers = [];
    for (const element of raw.elements) {
      if (element.type !== "way" || !Array.isArray(element.geometry) || element.geometry.length < 2) continue;
      const tags = element.tags || {};
      const points = element.geometry
        .filter(point => Number.isFinite(point.lat) && Number.isFinite(point.lon))
        .map(point => [point.lon, point.lat]);
      if (points.length < 2) continue;
      const key = "way/" + element.id;
      if (seen.has(key)) continue;
      seen.add(key);
      rivers.push({
        type: "Feature",
        id: key,
        properties: {
          name: tags["name:en"] || tags.name || tags["name:bn"] || "Unnamed waterway",
          name_bn: tags["name:bn"] || "",
          waterway: tags.waterway || "river",
          wikidata: tags.wikidata || "",
          wikipedia: tags.wikipedia || ""
        },
        geometry: { type: "LineString", coordinates: points }
      });
      if (rivers.length >= MAX_RIVERS) break;
    }
    return json({
      type: "FeatureCollection",
      features: rivers,
      count: rivers.length,
      capped: raw.elements.length >= MAX_RIVERS,
      source: "© OpenStreetMap contributors",
      license: "Open Database License (ODbL)",
      timestamp: raw.osm3s?.timestamp_osm_base || null,
      bbox: [box.south, box.west, box.north, box.east]
    });
  } catch (error) {
    return json({
      error: error?.message || "The river data service is temporarily unavailable.",
      features: []
    }, 502);
  }
}
