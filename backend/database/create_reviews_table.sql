-- Create reviews table for service ratings and reviews
CREATE TABLE IF NOT EXISTS service_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  service_id INT NOT NULL,
  vendor_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_verified BOOLEAN DEFAULT FALSE,
  helpful_count INT DEFAULT 0,
  
  -- Foreign key constraints
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES vendor_services(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Ensure one review per client per service
  UNIQUE KEY unique_client_service (client_id, service_id),
  
  -- Indexes for better performance
  INDEX idx_service_id (service_id),
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_rating (rating),
  INDEX idx_created_at (created_at)
);

-- Add sample reviews for testing
INSERT INTO service_reviews (client_id, service_id, vendor_id, rating, review_text, is_verified) VALUES
(1, 1, 1, 5, 'Amazing photography service! The photographer was professional and captured every moment perfectly. Highly recommended for weddings.', TRUE),
(1, 2, 2, 4, 'Great videography work. The final video was beautiful and well-edited. Only minor issue was slight delay in delivery.', TRUE),
(1, 3, 3, 5, 'Absolutely stunning floral arrangements! The flowers were fresh and the design exceeded our expectations.', TRUE);

-- Update vendor_services table to add rating fields if they don't exist
ALTER TABLE vendor_services 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_reviews INT DEFAULT 0;

-- Create a trigger to automatically update average rating when a review is added/updated/deleted
DELIMITER //

CREATE TRIGGER update_service_rating_after_insert
AFTER INSERT ON service_reviews
FOR EACH ROW
BEGIN
  UPDATE vendor_services 
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0) 
      FROM service_reviews 
      WHERE service_id = NEW.service_id
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM service_reviews 
      WHERE service_id = NEW.service_id
    )
  WHERE id = NEW.service_id;
END//

CREATE TRIGGER update_service_rating_after_update
AFTER UPDATE ON service_reviews
FOR EACH ROW
BEGIN
  UPDATE vendor_services 
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0) 
      FROM service_reviews 
      WHERE service_id = NEW.service_id
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM service_reviews 
      WHERE service_id = NEW.service_id
    )
  WHERE id = NEW.service_id;
END//

CREATE TRIGGER update_service_rating_after_delete
AFTER DELETE ON service_reviews
FOR EACH ROW
BEGIN
  UPDATE vendor_services 
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0) 
      FROM service_reviews 
      WHERE service_id = OLD.service_id
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM service_reviews 
      WHERE service_id = OLD.service_id
    )
  WHERE id = OLD.service_id;
END//

DELIMITER ;

-- Update existing services with calculated ratings
UPDATE vendor_services vs
SET 
  average_rating = (
    SELECT COALESCE(AVG(sr.rating), 0) 
    FROM service_reviews sr 
    WHERE sr.service_id = vs.id
  ),
  total_reviews = (
    SELECT COUNT(*) 
    FROM service_reviews sr 
    WHERE sr.service_id = vs.id
  );
