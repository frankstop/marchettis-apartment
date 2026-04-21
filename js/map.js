/**
 * Marchetti's Apartment — Map Controller
 * Manages the Leaflet map, markers, isochrone layer, and POI layers.
 */

const MapController = {
  map: null,
  locationMarker: null,
  isochroneLayer: null,
  poiLayers: {},      // catId -> L.LayerGroup
  layerVisibility: {}, // catId -> bool

  /** Initialize the Leaflet map. */
  init() {
    this.map = L.map('map', {
      center: CONFIG.MAP_DEFAULT_CENTER,
      zoom: CONFIG.MAP_DEFAULT_ZOOM,
      zoomControl: false,
    });

    // Dark tile layer (CartoDB Dark Matter — no API key required)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(this.map);

    // Zoom controls — bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // Initialize empty POI layer groups
    CATEGORIES.forEach(cat => {
      this.poiLayers[cat.id] = L.layerGroup().addTo(this.map);
      this.layerVisibility[cat.id] = true;
    });
  },

  /** Place or update the main location marker. */
  setLocation(lat, lon, label) {
    if (this.locationMarker) {
      this.map.removeLayer(this.locationMarker);
    }

    // Custom pulsing marker
    const icon = L.divIcon({
      className: '',
      html: `<div class="location-marker"><div class="marker-dot"></div><div class="marker-pulse"></div></div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    this.locationMarker = L.marker([lat, lon], { icon })
      .bindPopup(`<div class="map-popup"><strong>${label}</strong></div>`, { maxWidth: 240 })
      .addTo(this.map);

    this.map.flyTo([lat, lon], 14, { duration: 1.2, easeLinearity: 0.25 });
  },

  /** Draw the isochrone GeoJSON polygon on the map. */
  setIsochrone(geojson) {
    if (this.isochroneLayer) {
      this.map.removeLayer(this.isochroneLayer);
    }

    this.isochroneLayer = L.geoJSON(geojson, {
      style: {
        fillColor: '#6366f1',
        fillOpacity: 0.12,
        color: '#818cf8',
        weight: 2,
        dashArray: '6 4',
        opacity: 0.8,
      },
    }).addTo(this.map);

    // Add glow effect class to the SVG path
    this.isochroneLayer.on('add', () => {
      document.querySelectorAll('.leaflet-interactive').forEach(el => {
        el.classList.add('isochrone-path');
      });
    });

    // Fit map to the isochrone bounds (with padding for panels)
    const bounds = this.isochroneLayer.getBounds();
    this.map.fitBounds(bounds, { paddingTopLeft: [320, 80], paddingBottomRight: [380, 40] });
  },

  /** Render POI markers for all categories. */
  renderPOIs(poiLocations) {
    // Clear existing POI layers
    CATEGORIES.forEach(cat => {
      this.poiLayers[cat.id].clearLayers();
    });

    CATEGORIES.forEach(cat => {
      const pois = poiLocations[cat.id] || [];
      // Limit to first 200 per category for performance
      pois.slice(0, 200).forEach(poi => {
        const marker = L.circleMarker([poi.lat, poi.lon], {
          radius: 5,
          fillColor: cat.color,
          color: 'rgba(0,0,0,0.4)',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.85,
        });

        marker.bindPopup(
          `<div class="map-popup"><span style="color:${cat.color}">${cat.icon}</span> <strong>${poi.name}</strong><br><small>${poi.subId.replace(/_/g, ' ')}</small></div>`,
          { maxWidth: 200 }
        );

        this.poiLayers[cat.id].addLayer(marker);
      });
    });
  },

  /** Toggle a POI category layer on/off. */
  toggleLayer(catId, visible) {
    this.layerVisibility[catId] = visible;
    if (visible) {
      this.poiLayers[catId].addTo(this.map);
    } else {
      this.map.removeLayer(this.poiLayers[catId]);
    }
  },

  /** Clear everything (isochrone + POIs) for a fresh analysis. */
  clearAnalysis() {
    if (this.isochroneLayer) {
      this.map.removeLayer(this.isochroneLayer);
      this.isochroneLayer = null;
    }
    CATEGORIES.forEach(cat => {
      this.poiLayers[cat.id].clearLayers();
    });
  },
};
