-- Add user_id column to service_bookings table
-- This links bookings to the users table instead of customers table

ALTER TABLE `service_bookings`
ADD COLUMN `user_id` int(11) DEFAULT NULL AFTER `customer_id`,
ADD KEY `idx_booking_user` (`user_id`),
ADD CONSTRAINT `service_bookings_ibfk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
