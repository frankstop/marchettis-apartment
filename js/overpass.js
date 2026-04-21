/**
 * Marchetti's Apartment — Overpass POI Fetcher
 * Queries OpenStreetMap Overpass API for points of interest within a bounding box.
 */

const Overpass = {
  /**
   * Fetch all configured POI types within the given bbox.
   * Uses a single batched Overpass QL query for efficiency.
   * @param {{ south, north, west, east }} bbox
   * @returns {Promise<Array>} raw OSM elements
   */
  async fetchPOIs(bbox) {
    const { south, west, north, east } = bbox;
    const bboxStr = `${south},${west},${north},${east}`;

    // Build one union query covering all subcategories
    const parts = [];
    CATEGORIES.forEach(cat => {
      cat.subcategories.forEach(sub => {
        parts.push(`  nwr["${sub.tagKey}"="${sub.tagValue}"](${bboxStr});`);
      });
    });

    const query = `[out:json][timeout:30];\n(\n${parts.join('\n')}\n);\nout center tags 1500;`;

    const res = await fetch(CONFIG.OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!res.ok) throw new Error(`Overpass API error (${res.status})`);
    const data = await res.json();
    return data.elements || [];
  },

  /**
   * Categorize raw OSM elements into counts and map-ready POI locations.
   * @param {Array} elements — raw Overpass elements
   * @returns {{ counts: object, poiLocations: object }}
   *   counts: { catId: { subId: number } }
   *   poiLocations: { catId: Array<{lat, lon, name, subId, color}> }
   */
  categorize(elements) {
    // Build tag → subcategory lookup map
    const tagMap = {};
    CATEGORIES.forEach(cat => {
      cat.subcategories.forEach(sub => {
        const key = `${sub.tagKey}:${sub.tagValue}`;
        if (!tagMap[key]) tagMap[key] = [];
        tagMap[key].push({ catId: cat.id, subId: sub.id, catColor: cat.color });
      });
    });

    // Initialize counts and location arrays
    const counts = {};
    const poiLocations = {};
    CATEGORIES.forEach(cat => {
      counts[cat.id] = {};
      poiLocations[cat.id] = [];
      cat.subcategories.forEach(sub => {
        counts[cat.id][sub.id] = 0;
      });
    });

    // Deduplicate by OSM id+type to avoid double-counting ways and relations
    const seen = new Set();

    elements.forEach(el => {
      const uid = `${el.type}:${el.id}`;
      if (seen.has(uid)) return;
      seen.add(uid);

      // Extract coordinates
      let lat, lon;
      if (el.type === 'node') {
        lat = el.lat;
        lon = el.lon;
      } else if (el.center) {
        lat = el.center.lat;
        lon = el.center.lon;
      } else {
        return; // No geometry available
      }

      const tags = el.tags || {};
      const matched = new Set(); // Avoid double-counting same element for same category

      Object.entries(tags).forEach(([k, v]) => {
        const key = `${k}:${v}`;
        if (!tagMap[key]) return;
        tagMap[key].forEach(({ catId, subId, catColor }) => {
          const dedup = `${uid}:${catId}:${subId}`;
          if (matched.has(dedup)) return;
          matched.add(dedup);

          counts[catId][subId]++;
          poiLocations[catId].push({
            lat,
            lon,
            name: tags.name || tags['name:en'] || subId.replace(/_/g, ' '),
            subId,
            color: catColor,
          });
        });
      });
    });

    return { counts, poiLocations };
  },
};
