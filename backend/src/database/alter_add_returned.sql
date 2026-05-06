-- Migration: thêm cột returned + returned_at vào sale_orders
-- Chạy lệnh này 1 lần trên DB hiện tại để hỗ trợ tính năng "Hoàn hàng".
-- Nếu bạn đã chạy lại migration.sql (DROP + CREATE) thì không cần file này.

ALTER TABLE sale_orders
  ADD COLUMN returned TINYINT(1) NOT NULL DEFAULT 0 AFTER sale_date,
  ADD COLUMN returned_at DATETIME DEFAULT NULL AFTER returned;
