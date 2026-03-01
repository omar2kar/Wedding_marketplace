-- Create images table for service images
CREATE TABLE IF NOT EXISTS service_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255),
    uploader_id INT,
    upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    display_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    file_size INT,
    mime_type VARCHAR(100),
    INDEX idx_service_id (service_id),
    INDEX idx_uploader_id (uploader_id),
    INDEX idx_display_order (display_order),
    FOREIGN KEY (service_id) REFERENCES vendor_services(id) ON DELETE CASCADE,
    FOREIGN KEY (uploader_id) REFERENCES vendors(id) ON DELETE SET NULL
);

-- Add some sample data if needed
-- INSERT INTO service_images (service_id, file_path, original_filename, display_order, is_primary) 
-- VALUES (1, '/images/sample-service-1.jpg', 'wedding-photo.jpg', 1, TRUE);
