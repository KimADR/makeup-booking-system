# Authentication & Admin System

## Overview

The makeup booking system now includes a complete authentication system with role-based access control using Clerk.

## Features

### 1. **User Authentication**
- Users must be signed in to book appointments
- Sign up and Sign in pages are available at `/sign-up` and `/sign-in`
- Protected booking page redirects unauthenticated users to sign in

### 2. **User Dashboard** (`/dashboard`)
- View all personal reservations
- Track booking status (Pending, Confirmed, Cancelled)
- Quick actions to book new services
- Account information display
- Only accessible to authenticated users

### 3. **Admin Dashboard** (`/admin`)
- View all reservations across the platform
- Update reservation statuses
- View customer information
- Revenue tracking
- Only accessible to admin users

## Setup

### Environment Variables

Add the following to your `.env.local` file:

```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Admin Emails (comma-separated list)
ADMIN_EMAILS=admin@example.com,admin2@example.com

# Database
DATABASE_URL=your_database_url
```

### Making a User an Admin

You have two options:

#### Option 1: Using Admin Emails (Environment Variable)
Add the user's email to the `ADMIN_EMAILS` environment variable.

#### Option 2: Using Clerk Metadata
In the Clerk Dashboard, go to the user's profile and add to public metadata:
```json
{
  "role": "admin"
}
```

Or in the private metadata:
```json
{
  "role": "admin"
}
```

## API Endpoints

### User Endpoints

**GET /api/user/reservations**
- Returns all reservations for the authenticated user
- Requires authentication
- Returns: `{ reservations: Array<Reservation> }`

### Admin Endpoints

All admin endpoints require the user to have admin role.

**GET /api/admin/check**
- Check if the current user is an admin
- Returns: `{ isAdmin: boolean }`

**GET /api/admin/reservations**
- Get all reservations in the system
- Returns: `{ reservations: Array<Reservation> }`
- Requires admin role

**PATCH /api/admin/reservations/[id]**
- Update a reservation status
- Body: `{ status: "Confirmed" | "Pending" | "Cancelled" }`
- Returns: `{ reservation: Reservation }`
- Requires admin role

## User Flows

### Booking Flow
1. User clicks "Book Service" on the services page
2. If not authenticated, redirect to sign in
3. Complete the booking form
4. Confirm booking
5. Toast notification shows "Reservation confirmed!"
6. Form is cleared and user returns to step 1

### Dashboard Flow
1. Authenticated user clicks "Dashboard" in navbar
2. View all personal reservations
3. See booking statuses
4. Quick link to book new services

### Admin Dashboard Flow
1. Admin user sees "🔐 Admin" button in navbar
2. Click admin button to go to `/admin`
3. View statistics (total bookings, confirmed, pending, revenue)
4. Click "Confirm" or "Cancel" buttons to update reservation statuses
5. Changes are reflected in real-time

## Security

- All protected routes check authentication with Clerk
- Admin endpoints verify user role before granting access
- Sensitive data is protected by role-based access control
- Database queries use parameterized statements to prevent SQL injection

## Customization

### Adding Custom Admin Checks
To add additional admin logic, modify the `checkAdminStatus()` function in:
- `/app/api/admin/check/route.ts`
- `/app/api/admin/reservations/route.ts`
- `/app/api/admin/reservations/[id]/route.ts`

### Customizing Dashboard UI
- User Dashboard: `/app/dashboard/page.tsx`
- Admin Dashboard: `/app/admin/page.tsx`

## Troubleshooting

**Users not seeing admin button:**
- Ensure their email is in `ADMIN_EMAILS` or has metadata set in Clerk
- Check environment variables are loaded correctly
- Clear browser cache and refresh

**Getting 403 Forbidden on admin endpoints:**
- User is not marked as admin
- Clerk secret key is not set or incorrect
- API call is missing proper authentication headers

## Next Steps

Consider implementing:
- Email notifications for booking confirmations
- SMS reminders for appointments
- Advanced filtering/search in admin dashboard
- Export booking data to CSV/PDF
- Multi-language support
