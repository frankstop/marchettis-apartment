/**
 * Marchetti's Apartment — Comparison Engine
 * Renders side-by-side comparison of up to 4 saved locations.
 */

const Compare = {
  modal: null,

  /** Open the full comparison modal. */
  show() {
    const locations = AppState.savedLocations;
    if (locations.length < 2) {
      UI.toast('Save at least 2 locations to compare.', 'info');
      return;
    }

    this._removeModal();

    const modal = document.createElement('div');
    modal.id = 'compare-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="compare-modal-content">
        <div class="compare-modal-header">
          <h2>📍 Location Comparison</h2>
          <button id="compare-modal-close" class="icon-btn">×</button>
        </div>
        <div class="compare-grid">
          ${this._buildHeader(locations)}
          ${this._buildScoreRow(locations)}
          ${this._buildCategoryRows(locations)}
        </div>
        <div class="compare-chart-wrap">
          <canvas id="compare-bar-chart"></canvas>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => modal.classList.add('modal-visible'));
    });

    document.getElementById('compare-modal-close').addEventListener('click', () => this.close());
    modal.addEventListener('click', e => { if (e.target === modal) this.close(); });

    this._buildBarChart(locations);
    this.modal = modal;
  },

  close() {
    if (!this.modal) return;
    this.modal.classList.remove('modal-visible');
    setTimeout(() => this._removeModal(), 350);
  },

  _removeModal() {
    const existing = document.getElementById('compare-modal');
    if (existing) existing.remove();
    this.modal = null;
  },

  _buildHeader(locations) {
    const cols = locations.map(loc => `
      <div class="cmp-col">
        <div class="cmp-addr">${loc.address.split(',').slice(0, 2).join(',')}</div>
        <div class="cmp-meta">${loc.minutes} min · ${loc.mode}</div>
      </div>
    `).join('');
    return `<div class="cmp-row cmp-header"><div class="cmp-label"></div>${cols}</div>`;
  },

  _buildScoreRow(locations) {
    const best = Math.max(...locations.map(l => l.score.composite));
    const cols = locations.map(loc => {
      const isBest = loc.score.composite === best;
      const gc = Scorer.gradeColor(loc.score.grade);
      return `
        <div class="cmp-col cmp-score-col ${isBest ? 'cmp-best' : ''}">
          <span class="cmp-score-big" style="color:${gc}">${loc.score.composite}</span>
          <span class="cmp-grade" style="color:${gc}">${loc.score.grade}</span>
          ${isBest ? '<span class="cmp-badge">Best</span>' : ''}
        </div>
      `;
    }).join('');
    return `<div class="cmp-row cmp-score-row"><div class="cmp-label">Overall Score</div>${cols}</div>`;
  },

  _buildCategoryRows(locations) {
    return CATEGORIES.map(cat => {
      const scores = locations.map(l => l.score.categories[cat.id]?.score || 0);
      const best = Math.max(...scores);
      const cols = locations.map((loc, i) => {
        const score = scores[i];
        const isBest = score === best && best > 0;
        return `
          <div class="cmp-col ${isBest ? 'cmp-best' : ''}">
            <div class="cmp-cat-bar-track">
              <div class="cmp-cat-bar-fill" style="width:${score}%;background:${cat.color}"></div>
            </div>
            <span class="cmp-cat-score">${score}</span>
          </div>
        `;
      }).join('');
      return `
        <div class="cmp-row">
          <div class="cmp-label">
            <span style="color:${cat.color}">${cat.icon}</span> ${cat.label}
          </div>
          ${cols}
        </div>
      `;
    }).join('');
  },

  _buildBarChart(locations) {
    const ctx = document.getElementById('compare-bar-chart').getContext('2d');
    const labels = CATEGORIES.map(c => c.label);
    const palette = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899'];

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: locations.map((loc, i) => ({
          label: loc.address.split(',')[0],
          data: CATEGORIES.map(c => loc.score.categories[c.id]?.score || 0),
          backgroundColor: palette[i % palette.length] + 'cc',
          borderColor: palette[i % palette.length],
          borderWidth: 1.5,
          borderRadius: 4,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: 'rgba(240,244,255,0.8)', font: { family: 'Inter' } },
          },
          tooltip: {
            backgroundColor: 'rgba(13,21,38,0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            ticks: { color: 'rgba(240,244,255,0.6)', font: { size: 11 } },
            grid: { color: 'rgba(255,255,255,0.06)' },
          },
          y: {
            min: 0, max: 100,
            ticks: { color: 'rgba(240,244,255,0.6)' },
            grid: { color: 'rgba(255,255,255,0.06)' },
          },
        },
      },
    });
  },
};
