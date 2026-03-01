-- Authentication System Improvements
-- Add missing fields to existing tables and create new auth-related tables

-- Update clients table with missing authentication fields
ALTER TABLE clients ADD COLUMN IF NOT EXISTS role ENUM('client', 'planner') DEFAULT 'client';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500) NULL;

-- Update vendors table with missing fields
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500) NULL;

-- Update admins table with missing fields  
ALTER TABLE admins ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500) NULL;

-- Create refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  user_type ENUM('client', 'vendor', 'admin') NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (user_id, user_type),
  INDEX idx_token (token),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(100) NOT NULL,
  user_type ENUM('client', 'vendor', 'admin') NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE    ,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email, user_type),
  INDEX idx_token (token),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

-- Create login attempts table for rate limiting
CREATE TABLE IF NOT EXISTS login_attempts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(100) NOT NULL,
  user_type ENUM('client', 'vendor', 'admin') NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  success BOOLEAN DEFAULT FALSE,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_type (email, user_type),
  INDEX idx_ip (ip_address),
  INDEX idx_attempted (attempted_at)
) ENGINE=InnoDB;
