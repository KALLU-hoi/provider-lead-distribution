import { NextResponse } from 'next/server';
import { safeProcessWebhookEvent } from '../../../lib/webhook';

export async function POST(request: Request) {
  const body = await request.json();
  const { externalId, eventType, payload } = body;

  if (!externalId || !eventType) {
    return NextResponse.json({ error: 'externalId and eventType are required' }, { status: 400 });
  }

  try {
    const event = await safeProcessWebhookEvent(externalId, eventType, payload);
    return NextResponse.json({ event });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to process webhook event' }, { status: 500 });
  }
}
