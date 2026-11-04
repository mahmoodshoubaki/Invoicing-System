// Values come from .env; next.config.mjs stops the build when one is missing.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME;
export const APP_SHORT_NAME = process.env.NEXT_PUBLIC_APP_SHORT_NAME;
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION;
export const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME;
export const COMPANY_SHORT_NAME = process.env.NEXT_PUBLIC_COMPANY_SHORT_NAME;

export const DEFAULT_LANGUAGE = process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE;
export const DEFAULT_CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY;
export const VAT_RATE = Number(process.env.NEXT_PUBLIC_DEFAULT_VAT_PERCENT) / 100;

/** For addresses Next.js does not prefix itself: fetch, window.location, iframes and plain <a>. */
export const withBasePath = (path) => `${BASE_PATH}${path}`;
