/**
 * Marchetti's Apartment — Local API Keys (NOT committed to git)
 *
 * 1. Copy this file to js/config.local.js
 * 2. Paste your Geoapify API key below
 * 3. js/config.local.js is gitignored — it will never be pushed
 *
 * Get a free key (3,000 req/day) at: https://www.geoapify.com/
 */

// This overrides the placeholder in config.js at runtime.
// Must be loaded BEFORE config.js in index.html.
window.GEOAPIFY_KEY_OVERRIDE = 'PASTE_YOUR_KEY_HERE';
