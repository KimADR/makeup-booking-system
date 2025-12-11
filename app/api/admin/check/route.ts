import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/check
 * Check if the current user is an admin
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { isAdmin: false },
        { status: 401 }
      );
    }

    // Check if user has admin role in their metadata
    // For now, we'll check if they're in a hardcoded admin list or have a special email
    // You can extend this to check database entries
    
    const response = await fetch(
      `https://api.clerk.com/v1/users/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { isAdmin: false },
        { status: 200 }
      );
    }

    const user = await response.json();
    
    // Check if user has admin metadata
    const isAdmin = user.public_metadata?.role === 'admin' || 
                   user.private_metadata?.role === 'admin' ||
                   process.env.ADMIN_EMAILS?.split(',').includes(user.email_addresses[0]?.email_address);

    return NextResponse.json(
      { isAdmin: !!isAdmin },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json(
      { isAdmin: false },
      { status: 200 }
    );
  }
}
