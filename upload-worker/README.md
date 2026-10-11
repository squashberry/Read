# Personal Library authentication and uploads (Cloudflare)

This Worker powers email-code sign-in, a personal upload dashboard, and file uploads without asking students to create GitHub accounts or paste GitHub tokens. The private credentials stay on Cloudflare's server side. Sign-in codes are sent through Resend.

**Important:** these files are the backend source/setup guide, not a deployed live service. The account and account-only upload UI will stay in setup mode until the Worker, bindings and public config are completed.

## What students get

- Sign in or create an account with an email address and a six-digit, one-time code.
- No password or GitHub account is needed for students.
- Their email, display name, session, uploads and recent activity are stored in Cloudflare D1.
- Uploads are accepted only from signed-in sessions and are protected with Cloudflare Turnstile.
- Rate limits: 8 MB per file, up to four files per upload, up to 20 files per user per UTC day, and an IP-level daily limit.
- Sessions expire after 14 days. Only a hash of the session token is stored in D1.

## One-time Cloudflare setup

### 1. Create the D1 database

In Cloudflare Dashboard, open **Workers & Pages → D1 SQL Database**, create a database such as `squashberry-library`, open its SQL console, and run the contents of `schema.sql`.

The schema defines `users`, `login_codes`, `sessions`, `uploads`, `activity` and an atomic `id_counters` table.

### 2. Create the rate-limit KV namespace

Open **Workers & Pages → KV**, create a namespace (for example `LIBRARY_UPLOAD_RATE_LIMIT`). The exact name can differ, but the Worker binding name must be `UPLOAD_RATE_LIMIT`.

### 3. Create the Turnstile widget

Open Cloudflare **Turnstile**, create a widget allowing the hostname `squashberry.github.io`, and save its **site key** and **secret key** separately. The site key is public; the secret key is not.

### 4. Set up email delivery

Sign-in codes are emailed through Resend's API. In Resend, verify a sender domain and choose a sender address allowed by that verified domain (for example, `Squashberry Library <library@your-verified-domain.example>`). You will add the Resend API key as a Worker secret and the sender string as `EMAIL_FROM`.

### 5. Create the Worker

Create a Worker named `squashberry-library-api`. Copy `worker.js` into its editor and deploy it.

Add these **bindings**:

- D1 database binding: variable name `DB` → the database from step 1.
- KV namespace binding: variable name `UPLOAD_RATE_LIMIT` → the namespace from step 2.

Add these **Worker secrets** (not ordinary public website variables):

- `GITHUB_TOKEN`: a fine-grained GitHub token restricted to repository `squashberry/Read` and permission **Contents: Read and write**. This is a server-side token owned by the Library operator; students never see it.
- `TURNSTILE_SECRET_KEY`: Turnstile's secret key.
- `AUTH_CODE_SECRET`: a long random secret used to protect one-time sign-in codes. Generate one locally with `openssl rand -hex 32`.
- `RESEND_API_KEY`: the Resend key for sending sign-in codes.

Add `EMAIL_FROM` as a Worker variable with the verified sender address. Keep secrets out of `worker.js`, `index.html`, `upload-config.js`, and Git history.

### 6. Connect the static website

After deployment, open the Worker's `workers.dev` URL shown by Cloudflare, for example:

`https://squashberry-library-api.<your-workers-subdomain>.workers.dev`

In the repository's public `upload-config.js`, set:

- `endpoint` to the Worker's full base URL without a trailing slash.
- `turnstileSiteKey` to the public Turnstile site key.

Commit the updated file. Do **not** put the Turnstile secret, Resend key, GitHub token or auth-code secret in this public config. The Worker only accepts browser requests whose origin is `https://squashberry.github.io`.

### 7. Verify it works

Open `https://squashberry.github.io/Read/`, select **You → Sign in / Create account**, request a code, and check the inbox (including spam). Enter the six-digit code, then open **You** again to see the profile and dashboard. Try uploading one harmless test document and check that its ID appears in the Library catalogue and the account's recent uploads.

For an initial backend check, open the Worker URL + `/health` from the page's browser console or make a request with the Library page origin. The health response reports whether required bindings/secrets appear configured.

## Privacy and publishing warning

The login, profile, uploads list and activity are user-specific. **The actual study files are still uploaded to the public `squashberry/Read` GitHub repository and are not private.** Anyone may download the file if they know or discover its URL. Do not upload confidential documents, patient-identifying information, passwords, keys, or any file you are not allowed to share.

For truly private documents, move the files to private object storage (for example, Cloudflare R2) and design a separate, authenticated way to share document contents with ChatGPT. This GitHub-backed version keeps the learning documents publicly retrievable so the numbered-file study workflow can work.
