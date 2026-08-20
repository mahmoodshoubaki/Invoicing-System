/**
 * Data-visualisation palette — the single source of truth for every chart.
 *
 * The categorical ORDER below is not cosmetic: it is the colour-blind-safety
 * mechanism. All 120 orderings of this hue pool were run through the palette
 * validator against the white card surface these charts actually render on,
 * and only 12 cleared every gate with zero warnings. This is one of those 12.
 *
 *   node scripts/validate_palette.js "#f8485e,#2a78d6,#158a62,#4a3aa7,#b07800" \
 *        --mode light --surface "#ffffff"
 *
 *   [PASS] Lightness band       all 5 inside L 0.43–0.77
 *   [PASS] Chroma floor         all 5 >= 0.1
 *   [PASS] CVD separation       worst adjacent #2a78d6↔#f8485e ΔE 18.7 (protan)
 *   [PASS] Normal-vision floor  worst adjacent #158a62↔#2a78d6 ΔE 20.3
 *   [PASS] Contrast vs surface  all 5 >= 3:1
 *
 * Two adjacencies are known-bad and must never be reintroduced by reordering:
 * brand-coral↔green (ΔE 4.6 protan — a hard FAIL) and coral↔gold (6.7 deutan).
 * Both warm hues need a cool slot between them. If you add a series, re-run the
 * validator on the new ordering rather than appending a hue that "looks fine".
 */

/** Categorical slots, assigned in fixed order — never cycled, never by rank. */
export const SERIES = ['#f8485e', '#2a78d6', '#158a62', '#4a3aa7', '#b07800'];

/** Named aliases for the slots this app actually uses, so charts read by role. */
export const SERIES_ROLE = {
  revenue: SERIES[0],   // brand coral — the headline measure
  invoiced: SERIES[1],  // blue
  collected: SERIES[2], // green — semantically "money in"
  wip: SERIES[3],       // violet
  forecast: SERIES[4],  // gold
};

/**
 * Status palette — fixed, never themed, never reused as a series colour.
 * Always shipped with an icon + label so state never rides on hue alone.
 */
export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
  /** In-flight / awaiting action. A deliberately desaturated slate, kept well
   *  clear of the saturated series blue so a workflow state can never be
   *  mistaken for a data series. */
  info: '#5f7d95',
  neutral: '#898781',
};

/** Chart chrome & ink — recessive by design so the data carries the contrast. */
export const CHROME = {
  surface: '#ffffff',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  textPrimary: '#0b0b0b',
  textSecondary: '#52514e',
  textMuted: '#898781',
};

/** Single-hue sequential ramp (brand coral), light → dark, for magnitude. */
export const SEQUENTIAL_CORAL = ['#ffe0e4', '#ffc0c8', '#fca2ae', '#f8485e', '#d9304a', '#a81f35'];
