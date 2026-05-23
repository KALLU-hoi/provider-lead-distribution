'use client';

import { useState } from 'react';

export default function TestToolsPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);

  async function invokeAction(body: Record<string, unknown>) {
    setLoading(true);
    setMessage(null);
    setOutput(null);

    try {
      const response = await fetch('/api/test-tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || 'Action failed.');
      } else {
        setMessage('Action completed successfully.');
        setOutput(JSON.stringify(result, null, 2));
      }
    } catch (err) {
      setMessage('Unexpected network error while executing action.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetQuota() {
    await invokeAction({ action: 'resetQuota', externalId: 'reset-quota-idempotent' });
  }

  async function handleMultipleWebhooks() {
    setLoading(true);
    setMessage(null);
    setOutput(null);

    try {
      const first = await fetch('/api/test-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resetQuota', externalId: 'reset-quota-idempotent' })
      });
      const second = await fetch('/api/test-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resetQuota', externalId: 'reset-quota-idempotent' })
      });
      const firstBody = await first.json();
      const secondBody = await second.json();
      setMessage('Webhook executed twice using the same externalId for idempotency validation.');
      setOutput(JSON.stringify({ first: firstBody, second: secondBody }, null, 2));
    } catch (err) {
      setMessage('Unexpected network error while calling webhook twice.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateLeads() {
    await invokeAction({ action: 'generateConcurrentLeads', serviceName: 'Service 1', count: 10 });
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="text-3xl font-semibold">Test Tools</h1>
        <p className="mt-3 text-slate-600">Use these tools to validate webhook idempotency and concurrency-safe lead generation.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
          <button
            type="button"
            disabled={loading}
            onClick={handleResetQuota}
            className="rounded-2xl bg-slate-900 px-5 py-4 text-left text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <p className="font-semibold">Reset Provider Quota</p>
            <p className="mt-2 text-sm text-slate-200">Simulate idempotent webhook reset for all providers.</p>
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleMultipleWebhooks}
            className="rounded-2xl bg-slate-900 px-5 py-4 text-left text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <p className="font-semibold">Call Webhook Twice</p>
            <p className="mt-2 text-sm text-slate-200">Validate repeated webhook calls do not duplicate effects.</p>
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleGenerateLeads}
            className="rounded-2xl bg-slate-900 px-5 py-4 text-left text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <p className="font-semibold">Generate 10 Leads</p>
            <p className="mt-2 text-sm text-slate-200">Simulate 10 simultaneous lead requests for Service 1.</p>
          </button>
        </div>

        {message ? <p className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">{message}</p> : null}
        {output ? (
          <pre className="mt-4 max-h-96 overflow-auto rounded-3xl border border-slate-200 bg-slate-900 p-4 text-sm text-slate-100">
            {output}
          </pre>
        ) : null}
      </div>
    </main>
  );
}
