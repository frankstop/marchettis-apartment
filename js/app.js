/**
 * Marchetti's Apartment — Main Application Controller
 * Manages global state and orchestrates the full analysis pipeline.
 */

/** Global application state. */
const AppState = {
  apiKey: CONFIG.GEOAPIFY_API_KEY,
  travelMode: CONFIG.DEFAULT_TRAVEL_MODE,
  travelMinutes: CONFIG.DEFAULT_TRAVEL_TIME,
  weights: {},           // catId -> weight (0–100)
  currentLocation: null, // { address, lat, lon }
  currentIsochrone: null,
  currentPOIData: null,  // { counts, poiLocations }
  currentScore: null,
  savedLocations: [],    // up to MAX_COMPARE_LOCATIONS entries
};

/** Initialize weights from category defaults. */
function initWeights() {
  CATEGORIES.forEach(function(cat) {
    AppState.weights[cat.id] = cat.weight;
  });
}

/** Full analysis pipeline. */
async function runAnalysis() {
  if (!AppState.currentLocation) return;

  const lat     = AppState.currentLocation.lat;
  const lon     = AppState.currentLocation.lon;
  const mode    = AppState.travelMode;
  const minutes = AppState.travelMinutes;
  const modeObj = TRAVEL_MODES.find(function(m) { return m.id === mode; });
  const geoapifyMode = modeObj ? modeObj.geoapifyMode : mode;

  MapController.clearAnalysis();

  try {
    // Step 1: Isochrone
    UI.showLoading('Calculating travel radius…');
    const isoGeoJSON = await Isochrone.fetch(lat, lon, geoapifyMode, minutes);
    AppState.currentIsochrone = isoGeoJSON;
    MapController.setIsochrone(isoGeoJSON);
    const bbox = Isochrone.getBbox(isoGeoJSON);

    // Step 2: POI fetch
    UI.showLoading('Fetching points of interest…');
    const elements = await Overpass.fetchPOIs(bbox);
    const categorized = Overpass.categorize(elements);
    const counts      = categorized.counts;
    const poiLocations = categorized.poiLocations;
    AppState.currentPOIData = { counts: counts, poiLocations: poiLocations };

    // Step 3: Render POIs on map
    MapController.renderPOIs(poiLocations);

    // Step 4: Compute score
    UI.showLoading('Computing proximity score…');
    const scoreResult = Scorer.compute(counts, AppState.weights);
    AppState.currentScore = scoreResult;
    UI.hideLoading();

    // Step 5: Reveal score dashboard
    UI.showScorePanel(scoreResult, AppState.currentLocation, mode, minutes);
    UI.updatePinButton();

    let total = 0;
    Object.values(counts).forEach(function(sub) {
      Object.values(sub).forEach(function(n) { total += n; });
    });
    UI.toast('Found ' + total + ' POIs \u00b7 Score: ' + scoreResult.composite + ' / ' + scoreResult.grade, 'success');

  } catch (err) {
    UI.hideLoading();
    console.error('Analysis error:', err);
    UI.toast(err.message || 'Analysis failed. Please try again.', 'error');
  }
}

