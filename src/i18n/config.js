import { DEFAULT_LANGUAGE } from '@/constants/appConfig';

export const LANGUAGES = ['en', 'ar'];
export const LANGUAGE_COOKIE = 'language';

// Switching the language switches the display currency to this one.
export const LANGUAGE_CURRENCY = {
  en: 'USD',
  ar: 'SAR',
};

// Arabic is pinned to the Gregorian calendar and Latin digits; browser defaults for Arabic differ.
export const INTL_LOCALES = {
  en: 'en-GB',
  ar: 'ar-u-ca-gregory-nu-latn',
};

/**
 * @param {string|null|undefined} value
 * @returns {'en'|'ar'}
 */
export function resolveLanguage(value) {
  if (LANGUAGES.includes(value)) return value;
  return LANGUAGES.includes(DEFAULT_LANGUAGE) ? DEFAULT_LANGUAGE : 'en';
}

/**
 * @param {string} locale an Intl locale such as INTL_LOCALES.ar
 */
export function isRtlLocale(locale) {
  return String(locale ?? '').startsWith('ar');
}

/**
 * @param {string} language
 * @returns {'rtl'|'ltr'}
 */
export function textDirection(language) {
  return language === 'ar' ? 'rtl' : 'ltr';
}
