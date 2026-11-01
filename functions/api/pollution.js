const BOUNDS = { south: 19.75, west: 87.45, north: 27.45, east: 93.25 };
const MAX_RESULTS = 900;
const LAYER_QUERIES = {
  "brick-kilns": {
    label: "Mapped brick kilns",
    query: box => {
      const b = [box.south, box.west, box.north, box.east].join(",");
      return `[out:json][timeout:20];
(
  nwr["industrial"="brickworks"](${b});
  nwr["craft"="brickmaker"](${b});
  nwr["man_made"="works"]["product"~"brick",i](${b});
  nwr["name"~"brick kiln|brickfield|brick works",i](${b});
);
out center tags qt ${MAX_RESULTS};
`;
    }
  },
  "industrial-sites": {
    label: "Mapped industrial sites",
    query: box => {
      const b = [box.south, box.west, box.north, box.east].join(",");
      return `[out:json][timeout:20];
(
  nwr["industrial"](${b});
  nwr["man_made"="works"](${b});
  nwr["landuse"="industrial"]["name"](${b});
);
out center tags qt ${MAX_RESULTS};
`;
    }
  },
  "ewaste-sites": {
    label: "Mapped electronics recycling sites",
    query: box => {
      const b = [box.south, box.west, box.north, box.east].join(",");
      return `[out:json][timeout:20];
(
  nwr["amenity"="recycling"]["recycling:electrical_appliances"="yes"](${b});
  nwr["amenity"="recycling"]["recycling:electrical_items"="yes"](${b});
  nwr["amenity"="recycling"]["recycling:small_appliances"="yes"](${b});
  nwr["recycling:electrical_appliances"="yes"](${b});
  nwr["recycling:electrical_items"="yes"](${b});
);
out center tags qt ${MAX_RESULTS};
`;
    }
  }
};

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

function parseBbox(value) {
  const values = String(value || "").split(",").map(Number);
  if (values.length !== 4 || values.some(value => !Number.isFinite(value))) {
    throw new Error("A valid south,west,north,east bounding box is required.");
  }
  const [south, west, north, east] = values;
  if (!(south < north && west < east)) throw new Error("Invalid map bounds.");
  if (south < BOUNDS.south || west < BOUNDS.west ||
      north > BOUNDS.north || east > BOUNDS.east) {
    throw new Error("Pollution-site searches must stay inside Bangladesh.");
  }
  if ((north - south) * (east - west) > 5.5 ||
      north - south > 2.8 || east - west > 3.2) {
    throw new Error("Zoom further in to search mapped sites in a smaller area.");
  }
  return { south, west, north, east };
}

function simplifyElement(element, layer) {
  const tags = element.tags || {};
  const lat = Number(element.lat ?? element.center?.lat);
  const lon = Number(element.lon ?? element.center?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) ||
      lat < BOUNDS.south || lat > BOUNDS.north ||
      lon < BOUNDS.west || lon > BOUNDS.east) return null;

  const keep = [
    "name", "name:en", "name:bn", "official_name", "industrial",
    "craft", "man_made", "landuse", "product", "amenity",
    "recycling", "recycling_type", "recycling:electrical_appliances",
    "recycling:electrical_items", "recycling:small_appliances",
    "operator", "website", "wikidata", "wikipedia", "description"
  ];
  const cleanTags = {};
  for (const key of keep) {
    if (typeof tags[key] === "string" && tags[key].length <= 300) {
      cleanTags[key] = tags[key];
    }
  }
  return {
    type: element.type,
    id: element.id,
    lat,
    lon,
    name: String(tags["name:en"] || tags.name || tags["name:bn"] ||
      LAYER_QUERIES[layer].label).slice(0, 180),
    tags: cleanTags,
    layer
  };
}

async function fetchOverpass(query) {
  const endpoints = [
    "https://overpass.private.coffee/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass-api.de/api/interpreter"
  ];
  let lastError = null;
  for (const endpoint of endpoints) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 14000);
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
      if (!response.ok) throw new Error("Map data server returned HTTP " + response.status);
      const body = await response.json();
      if (!Array.isArray(body.elements)) {
        throw new Error(body.remark || "Map data server returned an invalid response.");
      }
      if (body.remark && /runtime error|timed out|out of memory/i.test(body.remark)) {
        throw new Error(body.remark);
      }
      return body;
    } catch (error) {
      lastError = error?.name === "AbortError"
        ? new Error("The mapped-site search timed out.")
        : error;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError || new Error("All map-data servers are temporarily unavailable.");
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const origin = context.request.headers.get("Origin");
  if (origin && origin !== url.origin) {
    return json({ error: "Cross-origin pollution-site searches are not allowed.", features: [] }, 403);
  }

  const layer = url.searchParams.get("layer");
  if (!Object.prototype.hasOwnProperty.call(LAYER_QUERIES, layer)) {
    return json({ error: "Choose a supported mapped-site category.", features: [] }, 400);
  }

  const zoom = Number(url.searchParams.get("zoom"));
  if (!Number.isFinite(zoom) || zoom < 9) {
    return json({ error: "Zoom to level 9 or closer to inspect mapped sites.", features: [] }, 400);
  }

  let box;
  try {
    box = parseBbox(url.searchParams.get("bbox"));
  } catch (error) {
    return json({ error: error.message, features: [] }, 400);
  }

  try {
    const raw = await fetchOverpass(LAYER_QUERIES[layer].query(box));
    const seen = new Set();
    const features = [];
    for (const element of raw.elements) {
      const point = simplifyElement(element, layer);
      if (!point) continue;
      const key = point.type + "/" + point.id;
      if (seen.has(key)) continue;
      seen.add(key);
      features.push({
        type: "Feature",
        id: key,
        geometry: { type: "Point", coordinates: [point.lon, point.lat] },
        properties: {
          name: point.name,
          osm_type: point.type,
          osm_id: point.id,
          layer: point.layer,
          tags: point.tags
        }
      });
      if (features.length >= MAX_RESULTS) break;
    }

    return json({
      type: "FeatureCollection",
      features,
      count: features.length,
      capped: raw.elements.length >= MAX_RESULTS,
      source: "© OpenStreetMap contributors",
      license: "Open Database License (ODbL)",
      note: "These are mapped facility locations only; they are not verified pollution readings or a complete national inventory.",
      timestamp: raw.osm3s?.timestamp_osm_base || null,
      bbox: [box.south, box.west, box.north, box.east]
    });
  } catch (error) {
    return json({
      error: error?.message || "The mapped-site data service is temporarily unavailable.",
      features: []
    }, 502);
  }
}
