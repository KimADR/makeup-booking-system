'use client';

import { Suspense } from 'react';
import BookingInner from './BookingInner';

export default function BookingPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8 pt-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B9CE2] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    }>
      <BookingInner />
    </Suspense>
  );
} 