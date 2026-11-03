import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'Inventory Demand Forecaster for Flash Sales',
  description:
    'Flash-sale demand scenario estimates, stockout-risk warnings, and accuracy analytics',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full bg-slate-50 text-slate-900 antialiased transition-colors duration-200 dark:bg-zinc-950 dark:text-zinc-50">
        <Navbar />
        <div className="flex-1 pl-20">{children}</div>
      </body>
    </html>
  );
}
