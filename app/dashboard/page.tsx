'use client';

import { useEffect, useState } from 'react';

type AssignedLead = {
  id: string;
  name: string;
  phoneNumber: string;
  city: string;
  description?: string;
  assignedAt: string;
  kind: string;
};

type ProviderDashboard = {
  id: string;
  name: string;
  monthlyQuota: number;
  quotaRemaining: number;
  receivedCount: number;
  assignedLeads: AssignedLead[];
};

export default function DashboardPage() {
  const [providers, setProviders] = useState<ProviderDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  async function loadDashboard() {
    try {
      const response = await fetch('/api/dashboard', { cache: 'no-store' });
      const data = await response.json();
      setProviders(data);
      setLastUpdated(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      setError('Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    const interval = window.setInterval(loadDashboard, 5000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Provider Dashboard</h1>
            <p className="mt-3 text-slate-600">Live provider allocation metrics and assigned leads.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {lastUpdated ? `Last refreshed at ${lastUpdated}` : 'Refreshing every 5 seconds'}
          </div>
        </div>

        {error ? <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">{error}</p> : null}

        {loading ? (
          <div className="mt-6 text-slate-600">Loading provider data…</div>
        ) : (
          <div className="mt-6 space-y-6">
            {providers.map((provider) => (
              <div key={provider.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">{provider.name}</h2>
                    <p className="mt-1 text-slate-600">Assigned leads: {provider.receivedCount}</p>
                  </div>
                  <div className="inline-flex flex-wrap gap-3 text-sm">
                    <span className="rounded-full bg-slate-900 px-4 py-2 text-white">Quota remaining: {provider.quotaRemaining}</span>
                    <span className="rounded-full bg-slate-200 px-4 py-2 text-slate-800">Monthly quota: {provider.monthlyQuota}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <h3 className="text-lg font-semibold">Assigned Leads</h3>
                  {provider.assignedLeads.length === 0 ? (
                    <p className="text-slate-600">No leads assigned yet.</p>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {provider.assignedLeads.map((lead) => (
                        <div key={lead.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold">{lead.name}</p>
                              <p className="text-sm text-slate-500">{lead.city}</p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-wide text-slate-600">
                              {lead.kind}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-700">{lead.description || 'No description provided'}</p>
                          <p className="mt-3 text-xs text-slate-500">Phone: {lead.phoneNumber}</p>
                          <p className="text-xs text-slate-500">Assigned: {new Date(lead.assignedAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
