-- Create favorites/wishlist table for clients
CREATE TABLE IF NOT EXISTS client_favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    service_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES vendor_services(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (client_id, service_id),
    INDEX idx_client_id (client_id),
    INDEX idx_service_id (service_id)
);
