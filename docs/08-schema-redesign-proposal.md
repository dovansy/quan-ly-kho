# Đề xuất Schema v2 — Tách Nhập / Xuất / Tồn kho (đã chốt)

Tài liệu này là thiết kế DB mới, **đã thống nhất với user**. Các quyết định
chốt ở §9. Chưa apply migration/code — dùng làm reference trước khi triển khai.

---

## 1. Flow nghiệp vụ

1. **Nhập hàng** (stock in): mỗi lần nhập tạo 1 bản ghi độc lập trong bảng nhập.
   - Cùng SP + cùng kho + cùng lô + cùng NCC vẫn **KHÔNG cộng dồn** — xem là 2 lần nhập khác nhau.
   - Mỗi dòng có: số **kiện**, số **lẻ**, số **hộp/kiện** (đơn vị lẻ = hộp/túi/lọ/gói, chọn từ bảng `small_units`).
   - Màn hình "Nhập hàng" hiển thị đầy đủ lịch sử các lần nhập.
   - **Không có page tạo SP thủ công** — khi nhập lần đầu, backend tự tạo row trong `products` với đơn vị lẻ lấy từ modal nhập.

2. **Xuất hàng** (stock out / bán): mỗi lần xuất tạo 1 hóa đơn gồm nhiều dòng.
   - Mỗi dòng xuất gắn với 1 SP + kho + lô + NCC cụ thể (để trừ đúng).
   - User chọn SP từ **API tồn kho** (`inventory_balance`, chỉ trả về dòng `stock > 0`).
   - Màn hình "Xuất hàng" hiển thị đầy đủ các lần xuất.

3. **Tồn kho** (bảng vật lý): `inventory_balance` lưu 1 row cho mỗi tổ hợp `(product, warehouse, supplier, batch)`. Trigger trên `stock_imports` và `stock_exports` tự động update cột `stock_pieces` và `nearest_expiry`.

---

## 2. Vấn đề của schema hiện tại

| Vấn đề | Hệ quả |
|--|--|
| Bảng `products` đóng vai trò kép: catalog + dòng tồn cho 1 lô. | Mỗi (SP + kho + lô) chỉ có 1 row, lần nhập sau bị cộng dồn hoặc append `product_unit_entries` lung tung. |
| `product_unit_entries` bị append khi nhập trùng (bug §7 doc 07). | UI edit đọc first entry → sai dữ liệu. |
| Không có `warehouse_id / batch / supplier` trên `sale_items`. | Không biết xuất từ lô nào → không trừ tồn chính xác. |
| Không có khái niệm "lần nhập" riêng biệt. | Không ghi nhận lịch sử nhập được. |
| Đơn vị lẻ là string tự do (`hop`, `goi`, `Viên`…). | Dữ liệu không chuẩn, khó filter/report. |

---

## 3. Thiết kế mới — 4 bảng nghiệp vụ + 1 bảng cache tồn + 1 lookup

```
┌────────────┐   ┌────────────┐       ┌───────────────┐
│ small_units│◀─┬│  products  │◀─N─1──│ stock_imports │  (bảng NHẬP)
└────────────┘  │└────────────┘       └───────────────┘
                │                            │ TRIGGER +/-
                │                            ▼
                │                     ┌───────────────────┐
                │                     │ inventory_balance │  (bảng TỒN, vật lý)
                │                     └───────────────────┘
                │                            ▲
                │                            │ TRIGGER -/+
                │                            │
                │                     ┌───────────────┐
                └──────── (N─1) ──────│ stock_exports │  (bảng XUẤT chi tiết)
                                      └───────┬───────┘
                                              │ N─1
                                              ▼
                                      ┌──────────────┐
                                      │ sale_orders  │  (HÓA ĐƠN XUẤT)
                                      └──────────────┘
```

| Bảng | Vai trò | Tương ứng code cũ |
|--|--|--|
| `small_units` | **Lookup** đơn vị lẻ: `hop`, `goi`, `tui`, `lo`, `vien`… | Thay cho enum `SmallUnit` trong `frontend/src/constants/enums.ts` |
| `products` | **Catalog** SP — tên, loại, `default_small_unit_id`. Auto-create khi nhập lần đầu. | Replace `products` cũ (bỏ quantity, warehouse_*, batch, supplier, min_stock, unit, imported_by, expiry_date) |
| `stock_imports` | **Bảng NHẬP** — mỗi lần nhập 1 row. | Thay `products` + `product_unit_entries` cũ cho ghi nhận lần nhập |
| `inventory_balance` | **Bảng TỒN (vật lý)** — maintained bởi trigger. | Thay logic tính tồn on-the-fly trong `inventoryController` cũ |
| `sale_orders` | **Hóa đơn xuất** (header). | Rename `sales` |
| `stock_exports` | **Dòng xuất chi tiết** + `warehouse_id/supplier/batch` để trừ đúng. | Rename + mở rộng `sale_items` |

