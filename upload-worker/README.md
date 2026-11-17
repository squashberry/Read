# Squashberry Library Upload API

Supabase Auth manages accounts, passwords and sessions. The Cloudflare Worker only provides protected uploads and user file history, validating each bearer token against Supabase Auth. Configure Worker variables `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Keep the existing D1, KV, GitHub, review and VAPID bindings. Turnstile is no longer used for auth.

Uploads include the display-name attribution `uploadedBy` and a user-selected `category` (for example Research). D1 stores the category by uploader and file. The originals and catalogue remain public in the GitHub repository; do not upload confidential or patient-identifying data.