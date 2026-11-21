-- Per-follow push notifications without forcing daily reminders.
ALTER TABLE push_subscriptions ADD COLUMN upload_notifications INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS share_links (
  token TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK(resource_type IN ('file','collection')),
  resource_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  UNIQUE(owner_id,resource_type,resource_id)
);
CREATE INDEX IF NOT EXISTS share_links_owner_idx ON share_links(owner_id,created_at DESC);