---

## 4. Chi tiết từng bảng

### 4.1. `small_units` (lookup đơn vị lẻ)

| Cột | Kiểu | Null | Ý nghĩa |
|--|--|--|--|
| `id` | INT, PK, AUTO_INCREMENT | ✗ | PK — được lưu FK từ `products / stock_imports / stock_exports` |
| `code` | VARCHAR(50), UNIQUE | ✗ | Mã ngắn: `hop`, `goi`, `tui`, `lo`, `vien`, `chai`… |
| `label` | VARCHAR(100) | ✗ | Nhãn hiển thị: `Hộp`, `Gói`, `Túi`, `Lọ`, `Viên`, `Chai`… |
| `status` | ENUM('active','inactive') | ✗ | Bật/tắt hiển thị trong dropdown |
| `created_at`, `updated_at` | DATETIME | ✗ | Timestamp |

Seed mặc định: `hop`, `goi`, `tui`, `lo`, `vien`, `chai`.

### 4.2. `products` (catalog — auto-create)

| Cột | Kiểu | Null | Ý nghĩa |
|--|--|--|--|
| `id` | INT, PK, AUTO_INCREMENT | ✗ | PK |
| `name` | VARCHAR(255), UNIQUE | ✗ | Tên SP — khóa auto-create (find-or-create on import) |
| `category` | VARCHAR(100) | ✓ | Loại SP (autocomplete) |
| `default_small_unit_id` | INT, FK → `small_units.id` | ✗ | Đơn vị lẻ — gán từ lần nhập đầu tiên |
| `default_unit_price` | DECIMAL(15,2) | ✗ | Giá bán đề xuất — mặc định bằng `unit_price` lần nhập đầu, user có thể chỉnh |
| `status` | ENUM('active','inactive') | ✗ | Còn kinh doanh? |
| `created_at`, `updated_at` | DATETIME | ✗ | Timestamp |

**Auto-create logic (backend `stockImportController.create`):**
```ts
const product = await Product.findOne({ where: { name } })
  ?? await Product.create({
       name, category,
       default_small_unit_id: body.small_unit_id,
       default_unit_price: body.unit_price,
     });
// rồi INSERT stock_imports với product_id = product.id
```

**Không có form CRUD products trên frontend.** Page `/products` (nếu giữ) chỉ view & edit `category / default_unit_price / status`.

### 4.3. `stock_imports` (bảng NHẬP)

| Cột | Kiểu | Null | Ý nghĩa |
|--|--|--|--|
| `id` | INT, PK, AUTO_INCREMENT | ✗ | PK |
| `product_id` | INT, FK → `products.id` (RESTRICT) | ✗ | SP được nhập |
| `warehouse_id` | INT, FK → `warehouses.id` (RESTRICT) | ✗ | Kho nhập về |
| `supplier` | VARCHAR(255) | ✗ | Nhà cung cấp |
| `batch` | VARCHAR(100) | ✗ | Mã lô (cho phép trùng, mỗi lần nhập = 1 row mới) |
| `small_unit_id` | INT, FK → `small_units.id` (RESTRICT) | ✗ | Đơn vị lẻ chọn từ modal nhập |
| `carton_quantity` | INT | ✗ | Số kiện |
| `units_per_carton` | INT | ✗ | Số đơn vị lẻ / 1 kiện |
| `piece_quantity` | INT | ✗ | Số đơn vị lẻ nhập ngoài kiện |
| `unit_price` | DECIMAL(15,2) | ✗ | Giá nhập / 1 đơn vị lẻ |
| `expiry_date` | DATE | ✗ | HSD của lô |
| `imported_by_user_id` | INT, FK → `users.id` (SET NULL) | ✓ | User thực hiện nhập |
| `import_date` | DATE | ✗ | Ngày nhập thực tế |
| `note` | VARCHAR(500) | ✓ | Ghi chú |
| `created_at`, `updated_at` | DATETIME | ✗ | Timestamp |

Tổng đơn vị lẻ / row = `carton_quantity * units_per_carton + piece_quantity`.

