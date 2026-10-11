// Public configuration only. These values are safe to publish.
// Private keys remain in Cloudflare Worker secrets.
window.LIBRARY_UPLOAD_CONFIG = {
  endpoint: "https://squashberry-library-api.squashberrypay.workers.dev",
  turnstileSiteKey: "0x4AAAAAAFUEbRhMe1zEGY30",
  // Public VAPID key for browser push subscriptions. The matching private key stays in Cloudflare.
  vapidPublicKey: "BO7oUjcsmFv0NuY6yaFFOPNn8dW90pnfL5FBeIQsHq6LmJHHbtcbRVA7LrF5mugrrRTBoo62GwvcTmCxp23c0KQ"
};
