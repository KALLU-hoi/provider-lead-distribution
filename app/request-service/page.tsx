'use client';

import { FormEvent, useEffect, useState } from 'react';

type Service = {
  id: string;
  name: string;
};

export default function RequestServicePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadServices() {
      try {
        setError(null);
        const response = await fetch('/api/services');
        if (!response.ok) {
          throw new Error(`Failed to fetch services (${response.status})`);
        }
        const data = await response.json();
        const list = Array.isArray(data) ? data : data?.services ?? [];
        setServices(list);
        if (list.length > 0 && !serviceId) {
          setServiceId(list[0].id);
        }
      } catch (err: any) {
        setError(err?.message || 'Unable to load service options.');
      }
    }

    loadServices();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          phoneNumber,
          city,
          description,
          serviceId
        })
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Lead submission failed.');
      } else {
        setMessage('Lead submitted and providers assigned successfully.');
        setName('');
        setPhoneNumber('');
        setCity('');
        setDescription('');
      }
    } catch (err) {
      setError('Unexpected error while submitting the lead.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="text-3xl font-semibold">Request a Service</h1>
        <p className="mt-3 text-slate-600">
          Complete the form to create a lead and trigger provider allocation automatically.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-slate-700">Name</span>
              <input
                className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-sm focus:border-slate-900 focus:outline-none"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="text-slate-700">Phone Number</span>
              <input
                className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-sm focus:border-slate-900 focus:outline-none"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                required
              />
            </label>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-slate-700">City</span>
              <input
                className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-sm focus:border-slate-900 focus:outline-none"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="text-slate-700">Service Type</span>
              <select
                className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-sm focus:border-slate-900 focus:outline-none"
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
                required
              >
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-slate-700">Description</span>
            <textarea
              className="mt-1 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm focus:border-slate-900 focus:outline-none"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
            />
          </label>

          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
            Same phone number cannot create another lead for the same service. This is enforced at the database level.
          </div>

          {message ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">{message}</p> : null}
          {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? 'Submitting…' : 'Submit Lead'}
          </button>
        </form>
      </div>
    </main>
  );
}
