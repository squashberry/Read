PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL,
  allow_followers INTEGER NOT NULL DEFAULT 0,
  password_salt TEXT,
  password_hash TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);


CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);

CREATE TABLE IF NOT EXISTS uploads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(file_id)
);
CREATE INDEX IF NOT EXISTS uploads_user_date_idx ON uploads(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS upload_categories (file_id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, category TEXT NOT NULL DEFAULT 'Uncategorised', created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS upload_categories_user_category_idx ON upload_categories(user_id, category);

CREATE TABLE IF NOT EXISTS activity (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS activity_user_date_idx ON activity(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS id_counters (
  name TEXT PRIMARY KEY,
  next_id INTEGER NOT NULL
);
INSERT OR IGNORE INTO id_counters (name, next_id) VALUES ('study-files', 1);


CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  time_zone TEXT NOT NULL DEFAULT 'Africa/Banjul',
  reminder_time TEXT NOT NULL DEFAULT '08:00',
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_sent_date TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON push_subscriptions(user_id, enabled);


CREATE TABLE IF NOT EXISTS follows (follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,contributor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,created_at INTEGER NOT NULL,PRIMARY KEY(follower_id,contributor_id),CHECK(follower_id <> contributor_id));
CREATE INDEX IF NOT EXISTS follows_contributor_idx ON follows(contributor_id,created_at DESC);
CREATE TABLE IF NOT EXISTS collections (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,name TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',is_public INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS collections_public_idx ON collections(is_public,updated_at DESC);
CREATE INDEX IF NOT EXISTS collections_user_idx ON collections(user_id,updated_at DESC);
CREATE TABLE IF NOT EXISTS collection_items (collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,file_path TEXT NOT NULL,file_id TEXT NOT NULL DEFAULT '',file_name TEXT NOT NULL,added_at INTEGER NOT NULL,PRIMARY KEY(collection_id,file_path));
CREATE INDEX IF NOT EXISTS collection_items_path_idx ON collection_items(file_path);
CREATE TABLE IF NOT EXISTS document_requests (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,title TEXT NOT NULL,subject TEXT NOT NULL DEFAULT '',details TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'open',created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS document_requests_user_idx ON document_requests(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS file_views (id TEXT PRIMARY KEY,file_path TEXT NOT NULL,file_id TEXT NOT NULL DEFAULT '',file_name TEXT NOT NULL,visitor_key TEXT NOT NULL,view_date TEXT NOT NULL,viewed_at INTEGER NOT NULL,UNIQUE(file_path,visitor_key,view_date));
CREATE INDEX IF NOT EXISTS file_views_week_idx ON file_views(view_date,file_path);