**Indexes:** `(product_id, warehouse_id, supplier, batch)`, `(warehouse_id)`, `(import_date)`.
**KHÔNG UNIQUE** trên key grouping — cho phép nhiều lần nhập trùng.

### 4.4. `sale_orders` (HÓA ĐƠN XUẤT — header)

Rename từ `sales`, giữ gần nguyên.

| Cột | Kiểu | Null | Ý nghĩa |
|--|--|--|--|
| `id` | INT, PK, AUTO_INCREMENT | ✗ | PK |
| `invoice_code` | VARCHAR(100), UNIQUE | ✗ | `HD-YYYYMMDD-NNN` |
| `customer_name` | VARCHAR(255) | ✓ | Khách |
| `customer_phone` | VARCHAR(20) | ✓ | SĐT |
| `customer_address` | VARCHAR(500) | ✓ | Địa chỉ |
| `sale_type` | ENUM('wholesale','retail','broker') | ✗ | Loại giao dịch |
| `total_amount` | DECIMAL(15,2) | ✗ | Tổng = SUM(stock_exports.total) |
| `paid` | TINYINT(1) | ✗ | Đã trả? |
| `sale_date` | DATE | ✗ | Ngày bán |
| `created_by_user_id` | INT, FK → `users.id` (SET NULL) | ✓ | Người lập đơn |
| `created_at`, `updated_at` | DATETIME | ✗ | Timestamp |

### 4.5. `stock_exports` (DÒNG XUẤT)

| Cột | Kiểu | Null | Ý nghĩa |
|--|--|--|--|
| `id` | INT, PK, AUTO_INCREMENT | ✗ | PK |
| `sale_order_id` | INT, FK → `sale_orders.id` (CASCADE) | ✗ | Thuộc đơn nào |
| `product_id` | INT, FK → `products.id` (RESTRICT) | ✗ | SP xuất |
| `warehouse_id` | INT, FK → `warehouses.id` (RESTRICT) | ✗ | **Xuất từ kho nào** |
| `supplier` | VARCHAR(255) | ✗ | **Xuất từ lô của NCC nào** |
| `batch` | VARCHAR(100) | ✗ | **Xuất từ lô nào** |
| `small_unit_id` | INT, FK → `small_units.id` (RESTRICT) | ✗ | Snapshot đơn vị (= `products.default_small_unit_id` tại thời điểm xuất) |
| `quantity` | INT | ✗ | Số đơn vị lẻ xuất |
| `unit_price` | DECIMAL(15,2) | ✗ | Đơn giá tại thời điểm bán |
| `total` | DECIMAL(15,2) | ✗ | `quantity * unit_price` (snapshot) |

**Indexes:** `(sale_order_id)`, `(product_id, warehouse_id, supplier, batch)`.

Frontend sales form: user chọn từ dropdown `GET /inventory?stock>0` → tự fill `product_id, warehouse_id, supplier, batch, small_unit_id`.

#### Bán theo kiện + lẻ (UI flow)

Schema `stock_exports` chỉ lưu duy nhất `quantity` (tổng số lẻ) làm source of truth — KHÔNG thêm `carton_quantity / units_per_carton`. Lý do: `units_per_carton` của một lô đã được lưu ở `stock_imports` (lần nhập gần nhất theo `import_date DESC`), `inventory` API trả kèm field này nên frontend đủ thông tin để render và quy đổi.

**Modal "Tạo hóa đơn xuất hàng" (`frontend/src/pages/sales/index.tsx`)** mỗi dòng có:

| Input | Mô tả |
|---|---|
| Chọn từ tồn kho | Dropdown `GET /inventory` — trả kèm `units_per_carton` (lần nhập mới nhất của lô) |
| Số kiện | User nhập số kiện muốn bán; label hiển thị `(1 kiện = X)` để gợi ý quy cách |
| Số lẻ | User nhập số lẻ ngoài kiện (vd bóc 1 kiện ra bán 5 hộp lẻ) |
| Đơn giá | Đơn giá / 1 đơn vị lẻ |
| Thành tiền | `quantity * unit_price`, có dòng phụ "Tổng: N hộp" |

Frontend tự tính `quantity = carton_quantity * units_per_carton + piece_quantity` mỗi khi user thay đổi 1 trong 2 ô, validate `quantity ≤ stock_pieces`, rồi gửi backend duy nhất `quantity` (số lẻ tổng). Backend không thay đổi.

