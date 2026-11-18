-- Community features: all contributor identities are opt-in and disabled by default.
ALTER TABLE users ADD COLUMN allow_followers INTEGER NOT NULL DEFAULT 0;
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
