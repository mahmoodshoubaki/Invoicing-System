import { cookies } from 'next/headers';
import { Montserrat } from 'next/font/google';
import '@/app/globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata = {
  title: 'Enterprise Invoicing & Tracking System | Devoteam',
  description:
    'Devoteam Middle East — Enterprise Invoicing & Project Tracking System for managing BOQ, invoices, SLA compliance, and revenue recognition.',
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const lang = cookieStore.get('language')?.value ?? 'en';

  return (
    <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
