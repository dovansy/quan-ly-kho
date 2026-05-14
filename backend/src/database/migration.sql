-- Quan Ly Kho - Database Schema v2
-- Run this script to initialize the database
-- Destructive: drops existing tables. Use `npm run seed` to run.

CREATE DATABASE IF NOT EXISTS railway
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE railway;

-- Drop trigger trước
DROP TRIGGER IF EXISTS trg_si_after_insert;
DROP TRIGGER IF EXISTS trg_si_after_update;
DROP TRIGGER IF EXISTS trg_si_after_delete;
DROP TRIGGER IF EXISTS trg_se_after_insert;
DROP TRIGGER IF EXISTS trg_se_after_update;
DROP TRIGGER IF EXISTS trg_se_after_delete;

-- Drop in reverse dependency order
DROP TABLE IF EXISTS inventory_transfers;
DROP TABLE IF EXISTS stock_exports;
DROP TABLE IF EXISTS stock_imports;
DROP TABLE IF EXISTS inventory_balance;
DROP TABLE IF EXISTS sale_orders;
DROP TABLE IF EXISTS sale_items;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS product_unit_entries;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS small_units;
DROP TABLE IF EXISTS warehouses;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;

-- ────────────────────────────────────────────────
-- Auth tables
-- ────────────────────────────────────────────────
CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(255) DEFAULT NULL,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE roles (
  id INT NOT NULL AUTO_INCREMENT,
  role VARCHAR(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE user_roles (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  KEY idx_user_roles_role_id (role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ────────────────────────────────────────────────
-- Warehouse
-- ────────────────────────────────────────────────
CREATE TABLE warehouses (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500) DEFAULT NULL,
  manager VARCHAR(255) DEFAULT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ────────────────────────────────────────────────
-- Lookup: small_units
-- ────────────────────────────────────────────────
CREATE TABLE small_units (
  id INT NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL,
  label VARCHAR(100) NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_small_units_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ────────────────────────────────────────────────
-- Catalog: products (auto-created on import)
-- ────────────────────────────────────────────────
CREATE TABLE products (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT NULL,
  supplier VARCHAR(255) DEFAULT NULL,
  default_small_unit_id INT NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_name (name),
  KEY idx_products_category (category),
  KEY idx_products_supplier (supplier),
  CONSTRAINT fk_products_small_unit FOREIGN KEY (default_small_unit_id)
    REFERENCES small_units(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ────────────────────────────────────────────────
-- NHẬP: stock_imports (lịch sử nhập, mỗi lần 1 row)
-- ────────────────────────────────────────────────
CREATE TABLE stock_imports (
  id INT NOT NULL AUTO_INCREMENT,
  product_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  supplier VARCHAR(255) NOT NULL,
  batch VARCHAR(100) NOT NULL,
  small_unit_id INT NOT NULL,
  carton_quantity INT NOT NULL DEFAULT 0,
  units_per_carton INT NOT NULL DEFAULT 1,
  piece_quantity INT NOT NULL DEFAULT 0,
  expiry_date DATE DEFAULT NULL,
  imported_by_user_id INT DEFAULT NULL,
  import_date DATE NOT NULL,
  note VARCHAR(500) DEFAULT NULL,
  input_total_pieces INT DEFAULT NULL COMMENT 'Có giá trị = bản ghi nhập theo mode viên',
  units_per_box INT DEFAULT NULL,
  boxes_per_carton INT DEFAULT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_si_group (product_id, warehouse_id, supplier, batch),
  KEY idx_si_warehouse (warehouse_id),
  KEY idx_si_import_date (import_date),
  CONSTRAINT fk_si_product    FOREIGN KEY (product_id)          REFERENCES products(id)    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_si_warehouse  FOREIGN KEY (warehouse_id)        REFERENCES warehouses(id)  ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_si_small_unit FOREIGN KEY (small_unit_id)       REFERENCES small_units(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_si_user       FOREIGN KEY (imported_by_user_id) REFERENCES users(id)       ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ────────────────────────────────────────────────
-- HÓA ĐƠN XUẤT: sale_orders (header)
-- ────────────────────────────────────────────────
CREATE TABLE sale_orders (
  id INT NOT NULL AUTO_INCREMENT,
  invoice_code VARCHAR(100) NOT NULL,
  customer_name VARCHAR(255) DEFAULT NULL,
  customer_phone VARCHAR(20) DEFAULT NULL,
  customer_address VARCHAR(500) DEFAULT NULL,
  broker_name VARCHAR(255) DEFAULT NULL,
  sale_type ENUM('wholesale', 'retail', 'broker') NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  paid TINYINT(1) NOT NULL DEFAULT 0,
  sale_date DATE NOT NULL,
  returned TINYINT(1) NOT NULL DEFAULT 0,
  returned_at DATETIME DEFAULT NULL,
  created_by_user_id INT DEFAULT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_so_invoice_code (invoice_code),
  KEY idx_so_sale_date (sale_date),
  CONSTRAINT fk_so_user FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ────────────────────────────────────────────────
-- DÒNG XUẤT: stock_exports
-- ────────────────────────────────────────────────
CREATE TABLE stock_exports (
  id INT NOT NULL AUTO_INCREMENT,
  sale_order_id INT NOT NULL,
  product_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  supplier VARCHAR(255) NOT NULL,
  batch VARCHAR(100) NOT NULL,
  small_unit_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total DECIMAL(15, 2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_se_sale_order (sale_order_id),
  KEY idx_se_group (product_id, warehouse_id, supplier, batch),
  CONSTRAINT fk_se_order      FOREIGN KEY (sale_order_id) REFERENCES sale_orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_se_product    FOREIGN KEY (product_id)    REFERENCES products(id)    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_se_warehouse  FOREIGN KEY (warehouse_id)  REFERENCES warehouses(id)  ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_se_small_unit FOREIGN KEY (small_unit_id) REFERENCES small_units(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ────────────────────────────────────────────────
-- TỒN: inventory_balance (vật lý, maintained bởi trigger)
-- ────────────────────────────────────────────────
CREATE TABLE inventory_balance (
  id INT NOT NULL AUTO_INCREMENT,
  product_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  supplier VARCHAR(255) NOT NULL,
  batch VARCHAR(100) NOT NULL,
  stock_pieces INT NOT NULL DEFAULT 0,
  nearest_expiry DATE DEFAULT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ib_group (product_id, warehouse_id, supplier, batch),
  KEY idx_ib_stock (stock_pieces),
  CONSTRAINT fk_ib_product   FOREIGN KEY (product_id)   REFERENCES products(id)   ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_ib_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_ib_stock_nonneg CHECK (stock_pieces >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ────────────────────────────────────────────────
-- LOG: inventory_transfers (lịch sử chuyển kho)
-- ────────────────────────────────────────────────
CREATE TABLE inventory_transfers (
  id INT NOT NULL AUTO_INCREMENT,
  product_id INT NOT NULL,
  warehouse_id_from INT NOT NULL,
  warehouse_id_to INT NOT NULL,
  supplier VARCHAR(255) NOT NULL,
  batch VARCHAR(100) NOT NULL,
  quantity INT NOT NULL,
  transferred_by_user_id INT DEFAULT NULL,
  transfer_date DATETIME NOT NULL,
  note VARCHAR(500) DEFAULT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_it_date (transfer_date),
  KEY idx_it_product (product_id),
  CONSTRAINT fk_it_product FOREIGN KEY (product_id)        REFERENCES products(id)   ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_it_wh_from FOREIGN KEY (warehouse_id_from) REFERENCES warehouses(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_it_wh_to   FOREIGN KEY (warehouse_id_to)   REFERENCES warehouses(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_it_user    FOREIGN KEY (transferred_by_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_it_qty_pos CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ────────────────────────────────────────────────
-- TRIGGERS: duy trì inventory_balance
-- ────────────────────────────────────────────────
DELIMITER $$

-- INSERT lần nhập → cộng vào balance
CREATE TRIGGER trg_si_after_insert
AFTER INSERT ON stock_imports FOR EACH ROW
BEGIN
  INSERT INTO inventory_balance
    (product_id, warehouse_id, supplier, batch, stock_pieces, nearest_expiry, updated_at)
  VALUES
    (NEW.product_id, NEW.warehouse_id, NEW.supplier, NEW.batch,
     NEW.carton_quantity * NEW.units_per_carton + NEW.piece_quantity,
     NEW.expiry_date, NOW())
  ON DUPLICATE KEY UPDATE
    stock_pieces   = stock_pieces + VALUES(stock_pieces),
    nearest_expiry = LEAST(IFNULL(nearest_expiry, VALUES(nearest_expiry)), VALUES(nearest_expiry)),
    updated_at     = NOW();
END$$

-- UPDATE lần nhập → điều chỉnh delta
CREATE TRIGGER trg_si_after_update
AFTER UPDATE ON stock_imports FOR EACH ROW
BEGIN
  DECLARE old_total INT;
  DECLARE new_total INT;
  SET old_total = OLD.carton_quantity * OLD.units_per_carton + OLD.piece_quantity;
  SET new_total = NEW.carton_quantity * NEW.units_per_carton + NEW.piece_quantity;

  IF NEW.product_id   <> OLD.product_id
  OR NEW.warehouse_id <> OLD.warehouse_id
  OR NEW.supplier     <> OLD.supplier
  OR NEW.batch        <> OLD.batch THEN
    -- Trừ khỏi row cũ
    UPDATE inventory_balance SET stock_pieces = stock_pieces - old_total, updated_at = NOW()
    WHERE product_id   = OLD.product_id   AND warehouse_id = OLD.warehouse_id
      AND supplier     = OLD.supplier     AND batch        = OLD.batch;
    -- Cộng vào row mới (UPSERT)
    INSERT INTO inventory_balance
      (product_id, warehouse_id, supplier, batch, stock_pieces, nearest_expiry, updated_at)
    VALUES
      (NEW.product_id, NEW.warehouse_id, NEW.supplier, NEW.batch, new_total, NEW.expiry_date, NOW())
    ON DUPLICATE KEY UPDATE
      stock_pieces = stock_pieces + VALUES(stock_pieces),
      updated_at   = NOW();
    -- Recompute nearest_expiry cho row cũ
    UPDATE inventory_balance
    SET nearest_expiry = (SELECT MIN(expiry_date) FROM stock_imports
                          WHERE product_id   = OLD.product_id   AND warehouse_id = OLD.warehouse_id
                            AND supplier     = OLD.supplier     AND batch        = OLD.batch)
    WHERE product_id   = OLD.product_id   AND warehouse_id = OLD.warehouse_id
      AND supplier     = OLD.supplier     AND batch        = OLD.batch;
  ELSE
    UPDATE inventory_balance
    SET stock_pieces = stock_pieces + (new_total - old_total), updated_at = NOW()
    WHERE product_id   = NEW.product_id   AND warehouse_id = NEW.warehouse_id
      AND supplier     = NEW.supplier     AND batch        = NEW.batch;
  END IF;

  -- Recompute nearest_expiry cho row mới
  UPDATE inventory_balance
  SET nearest_expiry = (SELECT MIN(expiry_date) FROM stock_imports
                        WHERE product_id   = NEW.product_id   AND warehouse_id = NEW.warehouse_id
                          AND supplier     = NEW.supplier     AND batch        = NEW.batch)
  WHERE product_id   = NEW.product_id   AND warehouse_id = NEW.warehouse_id
    AND supplier     = NEW.supplier     AND batch        = NEW.batch;
END$$

-- DELETE lần nhập → trừ
CREATE TRIGGER trg_si_after_delete
AFTER DELETE ON stock_imports FOR EACH ROW
BEGIN
  UPDATE inventory_balance
  SET stock_pieces   = stock_pieces - (OLD.carton_quantity * OLD.units_per_carton + OLD.piece_quantity),
      nearest_expiry = (SELECT MIN(expiry_date) FROM stock_imports
                        WHERE product_id   = OLD.product_id   AND warehouse_id = OLD.warehouse_id
                          AND supplier     = OLD.supplier     AND batch        = OLD.batch),
      updated_at     = NOW()
  WHERE product_id   = OLD.product_id   AND warehouse_id = OLD.warehouse_id
    AND supplier     = OLD.supplier     AND batch        = OLD.batch;
END$$

-- INSERT dòng xuất → trừ
CREATE TRIGGER trg_se_after_insert
AFTER INSERT ON stock_exports FOR EACH ROW
BEGIN
  UPDATE inventory_balance
  SET stock_pieces = stock_pieces - NEW.quantity, updated_at = NOW()
  WHERE product_id   = NEW.product_id   AND warehouse_id = NEW.warehouse_id
    AND supplier     = NEW.supplier     AND batch        = NEW.batch;
END$$

-- UPDATE dòng xuất → điều chỉnh delta
CREATE TRIGGER trg_se_after_update
AFTER UPDATE ON stock_exports FOR EACH ROW
BEGIN
  IF NEW.product_id   <> OLD.product_id
  OR NEW.warehouse_id <> OLD.warehouse_id
  OR NEW.supplier     <> OLD.supplier
  OR NEW.batch        <> OLD.batch THEN
    -- Trả lại số cũ
    UPDATE inventory_balance SET stock_pieces = stock_pieces + OLD.quantity, updated_at = NOW()
    WHERE product_id   = OLD.product_id   AND warehouse_id = OLD.warehouse_id
      AND supplier     = OLD.supplier     AND batch        = OLD.batch;
    -- Trừ ở key mới
    UPDATE inventory_balance SET stock_pieces = stock_pieces - NEW.quantity, updated_at = NOW()
    WHERE product_id   = NEW.product_id   AND warehouse_id = NEW.warehouse_id
      AND supplier     = NEW.supplier     AND batch        = NEW.batch;
  ELSE
    UPDATE inventory_balance
    SET stock_pieces = stock_pieces - (NEW.quantity - OLD.quantity), updated_at = NOW()
    WHERE product_id   = NEW.product_id   AND warehouse_id = NEW.warehouse_id
      AND supplier     = NEW.supplier     AND batch        = NEW.batch;
  END IF;
END$$

-- DELETE dòng xuất → cộng trả
CREATE TRIGGER trg_se_after_delete
AFTER DELETE ON stock_exports FOR EACH ROW
BEGIN
  UPDATE inventory_balance
  SET stock_pieces = stock_pieces + OLD.quantity, updated_at = NOW()
  WHERE product_id   = OLD.product_id   AND warehouse_id = OLD.warehouse_id
    AND supplier     = OLD.supplier     AND batch        = OLD.batch;
END$$

DELIMITER ;