**Edit hóa đơn cũ:** auto-convert ngược `it.quantity → (carton, piece)` theo `units_per_carton` hiện tại của lô: `carton = floor(quantity / units_per_carton)`, `piece = quantity % units_per_carton`.

**Hiển thị tồn (`pages/inventory/index.tsx`):** vẫn render dạng "X Kiện × Y + Z lẻ" tự tính từ `stock_pieces / units_per_carton` (Y cố định theo lô). Vì `units_per_carton` cố định, sau mỗi lần bán (dù bóc kiện), tồn sẽ tự re-render về đúng quy cách ban đầu.

### 4.6. `inventory_balance` (TỒN KHO — bảng vật lý + trigger)

| Cột | Kiểu | Null | Ý nghĩa |
|--|--|--|--|
| `id` | INT, PK, AUTO_INCREMENT | ✗ | PK |
| `product_id` | INT, FK → `products.id` (RESTRICT) | ✗ | Phần của key grouping |
| `warehouse_id` | INT, FK → `warehouses.id` (RESTRICT) | ✗ | Phần của key grouping |
| `supplier` | VARCHAR(255) | ✗ | Phần của key grouping |
| `batch` | VARCHAR(100) | ✗ | Phần của key grouping |
| `stock_pieces` | INT | ✗ | Tồn hiện tại (đơn vị lẻ). Maintained bởi trigger. |
| `nearest_expiry` | DATE | ✓ | HSD gần nhất trong các lần nhập thuộc dòng này. Maintained bởi trigger. |
| `updated_at` | DATETIME | ✗ | Lần cập nhật gần nhất |

**UNIQUE KEY** `uq_ib_group (product_id, warehouse_id, supplier, batch)` — mỗi tổ hợp có đúng 1 row.
**CHECK** `chk_ib_stock_nonneg (stock_pieces >= 0)` — guard chống âm tồn.

**Query tồn kho (inventory page):** `SELECT * FROM inventory_balance WHERE stock_pieces > 0 [AND filters]` + JOIN `products/warehouses/small_units` để lấy tên & đơn vị.

---

## 5. Trigger duy trì `inventory_balance`

6 trigger trên 2 bảng (`stock_imports`, `stock_exports`):

### 5.1. Trigger nhập

```sql
DELIMITER $$

-- Khi INSERT 1 dòng nhập → cộng vào inventory_balance
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

-- Khi UPDATE dòng nhập → điều chỉnh delta
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
    -- Key đổi: trừ khỏi row cũ
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
  ELSE
    UPDATE inventory_balance
    SET stock_pieces = stock_pieces + (new_total - old_total), updated_at = NOW()
    WHERE product_id   = NEW.product_id   AND warehouse_id = NEW.warehouse_id
      AND supplier     = NEW.supplier     AND batch        = NEW.batch;
  END IF;

  -- Recompute nearest_expiry cho row bị ảnh hưởng
  UPDATE inventory_balance
  SET nearest_expiry = (SELECT MIN(expiry_date) FROM stock_imports
                        WHERE product_id   = NEW.product_id   AND warehouse_id = NEW.warehouse_id
                          AND supplier     = NEW.supplier     AND batch        = NEW.batch)
  WHERE product_id   = NEW.product_id   AND warehouse_id = NEW.warehouse_id
    AND supplier     = NEW.supplier     AND batch        = NEW.batch;
END$$

-- Khi DELETE dòng nhập → trừ
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
```

### 5.2. Trigger xuất

```sql
-- Khi INSERT dòng xuất → trừ
CREATE TRIGGER trg_se_after_insert
AFTER INSERT ON stock_exports FOR EACH ROW
BEGIN
  UPDATE inventory_balance
  SET stock_pieces = stock_pieces - NEW.quantity, updated_at = NOW()
  WHERE product_id   = NEW.product_id   AND warehouse_id = NEW.warehouse_id
    AND supplier     = NEW.supplier     AND batch        = NEW.batch;
END$$

-- Khi UPDATE dòng xuất → điều chỉnh delta
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

-- Khi DELETE dòng xuất → cộng trả
CREATE TRIGGER trg_se_after_delete
AFTER DELETE ON stock_exports FOR EACH ROW
BEGIN
  UPDATE inventory_balance
  SET stock_pieces = stock_pieces + OLD.quantity, updated_at = NOW()
  WHERE product_id   = OLD.product_id   AND warehouse_id = OLD.warehouse_id
    AND supplier     = OLD.supplier     AND batch        = OLD.batch;
END$$

DELIMITER ;
```

### 5.3. Guard chống âm tồn

