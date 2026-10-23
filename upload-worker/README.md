# Squashberry Library account and upload API

This Cloudflare Worker powers direct email-and-password sign-up/sign-in, a personal upload dashboard, study-file review, document uploads, and browser push reminders. **It does not send email and does not require Resend.** Email addresses are used as account identifiers but are not verified by email.

## Important: deployment steps for the existing service

The website code and Worker code are separate. Committing these files updates GitHub Pages (if its repository deployment is connected), but it does not automatically update a Worker copied manually into Cloudflare.

1. In Cloudflare Dashboard, open **Workers & Pages → D1 → squashberry-library-db → SQL Console** and run the contents of `migrations/0002_password_auth.sql` **once**. Do not run it a second time; SQLite will report that the columns already exist.
2. Open **Workers & Pages → squashberry-library-api → Edit code**. Replace the deployed Worker source with `worker.js` from this repository and deploy it.
3. Open `https://squashberry-library-api.squashberrypay.workers.dev/health` from the Library website context or inspect the endpoint response. It should list no missing required configuration for password auth, uploads, and push reminders.
4. Visit [Squashberry Library](https://squashberry.github.io/Read/), create a test account with an email address and a password of at least eight characters, then sign out and sign back in. Upload a harmless study document to verify the uploader attribution and personal dashboard.

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
