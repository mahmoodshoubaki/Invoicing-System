import { cookies } from 'next/headers';
import { Montserrat } from 'next/font/google';
import '@/app/globals.css';
import { APP_NAME, COMPANY_NAME, COMPANY_SHORT_NAME, DEFAULT_LANGUAGE } from '@/constants/appConfig';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata = {
  title: `${APP_NAME} | ${COMPANY_SHORT_NAME}`,
  description: `${COMPANY_NAME} — ${APP_NAME}`,
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const lang = cookieStore.get('language')?.value ?? DEFAULT_LANGUAGE;

  return (
    <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
