/**
 * Marchetti's Apartment — Proximity Score Engine
 * Computes weighted composite scores from POI counts.
 */

const Scorer = {
  /**
   * Compute the full score result from POI counts and user weights.
   * Algorithm:
   *   1. Each subcategory: score = min(count / benchmark, 1.0) * 100
   *   2. Category score = average of subcategory scores
   *   3. Weighted composite = Σ(category_score × weight) / Σ(weights)
   *
   * @param {{ catId: { subId: count } }} counts
   * @param {{ catId: number }} weights  — user-defined weight per category (0–100)
   * @returns {{ composite, grade, gradeColor, categories }}
   */
  compute(counts, weights) {
    const categoryResults = {};
    let totalWeightedScore = 0;
    let totalWeight = 0;

    CATEGORIES.forEach(cat => {
      const weight = (weights[cat.id] !== undefined) ? weights[cat.id] : cat.weight;
      const subDetails = [];
      let subScoreSum = 0;

      cat.subcategories.forEach(sub => {
        const count = (counts[cat.id] && counts[cat.id][sub.id]) || 0;
        const rawScore = Math.min(count / sub.benchmark, 1.0) * 100;
        subScoreSum += rawScore;
        subDetails.push({
          id: sub.id,
          label: sub.label,
          count,
          score: Math.round(rawScore),
          benchmark: sub.benchmark,
        });
      });

      const catScore = cat.subcategories.length > 0
        ? subScoreSum / cat.subcategories.length
        : 0;

      categoryResults[cat.id] = {
        score: Math.round(catScore),
        weight,
        subcategories: subDetails,
        color: cat.color,
        icon: cat.icon,
        label: cat.label,
      };

      totalWeightedScore += catScore * weight;
      totalWeight += weight;
    });

    const composite = totalWeight > 0
      ? Math.round(totalWeightedScore / totalWeight)
      : 0;
    const grade = this.grade(composite);

    return {
      composite,
      grade,
      gradeColor: this.gradeColor(grade),
      categories: categoryResults,
    };
  },

  /** Letter grade from composite score. */
  grade(score) {
    if (score >= 80) return 'A';
    if (score >= 65) return 'B';
    if (score >= 50) return 'C';
    if (score >= 35) return 'D';
    return 'F';
  },

  /** Hex color for a letter grade. */
  gradeColor(grade) {
    const map = { A: '#22c55e', B: '#6366f1', C: '#f59e0b', D: '#f97316', F: '#ef4444' };
    return map[grade] || '#6366f1';
  },

  /** Human-readable tagline for the score. */
  tagline(score, grade, mode, minutes) {
    const modeLabel = {
      walk: 'walking', bicycle: 'cycling', drive: 'driving', transit: 'transit',
    };
    const quality = {
      A: 'Exceptional', B: 'Great', C: 'Moderate', D: 'Limited', F: 'Poor',
    }[grade] || 'Unknown';
    return `${quality} lifestyle access within ${minutes} min ${modeLabel[mode] || 'travel'}`;
  },
};
