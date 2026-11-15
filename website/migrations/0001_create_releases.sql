CREATE TABLE IF NOT EXISTS releases (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  version TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  release_notes TEXT NOT NULL DEFAULT '',
  published_at TEXT NOT NULL,
  download_url TEXT NOT NULL,
  html_url TEXT NOT NULL DEFAULT '',
  etag TEXT NOT NULL DEFAULT ''
);
