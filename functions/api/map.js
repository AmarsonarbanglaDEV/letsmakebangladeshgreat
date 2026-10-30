const LAYERS = {
  country: {
    url: "https://gis.dghs.gov.bd/server/rest/services/Hosted/bgd_admbnda_adm0_bbs_20201113/FeatureServer/0",
    adm: 0,
    label: "Bangladesh national boundary · BBS ADM0"
  },
  division: {
    url: "https://gis.dghs.gov.bd/server/rest/services/Hosted/bgd_admbnda_adm1_bbs_20201113/FeatureServer/0",
    adm: 1,
    label: "Division boundaries · BBS ADM1"
  },
  district: {
    url: "https://gis.dghs.gov.bd/server/rest/services/Hosted/bgd_admbnda_adm2_bbs_20201113/FeatureServer/0",
    adm: 2,
    label: "District boundaries · BBS ADM2"
  },
  upazila: {
    url: "https://www.arcgisbd.com/server/rest/services/ADB005/CRIIPS/MapServer/122",
    adm: 3,
    label: "Upazila boundaries · BBS 2022"
  },
  union: {
    url: "https://gis.dghs.gov.bd/server/rest/services/Hosted/All_Union/FeatureServer/0",
    adm: 4,
    label: "Union boundary service · DGHS"
  },
  ward: {
    url: "https://gis.dghs.gov.bd/server/rest/services/Hosted/All_Wards_main/FeatureServer/0",
    adm: 5,
    label: "Available ward boundary service · DGHS"
  }
};

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/geo+json; charset=utf-8",
      "Cache-Control": status === 200
        ? "public, max-age=300, stale-while-revalidate=1800"
        : "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders
    }
  });
}

async function readJson(response, label) {
  if (!response.ok) {
    throw new Error(label + " returned HTTP " + response.status);
  }
  const data = await response.json();
  if (data && data.error) {
    throw new Error(data.error.message || label + " returned a GIS error");
  }
  return data;
}

function objectIdField(metadata) {
  if (metadata.objectIdField) return metadata.objectIdField;
  if (metadata.objectIdFieldName) return metadata.objectIdFieldName;
  const oid = (metadata.fields || []).find(field =>
    field.type === "esriFieldTypeOID"
  );
  return oid ? oid.name : "";
}

async function fetchGeoBoundariesFallback(adm) {
  const metadataUrl =
    "https://www.geoboundaries.org/api/current/gbOpen/BGD/ADM" + adm + "/";
  const metadataResponse = await fetch(metadataUrl, {
    headers: { Accept: "application/json" },
    cf: { cacheTtl: 3600, cacheEverything: true }
  });
  const metadata = await readJson(metadataResponse, "geoBoundaries metadata");
  const item = Array.isArray(metadata) ? metadata[0] : metadata;
  const downloadUrl = item &&
    (item.simplifiedGeometryGeoJSON || item.gjDownloadURL);

  if (!downloadUrl || typeof downloadUrl !== "string" ||
      !downloadUrl.startsWith("https://")) {
    throw new Error("geoBoundaries did not provide a GeoJSON download URL");
  }

  const geometryResponse = await fetch(downloadUrl, {
    headers: { Accept: "application/geo+json, application/json" },
    cf: { cacheTtl: 3600, cacheEverything: true }
  });
  const geojson = await readJson(geometryResponse, "geoBoundaries geometry");
  if (!Array.isArray(geojson.features) || !geojson.features.length) {
    throw new Error("geoBoundaries returned no boundary features");
  }
  return geojson;
}

async function fetchArcGisPage(config, offset, requestedLimit) {
  const metadataUrl = config.url + "?f=pjson";
  const metadataResponse = await fetch(metadataUrl, {
    headers: { Accept: "application/json" },
    cf: { cacheTtl: 1800, cacheEverything: true }
  });
  const metadata = await readJson(metadataResponse, "ArcGIS layer metadata");
  const oid = objectIdField(metadata);
  const serviceLimit = Number(metadata.maxRecordCount) || 1000;
  const pageSize = Math.max(1, Math.min(requestedLimit, serviceLimit, 900));

  const params = new URLSearchParams({
    where: "1=1",
    outFields: "*",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
    resultOffset: String(offset),
    resultRecordCount: String(pageSize)
  });
  if (oid) params.set("orderByFields", oid + " ASC");

  const queryUrl = config.url + "/query?" + params.toString();
  const queryResponse = await fetch(queryUrl, {
    headers: { Accept: "application/geo+json, application/json" },
    cf: { cacheTtl: 300, cacheEverything: true }
  });
  const geojson = await readJson(queryResponse, "ArcGIS feature query");

  if (!Array.isArray(geojson.features)) {
    throw new Error("ArcGIS query did not return a GeoJSON feature list");
  }

  return {
    type: "FeatureCollection",
    features: geojson.features,
    nextOffset: offset + geojson.features.length,
    hasMore: geojson.exceededTransferLimit === true ||
      geojson.features.length === pageSize,
    sourceLabel: config.label,
    objectIdField: oid || null
  };
}

export async function onRequestGet(context) {
  const request = context.request;
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");

  // This endpoint is for the same-site map only, not a general-purpose proxy.
  if (origin && origin !== requestUrl.origin) {
    return jsonResponse({ error: "Cross-origin requests are not allowed." }, 403);
  }

  const level = requestUrl.searchParams.get("level") || "";
  const config = LAYERS[level];
  if (!config) {
    return jsonResponse({
      error: "Unknown map layer. Use country, division, district, upazila, union or ward."
    }, 400);
  }

  const offsetValue = Number(requestUrl.searchParams.get("offset") || 0);
  const limitValue = Number(requestUrl.searchParams.get("limit") || 600);
  if (!Number.isSafeInteger(offsetValue) || offsetValue < 0 ||
      !Number.isSafeInteger(limitValue) || limitValue < 1 || limitValue > 900) {
    return jsonResponse({ error: "Invalid map pagination values." }, 400);
  }

  try {
    const page = await fetchArcGisPage(config, offsetValue, limitValue);
    return jsonResponse(page);
  } catch (primaryError) {
    // Use the open gbOpen boundary only for national / division / district
    // layers. Fine-scale layers remain explicitly unavailable when their
    // documented source is down; never substitute a different admin level.
    if (config.adm <= 2 && offsetValue === 0) {
      try {
        const fallback = await fetchGeoBoundariesFallback(config.adm);
        return jsonResponse({
          type: "FeatureCollection",
          features: fallback.features,
          nextOffset: fallback.features.length,
          hasMore: false,
          sourceLabel: "geoBoundaries gbOpen fallback · CC BY 4.0",
          fallbackReason: primaryError.message
        });
      } catch (fallbackError) {
        return jsonResponse({
          error: "Primary boundary service failed: " + primaryError.message +
            ". Open-data fallback failed: " + fallbackError.message
        }, 502);
      }
    }

    return jsonResponse({
      error: primaryError.message,
      layer: level,
      hint: "Try the district or division map if this detailed boundary source is temporarily unavailable."
    }, 502);
  }
}
