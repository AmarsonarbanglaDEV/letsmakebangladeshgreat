-- Private citizen reports. No public read endpoint is provided.
CREATE TABLE IF NOT EXISTS grievances (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  place_label TEXT,
  location_url TEXT NOT NULL,
  reporter_name TEXT,
  reporter_contact TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_grievances_created_at ON grievances(created_at);
CREATE INDEX IF NOT EXISTS idx_grievances_status ON grievances(status);

CREATE TABLE IF NOT EXISTS grievance_attachments (
  id TEXT PRIMARY KEY,
  grievance_id TEXT NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_grievance_attachments_grievance ON grievance_attachments(grievance_id);

-- One-hour privacy-preserving rate-limit counters; hashes are not raw IP addresses.
CREATE TABLE IF NOT EXISTS grievance_rate_limits (
  ip_hash TEXT NOT NULL,
  window_start TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(ip_hash, window_start)
);
