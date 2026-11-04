export function isTypingIn(element) {
  if (!element) return false;
  if (element.isContentEditable) return true;
  if (element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') return true;
  return element.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit'].includes(element.type);
}
