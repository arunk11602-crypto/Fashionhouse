/*
# Booking status values

## Plain-English summary
Booking statuses now match the shop's workflow: New, Pending, Confirmed, Ready, Completed, Rejected and Cancelled.

## 1. Changes
- The status rule on bookings is replaced. It previously allowed only four values (pending, confirmed, cancelled, completed). The new rule allows all seven.
- No existing booking rows are changed. All existing statuses are in the new list.

## 2. Security
- No access rules change.
*/

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('new', 'pending', 'confirmed', 'ready', 'completed', 'rejected', 'cancelled'));
