'use client';

import React, { useState } from 'react';

interface CalendarProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

export default function Calendar({ onDateSelect, selectedDate }: CalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    today.setDate(today.getDate() - day);
    return today;
  });

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handlePrevWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const formatWeekRange = () => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const startDay = currentWeekStart.getDate();
    const endDay = weekEnd.getDate();
    const startMonth = currentWeekStart.toLocaleString('default', { month: 'long' });
    const endMonth = weekEnd.toLocaleString('default', { month: 'long' });
    const year = currentWeekStart.getFullYear();

    if (startMonth === endMonth) {
      return `${startDay} - ${endDay} ${startMonth} ${year}`;
    }
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
  };

  const renderWeekDays = () => {
    const weekDays = [];
    const currentDate = new Date(currentWeekStart);

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate);
      const isDisabled = isDateDisabled(date);
      const isSelected = selectedDate?.toDateString() === date.toDateString();
      
      weekDays.push(
        <button
          key={i}
          onClick={() => !isDisabled && onDateSelect(date)}
          disabled={isDisabled}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
            ${isDisabled ? 'text-gray-300 cursor-not-allowed' :
              isSelected ? 'bg-blue-500 text-white' :
                'hover:bg-gray-100'}`}
        >
          {date.getDate()}
        </button>
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return weekDays;
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePrevWeek}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center">
          <h3 className="text-lg font-semibold">
            {formatWeekRange()}
          </h3>
          <button className="ml-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <button
          onClick={handleNextWeek}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {days.map(day => (
            <div key={day} className="text-center text-sm text-gray-500">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {renderWeekDays()}
        </div>
      </div>
    </div>
  );
} 