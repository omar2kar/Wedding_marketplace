-- Create database if not exists
CREATE DATABASE IF NOT EXISTS wedding_marketplace;
USE wedding_marketplace;

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  business_name VARCHAR(200),
  category VARCHAR(50),
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vendor_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(50),
  images JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT NOT NULL,
  vendor_id INT NOT NULL,
  service_id INT NOT NULL,
  event_date DATE NOT NULL,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_event_date (event_date)
);

-- Reviews table with vendor reply support
CREATE TABLE IF NOT EXISTS reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT NOT NULL,
  vendor_id INT NOT NULL,
  service_id INT NOT NULL,
  booking_id INT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  vendor_reply TEXT,
  reply_date TIMESTAMP NULL,
  has_purchased BOOLEAN DEFAULT TRUE,
  is_visible_to_vendor BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  UNIQUE KEY unique_booking_review (booking_id),
  INDEX idx_vendor_reviews (vendor_id, created_at),
  INDEX idx_service_reviews (service_id, created_at)
);

-- Sample data for testing

-- Insert sample vendors
INSERT INTO vendors (name, email, password, business_name, category) VALUES
('Ahmad Mohammad', 'ahmad@example.com', '$2b$10$YourHashedPasswordHere', 'Dream Studio', 'photography'),
('Sara Ali', 'sara@example.com', '$2b$10$YourHashedPasswordHere', 'Royal Wedding Hall', 'venue'),
('Mohammad Hassan', 'mohammad@example.com', '$2b$10$YourHashedPasswordHere', 'Gourmet Catering', 'catering');

-- Insert sample clients
INSERT INTO clients (name, email, password) VALUES
('Fatima Ahmad', 'fatima@example.com', '$2b$10$YourHashedPasswordHere'),
('Ali Hussein', 'ali@example.com', '$2b$10$YourHashedPasswordHere'),
('Nora Khaled', 'nora@example.com', '$2b$10$YourHashedPasswordHere');

-- Insert sample services
INSERT INTO services (vendor_id, name, description, price, category) VALUES
(1, 'Complete Wedding Photography', 'Professional wedding photography with full team', 5000.00, 'photography'),
(1, 'Engagement Photo Session', 'Outdoor engagement photography session', 1500.00, 'photography'),
(2, 'Luxury Wedding Hall', 'Hall for 500 guests with complete decoration', 15000.00, 'venue'),
(3, 'Open Buffet', 'Diverse open buffet for 200 people', 8000.00, 'catering');

-- Insert sample bookings
INSERT INTO bookings (client_id, vendor_id, service_id, event_date, status, total_amount) VALUES
(1, 1, 1, '2024-06-15', 'completed', 5000.00),
(2, 1, 2, '2024-07-20', 'completed', 1500.00),
(3, 2, 3, '2024-08-10', 'completed', 15000.00),
(1, 3, 4, '2024-09-05', 'confirmed', 8000.00);

-- Insert sample reviews
INSERT INTO reviews (client_id, vendor_id, service_id, booking_id, rating, comment, has_purchased) VALUES
(1, 1, 1, 1, 5, 'Excellent service and the photos were amazing! Highly recommend', true),
(2, 1, 2, 2, 4, 'Very good photography, but delivery was slightly delayed', true),
(3, 2, 3, 3, 5, 'Luxurious hall and elegant service, it was my dream wedding', true);

-- Update vendor ratings
UPDATE vendors v
SET rating = (SELECT AVG(rating) FROM reviews WHERE vendor_id = v.id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE vendor_id = v.id)
WHERE id IN (SELECT DISTINCT vendor_id FROM reviews);
