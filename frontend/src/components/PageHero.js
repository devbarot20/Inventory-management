export default function PageHero({ eyebrow, title, text }) {
  return (
    <section className="bg-gradient-to-b from-indigo-50 to-white py-20 text-center dark:from-zinc-900 dark:to-zinc-950 sm:py-24">
      <div className="mx-auto max-w-3xl px-4">
        <span className="inline-block rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
          {eyebrow}
        </span>
        <h1 className="mt-6 text-5xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-zinc-50 sm:text-6xl">{title}</h1>
        {text && <p className="mt-6 text-xl leading-relaxed text-slate-600 dark:text-zinc-400 sm:text-2xl">{text}</p>}
      </div>
    </section>
  );
}
