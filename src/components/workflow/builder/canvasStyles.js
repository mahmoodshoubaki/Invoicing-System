import { CHROME } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

export const canvasSurface = {
  backgroundColor: '#f3f2ef',
  backgroundImage: 'radial-gradient(circle, #d8d6cf 1px, transparent 1px)',
  backgroundSize: '18px 18px',
  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
};

export const nodeCard = {
  backgroundColor: '#ffffff',
  borderRadius: 14,
  border: '1px solid #e6e4dd',
  boxShadow: '0 1px 2px rgba(16,15,14,0.04), 0 4px 12px rgba(16,15,14,0.05)',
};

export const startNodeCard = (accent) => ({
  ...nodeCard,
  border: `1px solid ${withAlpha(accent, 0.45)}`,
  boxShadow: `0 0 0 3px ${withAlpha(accent, 0.09)}, 0 1px 2px rgba(16,15,14,0.04), 0 4px 12px rgba(16,15,14,0.05)`,
});

export const SELECTION_COLOR = '#2a78d6';

export const selectedOutline = {
  outline: `2px solid ${SELECTION_COLOR}`,
  outlineOffset: 2,
};

export const ACTIVE_COLOR = CHROME.textPrimary;

export const withActiveRing = (shadow) =>
  shadow ? `0 0 0 2px ${ACTIVE_COLOR}, ${shadow}` : `0 0 0 2px ${ACTIVE_COLOR}`;

export const cutStyle = {
  opacity: 0.45,
};

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

export const pill = (color, tint = 0.12) => ({
  backgroundColor: withAlpha(color, tint),
  color,
  borderRadius: 999,
  fontWeight: 600,
});

export const connectorLine = {
  width: 2,
  backgroundColor: '#d8d6cf',
  borderRadius: 1,
};

export const mutedText = { color: CHROME.textMuted };
export const secondaryText = { color: CHROME.textSecondary };
export const primaryText = { color: CHROME.textPrimary };
