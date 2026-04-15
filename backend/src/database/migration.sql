-- Quan Ly Kho - Database Schema
-- Run this script to initialize the database

CREATE DATABASE IF NOT EXISTS quan_ly_kho;
USE quan_ly_kho;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) DEFAULT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role VARCHAR(50) NOT NULL UNIQUE
);

-- User-Roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500) DEFAULT NULL,
  manager VARCHAR(255) DEFAULT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  warehouse_id INT DEFAULT NULL,
  warehouse_name VARCHAR(255) DEFAULT NULL,
  supplier VARCHAR(255) DEFAULT NULL,
  batch VARCHAR(100) DEFAULT NULL,
  quantity INT DEFAULT 0,
  min_stock INT DEFAULT 0,
  unit_price DECIMAL(15, 2) DEFAULT 0,
  unit VARCHAR(50) DEFAULT 'hộp',
  expiry_date DATE DEFAULT NULL,
  imported_by VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL
);

-- Product unit entries (for multi-unit conversion)
CREATE TABLE IF NOT EXISTS product_unit_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  unit VARCHAR(50) NOT NULL,
  quantity INT DEFAULT 0,
  conversion_rate INT DEFAULT 1,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_code VARCHAR(100) NOT NULL UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) DEFAULT NULL,
  sale_type ENUM('wholesale', 'retail') NOT NULL,
  total_amount DECIMAL(15, 2) DEFAULT 0,
  paid BOOLEAN DEFAULT FALSE,
  sale_date DATE NOT NULL,
  created_by VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sale items table
CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  unit VARCHAR(50) DEFAULT 'hộp',
  unit_price DECIMAL(15, 2) DEFAULT 0,
  total DECIMAL(15, 2) DEFAULT 0,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

-- Insert default roles
INSERT IGNORE INTO roles (role) VALUES ('super_admin'), ('admin');

-- Insert default super admin user (password: admin123)
INSERT IGNORE INTO users (full_name, username, email, phone, password_hash, status)
VALUES ('Super Admin', 'admin', 'admin@quanlykho.com', '0901234567', '$2b$10$sWXhXWCcmjyFh6EoJQQDxuoJ4WUa/QH3IDzoJHaF262FKP3/QTzrq', 'active');

-- Assign super_admin role to the default user
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'admin' AND r.role = 'super_admin';

-- Insert sample warehouses
INSERT IGNORE INTO warehouses (id, name, address, manager, status) VALUES
(1, 'Kho Chẵn', '123 Cầu Giấy, Hà Nội', 'Nguyễn Văn A', 'active'),
(2, 'Kho Lẻ', '456 Nguyễn Huệ, Quận 1, TP.HCM', 'Trần Thị B', 'active'),
(3, 'Kho Thuốc BHYT', '789 Nguyễn Văn Linh, Đà Nẵng', 'Lê Văn C', 'active');

-- Insert sample products
INSERT IGNORE INTO products (id, name, category, warehouse_id, warehouse_name, supplier, batch, quantity, min_stock, unit_price, unit, expiry_date, imported_by) VALUES
(1, 'Paracetamol 500mg', 'Thuốc giảm đau', 1, 'Kho Chẵn', 'Dược Hậu Giang', 'BATCH001', 5000, 1000, 1500, 'Viên', '2027-03-15', 'Nguyễn Văn A'),
(2, 'Amoxicillin 250mg', 'Kháng sinh', 2, 'Kho Lẻ', 'Traphaco', 'BATCH002', 120, 200, 2500, 'Gói', '2024-04-10', 'Trần Thị B'),
(3, 'Vitamin C 1000mg', 'Vitamin', 1, 'Kho Chẵn', 'Imexpharm', 'BATCH003', 3000, 500, 800, 'Viên', '2026-12-01', 'Nguyễn Văn A'),
(4, 'Omeprazol 20mg', 'Thuốc tiêu hóa', 2, 'Kho Lẻ', 'Dược Hậu Giang', 'BATCH004', 800, 100, 3200, 'Viên', '2026-06-30', 'Lê Văn C');

-- Insert sample unit entries
INSERT IGNORE INTO product_unit_entries (product_id, unit, quantity, conversion_rate) VALUES
(1, 'kiện', 1000, 5),
(2, 'hộp', 120, 1),
(3, 'kiện', 300, 10),
(4, 'kiện', 100, 8);
