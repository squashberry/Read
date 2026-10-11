// Public configuration only. These values are safe to publish.
// Fill these after the Cloudflare Worker and Turnstile widget are deployed.
// Never put GITHUB_TOKEN, TURNSTILE_SECRET_KEY, RESEND_API_KEY or AUTH_CODE_SECRET here.
window.LIBRARY_UPLOAD_CONFIG = {
  // Example: https://squashberry-library-api.<your-workers-subdomain>.workers.dev
  endpoint: "",
  // Public Turnstile site key for squashberry.github.io (not the secret key).
  turnstileSiteKey: ""
};
