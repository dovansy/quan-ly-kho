-- Quan Ly Kho - Database Schema
-- Run this script to initialize the database

CREATE DATABASE IF NOT EXISTS quan_ly_kho;
USE quan_ly_kho;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(255) DEFAULT NULL,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY username (username),
  UNIQUE KEY email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id INT NOT NULL AUTO_INCREMENT,
  role VARCHAR(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- User-Roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  KEY role_id (role_id),
  CONSTRAINT user_roles_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT user_roles_ibfk_2 FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500) DEFAULT NULL,
  manager VARCHAR(255) DEFAULT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT NULL,
  warehouse_id INT DEFAULT NULL,
  warehouse_name VARCHAR(255) DEFAULT NULL,
  supplier VARCHAR(255) DEFAULT NULL,
  batch VARCHAR(100) DEFAULT NULL,
  quantity INT DEFAULT 0,
  min_stock INT DEFAULT 0,
  unit_price DECIMAL(15, 2) DEFAULT 0.00,
  unit VARCHAR(50) DEFAULT NULL,
  expiry_date DATE DEFAULT NULL,
  imported_by VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY warehouse_id (warehouse_id),
  CONSTRAINT products_ibfk_1 FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Product unit entries (for multi-unit conversion)
CREATE TABLE IF NOT EXISTS product_unit_entries (
  id INT NOT NULL AUTO_INCREMENT,
  product_id INT NOT NULL,
  unit VARCHAR(50) NOT NULL,
  quantity INT DEFAULT 0,
  conversion_rate INT DEFAULT 1,
  PRIMARY KEY (id),
  KEY product_id (product_id),
  CONSTRAINT product_unit_entries_ibfk_1 FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id INT NOT NULL AUTO_INCREMENT,
  invoice_code VARCHAR(100) NOT NULL,
  customer_name VARCHAR(255) DEFAULT NULL,
  customer_phone VARCHAR(20) DEFAULT NULL,
  sale_type ENUM('wholesale', 'retail') NOT NULL,
  total_amount DECIMAL(15, 2) DEFAULT 0.00,
  paid TINYINT(1) DEFAULT 0,
  sale_date DATE NOT NULL,
  created_by VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY invoice_code (invoice_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Sale items table
CREATE TABLE IF NOT EXISTS sale_items (
  id INT NOT NULL AUTO_INCREMENT,
  sale_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  unit VARCHAR(50) DEFAULT NULL,
  unit_price DECIMAL(15, 2) DEFAULT 0.00,
  total DECIMAL(15, 2) DEFAULT 0.00,
  PRIMARY KEY (id),
  KEY sale_id (sale_id),
  CONSTRAINT sale_items_ibfk_1 FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert default roles
INSERT IGNORE INTO roles (role) VALUES ('super_admin'), ('admin');

-- Insert default super admin user (password: admin123)
INSERT IGNORE INTO users (full_name, username, email, phone, password_hash, status, created_at, updated_at)
VALUES ('Super Admin', 'admin', 'admin@quanlykho.com', '0901234567', '$2b$10$sWXhXWCcmjyFh6EoJQQDxuoJ4WUa/QH3IDzoJHaF262FKP3/QTzrq', 'active', NOW(), NOW());

-- Assign super_admin role to the default user
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'admin' AND r.role = 'super_admin';

-- Insert sample warehouses
INSERT IGNORE INTO warehouses (id, name, address, manager, status, created_at, updated_at) VALUES
(1, 'Kho Chẵn', '123 Cầu Giấy, Hà Nội', 'Nguyễn Văn A', 'active', NOW(), NOW()),
(2, 'Kho Lẻ', '456 Nguyễn Huệ, Quận 1, TP.HCM', 'Trần Thị B', 'active', NOW(), NOW()),
(3, 'Kho Thuốc BHYT', '789 Nguyễn Văn Linh, Đà Nẵng', 'Lê Văn C', 'active', NOW(), NOW());

-- Insert sample products
INSERT IGNORE INTO products (id, name, category, warehouse_id, warehouse_name, supplier, batch, quantity, min_stock, unit_price, unit, expiry_date, imported_by, created_at, updated_at) VALUES
(1, 'Paracetamol 500mg', 'Thuốc giảm đau', 1, 'Kho Chẵn', 'Dược Hậu Giang', 'BATCH001', 5000, 1000, 1500, 'Viên', '2027-03-15', 'Nguyễn Văn A', NOW(), NOW()),
(2, 'Amoxicillin 250mg', 'Kháng sinh', 2, 'Kho Lẻ', 'Traphaco', 'BATCH002', 120, 200, 2500, 'Gói', '2024-04-10', 'Trần Thị B', NOW(), NOW()),
(3, 'Vitamin C 1000mg', 'Vitamin', 1, 'Kho Chẵn', 'Imexpharm', 'BATCH003', 3000, 500, 800, 'Viên', '2026-12-01', 'Nguyễn Văn A', NOW(), NOW()),
(4, 'Omeprazol 20mg', 'Thuốc tiêu hóa', 2, 'Kho Lẻ', 'Dược Hậu Giang', 'BATCH004', 800, 100, 3200, 'Viên', '2026-06-30', 'Lê Văn C', NOW(), NOW());

-- Insert sample unit entries
INSERT IGNORE INTO product_unit_entries (product_id, unit, quantity, conversion_rate) VALUES
(1, 'kiện', 1000, 5),
(2, 'hộp', 120, 1),
(3, 'kiện', 300, 10),
(4, 'kiện', 100, 8);
