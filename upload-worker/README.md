# Tokenless Library uploads (Cloudflare Worker)

This adds a small server-side upload endpoint so classmates do **not** need GitHub accounts or personal access tokens. A server-side GitHub token is still required, but it is stored as a Cloudflare Worker secret and is never sent to the browser.

## One-time setup

1. In Cloudflare, create a Turnstile widget and allow the hostname `squashberry.github.io`. Copy its **site key** and **secret key**.
2. Create a KV namespace (for example, `LIBRARY_UPLOAD_RATE_LIMIT`).
3. Create a Cloudflare Worker named `squashberry-library-upload` and paste in `worker.js`.
4. Add Worker secret `GITHUB_TOKEN`: a fine-grained personal access token restricted to `squashberry/Read` with **Contents: Read and write**. Add Worker secret `TURNSTILE_SECRET_KEY` with the Turnstile secret. Bind the KV namespace to the Worker using the variable name `UPLOAD_RATE_LIMIT`.
5. Set the Turnstile site key on the website in `upload-config.js`, and set `endpoint` to the exact deployed Worker URL, for example `https://squashberry-library-upload.<your-workers-subdomain>.workers.dev`. The example is a pattern—use the URL shown by your own Cloudflare account.
6. Save the file. GitHub Pages will publish it. Test by uploading one harmless PDF, then verify that a new numbered entry appears in `library-index.json`.

## Safety limits in this starter

- Only requests from the GitHub Pages origin are accepted.
- Cloudflare Turnstile must pass.
- The server accepts only PDF, PowerPoint, Word and text file extensions.
- Each file is limited to 8 MB; up to four files per request.
- The KV counter limits each IP address to 10 uploaded files per UTC day.
- Files added to this repo are public. Do not upload confidential or patient-identifying materials.

## Important operational note

This is a deployable Worker source file, not a live hosted endpoint. Until the Worker has been created in Cloudflare and its URL plus Turnstile site key are placed in `upload-config.js`, the current token-based upload remains the fallback. Do not put `GITHUB_TOKEN` or `TURNSTILE_SECRET_KEY` in `upload-config.js`, HTML, or any public file.
