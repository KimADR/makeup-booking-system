import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/availability
 * 
 * Query parameters:
 * - date: The date to check availability for (YYYY-MM-DD format)
 * 
 * Returns available time slots for a given date
 */
export async function GET(request: NextRequest) {
  try {
    // Get the date from query parameters
    const searchParams = request.nextUrl.searchParams;
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Validate the date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Parse the date
    const requestedDate = new Date(dateStr);
    if (isNaN(requestedDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date' },
        { status: 400 }
      );
    }

    // Define all available time slots
    const allSlots = [
      '08:00 - 09:00',
      '09:00 - 10:00',
      '10:00 - 11:00',
      '11:00 - 12:00',
      '12:00 - 13:00',
      '13:00 - 14:00',
      '14:00 - 15:00',
      '15:00 - 16:00',
    ];

    // Start all slots as available, then apply checks below
    const availability: Record<string, boolean> = {};
    allSlots.forEach((s) => (availability[s] = true));

    // Do not provide availability for past dates: mark all as unavailable
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reqDateStart = new Date(requestedDate);
    reqDateStart.setHours(0, 0, 0, 0);
    if (reqDateStart < today) {
      // all slots unavailable for past dates
      allSlots.forEach((s) => (availability[s] = false));
      return NextResponse.json({ date: dateStr, slots: availability, timezone: 'Indian/Antananarivo' }, { status: 200 });
    }

    // Mark slots that are already reserved for this date as unavailable
    try {
      const dayStart = new Date(requestedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const reservations = await prisma.reservation.findMany({
        where: {
          date: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      });

      const reservedTimes = new Set(
        reservations
          .map((r: { time: string | null }) => r.time)
          .filter((time: string | null) => time !== null && time !== undefined) as string[]
      );
      reservedTimes.forEach((t) => {
        if (availability[t] !== undefined) availability[t] = false;
      });
    } catch (err) {
      console.error('Error checking reservations in availability API:', err);
      // proceed — we won't block slots if DB check fails, but keep deterministic availability
    }

    // For the requested date being today, remove any time slots that have already started
    const now = new Date();
    const isToday = reqDateStart.getTime() === today.getTime();
    if (isToday) {
      allSlots.forEach((slot) => {
        const start = slot.split('-')[0].trim(); // e.g. '08:00'
        const [h, m] = start.split(':').map((x) => parseInt(x, 10));
        const slotStart = new Date(requestedDate);
        slotStart.setHours(h, m, 0, 0);
        if (slotStart <= now) {
          availability[slot] = false;
        }
      });
    }

    return NextResponse.json(
      {
        date: dateStr,
        slots: availability,
        timezone: 'Indian/Antananarivo'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API /api/availability error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
