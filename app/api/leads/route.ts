import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { createLeadAndAllocate, AllocationError } from '../../../lib/lead-allocation';

export async function POST(request: Request) {
  const body = await request.json();
  const { name, phoneNumber, city, description, serviceId } = body;

  if (!name || !phoneNumber || !city || !serviceId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const allocation = await createLeadAndAllocate({
      name,
      phoneNumber,
      city,
      description,
      serviceId
    });

    return NextResponse.json(allocation, { status: 201 });
  } catch (error) {
    if (error instanceof AllocationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Duplicate lead for this phone number and service' }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
