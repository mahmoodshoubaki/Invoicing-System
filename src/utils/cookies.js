export function getCookie(key, fallback = '') {
  if (typeof document === 'undefined') return fallback;
  const match = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : fallback;
}

export function setCookie(key, value, maxAge = 365 * 24 * 60 * 60) {
  document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}
