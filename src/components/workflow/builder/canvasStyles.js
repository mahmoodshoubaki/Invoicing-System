/**
 * The builder's visual language, in one place.
 *
 * The builder reads as a **canvas** rather than a form: a recessed surface with
 * a dot grid, node cards floating on it, and connectors drawn between them —
 * the shape every workflow tool has settled on, because it makes "this happens,
 * then this" legible before a single word is read.
 *
 * What it deliberately is NOT is a free-positioning graph. `StageDefinition`
 * has no x/y field, so anything an author dragged would be thrown away on save.
 * The flow is therefore vertical and ordered, and the connectors describe real
 * transitions rather than decorative edges.
 *
 * Light, not dark. A dark canvas would look the part and clash with every other
 * screen in the app; a recessed warm surface separates canvas from page just as
 * clearly and stays part of the same product.
 */

import { CHROME } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

/** The recessed surface everything sits on. */
export const canvasSurface = {
  backgroundColor: '#f3f2ef',
  // The dot grid: two-tone so it reads as texture rather than a pattern to
  // decode, and small enough to disappear at a glance.
  backgroundImage: 'radial-gradient(circle, #d8d6cf 1px, transparent 1px)',
  backgroundSize: '18px 18px',
  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
};

/** A node card — a stage, or the trigger. */
export const nodeCard = {
  backgroundColor: '#ffffff',
  borderRadius: 14,
  border: '1px solid #e6e4dd',
  boxShadow: '0 1px 2px rgba(16,15,14,0.04), 0 4px 12px rgba(16,15,14,0.05)',
};

/** The same card while it is the run's entry point. */
export const startNodeCard = (accent) => ({
  ...nodeCard,
  border: `1px solid ${withAlpha(accent, 0.45)}`,
  boxShadow: `0 0 0 3px ${withAlpha(accent, 0.09)}, 0 1px 2px rgba(16,15,14,0.04), 0 4px 12px rgba(16,15,14,0.05)`,
});

/**
 * Selected for copying.
 *
 * Blue, because blue reads as "selected" everywhere else a person has ever
 * ticked things. The builder's other colours are all taken: slate marks the
 * start stage, red marks a problem, and each step type has its own accent.
 */
export const SELECTION_COLOR = '#2a78d6';

/** Drawn as an outline, so selecting a card never changes its size. */
export const selectedOutline = {
  outline: `2px solid ${SELECTION_COLOR}`,
  outlineOffset: 2,
};

/**
 * Open in the side panel. A dark ring, so it never reads as "selected for
 * copying" (blue) or "has a problem" (red); drawn as a shadow, so the card
 * keeps its size.
 */
export const ACTIVE_COLOR = CHROME.textPrimary;

/** A ring around a card, added to whatever shadow it already has. */
export const withActiveRing = (shadow) =>
  shadow ? `0 0 0 2px ${ACTIVE_COLOR}, ${shadow}` : `0 0 0 2px ${ACTIVE_COLOR}`;

/**
 * Cut, waiting to be moved.
 *
 * Faded rather than removed: nothing leaves its place until it is pasted, and a
 * cut can still be cancelled. Whatever it holds fades with it.
 */
export const cutStyle = {
  opacity: 0.45,
};

/** A tinted square holding a type icon. */
export const iconChip = (accent, size = 30) => ({
  width: size,
  height: size,
  borderRadius: size / 3.2,
  backgroundColor: withAlpha(accent, 0.12),
  color: accent,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

/** A small pill — a count, a state, a label on an edge. */
export const pill = (color, tint = 0.12) => ({
  backgroundColor: withAlpha(color, tint),
  color,
  borderRadius: 999,
  fontWeight: 600,
});

/** The vertical line that joins one node to the next. */
export const connectorLine = {
  width: 2,
  backgroundColor: '#d8d6cf',
  borderRadius: 1,
};

export const mutedText = { color: CHROME.textMuted };
export const secondaryText = { color: CHROME.textSecondary };
export const primaryText = { color: CHROME.textPrimary };
