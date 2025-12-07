import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // TODO: Replace with real persistence (database/email/etc.)
    const bookingReference = `RVT-${Math.random().toString(36).slice(2, 9).toUpperCase()}`;

    // Return a lightweight success response for local/dev testing
    return NextResponse.json({ bookingReference, payload: body }, { status: 201 });
  } catch (err) {
    console.error('API /api/bookings error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
