import Link from 'next/link';
import { REPO_URL, SITE_NAME } from '@/lib/site';

const COLUMNS = [
  {
    title: 'Use case',
    links: [
      { label: 'Demand forecasting', href: '/#features' },
      { label: 'Stockout risk', href: '/#features' },
      { label: 'Scenario planning', href: '/#features' },
      { label: 'Accuracy tracking', href: '/#features' },
    ],
  },
  {
    title: 'Product',
    links: [
      { label: 'Home', href: '/' },
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Blog', href: '/blog' },
      { label: 'Log in', href: '/dashboard' },
      { label: 'Sign up', href: '/dashboard' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About us', href: '/about' },
      { label: 'Contact us', href: '/contact' },
      { label: 'Blog', href: '/blog' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    title: 'Utility',
    links: [
      { label: 'FAQ', href: '/#faq' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Source code', href: REPO_URL, external: true },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-black text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-5">
          <div>
            <Link href="/" className="text-3xl font-bold tracking-tight text-white">
              Forecast<span className="text-indigo-400">IQ</span>
            </Link>
            <p className="mt-4 max-w-xs text-base leading-relaxed text-zinc-500">
              Demand forecasting and stockout alerts for flash sales.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-base font-semibold text-white">{col.title}</h3>
              <ul className="mt-5 space-y-3.5">
                {col.links.map((l) => (
                  <li key={`${col.title}-${l.label}`}>
                    {l.external ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-base transition hover:text-white">
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className="text-base transition hover:text-white">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-6 border-t border-zinc-800 pt-8 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-500">
            <span>© {SITE_NAME}. All rights reserved.</span>
            <Link href="/privacy" className="underline underline-offset-4 hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="underline underline-offset-4 hover:text-white">Terms of Service</Link>
          </div>
          <div className="flex gap-2">
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="flex h-11 w-11 items-center justify-center border border-zinc-800 text-zinc-500 transition hover:border-zinc-600 hover:text-white">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a11.5 11.5 0 00-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 015.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0012 .5z" /></svg>
            </a>
            <Link href="/contact" aria-label="Contact" className="flex h-11 w-11 items-center justify-center border border-zinc-800 text-zinc-500 transition hover:border-zinc-600 hover:text-white">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
