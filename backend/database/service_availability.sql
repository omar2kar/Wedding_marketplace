-- Create service_availability table for managing service availability dates
CREATE TABLE `service_availability` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `service_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `status` enum('available','booked','blocked') DEFAULT 'available',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_service_date` (`service_id`, `date`),
  KEY `idx_service_id` (`service_id`),
  KEY `idx_date` (`date`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_service_availability_service` FOREIGN KEY (`service_id`) REFERENCES `vendor_services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
