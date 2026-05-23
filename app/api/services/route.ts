import { NextResponse } from 'next/server';
import { getServiceList } from '../../../lib/services';

export async function GET() {
  const services = await getServiceList();
  return NextResponse.json(services);
}
