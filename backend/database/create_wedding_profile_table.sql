-- Create wedding profile table for clients
CREATE TABLE IF NOT EXISTS client_wedding_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    wedding_date DATE,
    venue_location VARCHAR(255),
    guest_count INT,
    budget_min DECIMAL(10, 2),
    budget_max DECIMAL(10, 2),
    preferred_style VARCHAR(100), -- Classic, Modern, Rustic, etc.
    color_theme VARCHAR(255),
    special_requirements TEXT,
    services_needed JSON, -- Array of service categories needed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    INDEX idx_client_id (client_id),
    INDEX idx_wedding_date (wedding_date),
    INDEX idx_budget (budget_min, budget_max)
);
