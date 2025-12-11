import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/reservations
 * Get all reservations (admin only)
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

    // Check if user is admin
    const isAdmin = await checkAdminStatus(userId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get all reservations
    const reservations = await prisma.reservation.findMany({
      include: {
        user: true,
        makeupService: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    const formattedReservations = reservations.map((reservation) => ({
      reservationId: reservation.reservationId,
      customerName: reservation.user.name,
      customerEmail: reservation.user.email,
      serviceName: reservation.makeupService.name,
      date: reservation.date.toISOString(),
      time: reservation.time,
      status: reservation.status,
      price: reservation.makeupService.price,
    }));

    return NextResponse.json(
      { reservations: formattedReservations },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

async function checkAdminStatus(userId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.clerk.com/v1/users/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return false;
    }

    const user = await response.json();
    
    return (user.public_metadata?.role === 'admin' || 
            user.private_metadata?.role === 'admin' ||
            process.env.ADMIN_EMAILS?.split(',').includes(user.email_addresses[0]?.email_address)) ?? false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}