- Check ở **application layer** (`stockExportController.create`): so sánh `inventory_balance.stock_pieces >= quantity` trước khi INSERT, báo lỗi 400 nếu không đủ.
- CHECK constraint `chk_ib_stock_nonneg` ở DB làm guard cuối cùng — nếu có race, DB sẽ từ chối update và transaction rollback.

---

## 6. SQL DDL đầy đủ (migration v2)

```sql
-- Destructive — drop & seed
DROP TABLE IF EXISTS stock_exports;
DROP TABLE IF EXISTS stock_imports;
DROP TABLE IF EXISTS inventory_balance;
DROP TABLE IF EXISTS sale_orders;
DROP TABLE IF EXISTS sale_items;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS product_unit_entries;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS small_units;

-- 1. Lookup đơn vị lẻ
CREATE TABLE small_units (
  id INT NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL,
  label VARCHAR(100) NOT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_small_units_code (code)
) ENGINE=InnoDB;

-- 2. Catalog (auto-create)
CREATE TABLE products (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT NULL,
  default_small_unit_id INT NOT NULL,
  default_unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_name (name),
  CONSTRAINT fk_products_small_unit FOREIGN KEY (default_small_unit_id)
    REFERENCES small_units(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 3. Bảng NHẬP
CREATE TABLE stock_imports (
  id INT NOT NULL AUTO_INCREMENT,
  product_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  supplier VARCHAR(255) NOT NULL,
  batch VARCHAR(100) NOT NULL,
  small_unit_id INT NOT NULL,
  carton_quantity INT NOT NULL DEFAULT 0,
  units_per_carton INT NOT NULL DEFAULT 0,
  piece_quantity INT NOT NULL DEFAULT 0,
  unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  expiry_date DATE NOT NULL,
  imported_by_user_id INT DEFAULT NULL,
  import_date DATE NOT NULL,
  note VARCHAR(500) DEFAULT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_si_group (product_id, warehouse_id, supplier, batch),
  KEY idx_si_warehouse (warehouse_id),
  KEY idx_si_import_date (import_date),
  CONSTRAINT fk_si_product    FOREIGN KEY (product_id)          REFERENCES products(id)    ON DELETE RESTRICT,
  CONSTRAINT fk_si_warehouse  FOREIGN KEY (warehouse_id)        REFERENCES warehouses(id)  ON DELETE RESTRICT,
  CONSTRAINT fk_si_small_unit FOREIGN KEY (small_unit_id)       REFERENCES small_units(id) ON DELETE RESTRICT,
  CONSTRAINT fk_si_user       FOREIGN KEY (imported_by_user_id) REFERENCES users(id)       ON DELETE SET NULL
) ENGINE=InnoDB;

-- 4. Hóa đơn xuất
CREATE TABLE sale_orders (
  id INT NOT NULL AUTO_INCREMENT,
  invoice_code VARCHAR(100) NOT NULL,
  customer_name VARCHAR(255) DEFAULT NULL,
  customer_phone VARCHAR(20) DEFAULT NULL,
  customer_address VARCHAR(500) DEFAULT NULL,
  sale_type ENUM('wholesale','retail','broker') NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  paid TINYINT(1) NOT NULL DEFAULT 0,
  sale_date DATE NOT NULL,
  created_by_user_id INT DEFAULT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_so_invoice_code (invoice_code),
  KEY idx_so_sale_date (sale_date),
  CONSTRAINT fk_so_user FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. Dòng xuất
CREATE TABLE stock_exports (
  id INT NOT NULL AUTO_INCREMENT,
  sale_order_id INT NOT NULL,
  product_id INT NOT NULL,
  warehouse_id INT NOT NULL,
  supplier VARCHAR(255) NOT NULL,
  batch VARCHAR(100) NOT NULL,
  small_unit_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  total DECIMAL(15,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_se_sale_order (sale_order_id),
  KEY idx_se_group (product_id, warehouse_id, supplier, batch),
  CONSTRAINT fk_se_order      FOREIGN KEY (sale_order_id) REFERENCES sale_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_se_product    FOREIGN KEY (product_id)    REFERENCES products(id)    ON DELETE RESTRICT,
  CONSTRAINT fk_se_warehouse  FOREIGN KEY (warehouse_id)  REFERENCES warehouses(id)  ON DELETE RESTRICT,
  CONSTRAINT fk_se_small_unit FOREIGN KEY (small_unit_id) REFERENCES small_units(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 6. Tồn kho (vật lý)
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
  CONSTRAINT fk_ib_product   FOREIGN KEY (product_id)   REFERENCES products(id)   ON DELETE RESTRICT,
  CONSTRAINT fk_ib_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
  CONSTRAINT chk_ib_stock_nonneg CHECK (stock_pieces >= 0)
) ENGINE=InnoDB;

-- 7. Triggers: xem §5
```

