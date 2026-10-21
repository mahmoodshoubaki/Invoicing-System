/**
 * Whether a key press belongs to a field the author is typing in.
 *
 * Ctrl+C, Ctrl+V and Esc there mean what they always mean. A tick box does not
 * count: it takes focus when clicked, and copying straight after ticking is the
 * whole point of ticking.
 */
export function isTypingIn(element) {
  if (!element) return false;
  if (element.isContentEditable) return true;
  if (element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') return true;
  return element.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit'].includes(element.type);
}
