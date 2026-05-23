import { NextResponse } from 'next/server';
import { getProviderDashboard } from '../../../lib/dashboard';

export async function GET() {
  const dashboard = await getProviderDashboard();
  return NextResponse.json(dashboard, {
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}
