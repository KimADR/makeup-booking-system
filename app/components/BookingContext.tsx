'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Toast } from '@/app/components/Toast';

interface BookingPageProps {
  children: React.ReactNode;
  services: Record<string, {
    name: string;
    price: number;
    duration: string;
    description: string;
  }>;
}

export function BookingContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useBookingParams() {
  const searchParams = useSearchParams();
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const serviceId = searchParams.get('service') || 'bridal-trial';

  return { serviceId, userId, isLoaded, router, searchParams };
}