/** App bootstrap — runs after DOM is ready. */
document.addEventListener('DOMContentLoaded', function() {
  initWeights();
  MapController.init();
  UI.buildTravelModes();
  UI.buildWeightControls(AppState.weights);

  // ── Search Input ──────────────────────────────────────────────
  var searchInput = document.getElementById('search-input');
  var dropdown    = document.getElementById('autocomplete-dropdown');

  searchInput.addEventListener('input', function() {
    var val = searchInput.value.trim();
    document.getElementById('btn-analyze').disabled = !val;

    if (!val) {
      dropdown.classList.add('hidden');
      return;
    }

    Geocoder.debounceAutocomplete(val, function(results) {
      if (!results.length) { dropdown.classList.add('hidden'); return; }

      var html = '';
      results.forEach(function(r, i) {
        var safeText = r.text.replace(/"/g, '&quot;');
        html += '<div class="autocomplete-item" data-index="' + i +
                '" data-lat="' + r.lat + '" data-lon="' + r.lon +
                '" data-text="' + safeText + '">' + r.text + '</div>';
      });
      dropdown.innerHTML = html;
      dropdown.classList.remove('hidden');

      dropdown.querySelectorAll('.autocomplete-item').forEach(function(item) {
        item.addEventListener('mousedown', function(e) {
          e.preventDefault();
          selectLocation(item.dataset.text, parseFloat(item.dataset.lat), parseFloat(item.dataset.lon));
        });
      });
    });
  });

  searchInput.addEventListener('blur', function() {
    setTimeout(function() { dropdown.classList.add('hidden'); }, 150);
  });

  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      dropdown.classList.add('hidden');
      geocodeAndSet(searchInput.value.trim());
    }
    if (e.key === 'Escape') dropdown.classList.add('hidden');
  });

  async function geocodeAndSet(text) {
    if (!text) return;
    try {
      UI.showLoading('Finding location…');
      var result = await Geocoder.search(text);
      UI.hideLoading();
      selectLocation(result.address, result.lat, result.lon);
    } catch (err) {
      UI.hideLoading();
      UI.toast(err.message, 'error');
    }
  }

  function selectLocation(address, lat, lon) {
    AppState.currentLocation = { address: address, lat: lat, lon: lon };
    searchInput.value = address;
    dropdown.classList.add('hidden');
    document.getElementById('btn-analyze').disabled = false;
    MapController.setLocation(lat, lon, address);
    var overlay = document.getElementById('map-empty-overlay');
    if (overlay) overlay.classList.add('fading');
  }

  // ── Travel Mode Pills ─────────────────────────────────────────
  document.getElementById('mode-pills').addEventListener('click', function(e) {
    var pill = e.target.closest('.mode-pill');
    if (!pill) return;
    document.querySelectorAll('.mode-pill').forEach(function(p) { p.classList.remove('active'); });
    pill.classList.add('active');
    AppState.travelMode = pill.dataset.mode;
  });

  // ── Time Slider ───────────────────────────────────────────────
  var timeSlider  = document.getElementById('time-slider');
  var timeDisplay = document.getElementById('time-display');
  timeSlider.addEventListener('input', function() {
    AppState.travelMinutes = parseInt(timeSlider.value);
    timeDisplay.textContent = timeSlider.value + ' min';
  });

  // ── Weight Sliders ────────────────────────────────────────────
  document.getElementById('weight-controls').addEventListener('input', function(e) {
    var slider = e.target.closest('.weight-slider');
    if (!slider) return;
    var catId = slider.dataset.cat;
    var val   = parseInt(slider.value);
    AppState.weights[catId] = val;
    var valEl = document.getElementById('wval-' + catId);
    if (valEl) valEl.textContent = val;

    // Live recalculate if we have POI data
    if (AppState.currentPOIData) {
      var newScore = Scorer.compute(AppState.currentPOIData.counts, AppState.weights);
      UI.updateScoreDisplay(newScore, AppState.currentLocation, AppState.travelMode, AppState.travelMinutes);
    }
  });

  // ── Analyze Button ────────────────────────────────────────────
  document.getElementById('btn-analyze').addEventListener('click', runAnalysis);

  // ── Pin / Save Button ─────────────────────────────────────────
  document.getElementById('btn-pin').addEventListener('click', function() {
    if (!AppState.currentLocation || !AppState.currentScore) return;

    if (AppState.savedLocations.length >= CONFIG.MAX_COMPARE_LOCATIONS) {
      UI.toast('Maximum 4 locations for comparison.', 'info');
      return;
    }
    var already = AppState.savedLocations.some(function(l) {
      return l.address === AppState.currentLocation.address;
    });
    if (already) {
      UI.toast('Location already saved.', 'info');
      return;
    }

    AppState.savedLocations.push({
      address: AppState.currentLocation.address,
      lat:     AppState.currentLocation.lat,
      lon:     AppState.currentLocation.lon,
      score:   AppState.currentScore,
      mode:    AppState.travelMode,
      minutes: AppState.travelMinutes,
    });

    UI.updateCompareBar();
    UI.updatePinButton();

    var count = AppState.savedLocations.length;
    document.getElementById('btn-compare').classList.remove('hidden');
    document.getElementById('compare-count').textContent = count;
    UI.toast('Location saved for comparison!', 'success');
  });

  // ── Compare Button ────────────────────────────────────────────
  document.getElementById('btn-compare').addEventListener('click', function() {
    Compare.show();
  });

  // ── Clear Compare ─────────────────────────────────────────────
  document.getElementById('btn-clear-compare').addEventListener('click', function() {
    AppState.savedLocations = [];
    UI.updateCompareBar();
    document.getElementById('btn-compare').classList.add('hidden');
    document.getElementById('compare-count').textContent = 0;
    UI.updatePinButton();
  });
});
