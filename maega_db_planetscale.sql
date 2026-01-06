-- PlanetScale Compatible SQL
-- Removed: Foreign keys, CHECK constraints, MariaDB-specific syntax

-- Table: admin_users
CREATE TABLE `admin_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `role` enum('Super Admin','Admin','Manager') DEFAULT 'Manager',
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `admin_users` (`id`, `username`, `email`, `password_hash`, `first_name`, `last_name`, `role`, `is_active`, `last_login`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@maega.com', '$2a$12$uqEq1.cPhiL2FK78k6MtgeOwOHucAfKr84Vfr/dTpAbtadSXr6fnK', 'System', 'Administrator', 'Super Admin', 1, '2025-12-06 18:08:40', '2025-09-20 16:22:57', '2025-12-06 18:08:40');

-- Table: analytics_events
CREATE TABLE `analytics_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_type` varchar(100) NOT NULL,
  `event_category` varchar(100) DEFAULT NULL,
  `user_type` enum('Customer','Worker','Admin') DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `event_data` longtext DEFAULT NULL,
  `page_url` varchar(500) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_event_type` (`event_type`),
  KEY `idx_event_date` (`created_at`),
  KEY `idx_user_tracking` (`user_type`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: communications
CREATE TABLE `communications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `recipient_type` enum('Worker','Customer') NOT NULL,
  `recipient_id` int(11) NOT NULL,
  `recipient_phone` varchar(15) DEFAULT NULL,
  `recipient_email` varchar(255) DEFAULT NULL,
  `communication_type` enum('WhatsApp','Email','SMS') NOT NULL,
  `message_content` text NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `status` enum('Pending','Sent','Delivered','Failed') DEFAULT 'Pending',
  `sent_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `external_message_id` varchar(255) DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  KEY `idx_communication_status` (`status`),
  KEY `idx_communication_type` (`communication_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: customers
CREATE TABLE `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `location_lat` decimal(10,8) DEFAULT NULL,
  `location_lng` decimal(11,8) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_customer_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: otp_verifications
CREATE TABLE `otp_verifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `identifier` varchar(255) NOT NULL,
  `otp_code` varchar(50) NOT NULL,
  `otp_type` enum('email','phone') NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `verified` tinyint(1) DEFAULT 0,
  `attempts` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_identifier_type` (`identifier`,`otp_type`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `otp_verifications` (`id`, `identifier`, `otp_code`, `otp_type`, `expires_at`, `verified`, `attempts`, `created_at`) VALUES
(18, '9521036229', '546271', 'phone', '2025-12-03 08:42:48', 0, 0, '2025-12-03 08:32:48'),
(26, '7974078184', '54a3a7', 'phone', '2026-01-01 06:48:33', 0, 1, '2026-01-01 06:48:12');

-- Table: services
CREATE TABLE `services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `services` (`id`, `name`, `description`, `category`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'AC Repair & Service', 'Complete air conditioning repair, installation, maintenance & gas refilling services', 'Appliance', 1, '2025-09-20 16:22:57', '2025-09-20 16:22:57'),
(2, 'Refrigerator Repair & Service', 'Expert refrigerator repair, compressor replacement & cooling issues solutions', 'Appliance', 1, '2025-09-20 16:22:57', '2025-09-20 16:22:57'),
(3, 'Washing Machine Repair', 'Washing machine repair, drum replacement & water drainage issues solutions', 'Appliance', 1, '2025-09-20 16:22:57', '2025-09-20 16:22:57'),
(4, 'Microwave Repair', 'Microwave oven repair, magnetron replacement & heating issues solutions', 'Appliance', 1, '2025-09-20 16:22:57', '2025-09-20 16:22:57'),
(5, 'Chimney Repair & Service', 'Kitchen chimney repair, motor replacement & suction problems solutions', 'Appliance', 1, '2025-09-20 16:22:57', '2025-09-20 16:22:57'),
(6, 'TV Repair & Service', 'LED/LCD TV repair, screen replacement & display issues solutions', 'Electronics', 1, '2025-09-20 16:22:57', '2025-09-20 16:22:57'),
(7, 'Water Cooler Service', 'Water cooler repair, cooling issues & maintenance services', 'Appliance', 1, '2025-09-20 16:22:57', '2025-09-20 16:22:57'),
(8, 'Deep Freezer Repair', 'Deep freezer repair, temperature control & compressor issues solutions', 'Appliance', 1, '2025-09-20 16:22:57', '2025-09-20 16:22:57'),
(9, 'Geyser Repair & Service', 'Water heater repair, heating element replacement & thermostat issues', 'Appliance', 1, '2025-09-20 16:22:57', '2025-09-20 16:22:57'),
(10, 'Installation & Uninstallation', 'Professional appliance installation and uninstallation services', 'Installation', 1, '2025-09-20 16:22:57', '2025-09-20 16:22:57');

-- Table: service_subcategories
CREATE TABLE `service_subcategories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `service_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `estimated_duration` int(11) DEFAULT NULL,
  `base_price` decimal(10,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `service_id` (`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `service_subcategories` (`id`, `service_id`, `name`, `description`, `estimated_duration`, `base_price`, `is_active`, `created_at`) VALUES
(1, 1, 'Installation', 'AC Installation Service', 120, 500.00, 1, '2025-09-20 16:22:57'),
(2, 1, 'Repair', 'AC Repair Service', 90, 300.00, 1, '2025-09-20 16:22:57'),
(3, 1, 'Maintenance', 'AC Maintenance Service', 60, 200.00, 1, '2025-09-20 16:22:57'),
(4, 1, 'Gas Refilling', 'AC Gas Refilling Service', 45, 400.00, 1, '2025-09-20 16:22:57');

-- Table: service_bookings
CREATE TABLE `service_bookings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_code` varchar(50) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `customer_name` varchar(255) NOT NULL,
  `customer_phone` varchar(15) NOT NULL,
  `customer_email` varchar(255) DEFAULT NULL,
  `customer_address` text DEFAULT NULL,
  `service_id` int(11) NOT NULL,
  `subcategory_id` int(11) DEFAULT NULL,
  `service_description` text DEFAULT NULL,
  `preferred_date` date DEFAULT NULL,
  `preferred_time` time DEFAULT NULL,
  `urgency_level` enum('Low','Medium','High','Emergency') DEFAULT 'Medium',
  `service_location_lat` decimal(10,8) DEFAULT NULL,
  `service_location_lng` decimal(11,8) DEFAULT NULL,
  `service_address` text DEFAULT NULL,
  `assigned_worker_id` int(11) DEFAULT NULL,
  `assigned_at` timestamp NULL DEFAULT NULL,
  `assigned_by` int(11) DEFAULT NULL,
  `status` enum('Pending','Assigned','In Progress','Completed','Cancelled','Rejected') DEFAULT 'Pending',
  `payment_status` enum('pending','paid','failed','refunded') DEFAULT 'pending',
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_id` varchar(255) DEFAULT NULL,
  `payment_order_id` varchar(255) DEFAULT NULL,
  `payment_amount` decimal(10,2) DEFAULT NULL,
  `estimated_cost` decimal(10,2) DEFAULT NULL,
  `final_cost` decimal(10,2) DEFAULT NULL,
  `special_instructions` text DEFAULT NULL,
  `customer_rating` int(11) DEFAULT NULL,
  `customer_feedback` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `booking_code` (`booking_code`),
  KEY `customer_id` (`customer_id`),
  KEY `subcategory_id` (`subcategory_id`),
  KEY `idx_booking_status` (`status`),
  KEY `idx_booking_date` (`preferred_date`),
  KEY `idx_booking_worker` (`assigned_worker_id`),
  KEY `idx_booking_service` (`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `service_bookings` (`id`, `booking_code`, `customer_id`, `customer_name`, `customer_phone`, `customer_email`, `customer_address`, `service_id`, `subcategory_id`, `service_description`, `preferred_date`, `preferred_time`, `urgency_level`, `service_location_lat`, `service_location_lng`, `service_address`, `assigned_worker_id`, `assigned_at`, `assigned_by`, `status`, `payment_status`, `payment_method`, `payment_id`, `payment_order_id`, `payment_amount`, `estimated_cost`, `final_cost`, `special_instructions`, `customer_rating`, `customer_feedback`, `created_at`, `updated_at`, `completed_at`, `cancelled_at`) VALUES
(4, 'MAEGA232610354', NULL, 'Harsh Carpenter', '9179970908', 'harshcarpenter06902@gmail.com', '44, Vidhyut Nagar, Gandhi Nagar, Mandsaur, MP', 1, NULL, 'AC Repairs', '2025-12-09', '10:00:00', 'Medium', 22.70819550, 75.88244220, NULL, 1, '2025-12-07 08:13:52', NULL, 'In Progress', 'pending', 'razorpay', NULL, NULL, 99.00, NULL, NULL, NULL, NULL, NULL, '2025-12-07 08:13:52', '2025-12-07 08:23:19', NULL, NULL),
(5, 'MAEGA350360MBL', NULL, 'Harsh Carpenter', '9179970908', 'harshcarpenter06902@gmail.com', '44, Vidhyut Nagar, Gandhi Nagar, Mandsaur, MP', 1, NULL, 'AC Repairs', '2025-12-09', '10:00:00', 'Medium', 22.70819550, 75.88244220, NULL, 1, '2025-12-07 08:15:50', NULL, 'In Progress', 'pending', 'pay-on-service', NULL, NULL, 99.00, NULL, NULL, NULL, NULL, NULL, '2025-12-07 08:15:50', '2025-12-07 08:23:22', NULL, NULL);

-- Table: system_settings
CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_type` enum('String','Number','Boolean','JSON') DEFAULT 'String',
  `description` text DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `is_public`, `updated_at`) VALUES
(1, 'site_name', 'MAEGA', 'String', 'Website name', 0, '2025-09-20 16:22:57'),
(2, 'whatsapp_api_enabled', 'true', 'Boolean', 'Enable WhatsApp API integration', 0, '2025-09-20 16:22:57'),
(3, 'email_notifications_enabled', 'true', 'Boolean', 'Enable email notifications', 0, '2025-09-20 16:22:57'),
(4, 'max_booking_distance_km', '50', 'Number', 'Maximum distance for service booking in kilometers', 0, '2025-09-20 16:22:57'),
(5, 'auto_assign_workers', 'true', 'Boolean', 'Automatically assign available workers to bookings', 0, '2025-09-20 16:22:57');

-- Table: users
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `phone_verified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `phone`, `password_hash`, `email_verified`, `phone_verified`, `created_at`, `updated_at`) VALUES
(1, 'Harsh', 'Carpenter', 'harshcarpenter06902@gmail.com', '9179970908', '$2a$12$eo1eCGo0gPDZBNLsqyh5Heltrj6ON1kUMhb7dsTVGepDrqq07WjJq', 1, 1, '2025-12-03 08:49:06', '2025-12-07 08:11:55'),
(2, 'Naksh', 'Carpenter', 'harsh.22bce9029@vitapstudent.ac.in', '9602626844', '$2a$12$wJGhZJ7VxsoeZDGfVxP5h.RBkSGaQEdV3H0ur2iLpU7MjQ6.sm9ty', 1, 1, '2026-01-01 08:29:35', '2026-01-01 08:29:35');

-- Table: workers
CREATE TABLE `workers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `worker_code` varchar(50) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `phone` varchar(15) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `photo_url` varchar(500) DEFAULT NULL,
  `address_line1` varchar(255) DEFAULT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `account_holder_name` varchar(255) DEFAULT NULL,
  `account_number` varchar(50) DEFAULT NULL,
  `account_type` enum('Savings','Current') DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `ifsc_code` varchar(20) DEFAULT NULL,
  `branch_name` varchar(255) DEFAULT NULL,
  `shop_name` varchar(255) DEFAULT NULL,
  `shop_address` text DEFAULT NULL,
  `shop_phone` varchar(15) DEFAULT NULL,
  `shop_registration_number` varchar(100) DEFAULT NULL,
  `house_type` varchar(100) DEFAULT NULL,
  `house_address` text DEFAULT NULL,
  `marital_status` enum('Single','Married','Other') DEFAULT NULL,
  `experience_years` int(11) DEFAULT NULL,
  `previous_company` varchar(255) DEFAULT NULL,
  `reference_name` varchar(255) DEFAULT NULL,
  `reference_phone` varchar(15) DEFAULT NULL,
  `academic_qualification` enum('10th Standard','12th Standard','Diploma','Graduate','Post Graduate','Other') DEFAULT NULL,
  `technical_qualification` enum('ITI','Technical Diploma','Certificate Course','Experience Based','Other') DEFAULT NULL,
  `other_qualifications` text DEFAULT NULL,
  `emergency_contact_name` varchar(255) DEFAULT NULL,
  `emergency_contact_phone` varchar(15) DEFAULT NULL,
  `emergency_contact_relation` varchar(100) DEFAULT NULL,
  `blood_group` enum('A+','A-','B+','B-','O+','O-','AB+','AB-') DEFAULT NULL,
  `id_proof_url` varchar(500) DEFAULT NULL,
  `certificates_url` varchar(500) DEFAULT NULL,
  `status` enum('Active','Inactive','Suspended','Pending Approval') DEFAULT 'Pending Approval',
  `is_available` tinyint(1) DEFAULT 1,
  `current_location_lat` decimal(10,8) DEFAULT NULL,
  `current_location_lng` decimal(11,8) DEFAULT NULL,
  `total_jobs_completed` int(11) DEFAULT 0,
  `average_rating` decimal(3,2) DEFAULT 0.00,
  `total_earnings` decimal(12,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `worker_code` (`worker_code`),
  UNIQUE KEY `phone` (`phone`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_worker_status` (`status`),
  KEY `idx_worker_availability` (`is_available`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `workers` (`id`, `worker_code`, `first_name`, `last_name`, `phone`, `email`, `date_of_birth`, `gender`, `photo_url`, `address_line1`, `address_line2`, `city`, `state`, `pincode`, `account_holder_name`, `account_number`, `account_type`, `bank_name`, `ifsc_code`, `branch_name`, `shop_name`, `shop_address`, `shop_phone`, `shop_registration_number`, `house_type`, `house_address`, `marital_status`, `experience_years`, `previous_company`, `reference_name`, `reference_phone`, `academic_qualification`, `technical_qualification`, `other_qualifications`, `emergency_contact_name`, `emergency_contact_phone`, `emergency_contact_relation`, `blood_group`, `id_proof_url`, `certificates_url`, `status`, `is_available`, `current_location_lat`, `current_location_lng`, `total_jobs_completed`, `average_rating`, `total_earnings`, `created_at`, `updated_at`, `approved_at`, `approved_by`, `password_hash`) VALUES
(1, 'MAEGA1764753241010SFAP', 'Harsh', 'Carpenter', '9179970908', 'harshcarpenter06902@gmail.com', '2002-12-03', NULL, '/uploads/Harsh_Carpenter-87797/photo.jpg', '2, Street Number, Village, Mandal - 678001', NULL, 'Village', NULL, '678001', 'Harsh Carpenter', '69360000222100879', 'Savings', 'PUNB', 'PUNB69366', 'MDS', 'Jai Ho Electric', '2, Street Name, Area Name, Mandal Name - 457001', '9111582525', NULL, NULL, '2, Street Number, Village, Mandal - 678001', 'Married', NULL, NULL, NULL, NULL, '', 'Other', 'Appliances: AC, Refrigerator\nTechnicians Available: 4\nExperience: Full\nFather: Father - 91799890008\nSpouse: Spouse Name\nSpouse Phone: 9876514567\nOld ID: N/A\nAadhaar: 8877654670987\nPAN: PANS1234', '12121212121', '8887788712', '12121212121', 'A+', '/uploads/Harsh_Carpenter-87797/idProof.jpg', '/uploads/Harsh_Carpenter-87797/certificates.pdf', 'Active', 1, NULL, NULL, 0, 0.00, 0.00, '2025-12-03 09:14:01', '2025-12-06 18:27:40', '2025-12-06 18:27:40', 1, '$2a$12$3zK6hziH0NelBFj9wRc13Ogy71ZWD7qVLJf6Io4.n.U6DP7CC.Mca');

-- Table: worker_services
CREATE TABLE `worker_services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `worker_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `subcategory_id` int(11) DEFAULT NULL,
  `skill_level` enum('Beginner','Intermediate','Expert') DEFAULT 'Intermediate',
  `certification_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_worker_service` (`worker_id`,`service_id`,`subcategory_id`),
  KEY `service_id` (`service_id`),
  KEY `subcategory_id` (`subcategory_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `worker_services` (`id`, `worker_id`, `service_id`, `subcategory_id`, `skill_level`, `certification_url`, `is_active`, `created_at`) VALUES
(1, 1, 1, NULL, 'Intermediate', NULL, 1, '2025-12-03 09:14:01'),
(2, 1, 2, NULL, 'Intermediate', NULL, 1, '2025-12-03 09:14:01');
