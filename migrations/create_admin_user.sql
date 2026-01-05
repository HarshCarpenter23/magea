-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role ENUM('Super Admin', 'Admin', 'Manager') DEFAULT 'Admin',
  is_active BOOLEAN DEFAULT TRUE,
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert a default admin user
-- Password: Admin@123 (bcrypt hashed)
-- You should change this password immediately after first login
INSERT INTO admin_users (username, email, password_hash, first_name, last_name, role, is_active)
VALUES (
  'admin',
  'admin@maega.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4HJmLgFMgMXqXgNS',
  'MAEGA',
  'Admin',
  'Super Admin',
  TRUE
)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Note: The default password is "Admin@123"
-- Generate a new hash using: npx bcryptjs-cli hash "YourNewPassword" 12
