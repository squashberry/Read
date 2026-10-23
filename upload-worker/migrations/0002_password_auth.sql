-- Run this migration once in the existing Cloudflare D1 database before deploying password auth.
-- It preserves existing accounts and sessions. Users with an active old session can set a password in You → Profile.
ALTER TABLE users ADD COLUMN password_salt TEXT;
ALTER TABLE users ADD COLUMN password_hash TEXT;
