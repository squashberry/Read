# Squashberry Library account and upload API

This Cloudflare Worker powers direct email-and-password sign-up/sign-in, a personal upload dashboard, study-file review, document uploads, and browser push reminders. **It does not send email and does not require Resend.** Email addresses are used as account identifiers but are not verified by email.

## Deployment and database migration

The static app deploys from GitHub Pages; the API is a separate Cloudflare Worker. Keep `upload-config.js` pointed at the production Worker URL. For an existing D1 database, run `migrations/0002_password_auth.sql` exactly once after checking whether the two columns are already present. The migration adds only `password_salt` and `password_hash`; it does not delete users, upload records, or active sessions. Deploy `worker.js` to `squashberry-library-api` while retaining the existing D1, KV, Turnstile and secret bindings. Verify `/health`, create a test account, sign out/in, and test a harmless upload.

The source includes `schema.sql` for a new D1 database. Existing installations must use the migration above rather than re-running the full schema.

## Existing accounts

Older accounts were created using emailed one-time codes and do not have password hashes. For account safety, the new public sign-up endpoint will **not** let someone claim an old account just by entering its email address. If you are still signed in on an old device, open **You → Profile** and set a password before that session expires. An old account whose sessions have all expired needs owner-assisted migration; do not solve that by allowing email-only sign-in, because that would let anyone impersonate another user.

## Current Cloudflare resources

- Worker: `squashberry-library-api`
- D1 database: `squashberry-library-db`
- KV binding: `UPLOAD_RATE_LIMIT`
- Public API URL: `https://squashberry-library-api.squashberrypay.workers.dev`
- Website origin allowed by the Worker: `https://squashberry.github.io`
- Turnstile: site key is in `upload-config.js`; the `TURNSTILE_SECRET_KEY` remains a private Worker secret for bot protection.
- GitHub token: `GITHUB_TOKEN`, a private Worker secret scoped to `squashberry/Read` with Contents read/write permission.
- `AUTH_CODE_SECRET`: remains a private Worker secret to sign short-lived document-review tokens. It is **not** used to send email codes.
- Push: `VAPID_PRIVATE_KEY` and `VAPID_PUBLIC_KEY` remain Worker secrets/variables. The existing cron schedule checks subscribed users' local reminder times.
- Optional upload review: `GEMINI_API_KEY` enables automated study-material review and title suggestions. Without it, users can confirm the upload manually.

You can remove the old `RESEND_API_KEY` secret and `EMAIL_FROM` variable from the Worker after deploying the new Worker. Neither is used by this version.

## Account and upload behaviour

- Public sign-up collects a display name, email address, password, and a short Cloudflare Turnstile safety check.
- Sign-in uses email + password; there is no emailed code or email confirmation.
- Passwords are salted and derived with PBKDF2-SHA-256; they are never stored in plain text. Sessions expire after 14 days and only a SHA-256 hash of each session token is stored.
- Users can set/update a password from **You → Profile** while signed in. This helps migrate old accounts whose sessions are still active.
- The Worker rate-limits sign-up/sign-in attempts by IP and email. Turnstile remains to reduce automated abuse.
- Uploads require a signed-in account and are rate-limited to 8 MB per file, up to four files per request, 20 files per user per UTC day, and an IP-level daily limit.
- Each new public catalogue entry includes `uploadedBy`, containing the uploader's **display name**. The extracted transcript also records that display name. The user's email and internal account ID are not written to the public catalogue.
- The personal dashboard records the account that uploaded each file and shows recent uploads and activity.

## Public-file and privacy warning

The catalogue, uploaded documents, and extracted transcripts are in the public `squashberry/Read` GitHub repository. Anyone who discovers a file's URL can view or download it. The uploader's display name is also public for new uploads. Do not upload confidential class records, patient-identifying information, passwords, personal identity or financial records, or material you are not allowed to share.

The API accepts browser requests only from `https://squashberry.github.io`. Never place `GITHUB_TOKEN`, `TURNSTILE_SECRET_KEY`, `AUTH_CODE_SECRET`, push private keys, or Gemini API keys in browser code or Git history.
