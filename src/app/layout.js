import { cookies } from 'next/headers';
import { Montserrat, Tajawal } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import '@/app/globals.css';
import { APP_NAME, COMPANY_NAME, COMPANY_SHORT_NAME } from '@/constants/appConfig';
import { LANGUAGE_COOKIE, resolveLanguage, textDirection } from '@/i18n/config';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

// Not preloaded: the browser fetches it only when Arabic text is on the page.
const tajawal = Tajawal({
  subsets: ['arabic'],
  variable: '--font-tajawal',
  display: 'swap',
  preload: false,
  weight: ['300', '400', '500', '700', '800'],
});

export const metadata = {
  title: `${APP_NAME} | ${COMPANY_SHORT_NAME}`,
  description: `${COMPANY_NAME} — ${APP_NAME}`,
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const language = resolveLanguage(cookieStore.get(LANGUAGE_COOKIE)?.value);

  return (
    <html lang={language} dir={textDirection(language)} className={`${montserrat.variable} ${tajawal.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
