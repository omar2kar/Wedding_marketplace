-- Create vendor_services table
CREATE TABLE IF NOT EXISTS vendor_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    images JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
);

-- Insert some sample services for testing
INSERT INTO vendor_services (vendor_id, name, description, category, price, images, is_active) VALUES
(1, 'Complete Wedding Photography', 'Professional wedding photography with delivery of 200+ edited photos', 'Photography', 800.00, '["service1.jpg", "service1-2.jpg"]', TRUE),
(1, 'Engagement Photo Session', 'Romantic engagement photo session at your choice of location', 'Photography', 300.00, '["service2.jpg"]', TRUE),
(2, 'Wedding Venue Rental', 'Elegant wedding hall with capacity for 200 guests', 'Venue', 1500.00, '["venue1.jpg", "venue2.jpg"]', TRUE),
(3, 'Wedding Catering Package', 'Complete catering service for wedding events', 'Catering', 25.00, '["catering1.jpg"]', TRUE);
