'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Toast } from '@/app/components/Toast';

interface BookingStep {
  title: string;
  component: React.ReactNode;
}

const services: Record<string, {
  name: string;
  price: number;
  duration: string;
  description: string;
}> = {
  'bridal-trial': {
    name: 'Bridal trial makeup',
    price: 150.00,
    duration: '1h',
    description: 'Test and refine your dream wedding day look with a trial session tailored to your preferences. Perfect for ensuring everything is flawless on the big day.'
  },
  'bridal': {
    name: 'Bridal makeup',
    price: 200.00,
    duration: '2h',
    description: 'Professional bridal makeup service for your special day.'
  },
  'special-occasion': {
    name: 'Special occasion makeup',
    price: 100.00,
    duration: '1h',
    description: 'Look your best for proms, galas, or any memorable event with professional makeup tailored to the occasion.'
  }
};

export function BookingPage() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('service') || 'bridal-trial';
  const service = services[serviceId];

  // Check authentication
  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      // Redirect to sign in with return URL
      router.push(`/sign-in?redirect_url=/booking?service=${serviceId}`);
    }
  }, [isLoaded, userId, router, serviceId]);

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    date: '',
    time: '',
    notes: '',
    rememberContact: false,
    showDifferentAddress: false,
    showNotes: false
  });

  // Helper to get the Monday of the week for a given date (week starts on Mon)
  const getWeekStart = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));

  const [availableTimeSlots] = useState<Record<string, boolean>>({
    '08:00 - 09:00': true,
    '09:00 - 10:00': true,
    '10:00 - 11:00': false,
    '11:00 - 12:00': true,
    '12:00 - 13:00': true,
    '13:00 - 14:00': false,
    '14:00 - 15:00': true,
    '15:00 - 16:00': true,
  });

  const [selectedDateSlots, setSelectedDateSlots] = useState<Record<string, boolean> | null>(null);
  const [slotsCache, setSlotsCache] = useState<Record<string, Record<string, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Rest of the logic from the original booking page...
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      time: name === 'time' ? value : prev.time,
    }));
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime('');
    checkAvailability(date);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setFormData(prev => ({ ...prev, time }));
  };

  const handlePrevWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const handleNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const checkAvailability = async (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    if (slotsCache[dateKey]) {
      setSelectedDateSlots(slotsCache[dateKey]);
      return;
    }

    try {
      const response = await fetch(`/api/availability?date=${dateKey}`);
      if (!response.ok) return;

      const data = await response.json();
      const slots = data.slots;
      setSlotsCache(prev => ({ ...prev, [dateKey]: slots }));
      setSelectedDateSlots(slots);
    } catch (error) {
      console.error('Error checking availability:', error);
      setSelectedDateSlots(availableTimeSlots);
    }
  };

  const confirmBooking = async () => {
    try {
      setIsSubmitting(true);
      setShowConfirmationModal(false);

      const bookingData = {
        service: {
          id: serviceId,
          name: service.name,
          price: service.price,
          duration: service.duration
        },
        date: format(selectedDate!, 'yyyy-MM-dd'),
        time: selectedTime,
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          notes: formData.notes
        }
      };

      if (formData.rememberContact) {
        localStorage.setItem('rovart_contact_info', JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address
        }));
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        throw new Error('Failed to create booking');
      }

      const result = await response.json();
      sessionStorage.setItem('last_booking_ref', result.bookingReference);

      setShowSuccessToast(true);

      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          date: '',
          time: '',
          notes: '',
          rememberContact: false,
          showDifferentAddress: false,
          showNotes: false
        });
        setSelectedDate(null);
        setSelectedTime('');
        setCurrentStep(0);
      }, 2000);
    } catch (error) {
      console.error('Booking submission failed:', error);
      setSubmissionError('Failed to create booking. Please try again.');
      setShowConfirmationModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\s/g, '');
    const phoneRegex = /^\d{9}$/;
    return phoneRegex.test(cleaned);
  };

  const validateName = (name: string): boolean => {
    return name.trim().length >= 2;
  };

  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};

    if (currentStep === 2) {
      if (!validateName(formData.name)) {
        errors.name = 'Name must be at least 2 characters';
      }
      if (!validateEmail(formData.email)) {
        errors.email = 'Please enter a valid email';
      }
      if (!validatePhone(formData.phone)) {
        errors.phone = 'Phone must be 9 digits';
      }
      if (!formData.address) {
        errors.address = 'Address is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && (!selectedDate || !selectedTime)) {
      setValidationErrors({ 
        dateTime: 'Please select both a date and time to continue' 
      });
      return;
    }

    if (currentStep === 2) {
      if (!validateCurrentStep()) {
        return;
      }
    }

    setValidationErrors({});
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setValidationErrors({});
    }
  };

  const handleClose = () => {
    window.history.back();
  };

  const handleSubmit = async () => {
    setShowConfirmationModal(true);
  };

  const cancelBooking = () => {
    setShowConfirmationModal(false);
  };

  // Placeholder for form components - these would normally be defined in the main file
  const ServiceDetails = <div>Service Details</div>;
  const DateTimeSelection = <div>Date & Time Selection</div>;
  const ContactForm = <div>Contact Form</div>;
  const Confirmation = <div>Confirmation</div>;

  const steps: BookingStep[] = [
    { title: 'Book a service', component: ServiceDetails },
    { title: 'Date & Time', component: DateTimeSelection },
    { title: 'Contact Information', component: ContactForm },
    { title: 'Summary', component: Confirmation }
  ];

  const ConfirmationModal = showConfirmationModal && <div>Confirmation Modal</div>;

  return (
    <>
      {!isLoaded ? (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8 pt-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B9CE2] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
      ) : !userId ? (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8 pt-24">
          <div className="w-full max-w-[580px] mx-auto">
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
              <p className="text-gray-600 mb-6">You need to sign in to book a service.</p>
              <button
                onClick={() => router.push(`/sign-in?redirect_url=/booking?service=${serviceId}`)}
                className="bg-[#3B9CE2] text-white py-4 px-6 rounded-xl text-lg font-medium hover:bg-[#3B9CE2]/90 transition-all w-full mb-3"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push(`/sign-up?redirect_url=/booking?service=${serviceId}`)}
                className="border border-[#3B9CE2] text-[#3B9CE2] py-4 px-6 rounded-xl text-lg font-medium hover:bg-[#3B9CE2]/5 transition-all w-full"
              >
                Create Account
              </button>
            </div>
          </div>
        </main>
      ) : (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8 pt-24">
          <div className="w-full max-w-[580px] mx-auto">
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
              <p className="text-gray-600">Booking interface...</p>
            </div>
          </div>
          {ConfirmationModal}
          {showSuccessToast && (
            <Toast 
              message="Réservation confirmée avec succès! 🎉" 
              type="success" 
              duration={4000}
              onClose={() => setShowSuccessToast(false)}
            />
          )}
        </main>
      )}
    </>
  );
}
