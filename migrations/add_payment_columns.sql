-- Add payment-related columns to service_bookings table
-- Run this SQL in your MySQL/MariaDB database

ALTER TABLE service_bookings
ADD COLUMN payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending' AFTER status,
ADD COLUMN payment_method VARCHAR(50) DEFAULT NULL AFTER payment_status,
ADD COLUMN payment_id VARCHAR(255) DEFAULT NULL AFTER payment_method,
ADD COLUMN payment_order_id VARCHAR(255) DEFAULT NULL AFTER payment_id,
ADD COLUMN payment_amount DECIMAL(10,2) DEFAULT NULL AFTER payment_order_id;

-- Add index for payment status queries
ALTER TABLE service_bookings
ADD INDEX idx_payment_status (payment_status);
