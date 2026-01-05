// scripts/create-admin.js
// Run with: node scripts/create-admin.js

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

// Database configuration - update these if needed
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'maega_db',
  port: 3306,
};

async function createAdmin() {
  // Default admin credentials - CHANGE THESE!
  const adminData = {
    username: 'admin',
    email: 'admin@maega.com',
    password: 'Admin@123', // Change this!
    firstName: 'MAEGA',
    lastName: 'Admin',
    role: 'Super Admin'
  };

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(adminData.password, 12);

    // Connect to database
    const connection = await mysql.createConnection(DB_CONFIG);

    // Create admin_users table if not exists
    await connection.execute(`
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
      )
    `);

    // Check if admin already exists by email or username
    const [existingByEmail] = await connection.execute(
      'SELECT id FROM admin_users WHERE email = ?',
      [adminData.email]
    );

    const [existingByUsername] = await connection.execute(
      'SELECT id, email FROM admin_users WHERE username = ?',
      [adminData.username]
    );

    if (existingByEmail.length > 0) {
      // Update existing admin password by email
      await connection.execute(
        'UPDATE admin_users SET password_hash = ?, updated_at = NOW() WHERE email = ?',
        [hashedPassword, adminData.email]
      );
      console.log('Admin user updated successfully!');
    } else if (existingByUsername.length > 0) {
      // Update existing admin by username (update email and password)
      await connection.execute(
        'UPDATE admin_users SET password_hash = ?, email = ?, updated_at = NOW() WHERE username = ?',
        [hashedPassword, adminData.email, adminData.username]
      );
      console.log('Admin user updated successfully! (Updated email and password for existing username)');
    } else {
      // Insert new admin
      await connection.execute(
        `INSERT INTO admin_users (username, email, password_hash, first_name, last_name, role, is_active)
         VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
        [adminData.username, adminData.email, hashedPassword, adminData.firstName, adminData.lastName, adminData.role]
      );
      console.log('Admin user created successfully!');
    }

    console.log('\n=================================');
    console.log('Admin Login Credentials:');
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);
    console.log('=================================');
    console.log('\nPlease change the password after first login!');

    await connection.end();
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
