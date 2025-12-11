'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

interface Reservation {
  reservationId: string;
  serviceName: string;
  date: string;
  time: string;
  status: string;
  price: number;
}

export default function UserDashboard() {
  const { userId, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      router.push('/sign-in');
      return;
    }

    // Fetch user reservations
    fetchReservations();
  }, [isLoaded, userId, router]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/reservations');
      
      if (!response.ok) {
        throw new Error('Failed to fetch reservations');
      }

      const data = await response.json();
      setReservations(data.reservations || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B9CE2] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return null; // Will be redirected by useEffect
  }

  const statusColors: Record<string, string> = {
    'Confirmed': 'bg-green-50 text-green-700 border-green-200',
    'Pending': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'Cancelled': 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <main className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {user?.firstName || user?.emailAddresses[0]?.emailAddress}</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/services" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-2">📅</div>
            <h3 className="text-lg font-semibold text-gray-900">Book a Service</h3>
            <p className="text-gray-600 text-sm">Schedule a new makeup appointment</p>
          </Link>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">✅</div>
            <h3 className="text-lg font-semibold text-gray-900">{reservations.filter(r => r.status === 'Confirmed').length}</h3>
            <p className="text-gray-600 text-sm">Confirmed Bookings</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">⏳</div>
            <h3 className="text-lg font-semibold text-gray-900">{reservations.filter(r => r.status === 'Pending').length}</h3>
            <p className="text-gray-600 text-sm">Pending Bookings</p>
          </div>
        </div>

        {/* Reservations List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Your Reservations</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B9CE2] mx-auto mb-2"></div>
              <p className="text-gray-600">Loading reservations...</p>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          ) : reservations.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-600 mb-4">You haven't booked any services yet.</p>
              <Link href="/services" className="inline-block bg-[#3B9CE2] text-white px-6 py-2 rounded-lg hover:bg-[#3B9CE2]/90 transition-colors">
                Browse Services
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Service</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date & Time</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Price</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reservations.map((reservation) => (
                    <tr key={reservation.reservationId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="text-gray-900 font-medium">{reservation.serviceName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">
                          {format(new Date(reservation.date), 'MMM d, yyyy')} at {reservation.time}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 font-medium">${reservation.price.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${statusColors[reservation.status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                          {reservation.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Account Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-gray-900">{user?.emailAddresses[0]?.emailAddress}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <p className="text-gray-900">{user?.firstName} {user?.lastName}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
