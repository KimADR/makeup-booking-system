import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/user/reservations
 * Get all reservations for the current authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find the user in our database
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        reservations: {
          include: {
            makeupService: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { reservations: [] },
        { status: 200 }
      );
    }

    const reservations = user.reservations.map((reservation) => ({
      reservationId: reservation.reservationId,
      serviceName: reservation.makeupService.name,
      date: reservation.date.toISOString(),
      time: reservation.time,
      status: reservation.status,
      price: reservation.makeupService.price,
    }));

    return NextResponse.json(
      { reservations },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user reservations:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
