const MAX_BODY = 16 * 1024 * 1024;
const MAX_FILE = 5 * 1024 * 1024;
const MAX_FILES = 3;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer"
    }
  });
}
function clean(value, max) {
  return String(value || "").replace(/\u0000/g, "").trim().slice(0, max);
}
function validCoord(value, min, max) {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}
function randomId() {
  return crypto.randomUUID();
}
async function hash(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}
async function sniff(file, bytes) {
  const b = new Uint8Array(bytes);
  if (file.type === "image/jpeg") return b.length > 3 && b[0] === 255 && b[1] === 216 && b[2] === 255;
  if (file.type === "image/png") return b.length > 8 && b[0] === 137 && b[1] === 80 && b[2] === 78 && b[3] === 71;
  if (file.type === "application/pdf") return b.length > 4 && String.fromCharCode(...b.slice(0, 5)) === "%PDF-";
  if (file.type === "image/webp") return b.length > 12 &&
    String.fromCharCode(...b.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...b.slice(8, 12)) === "WEBP";
  return false;
}
function ext(type) {
  return ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" })[type];
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (origin !== url.origin) return json({ error: "A same-origin browser submission is required." }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().includes("multipart/form-data")) {
    return json({ error: "Submit the report using the provided form." }, 415);
  }
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_BODY) return json({ error: "Submission is too large." }, 413);
  if (!env.COMPLAINTS_DB) return json({
    error: "Secure complaint storage is not configured yet. The report was not submitted. Please contact the site administrator."
  }, 503);

  let form;
  try { form = await request.formData(); }
  catch { return json({ error: "The submission could not be read." }, 400); }

  if (clean(form.get("website"), 200)) return json({ reference: "received" }, 200);
  const title = clean(form.get("title"), 140);
  const category = clean(form.get("category"), 80);
  const description = clean(form.get("description"), 5000);
  const latitude = validCoord(form.get("latitude"), 20.5, 26.8);
  const longitude = validCoord(form.get("longitude"), 88, 92.8);
  const placeLabel = clean(form.get("place_label"), 300);
  const locationUrl = clean(form.get("location_url"), 1000);
  const reporterName = clean(form.get("name"), 100);
  const reporterContact = clean(form.get("contact"), 160);
  const allowedCategories = new Set([
    "Road damage", "Drainage and waterlogging", "Waste management", "Water supply",
    "Electricity", "Public infrastructure", "Land and property issues",
    "Public safety", "Other government service complaints"
  ]);
  if (form.get("consent") !== "on") return json({ error: "Consent is required before submitting a report." }, 400);
  if (title.length < 5 || description.length < 20 || !allowedCategories.has(category) ||
      latitude === null || longitude === null) {
    return json({ error: "Please provide a valid title, category, description and Bangladesh coordinate." }, 400);
  }
  if (!locationUrl.startsWith(url.origin + "/geo-intelligence.html")) {
    return json({ error: "The location link is invalid." }, 400);
  }

  const files = form.getAll("attachments").filter(x => x && typeof x.arrayBuffer === "function" && x.size > 0);
  if (files.length > MAX_FILES) return json({ error: "Attach no more than three files." }, 400);
  if (files.reduce((total, file) => total + file.size, 0) > 15 * MAX_FILE) return json({ error: "The combined attachment size is too large." }, 413);
  if (files.some(f => f.size > MAX_FILE || !ALLOWED.has(f.type))) {
    return json({ error: "Only JPEG, PNG, WebP or PDF files up to 5 MB each are accepted." }, 400);
  }
  if (files.length && !env.COMPLAINTS_BUCKET) {
    return json({ error: "Private attachment storage is not configured. Remove attachments or contact the site administrator." }, 503);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (!env.GEO_RATE_LIMIT_SALT) return json({ error: "Submission protection is not configured. Please try again later." }, 503);
  const ipHash = await hash(ip + ":" + env.GEO_RATE_LIMIT_SALT);
  const now = new Date();
  const windowStart = new Date(Math.floor(now.getTime() / 3600000) * 3600000).toISOString();
  try {
    await env.COMPLAINTS_DB.prepare(
      "INSERT INTO grievance_rate_limits (ip_hash, window_start, count) VALUES (?, ?, 1) " +
      "ON CONFLICT(ip_hash, window_start) DO UPDATE SET count = count + 1"
    ).bind(ipHash, windowStart).run();
    const rate = await env.COMPLAINTS_DB.prepare(
      "SELECT count FROM grievance_rate_limits WHERE ip_hash = ? AND window_start = ?"
    ).bind(ipHash, windowStart).first();
    if (Number(rate?.count || 0) > 5) return json({ error: "Submission limit reached. Please try again later." }, 429);
  } catch {
    return json({ error: "Submission protection is temporarily unavailable. No report was stored." }, 503);
  }

  const id = randomId();
  const reference = "BDG-" + now.getUTCFullYear() + "-" + id.slice(0, 8).toUpperCase();
  const stored = [];
  try {
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      if (!(await sniff(file, bytes))) throw new Error("An attachment does not match its declared file type.");
      const key = "private/grievances/" + id + "/" + randomId() + "." + ext(file.type);
      await env.COMPLAINTS_BUCKET.put(key, bytes, {
        httpMetadata: { contentType: file.type, contentDisposition: "attachment" },
        customMetadata: { complaintId: id, reference }
      });
      stored.push({
        key,
        name: clean(file.name, 120).replace(/[^\w.\- ()]/g, "_"),
        type: file.type,
        size: file.size
      });
    }

    const statements = [
      env.COMPLAINTS_DB.prepare(
        "INSERT INTO grievances (id, reference, title, category, description, latitude, longitude, place_label, location_url, reporter_name, reporter_contact, status, created_at) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', ?)"
      ).bind(id, reference, title, category, description, latitude, longitude, placeLabel, locationUrl, reporterName || null, reporterContact || null, now.toISOString()),
      ...stored.map(file => env.COMPLAINTS_DB.prepare(
        "INSERT INTO grievance_attachments (id, grievance_id, object_key, original_name, mime_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).bind(randomId(), id, file.key, file.name, file.type, file.size, now.toISOString()))
    ];
    await env.COMPLAINTS_DB.batch(statements);
    return json({ ok: true, reference, received_at: now.toISOString() }, 201);
  } catch (error) {
    if (env.COMPLAINTS_BUCKET) {
      await Promise.all(stored.map(file => env.COMPLAINTS_BUCKET.delete(file.key).catch(() => null)));
    }
    return json({ error: error.message || "The report could not be stored securely. No reference was created." }, 500);
  }
}

export async function onRequestGet() {
  return json({ error: "This endpoint does not expose complaint records." }, 405);
}
