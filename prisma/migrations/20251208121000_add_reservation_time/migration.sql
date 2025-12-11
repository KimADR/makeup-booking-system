-- Add optional time column to Reservation to store selected time slot
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "time" TEXT;
