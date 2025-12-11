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

// Validation utilities
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  // Require exactly 9 digits (user will type number without country code)
  const cleaned = phone.replace(/\s/g, '');
  const phoneRegex = /^\d{9}$/;
  return phoneRegex.test(cleaned);
};

const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};

export default function BookingInner() {
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

  // Default selected date is today
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  // Default week start is the current week's Monday
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));

  const [availableTimeSlots] = useState<Record<string, boolean>>({
    '08:00 - 09:00': true,
    '09:00 - 10:00': true,
    '10:00 - 11:00': false, // Example of an unavailable slot
    '11:00 - 12:00': true,
    '12:00 - 13:00': true,
    '13:00 - 14:00': false,
    '14:00 - 15:00': true,
    '15:00 - 16:00': true,
  });

  // Selected date's slots and a small cache so availability can be per-date
  const [selectedDateSlots, setSelectedDateSlots] = useState<Record<string, boolean> | null>(null);
  const [slotsCache, setSlotsCache] = useState<Record<string, Record<string, boolean>>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    const savedContactInfo = localStorage.getItem('rovart_contact_info');
    if (savedContactInfo) {
      const parsed = JSON.parse(savedContactInfo);
      setFormData(prev => ({
        ...prev,
        ...parsed,
        rememberContact: true
      }));
    }
  }, []);

  // Redirect to home if an invalid service id is provided.
  useEffect(() => {
    if (!service) {
      router.push('/');
    }
  }, [service, router]);

  // When selectedDate is set (including initial load), populate the form date and fetch availability
  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: format(selectedDate, 'yyyy-MM-dd') }));
      // Load availability for the default selected date
      checkAvailability(selectedDate);
    }
  }, [selectedDate]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setFormData(prev => ({ ...prev, time }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
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
    // Validate before moving to next step
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
    // Prevent advancing past the last step
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setValidationErrors({});
    }
  };

  const handleClose = () => {
    // Navigate back to the home page or previous page
    window.history.back();
  };

  const handleSubmit = async () => {
    // Show confirmation modal instead of immediate submission
    setShowConfirmationModal(true);
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
      // Fall back to default availability on error
      setSelectedDateSlots(availableTimeSlots);
    }
  };

  const confirmBooking = async () => {
    try {
      setIsSubmitting(true);
      setShowConfirmationModal(false);

      // Prepare booking data
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

      // Save to localStorage if remember contact is checked
      if (formData.rememberContact) {
        localStorage.setItem('rovart_contact_info', JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address
        }));
      }

      // TODO: Replace with your actual API endpoint
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
      
      // Store booking reference
      sessionStorage.setItem('last_booking_ref', result.bookingReference);

      // Show success toast
      setShowSuccessToast(true);

      // Reset form
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
      setShowConfirmationModal(true); // Reopen modal to retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelBooking = () => {
    setShowConfirmationModal(false);
    setSubmissionError(null);
  };

  // Service Details Component
  const ServiceDetails = (
    <div className="space-y-6">
      <div className="flex items-start space-x-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900">{service.name}</h2>
          <p className="mt-2 text-gray-600">{service.description}</p>
          <div className="mt-4 flex items-center text-gray-500">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>The service will be performed at the headquarters of Rov&apos;Art</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-semibold text-gray-900">${service.price.toFixed(2)}</div>
          <div className="text-sm text-gray-500">{service.duration}</div>
        </div>
      </div>
      <button
        onClick={handleNext}
        className="w-full bg-[#3B9CE2] text-white py-4 px-6 rounded-xl text-lg font-medium hover:bg-[#3B9CE2]/90 transition-all"
      >
        Next step
      </button>
    </div>
  );

  const DateTimeSelection = (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 p-2"
          aria-label="Close booking"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={handlePrevWeek}
            className="text-gray-600 hover:text-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button className="text-gray-900 text-lg font-medium flex items-center">
            {format(currentWeekStart, 'd')} - {format(new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000), 'd MMM yyyy')}
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button 
            onClick={handleNextWeek}
            className="text-gray-600 hover:text-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0 text-center mb-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-sm text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0 text-center mb-8">
          {Array.from({ length: 7 }).map((_, i) => {
            const dateObj = new Date(currentWeekStart.getTime());
            dateObj.setDate(currentWeekStart.getDate() + i);
            const dayNum = format(dateObj, 'd');
            const iso = format(dateObj, 'yyyy-MM-dd');
            const isSelected = selectedDate ? format(selectedDate, 'yyyy-MM-dd') === iso : false;
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const dateStart = new Date(dateObj);
            dateStart.setHours(0, 0, 0, 0);
            const isPast = dateStart < todayStart;
            return (
              <button
                key={iso}
                onClick={() => { if (!isPast) handleDateSelect(dateObj); }}
                disabled={isPast}
                className={`
                  py-3 text-lg px-3
                  ${isSelected ? 'text-white bg-[#3B9CE2] rounded-full mx-2' : isPast ? 'text-gray-300 cursor-not-allowed opacity-60' : 'text-gray-900'}
                `}
              >
                {dayNum}
              </button>
            );
          })}
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="text-gray-900 font-medium mb-3">Morning</h4>
            <div className="space-y-2">
              {['08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00'].map((time) => {
                const now = new Date();
                let slotInPast = false;
                if (selectedDate) {
                  const start = time.split('-')[0].trim();
                  const [h, m] = start.split(':').map((x) => parseInt(x, 10));
                  const slotStart = new Date(selectedDate);
                  slotStart.setHours(h, m, 0, 0);
                  if (slotStart <= now) slotInPast = true;
                }
                const disabledByTime = slotInPast;
                const effectiveAvailable = (selectedDateSlots ?? availableTimeSlots)[time] && !disabledByTime;
                return (
                <button
                  key={time}
                  onClick={() => handleTimeSelect(time)}
                  disabled={!effectiveAvailable}
                  className={`
                    w-full py-3 px-4 rounded-xl text-sm transition-colors
                    ${selectedTime === time 
                      ? 'bg-[#3B9CE2] text-white' 
                      : !effectiveAvailable
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  {time}
                  {!effectiveAvailable && ' (Unavailable)'}
                </button>
              );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-gray-900 font-medium mb-3">Afternoon</h4>
            <div className="space-y-2">
              {['12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00'].map((time) => {
                const now = new Date();
                let slotInPast = false;
                if (selectedDate) {
                  const start = time.split('-')[0].trim();
                  const [h, m] = start.split(':').map((x) => parseInt(x, 10));
                  const slotStart = new Date(selectedDate);
                  slotStart.setHours(h, m, 0, 0);
                  if (slotStart <= now) slotInPast = true;
                }
                const disabledByTime = slotInPast;
                const effectiveAvailable = (selectedDateSlots ?? availableTimeSlots)[time] && !disabledByTime;
                return (
                <button
                  key={time}
                  onClick={() => handleTimeSelect(time)}
                  disabled={!effectiveAvailable}
                  className={`
                    w-full py-3 px-4 rounded-xl text-sm transition-colors
                    ${selectedTime === time 
                      ? 'bg-[#3B9CE2] text-white' 
                      : !effectiveAvailable
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  {time}
                  {!effectiveAvailable && ' (Unavailable)'}
                </button>
              );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleBack}
          className="flex-1 border border-gray-200 py-4 px-6 rounded-xl text-lg font-medium text-gray-700 hover:bg-gray-50 transition-all"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!selectedDate || !selectedTime}
          className="flex-1 bg-[#3B9CE2] text-white py-4 px-6 rounded-xl text-lg font-medium hover:bg-[#3B9CE2]/90 transition-all disabled:bg-gray-200 disabled:cursor-not-allowed"
        >
          Next step
        </button>
      </div>

      {validationErrors.dateTime && (
        <p className="text-red-600 text-sm text-center">{validationErrors.dateTime}</p>
      )}
    </div>
  );

  const ContactForm = (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-bold text-gray-900 mb-2">
            Name *
          </label>
            <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-xl text-base text-gray-900 focus:ring-2 focus:ring-[#3B9CE2] focus:border-transparent transition-all ${
              validationErrors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'
            }`}
            placeholder="Enter your full name"
          />
          {validationErrors.name && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18.101 12.93a1 1 0 00-1.414-1.414L10 15.586l-6.687-6.687a1 1 0 00-1.414 1.414l8 8a1 1 0 001.414 0l10-10z" clipRule="evenodd" />
              </svg>
              {validationErrors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-2">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border rounded-xl text-base text-gray-900 focus:ring-2 focus:ring-[#3B9CE2] focus:border-transparent transition-all ${
              validationErrors.email ? 'border-red-400 bg-red-50' : 'border-gray-200'
            }`}
            placeholder="Enter your email address"
          />
          {validationErrors.email && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              {validationErrors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-bold text-gray-900 mb-2">
            Phone *
          </label>
          <div className="flex">
            <select
              className="px-4 py-3 border border-gray-200 rounded-xl rounded-r-none border-r-0 text-base focus:ring-2 focus:ring-[#3B9CE2] focus:border-transparent transition-all"
              value="+261"
              disabled
            >
              <option value="+261">🇲🇬 +261</option>
            </select>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={formData.phone}
              onChange={handleInputChange}
              className={`flex-1 px-4 py-3 border rounded-xl rounded-l-none text-base text-gray-900 focus:ring-2 focus:ring-[#3B9CE2] focus:border-transparent transition-all ${
                validationErrors.phone ? 'border-red-400 bg-red-50' : 'border-gray-200'
              }`}
              placeholder="321234567"
            />
          </div>
          {validationErrors.phone && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              {validationErrors.phone}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-bold text-gray-900 mb-2">
            Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border rounded-xl text-base text-gray-900 focus:ring-2 focus:ring-[#3B9CE2] focus:border-transparent transition-all ${
              validationErrors.address ? 'border-red-400 bg-red-50' : 'border-gray-200'
            }`}
            placeholder="Enter your address"
          />
          {validationErrors.address && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              {validationErrors.address}
            </p>
          )}
        </div>

        <button 
          type="button"
          className="text-[#3B9CE2] text-sm flex items-center hover:text-[#3B9CE2]/80"
          onClick={() => setFormData(prev => ({ ...prev, showDifferentAddress: !prev.showDifferentAddress }))}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Different address for invoice
        </button>

        <button 
          type="button"
          className="text-[#3B9CE2] text-sm flex items-center hover:text-[#3B9CE2]/80"
          onClick={() => setFormData(prev => ({ ...prev, showNotes: !prev.showNotes }))}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Additional notes
        </button>

        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            id="rememberContact"
            name="rememberContact"
            checked={formData.rememberContact}
            onChange={handleInputChange}
            className="h-5 w-5 text-[#3B9CE2] border-gray-300 rounded focus:ring-[#3B9CE2] transition-all"
          />
          <label htmlFor="rememberContact" className="ml-2 text-sm text-gray-700">
            Remember my contact information
          </label>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleBack}
          className="flex-1 border border-gray-200 py-4 px-6 rounded-xl text-lg font-medium text-gray-700 hover:bg-gray-50 transition-all"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!formData.name || !formData.email || !formData.phone || isSubmitting}
          className="flex-1 bg-[#3B9CE2] text-white py-4 px-6 rounded-xl text-lg font-medium hover:bg-[#3B9CE2]/90 transition-all disabled:bg-gray-200 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Submitting...
            </div>
          ) : (
            'Next step'
          )}
        </button>
      </div>

      {submissionError && (
        <div className="text-red-500 text-sm mt-2">
          {submissionError}
        </div>
      )}
    </div>
  );

  const Confirmation = (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="border-b pb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
              <p className="mt-1 text-gray-600">{service.description}</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-semibold text-gray-900">${service.price.toFixed(2)}</div>
              <div className="text-sm text-gray-500">{service.duration}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-[#3B9CE2] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="font-medium text-gray-900">
                  {selectedDate && format(selectedDate, 'EEE, d MMM yyyy')}
                </div>
                <div className="text-sm text-gray-500">
                  The service will be performed between {selectedTime} and will take {service.duration}
                </div>
              </div>
            </div>
            <button className="text-[#3B9CE2]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-[#3B9CE2] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div>
                <div className="font-medium text-gray-900">{formData.name}</div>
                <div className="text-sm text-gray-500">
                  +261 {formData.phone}<br />
                  {formData.email}
                </div>
              </div>
            </div>
            <button className="text-[#3B9CE2]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-[#3B9CE2] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="font-medium text-gray-900">{formData.address}</div>
            </div>
            <button className="text-[#3B9CE2]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-500 text-center">
          This site is protected by reCAPTCHA and the Google{' '}
          <a href="#" className="text-[#3B9CE2]">Privacy Policy</a> and{' '}
          <a href="#" className="text-[#3B9CE2]">Terms of Service</a> apply.
        </p>
        <button
          onClick={handleSubmit}
          className="w-full bg-[#3B9CE2] text-white py-4 px-6 rounded-xl text-lg font-medium hover:bg-[#3B9CE2]/90 transition-all"
        >
          Confirm
        </button>
      </div>
    </div>
  );

  const steps: BookingStep[] = [
    { title: 'Book a service', component: ServiceDetails },
    { title: 'Date & Time', component: DateTimeSelection },
    { title: 'Contact Information', component: ContactForm },
    { title: 'Summary', component: Confirmation }
  ];

  // Confirmation Modal
  const ConfirmationModal = showConfirmationModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#3B9CE2]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#3B9CE2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Your Booking</h3>
            <p className="text-gray-600 text-sm">
            Please review your booking details below before confirming. You will receive a confirmation email after booking.
          </p>
        </div>

        <div className="space-y-4 mb-6 py-4 border-y border-gray-200">
          <div className="flex items-center text-sm">
            <svg className="w-5 h-5 text-[#3B9CE2] mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-900 font-medium">{service.name}</span>
          </div>
          <div className="flex items-center text-sm">
            <svg className="w-5 h-5 text-[#3B9CE2] mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v2h16V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a2 2 0 012 2v2H4V9a2 2 0 012-2h8zm8 8v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2h16z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-900">
              {selectedDate && format(selectedDate, 'MMM d, yyyy')} at {selectedTime}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <svg className="w-5 h-5 text-[#3B9CE2] mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            <span className="text-gray-900 font-medium">${service.price.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={confirmBooking}
            disabled={isSubmitting}
            className="w-full bg-[#3B9CE2] text-white py-3 px-4 rounded-xl font-medium hover:bg-[#3B9CE2]/90 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Confirming...
              </>
            ) : (
              'Confirm Booking'
            )}
          </button>
          <button
            onClick={cancelBooking}
            disabled={isSubmitting}
            className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>

        {submissionError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {submissionError}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8 pt-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B9CE2] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
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
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8 pt-24">
      <div className="w-full max-w-[580px] mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">
                {steps[currentStep]?.title ?? ''}
              </h1>
              <button 
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 p-2 transition-colors"
                aria-label="Close booking"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {currentStep < steps.length - 1 && (
              <div className="flex space-x-2">
                {steps.slice(0, -1).map((step, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      index <= currentStep ? 'bg-[#3B9CE2]' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          {steps[currentStep]?.component ?? null}
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
  );
}
