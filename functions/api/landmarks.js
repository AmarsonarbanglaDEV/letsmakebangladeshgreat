const BOUNDS = { south: 19.75, west: 87.45, north: 27.45, east: 93.25 };
const MAX_RESULTS = 1800;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": status === 200
        ? "public, max-age=600, s-maxage=1800, stale-while-revalidate=3600"
        : "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function fail(message, status = 400) {
  return json({ error: message, elements: [] }, status);
}

function parseBbox(value) {
  const numbers = String(value || "").split(",").map(Number);
  if (numbers.length !== 4 || numbers.some(number => !Number.isFinite(number))) {
    throw new Error("A valid south,west,north,east bounding box is required.");
  }
  const [south, west, north, east] = numbers;
  if (!(south < north && west < east)) throw new Error("The landmark map bounds are invalid.");
  if (south < BOUNDS.south || west < BOUNDS.west ||
      north > BOUNDS.north || east > BOUNDS.east) {
    throw new Error("Landmark requests must stay inside Bangladesh.");
  }
  if ((north - south) * (east - west) > 5.5 ||
      north - south > 2.8 || east - west > 3.2) {
    throw new Error("Zoom further into Bangladesh to load landmarks for a smaller map area.");
  }
  return { south, west, north, east };
}

function buildQuery(box) {
  const b = [box.south, box.west, box.north, box.east].join(",");
  return `[out:json][timeout:22];
(
  nwr["name"]["tourism"~"attraction|museum|viewpoint|artwork|gallery|zoo|aquarium|theme_park|camp_site|picnic_site|information"](${b});
  nwr["name"]["historic"](${b});
  nwr["name"]["heritage"](${b});
  nwr["name"]["memorial"](${b});
  nwr["name"]["natural"~"peak|waterfall|beach|cave|hot_spring|spring|cliff|volcano"](${b});
  nwr["name"]["leisure"~"park|garden|nature_reserve|stadium|sports_centre|marina"](${b});
  nwr["name"]["amenity"~"place_of_worship|museum|theatre|arts_centre|library|fountain|university|townhall"](${b});
  nwr["name"]["man_made"~"monument|lighthouse|tower|bridge|obelisk|pier|water_tower"](${b});
  nwr["name"]["railway"="station"](${b});
  nwr["name"]["aeroway"~"aerodrome|helipad"](${b});
  nwr["name"]["waterway"~"waterfall|dam"](${b});
  nwr["name"]["building"~"temple|mosque|church|cathedral|shrine|palace|castle"](${b});
  nwr["name"]["place"~"square|island"](${b});
  nwr["name"]["boundary"="protected_area"](${b});
  nwr["name"]["sport"="stadium"](${b});
);
out center tags;
`;
}

function simplifyElement(element) {
  const tags = element.tags || {};
  const lat = Number(element.lat ?? element.center?.lat);
  const lon = Number(element.lon ?? element.center?.lon);
  const name = tags.name || tags["name:en"] || tags["name:bn"] || tags.official_name;
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lon) ||
      lat < BOUNDS.south || lat > BOUNDS.north ||
      lon < BOUNDS.west || lon > BOUNDS.east) return null;

  const keep = [
    "name", "name:en", "name:bn", "official_name", "alt_name",
    "tourism", "historic", "heritage", "heritage:operator", "memorial",
    "natural", "leisure", "amenity", "religion", "denomination",
    "man_made", "railway", "aeroway", "waterway", "building",
    "place", "boundary", "sport", "website", "wikipedia", "wikidata",
    "description", "opening_hours"
  ];
  const cleanTags = {};
  for (const key of keep) {
    if (typeof tags[key] === "string" && tags[key].length <= 500) cleanTags[key] = tags[key];
  }
  return {
    type: element.type,
    id: element.id,
    lat,
    lon,
    name: String(name).slice(0, 220),
    tags: cleanTags
  };
}

async function fetchOverpass(query, requestUrl) {
  const endpoint = "https://overpass-api.de/api/interpreter?data=" +
    encodeURIComponent(query);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "BangladeshAtlas/1.0 (+https://github.com/AmarsonarbanglaDEV/letsmakebangladeshgreat)",
        "Referer": requestUrl.origin + "/"
      },
      cf: { cacheTtl: 1800, cacheEverything: true },
      signal: controller.signal
    });
    if (!response.ok) throw new Error("OpenStreetMap query service returned HTTP " + response.status);
    const body = await response.json();
    if (!Array.isArray(body.elements)) {
      throw new Error(body.remark || "OpenStreetMap returned an unexpected landmark response.");
    }
    return body;
  } finally {
    clearTimeout(timeout);
  }
}

export async function onRequestGet(context) {
  const request = context.request;
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (origin && origin !== url.origin) return fail("Cross-origin landmark requests are not allowed.", 403);

  const zoom = Number(url.searchParams.get("zoom"));
  if (!Number.isFinite(zoom) || zoom < 8) {
    return fail("Zoom to level 8 or closer to explore mapped landmarks.", 400);
  }

  let box;
  try {
    box = parseBbox(url.searchParams.get("bbox"));
  } catch (error) {
    return fail(error.message, 400);
  }

  try {
    const raw = await fetchOverpass(buildQuery(box), url);
    const seen = new Set();
    const elements = [];
    for (const item of raw.elements) {
      const clean = simplifyElement(item);
      if (!clean) continue;
      const key = clean.type + "/" + clean.id;
      if (seen.has(key)) continue;
      seen.add(key);
      elements.push(clean);
      if (elements.length >= MAX_RESULTS) break;
    }
    return json({
      elements,
      count: elements.length,
      capped: raw.elements.length > MAX_RESULTS,
      source: "© OpenStreetMap contributors",
      license: "Open Database License (ODbL)",
      timestamp: raw.osm3s?.timestamp_osm_base || null,
      bbox: [box.south, box.west, box.north, box.east]
    });
  } catch (error) {
    const message = error?.name === "AbortError"
      ? "The landmark query timed out. Zoom in or try again later."
      : (error?.message || "The OpenStreetMap landmark service is temporarily unavailable.");
    return fail(message, 502);
  }
}
