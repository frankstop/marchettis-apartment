/**
 * Marchetti's Apartment — Isochrone
 * Fetches travel-time isochrones from Geoapify and computes bounding boxes.
 */

const Isochrone = {
  /**
   * Fetch a travel-time isochrone polygon from Geoapify.
   * @param {number} lat
   * @param {number} lon
   * @param {string} mode  — walk | bicycle | drive | approximated_transit
   * @param {number} minutes
   * @returns {Promise<GeoJSON FeatureCollection>}
   */
  async fetch(lat, lon, mode, minutes) {
    const key = CONFIG.GEOAPIFY_API_KEY;
    const rangeSeconds = minutes * 60;
    const url = [
      'https://api.geoapify.com/v1/isoline',
      `?lat=${lat}`,
      `&lon=${lon}`,
      `&type=time`,
      `&mode=${mode}`,
      `&range=${rangeSeconds}`,
      `&apiKey=${key}`,
    ].join('');

    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Isochrone API error (${res.status}): ${body.slice(0, 120)}`);
    }
    const geojson = await res.json();
    if (!geojson.features || geojson.features.length === 0) {
      throw new Error('No isochrone returned for this location.');
    }
    return geojson;
  },

  /**
   * Compute the axis-aligned bounding box of a GeoJSON FeatureCollection.
   * Works with Polygon and MultiPolygon features.
   * @param {object} geojson
   * @returns {{ south, north, west, east }}
   */
  getBbox(geojson) {
    let minLat = Infinity, maxLat = -Infinity;
    let minLon = Infinity, maxLon = -Infinity;

    function walk(coords) {
      if (typeof coords[0] === 'number') {
        // [lon, lat] pair
        const [lon, lat] = coords;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
      } else {
        coords.forEach(walk);
      }
    }

    (geojson.features || []).forEach(f => {
      if (f.geometry) walk(f.geometry.coordinates);
    });

    return { south: minLat, north: maxLat, west: minLon, east: maxLon };
  },
};
