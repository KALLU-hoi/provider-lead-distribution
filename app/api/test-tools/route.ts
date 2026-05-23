import { NextResponse } from 'next/server';
import { getServiceIdByName, createConcurrentLeads } from '../../../lib/test-tools';
import { safeProcessWebhookEvent } from '../../../lib/webhook';

export async function POST(request: Request) {
  const body = await request.json();
  const { action, externalId, serviceId, serviceName, count } = body;

  if (action === 'resetQuota') {
    if (!externalId) {
      return NextResponse.json({ error: 'externalId is required for idempotent webhook reset' }, { status: 400 });
    }

    const event = await safeProcessWebhookEvent(externalId, 'RESET_QUOTA', { reason: 'manual reset' });
    return NextResponse.json({ event, message: 'Quota reset processed' });
  }

  if (action === 'generateConcurrentLeads') {
    const requestedCount = typeof count === 'number' && count > 0 ? count : 10;
    const resolvedServiceId = serviceId ?? (await getServiceIdByName(serviceName ?? 'Service 1'));
    const results = await createConcurrentLeads(resolvedServiceId, requestedCount);

    return NextResponse.json({ results });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
