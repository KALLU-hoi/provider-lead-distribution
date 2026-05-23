import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 p-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="text-4xl font-semibold">Prowider Mini Lead Distribution System</h1>
        <p className="mt-4 text-lg text-slate-600">
          Core system for service requests, provider allocation, and quota-safe lead distribution.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Link href="/request-service" className="rounded-2xl bg-slate-900 px-5 py-4 text-white hover:bg-slate-700">
            Request Service
          </Link>
          <Link href="/dashboard" className="rounded-2xl bg-slate-900 px-5 py-4 text-white hover:bg-slate-700">
            Provider Dashboard
          </Link>
          <Link href="/test-tools" className="rounded-2xl bg-slate-900 px-5 py-4 text-white hover:bg-slate-700">
            Test Tools
          </Link>
        </div>
      </div>
    </main>
  );
}
