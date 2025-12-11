import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/admin/reservations/[id]
 * Update a reservation status (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['Confirmed', 'Pending', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update reservation
    const reservation = await prisma.reservation.update({
      where: {
        reservationId: id,
      },
      data: {
        status: status,
      },
    });

    return NextResponse.json(
      { reservation },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating reservation:', error);
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
