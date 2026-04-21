/**
 * Marchetti's Apartment — UI Controller
 * Manages DOM updates, panels, charts, and micro-animations.
 */

const UI = {
  radarChart: null,
  _scoreRingCircumference: 2 * Math.PI * 54, // r=54

  /** Show the loading overlay with a message. */
  showLoading(text) {
    document.getElementById('loading-text').textContent = text || 'Analyzing…';
    document.getElementById('loading-overlay').classList.remove('hidden');
  },

  hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
  },

  /** Display a toast notification. type: 'error' | 'success' | 'info' */
  toast(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add('toast-visible'));
    });
    setTimeout(() => {
      el.classList.remove('toast-visible');
      setTimeout(() => el.remove(), 350);
    }, 4000);
  },

  /** Build the category weight sliders in the left panel. */
  buildWeightControls(weights) {
    const container = document.getElementById('weight-controls');
    container.innerHTML = '';

    CATEGORIES.forEach(cat => {
      const weight = weights[cat.id] !== undefined ? weights[cat.id] : cat.weight;
      const div = document.createElement('div');
      div.className = 'weight-item';
      div.innerHTML = `
        <div class="weight-header">
          <span class="weight-icon" style="color:${cat.color}">${cat.icon}</span>
          <span class="weight-label">${cat.label}</span>
          <span class="weight-val" id="wval-${cat.id}">${weight}</span>
        </div>
        <input
          type="range"
          class="weight-slider"
          data-cat="${cat.id}"
          min="0" max="100" step="5"
          value="${weight}"
          style="--accent:${cat.color}"
        >
      `;
      container.appendChild(div);
    });
  },

  /** Build travel mode pills. */
  buildTravelModes() {
    const container = document.getElementById('mode-pills');
    container.innerHTML = '';
    TRAVEL_MODES.forEach(mode => {
      const btn = document.createElement('button');
      btn.className = 'mode-pill' + (mode.id === AppState.travelMode ? ' active' : '');
      btn.dataset.mode = mode.id;
      btn.dataset.geoapifyMode = mode.geoapifyMode;
      btn.innerHTML = `<span>${mode.icon}</span><span>${mode.label}</span>`;
      container.appendChild(btn);
    });
  },

  /** Reveal the right panel with the score dashboard. */
  showScorePanel(scoreResult, location, mode, minutes) {
    const panel = document.getElementById('right-panel');
    panel.classList.remove('hidden', 'panel-exit');
    panel.classList.add('panel-enter');
    setTimeout(() => panel.classList.remove('panel-enter'), 500);

    this.updateScoreDisplay(scoreResult, location, mode, minutes);

    // Show POI layer toggles
    document.getElementById('layer-controls').classList.remove('hidden');
    this.buildLayerToggles();
  },

  /** Update all score display elements (for live weight recalculation). */
  updateScoreDisplay(scoreResult, location, mode, minutes) {
    const { composite, grade, gradeColor, categories } = scoreResult;
    const circ = this._scoreRingCircumference;

    // Animate score ring
    const arc = document.getElementById('score-arc');
    arc.style.stroke = gradeColor;
    arc.style.strokeDasharray = `${(composite / 100) * circ} ${circ}`;

    // Score number (count-up animation)
    this._animateNumber('score-value', composite);
    const gradeEl = document.getElementById('score-grade');
    gradeEl.textContent = grade;
    gradeEl.style.color = gradeColor;

    // Address and tagline
    const shortAddr = location.address.split(',').slice(0, 2).join(',');
    document.getElementById('score-address').textContent = shortAddr;
    document.getElementById('score-tagline').textContent =
      Scorer.tagline(composite, grade, mode, minutes);

    // Charts and cards
    this.updateRadarChart(categories);
    this.renderCategoryCards(categories);

    // Store for pin button
    AppState.currentScore = scoreResult;
  },

  /** Animate a numeric counter. */
  _animateNumber(elId, target) {
    const el = document.getElementById(elId);
    const start = parseInt(el.textContent) || 0;
    const duration = 800;
    const startTime = performance.now();

    function tick(now) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(start + (target - start) * eased);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  },

  /** Update or create the Chart.js radar chart. */
  updateRadarChart(categories) {
    const ctx = document.getElementById('radar-chart').getContext('2d');
    const labels = CATEGORIES.map(c => c.label);
    const data = CATEGORIES.map(c => (categories[c.id] ? categories[c.id].score : 0));
    const pointColors = CATEGORIES.map(c => c.color);

    if (this.radarChart) {
      this.radarChart.data.datasets[0].data = data;
      this.radarChart.update('active');
      return;
    }

    Chart.defaults.color = 'rgba(240,244,255,0.6)';
    this.radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: 'rgba(99,102,241,0.15)',
          borderColor: '#6366f1',
          borderWidth: 2,
          pointBackgroundColor: pointColors,
          pointBorderColor: '#fff',
          pointBorderWidth: 1.5,
          pointRadius: 5,
          pointHoverRadius: 7,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: { duration: 800, easing: 'easeOutCubic' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(13,21,38,0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            callbacks: {
              label: ctx => ` Score: ${ctx.raw}/100`,
            },
          },
        },
        scales: {
          r: {
            min: 0, max: 100,
            ticks: {
              stepSize: 25,
              color: 'rgba(255,255,255,0.35)',
              backdropColor: 'transparent',
              font: { size: 10 },
            },
            grid: { color: 'rgba(255,255,255,0.07)' },
            angleLines: { color: 'rgba(255,255,255,0.07)' },
            pointLabels: {
              color: 'rgba(240,244,255,0.75)',
              font: { size: 10, family: 'Inter, sans-serif' },
            },
          },
        },
      },
    });
  },

  /** Render category score cards with subcategory chips. */
  renderCategoryCards(categories) {
    const container = document.getElementById('category-breakdown');
    container.innerHTML = '';

    CATEGORIES.forEach((cat, i) => {
      const catData = categories[cat.id];
      if (!catData) return;

      const barColor = catData.score >= 70 ? '#22c55e'
        : catData.score >= 45 ? cat.color
        : '#ef4444';

      const card = document.createElement('div');
      card.className = 'category-card';
      card.style.cssText = `--cat-color:${cat.color};animation-delay:${i * 70}ms`;

      card.innerHTML = `
        <div class="cat-header">
          <span class="cat-icon">${cat.icon}</span>
          <div class="cat-title">
            <span class="cat-name">${cat.label}</span>
            <span class="cat-weight-tag">Priority: ${catData.weight}%</span>
          </div>
          <div class="cat-score" style="color:${barColor}">${catData.score}</div>
        </div>
        <div class="cat-bar-track">
          <div class="cat-bar-fill" style="width:${catData.score}%;background:${barColor}"></div>
        </div>
        <div class="cat-subcats">
          ${catData.subcategories.map(s => `
            <div class="subcat-chip" title="${s.label}">
              <span class="subcat-name">${s.label}</span>
              <span class="subcat-count">${s.count}</span>
            </div>
          `).join('')}
        </div>
      `;
      container.appendChild(card);
    });
  },

  /** Build POI layer toggle buttons on the map overlay. */
  buildLayerToggles() {
    const container = document.getElementById('layer-toggles');
    container.innerHTML = '';
    CATEGORIES.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'layer-btn active';
      btn.dataset.cat = cat.id;
      btn.title = cat.label;
      btn.style.setProperty('--cat-color', cat.color);
      btn.textContent = cat.icon;
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        MapController.toggleLayer(cat.id, btn.classList.contains('active'));
      });
      container.appendChild(btn);
    });
  },

  /** Show the comparison bar if there are saved locations. */
  updateCompareBar() {
    const bar = document.getElementById('compare-bar');
    const slots = document.getElementById('compare-slots');

    if (AppState.savedLocations.length === 0) {
      bar.classList.add('hidden');
      return;
    }

    bar.classList.remove('hidden');
    slots.innerHTML = '';

    AppState.savedLocations.forEach((loc, i) => {
      const gradeColor = Scorer.gradeColor(loc.score.grade);
      const card = document.createElement('div');
      card.className = 'compare-card';
      card.innerHTML = `
        <div class="compare-card-score" style="color:${gradeColor}">${loc.score.composite}<sup>${loc.score.grade}</sup></div>
        <div class="compare-card-addr">${loc.address.split(',')[0]}</div>
        <div class="compare-card-meta">${loc.minutes} min ${loc.mode}</div>
        <button class="compare-card-remove" data-index="${i}" title="Remove">×</button>
      `;
      card.querySelector('.compare-card-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        AppState.savedLocations.splice(i, 1);
        this.updateCompareBar();
        this.updatePinButton();
        document.getElementById('compare-count').textContent = AppState.savedLocations.length;
        if (AppState.savedLocations.length === 0) {
          document.getElementById('btn-compare').classList.add('hidden');
        }
      });
      slots.appendChild(card);
    });
  },

  /** Update the "Save for Comparison" button state. */
  updatePinButton() {
    const btn = document.getElementById('btn-pin');
    const alreadySaved = AppState.savedLocations.some(
      l => l.address === AppState.currentLocation?.address
    );
    const full = AppState.savedLocations.length >= CONFIG.MAX_COMPARE_LOCATIONS;

    btn.disabled = alreadySaved || full || !AppState.currentLocation;
    btn.textContent = alreadySaved ? '✓ Saved' : full ? 'Compare Full (4/4)' : '📍 Save for Comparison';
  },
};
