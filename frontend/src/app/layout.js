import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import { AuthProvider } from '@/context/AuthContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'Inventory Demand Forecaster for Flash Sales | ForecastIQ',
  description:
    'All-in-one demand forecasting, stockout risk mitigation, and scenario planning for high-velocity flash sales and seasonal promotions.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900 antialiased transition-colors duration-200 dark:bg-zinc-950 dark:text-zinc-50">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 pb-12">{children}</main>
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
