'use client';

import React, { useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isBefore,
  startOfToday
} from 'date-fns';

interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
}

export default function Calendar({ selectedDate, onDateSelect }: CalendarProps) {
  const today = startOfToday();
  const [currentMonth, setCurrentMonth] = useState(today);
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start week on Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={previousMonth}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
        </div>
        <button
          onClick={nextMonth}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 mb-4">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-400 pb-4"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isPast = isBefore(day, today);
          const isTodays = isToday(day);

          return (
            <div
              key={day.toString()}
              className="relative pb-[100%]"
            >
              <button
                onClick={() => !isPast && isCurrentMonth && onDateSelect(day)}
                disabled={isPast || !isCurrentMonth}
                className={`
                  absolute inset-1 flex items-center justify-center
                  text-sm font-medium rounded-lg transition-all
                  ${!isCurrentMonth ? 'text-gray-300' : isPast ? 'text-gray-400' : 'text-gray-700'}
                  ${isSelected ? 'bg-[#3B9CE2] text-white shadow-lg scale-110' : ''}
                  ${!isSelected && !isPast && isCurrentMonth ? 'hover:bg-gray-50 hover:scale-110' : ''}
                  ${isTodays && !isSelected ? 'border-2 border-[#3B9CE2] text-[#3B9CE2]' : ''}
                  ${isPast ? 'cursor-not-allowed' : 'cursor-pointer'}
                  disabled:opacity-50
                `}
              >
                {format(day, 'd')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
} 