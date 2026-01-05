-- Migration: Fix otp_code column to store 2Factor session IDs
-- The otp_code column needs to store UUIDs (36 chars) instead of just 6-digit OTPs

ALTER TABLE `otp_verifications`
MODIFY COLUMN `otp_code` VARCHAR(50) NOT NULL;

-- Verify the change
DESCRIBE `otp_verifications`;
