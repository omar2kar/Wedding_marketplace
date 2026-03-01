-- Add test vendor account for login testing
-- Password: password123 (hashed with bcrypt)

INSERT INTO vendors (
  name, 
  email, 
  password, 
  business_name, 
  phone, 
  category, 
  status
) VALUES (
  'Ahmed Photography',
  'vendor@test.com',
  '$2b$10$YE5ZvMSLxCqG0CjY2i3Xze0GKhHCd8H0bJXBKWQXoOvXuFqHZ6nXO',
  'Ahmed Studio for Wedding Photography',
  '01234567890',
  'Photography',
  'pending'
);

-- Add another pending vendor for testing
INSERT INTO vendors (
  name, 
  email, 
  password, 
  business_name, 
  phone, 
  category, 
  status
) VALUES (
  'Sara Wedding Venue',
  'sara@wedding.com',
  '$2b$10$YE5ZvMSLxCqG0CjY2i3Xze0GKhHCd8H0bJXBKWQXoOvXuFqHZ6nXO',
  'Sara Royal Wedding Hall',
  '01987654321',
  'Venue',
  'pending'
);

-- Test login credentials:
-- Email: vendor@test.com / Password: password123 (PENDING - can't login)
-- Email: sara@wedding.com / Password: password123 (PENDING - can't login)
