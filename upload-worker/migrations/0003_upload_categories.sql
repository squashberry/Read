-- Per-uploader categories. Existing uploads are kept and may be categorized on their next upload.
CREATE TABLE IF NOT EXISTS upload_categories (file_id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, category TEXT NOT NULL DEFAULT 'Uncategorised', created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS upload_categories_user_category_idx ON upload_categories(user_id, category);
