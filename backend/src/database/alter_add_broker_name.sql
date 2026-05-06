-- Migration: thêm cột broker_name vào sale_orders
-- Dùng cho loại bán "Nhà môi giới" (broker).

ALTER TABLE sale_orders
  ADD COLUMN broker_name VARCHAR(255) DEFAULT NULL AFTER customer_address;
