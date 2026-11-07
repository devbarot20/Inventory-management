import PageHero from '@/components/PageHero';

export const metadata = { title: 'Privacy Policy | ForecastIQ' };

const SECTIONS = [
  ['What we collect', 'Your name, email address and a hashed password when you create an account, plus the products, stock and sales data you enter or import.'],
  ['How we use it', 'Only to run the app: signing you in, calculating forecasts and showing your own reports. We do not sell your data.'],
  ['Storage and security', 'Data is stored in a MongoDB database. Passwords are hashed and never stored in plain text. Sessions use signed tokens kept in your browser.'],
  ['Your choices', 'You can sign out at any time. To have your account and data removed, contact us and we will delete it.'],
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy" text="Plain-language summary of how your information is handled." />
      <section className="mx-auto max-w-3xl space-y-10 px-4 py-16 sm:px-6">
        {SECTIONS.map(([t, x]) => (
          <div key={t}>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">{t}</h2>
            <p className="mt-3 text-lg leading-relaxed text-slate-600 dark:text-zinc-400">{x}</p>
          </div>
        ))}
      </section>
    </>
  );
}