---

## 7. Ảnh hưởng code — phải sửa gì

### Backend
- **Model mới**: `SmallUnit`, `StockImport`, `StockExport`, `SaleOrder` (rename `Sale`), `InventoryBalance`.
- **Model bỏ**: `ProductUnitEntry`. `Sale`, `SaleItem` rename.
- **Model rút gọn**: `Product` (chỉ catalog).
- **Controller mới**:
  - `smallUnitController` — list/CRUD đơn vị lẻ.
  - `stockImportController` — list/create/update/delete lần nhập. `create` có logic auto-create product.
  - `inventoryController` — query `inventory_balance` (bỏ logic tính tay).
- **Controller sửa**:
  - `productController` — bỏ create (auto từ import), chỉ giữ list/update `category / default_unit_price / status`.
  - `saleController` → đổi bảng đích sang `sale_orders` + `stock_exports`; guard check `stock_pieces >= quantity` trước khi tạo export.
- **Route mới**: `/api/v1/imports`, `/api/v1/small-units`.

### Frontend
- Pages:
  - `/products`: bỏ nút "Thêm SP" và modal create. Chỉ hiển thị catalog + edit category/price/status.
  - `/imports` (**mới**): bảng lịch sử nhập + modal "Nhập hàng mới" (chọn SP hoặc nhập tên mới, chọn `small_unit` từ dropdown, nhập kiện/hộp/kho/lô/NCC/HSD/giá).
  - `/inventory`: đọc từ `GET /inventory` trả về `inventory_balance`.
  - `/sales`: form chọn từng dòng bán **từ dropdown tồn kho** (API `/inventory?stock>0`), auto-fill (warehouse, supplier, batch, product, small_unit).
  - `/small-units` (mới, admin only): CRUD đơn vị lẻ.
- Services, hooks, enums tương ứng. `SmallUnit` enum cũ → lấy từ API.

---

## 8. Migration dữ liệu cũ

**Quyết định: drop & seed lại**, không viết script migration. Phù hợp vì:
- Đang ở giai đoạn dev, data seed demo.
- Script migration `sale_items` cũ (không có warehouse/supplier/batch) quá phức tạp.

Seed mới gồm: super_admin, admin; 6 small_units mặc định (`hop`, `goi`, `tui`, `lo`, `vien`, `chai`); 1 kho mẫu; optionally 1–2 bản ghi `stock_imports` để test inventory_balance.

---

## 9. Quyết định đã chốt (confirmed)

| # | Câu hỏi | Quyết định |
|--|--|--|
| 1 | `products` có cho tạo tay không? | **Không.** Auto-create khi nhập lần đầu, đơn vị lẻ lấy từ modal nhập. |
| 2 | Tồn kho là view hay bảng vật lý? | **Bảng vật lý** `inventory_balance` + **trigger** duy trì. |
| 3 | Data cũ xử lý thế nào? | **Drop & seed lại**, không viết migration script. |
| 4 | Đóng gói nhiều tầng? | **2 tầng** — kiện + lẻ. |
| 5 | Flow chọn SP khi xuất? | Chọn từ **API tồn kho**, **bắt buộc có tồn** (`stock_pieces > 0`). |
| 6 | Quản lý đơn vị lẻ? | **Bảng `small_units`** riêng + FK từ products/stock_imports/stock_exports. |

---

## 10. Kế hoạch triển khai

| Bước | Mô tả | Ước lượng |
|--|--|--|
| 1 | Confirm design này | — |
| 2 | Viết `migration.sql` v2 (bảng + triggers) + seed mới | ~1h |
| 3 | Sequelize models + associations mới | 1h |
| 4 | Backend controllers/routes: `smallUnit`, `stockImport`, refactor `inventory`, `sale` → `sale_orders/stock_exports`, `product` (list-only) | 3–4h |
| 5 | Frontend: bỏ modal create products, thêm page `/imports`, refactor inventory + sales, page `/small-units` | 4–5h |
| 6 | Test E2E: tạo 1 nhập → kiểm tra products tự tạo + `inventory_balance` +N; nhập thêm cùng lô → balance +N; xuất → balance −M; xóa lần nhập → balance −N | 1h |
