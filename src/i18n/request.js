import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { INTL_LOCALES, LANGUAGE_COOKIE, resolveLanguage } from './config';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const language = resolveLanguage(cookieStore.get(LANGUAGE_COOKIE)?.value);
  return {
    locale: INTL_LOCALES[language],
    messages: (await import(`./messages/${language}.json`)).default,
  };
});
