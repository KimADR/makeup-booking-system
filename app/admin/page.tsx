'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface Reservation {
  reservationId: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  date: string;
  time: string;
  status: string;
  price: number;
}

export default function AdminDashboard() {
  const { userId, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      router.push('/sign-in');
      return;
    }

    // Check if user is admin
    checkAdminStatus();
  }, [isLoaded, userId, router]);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/admin/check');
      
      if (!response.ok) {
        router.push('/dashboard');
        return;
      }

      const data = await response.json();
      if (!data.isAdmin) {
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
      fetchAllReservations();
    } catch (err) {
      console.error('Error checking admin status:', err);
      router.push('/dashboard');
    }
  };

  const fetchAllReservations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/reservations');
      
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

  const updateReservationStatus = async (reservationId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update reservation');
      }

      fetchAllReservations();
    } catch (err) {
      console.error('Error updating reservation:', err);
      setError('Failed to update reservation');
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

  if (!userId || !isAdmin) {
    return null;
  }

  const statusColors: Record<string, string> = {
    'Confirmed': 'bg-green-50 text-green-700 border-green-200',
    'Pending': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'Cancelled': 'bg-red-50 text-red-700 border-red-200',
  };

  const confirmedCount = reservations.filter(r => r.status === 'Confirmed').length;
  const pendingCount = reservations.filter(r => r.status === 'Pending').length;
  const totalRevenue = reservations.filter(r => r.status === 'Confirmed').reduce((sum, r) => sum + r.price, 0);

  return (
    <main className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage all bookings and reservations</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="text-lg font-semibold text-gray-900">{reservations.length}</h3>
            <p className="text-gray-600 text-sm">Total Bookings</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">✅</div>
            <h3 className="text-lg font-semibold text-gray-900">{confirmedCount}</h3>
            <p className="text-gray-600 text-sm">Confirmed</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">⏳</div>
            <h3 className="text-lg font-semibold text-gray-900">{pendingCount}</h3>
            <p className="text-gray-600 text-sm">Pending</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">💰</div>
            <h3 className="text-lg font-semibold text-gray-900">${totalRevenue.toFixed(2)}</h3>
            <p className="text-gray-600 text-sm">Revenue</p>
          </div>
        </div>

        {/* Reservations Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">All Reservations</h2>
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
              <p className="text-gray-600">No reservations yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Customer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Service</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date & Time</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Price</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reservations.map((reservation) => (
                    <tr key={reservation.reservationId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-gray-900 font-medium">{reservation.customerName}</p>
                          <p className="text-gray-600 text-sm">{reservation.customerEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">{reservation.serviceName}</span>
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
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {reservation.status !== 'Confirmed' && (
                            <button
                              onClick={() => updateReservationStatus(reservation.reservationId, 'Confirmed')}
                              className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition-colors text-sm font-medium"
                            >
                              Confirm
                            </button>
                          )}
                          {reservation.status !== 'Cancelled' && (
                            <button
                              onClick={() => updateReservationStatus(reservation.reservationId, 'Cancelled')}
                              className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 transition-colors text-sm font-medium"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
