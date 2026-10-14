export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 sm:px-12">
      <header className="flex items-center justify-between border-b border-stone-300 pb-6">
        <span className="text-2xl font-semibold tracking-[0.16em]">SOLEVA</span>
        <span className="text-sm text-stone-600">Built for your next move.</span>
      </header>
      <section className="flex flex-1 flex-col justify-center py-20">
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.25em] text-stone-600">
          Project foundation
        </p>
        <h1 className="max-w-4xl text-6xl font-semibold leading-[1.05] tracking-tight sm:text-8xl">
          Move beyond ordinary.
        </h1>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-stone-600">
          The SOLEVA project is ready for development. This starter establishes
          Next.js, React, TypeScript, and Tailwind CSS for the shoes store.
        </p>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-stone-600">
          The catalogue, shopping features, database, and 3D experiences will be
          implemented in the store build.
        </p>
      </section>
      <footer className="border-t border-stone-300 pt-6 text-sm text-stone-600">
        SOLEVA · Development starter
      </footer>
    </main>
  );
}
