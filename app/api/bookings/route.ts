import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/bookings
 * 
 * Creates a new booking reservation
 * 
 * Request body:
 * {
 *   service: { id: string, name: string, price: number, duration: string }
 *   date: string (YYYY-MM-DD format)
 *   time: string (HH:MM - HH:MM format)
 *   customer: { name: string, email: string, phone: string, address: string, notes?: string }
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // Validate required fields
    const { service, date, time, customer } = body;

    if (!service?.id || !date || !time || !customer?.name || !customer?.email || !customer?.phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Parse the date
    const bookingDate = new Date(date);
    if (isNaN(bookingDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Create or find the user
    const user = await prisma.user.upsert({
      where: { email: customer.email },
      update: {
        name: customer.name,
        phone: customer.phone,
      },
      create: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    });

    // Ensure the service exists
    const makeupService = await prisma.makeupService.upsert({
      where: { serviceId: service.id },
      update: {
        name: service.name,
        price: service.price,
        duration: service.duration ? parseInt(service.duration) : 60, // Convert "2h" to minutes or use default
      },
      create: {
        serviceId: service.id,
        name: service.name,
        price: service.price,
        duration: service.duration ? parseInt(service.duration) : 60,
      },
    });

    // Create the reservation (store selected time as well)
    const reservation = await prisma.reservation.create({
      data: {
        date: bookingDate,
        time,
        status: 'Confirmed',
        userId: user.id,
        serviceId: makeupService.serviceId,
      },
    });

    // Generate a booking reference
    const bookingReference = `RVT-${reservation.reservationId.slice(0, 8).toUpperCase()}`;

    return NextResponse.json(
      {
        bookingReference,
        reservationId: reservation.reservationId,
        message: 'Booking created successfully',
        booking: {
          id: reservation.reservationId,
          date: reservation.date,
          status: reservation.status,
          service: {
            id: makeupService.serviceId,
            name: makeupService.name,
            price: makeupService.price,
          },
          customer: {
            name: user.name,
            email: user.email,
            phone: user.phone,
          },
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('API /api/bookings error:', err);
    
    // Return more specific error messages
    if (err instanceof Error) {
      if (err.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'A booking with these details already exists' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create booking. Please try again.' },
      { status: 500 }
    );
  }
}
