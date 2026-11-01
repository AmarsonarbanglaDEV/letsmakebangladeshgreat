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
    "https://overpass.private.coffee/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass-api.de/api/interpreter"
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
    let raw;
    let riverSource = "© OpenStreetMap contributors";
    let fallbackReason = null;
    try {
      raw = await queryOverpass(buildQuery(box, zoom));
    } catch (overpassError) {
      // Keep the country from going blank if public Overpass mirrors are busy.
      // This ArcGIS layer is a lower-detail World Mapping Initiative fallback.
      fallbackReason = overpassError.message;
      const params = new URLSearchParams({
        where: "1=1",
        geometry: [box.west, box.south, box.east, box.north].join(","),
        geometryType: "esriGeometryEnvelope",
        inSR: "4326",
        outSR: "4326",
        outFields: "OBJECTID,nam,nam_descri,f_code_des,hyc_descri",
        returnGeometry: "true",
        f: "geojson"
      });
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 14000);
      try {
        const response = await fetch(
          "https://services.arcgis.com/zmBQLV64TsFvEpV0/ArcGIS/rest/services/BIWTA_Topo/FeatureServer/7/query?" + params.toString(),
          { headers: { Accept: "application/geo+json, application/json" }, signal: controller.signal }
        );
        if (!response.ok) throw new Error("Backup river layer returned HTTP " + response.status);
        const backup = await response.json();
        if (!Array.isArray(backup.features)) {
          throw new Error(backup.error?.message || "Backup river layer did not return features.");
        }
        raw = {
          elements: backup.features.map(feature => ({
            type: "Feature",
            id: feature.id || feature.properties?.OBJECTID,
            geometry: feature.geometry,
            properties: feature.properties || {}
          }))
        };
        riverSource = "World Mapping Initiative · BIWTA_Topo ArcGIS fallback";
      } finally {
        clearTimeout(timer);
      }
    }
    const seen = new Set();
    const rivers = [];
    for (const element of raw.elements) {
      let feature;
      if (element.type === "Feature") {
        const properties = element.properties || {};
        const name = properties.nam || properties.name || properties.nam_descri || "Unnamed river";
        const geometry = element.geometry;
        if (!geometry || !["LineString","MultiLineString"].includes(geometry.type)) continue;
        feature = {
          type: "Feature",
          id: "arcgis/" + element.id,
          properties: {
            name: String(name).slice(0,220),
            name_bn: "",
            waterway: "river",
            source: riverSource
          },
          geometry
        };
      } else {
        if (element.type !== "way" || !Array.isArray(element.geometry) || element.geometry.length < 2) continue;
        const tags = element.tags || {};
        const points = element.geometry
          .filter(point => Number.isFinite(point.lat) && Number.isFinite(point.lon))
          .map(point => [point.lon, point.lat]);
        if (points.length < 2) continue;
        feature = {
          type: "Feature",
          id: "way/" + element.id,
          properties: {
            name: tags["name:en"] || tags.name || tags["name:bn"] || "Unnamed waterway",
            name_bn: tags["name:bn"] || "",
            waterway: tags.waterway || "river",
            wikidata: tags.wikidata || "",
            wikipedia: tags.wikipedia || "",
            source: riverSource
          },
          geometry: { type: "LineString", coordinates: points }
        };
      }
      if (seen.has(feature.id)) continue;
      seen.add(feature.id);
      rivers.push(feature);
      if (rivers.length >= MAX_RIVERS) break;
    }
    return json({
      type: "FeatureCollection",
      features: rivers,
      count: rivers.length,
      capped: raw.elements.length >= MAX_RIVERS,
      source: riverSource,
      license: riverSource === "© OpenStreetMap contributors" ? "Open Database License (ODbL)" : "See source service attribution",
      fallbackReason,
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
