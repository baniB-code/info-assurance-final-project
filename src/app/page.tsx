import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16">
      <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/70 p-10 text-center shadow-2xl shadow-slate-950/40 backdrop-blur">
        <p className="mb-4 text-sm uppercase tracking-[0.2em] text-cyan-300">
          Information Assurance Final Project
        </p>
        <h1 className="text-4xl font-bold text-white md:text-5xl">Sentinel Notes</h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-300">
          A secure note-taking platform with hardened authentication, audit logs,
          and WebGoat lesson integration.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/auth"
            className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Sign In
          </Link>
          <Link
            href="/auth?mode=signup"
            className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-100 transition hover:border-slate-500"
          >
            Get Started
          </Link>
        </div>
      </div>
      <div className="mt-5 text-center">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Developers</p>
        <p className="mt-2 text-sm text-slate-600">
          Carpio, Isaiah James R. · Hermino, Christian D. · Ramos, Mitzie Anne V. ·
          Moncada, Evann Luke F.
        </p>
      </div>
      <p className="mt-6 text-xs text-slate-400">
        Built with Next.js, Supabase, Tailwind CSS, and secure-by-default patterns.
      </p>
    </main>
  );
}
