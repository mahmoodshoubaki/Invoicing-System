import { USD_TO_SAR_RATE } from './appConfig';

// The backend stores and expects every amount in this currency.
export const BASE_CURRENCY = 'USD';

export const Currencies = [
  { Key: "SAR", symbol: "\u{20C1}", name: "Saudi Riyal", rate: USD_TO_SAR_RATE },
  { Key: "USD", symbol: "$", name: "US Dollar", rate: 1 },
];
export const Currencies_LIST = Currencies;
