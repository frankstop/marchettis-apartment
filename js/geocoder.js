/**
 * Marchetti's Apartment — Geocoder
 * Geoapify geocoding and autocomplete integration.
 */

const Geocoder = {
  _debounceTimer: null,

  /**
   * Geocode an address string to lat/lon.
   * @param {string} text
   * @returns {Promise<{lat, lon, address}>}
   */
  async search(text) {
    const key = CONFIG.GEOAPIFY_API_KEY;
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(text)}&limit=1&apiKey=${key}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
    const data = await res.json();
    if (!data.features || !data.features.length) {
      throw new Error('No location found for that address. Try being more specific.');
    }
    const f = data.features[0];
    return {
      lat: f.properties.lat,
      lon: f.properties.lon,
      address: f.properties.formatted,
    };
  },

  /**
   * Fetch autocomplete suggestions.
   * @param {string} text
   * @returns {Promise<Array<{text, lat, lon}>>}
   */
  async autocomplete(text) {
    if (!text || text.length < 3) return [];
    const key = CONFIG.GEOAPIFY_API_KEY;
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&limit=6&apiKey=${key}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features || []).map(f => ({
      text: f.properties.formatted,
      lat: f.properties.lat,
      lon: f.properties.lon,
    }));
  },

  /**
   * Reverse geocode coordinates to a formatted address.
   * @param {number} lat
   * @param {number} lon
   * @returns {Promise<{lat, lon, address}>}
   */
  async reverseGeocode(lat, lon) {
    const key = CONFIG.GEOAPIFY_API_KEY;
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${key}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Reverse geocoding failed');
    const data = await res.json();
    if (!data.features || !data.features.length) {
      return { lat, lon, address: `${lat.toFixed(5)}, ${lon.toFixed(5)}` };
    }
    const f = data.features[0];
    return {
      lat: f.properties.lat || lat,
      lon: f.properties.lon || lon,
      address: f.properties.formatted,
    };
  },

  /**
   * Debounced autocomplete — calls callback after 300ms of silence.
   */
  debounceAutocomplete(text, callback) {
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(async () => {
      try {
        const results = await this.autocomplete(text);
        callback(results);
      } catch {
        callback([]);
      }
    }, 300);
  },
};
