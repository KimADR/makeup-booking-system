'use client';

import React, { useState } from 'react';
import Calendar from './Calendar';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    name: string;
    price: number;
    duration: string;
    description: string;
  };
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  address: string;
  additionalNotes?: string;
  differentBillingAddress?: boolean;
  rememberInfo?: boolean;
}

const STEPS = [
  { number: 1, title: 'Service' },
  { number: 2, title: 'Time' },
  { number: 3, title: 'Information' },
  { number: 4, title: 'Confirmation' }
];

export default function BookingModal({ isOpen, onClose, service }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    countryCode: '+261',
    address: '',
    additionalNotes: '',
    differentBillingAddress: false,
    rememberInfo: false
  });

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleCustomerInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setCustomerInfo(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleNextStep = () => {
    setStep(prev => prev + 1);
  };

  const handleConfirmBooking = async () => {
    // Here you would implement the actual booking logic
    const reservationNumber = 'CIFE85';
    alert(`RESERVATION #${reservationNumber}. Your reservation is confirmed. Thank you!`);
    onClose();
  };

  const renderSteps = () => {
    return (
      <div className="flex items-center justify-between mb-8 px-2">
        {STEPS.map((s, index) => (
          <React.Fragment key={s.number}>
            <div className="flex flex-col items-center relative">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step >= s.number ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}
              >
                {step > s.number ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s.number
                )}
              </div>
              <span className={`mt-2 text-sm ${step >= s.number ? 'text-blue-500' : 'text-gray-500'}`}>
                {s.title}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div 
                className={`flex-1 h-0.5 mx-4 ${
                  step > index + 1 ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            {step > 1 && (
              <button onClick={handlePrevStep} className="flex items-center text-gray-600">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {step === 2 ? 'Book a service' : 'Summary'}
              </button>
            )}
            {step === 1 && <h2 className="text-2xl font-semibold">Book a service</h2>}
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 ml-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {renderSteps()}

          <div className="mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 mt-1 mr-3">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-semibold">{service.name}</h3>
                <p className="text-gray-600 mt-1">{service.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-semibold">${service.price.toFixed(2)}</span>
                  <span className="text-gray-500">{service.duration}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-start text-gray-500 text-sm">
              <svg className="w-4 h-4 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>The service will be performed at the headquarters of Rov&apos;Art</span>
            </div>
          </div>

          {step === 1 && (
            <>
              <Calendar onDateSelect={handleDateSelect} selectedDate={selectedDate} />
              <div className="mt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Morning</h4>
                    <div className="space-y-2">
                      {['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00'].map(time => (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time)}
                          className={`w-full p-2 rounded border ${
                            selectedTime === time 
                              ? 'bg-blue-500 text-white border-blue-500' 
                              : 'border-gray-200 hover:border-blue-500'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Afternoon</h4>
                    <div className="space-y-2">
                      {['12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00'].map(time => (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time)}
                          className={`w-full p-2 rounded border ${
                            selectedTime === time 
                              ? 'bg-blue-500 text-white border-blue-500' 
                              : 'border-gray-200 hover:border-blue-500'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={customerInfo.name}
                  onChange={handleCustomerInfoChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={customerInfo.email}
                  onChange={handleCustomerInfoChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <select
                    name="countryCode"
                    value={customerInfo.countryCode}
                    onChange={handleCustomerInfoChange}
                    className="w-24 p-2 border rounded-l focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="+261">🇲🇬 +261</option>
                  </select>
                  <input
                    type="tel"
                    name="phone"
                    value={customerInfo.phone}
                    onChange={handleCustomerInfoChange}
                    className="flex-1 p-2 border-l-0 border rounded-r focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={customerInfo.address}
                  onChange={handleCustomerInfoChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button className="mt-2 text-blue-500 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit address
                </button>
              </div>
              <div>
                <button 
                  onClick={() => setCustomerInfo(prev => ({ ...prev, differentBillingAddress: !prev.differentBillingAddress }))}
                  className="text-blue-500 text-sm flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Different address for invoice
                </button>
              </div>
              <div>
                <button 
                  onClick={() => setCustomerInfo(prev => ({ ...prev, additionalNotes: prev.additionalNotes ? '' : ' ' }))}
                  className="text-blue-500 text-sm flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Additional notes
                </button>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberInfo"
                  checked={customerInfo.rememberInfo}
                  onChange={handleCustomerInfoChange}
                  className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Remember my contact information
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <p className="text-gray-500 text-sm">{service.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${service.price.toFixed(2)}</div>
                    <div className="text-gray-500 text-sm">{service.duration}</div>
                  </div>
                </div>
              </div>

              <div className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <div className="font-semibold">
                        {selectedDate?.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-gray-500 text-sm">
                        The service will be performed between {selectedTime} and will take {service.duration}
                      </div>
                    </div>
                  </div>
                  <button className="text-blue-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <div className="font-semibold">{customerInfo.name}</div>
                      <div className="text-gray-500 text-sm">
                        {customerInfo.countryCode}{customerInfo.phone}
                        <br />
                        {customerInfo.email}
                      </div>
                    </div>
                  </div>
                  <button className="text-blue-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              </div>

              {customerInfo.address && (
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div className="font-semibold">{customerInfo.address}</div>
                    </div>
                    <button className="text-blue-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 rounded-b-lg">
          {step < 3 ? (
            <button
              onClick={handleNextStep}
              disabled={step === 1 ? (!selectedDate || !selectedTime) : (!customerInfo.name || !customerInfo.email || !customerInfo.phone)}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next step
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 text-center">
                This site is protected by reCAPTCHA and the Google{' '}
                <a href="#" className="text-blue-500">Privacy Policy</a> and{' '}
                <a href="#" className="text-blue-500">Terms of Service</a> apply.
              </p>
              <button
                onClick={handleConfirmBooking}
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 