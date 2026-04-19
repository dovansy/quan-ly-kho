# Database Schema Audit

Tài liệu liệt kê đầy đủ các bảng, cột, quan hệ của database `quan_ly_kho`, kèm
giải thích mục đích từng cột và đánh giá mức độ sử dụng so với mã nguồn
**backend** (`backend/src/`) và **frontend** (`frontend/src/`) hiện tại.

> Phạm vi tham chiếu: `backend/src/database/migration.sql`, `backend/src/models/*`.
> Các cột không còn dùng hoặc đáng xem lại được tổng hợp ở mục
> [Cột không dùng / cần review](#cột-không-dùng--cần-review) ở cuối file.

---

## 1. Sơ đồ quan hệ (ERD tóm tắt)

```
┌──────────┐      ┌────────────┐      ┌──────────┐
│  users   │──┬──▶│ user_roles │◀──┬──│  roles   │
└──────────┘  │   └────────────┘   │  └──────────┘
              │   (M-N pivot)      │

┌────────────┐       ┌──────────┐       ┌──────────────────────┐
│ warehouses │──1─N─▶│ products │──1─N─▶│ product_unit_entries │
└────────────┘       └──────────┘       └──────────────────────┘
                         ▲
                         │
                         │ (SET NULL on delete)
                         │
┌──────────┐       ┌────────────┐
│  sales   │──1─N─▶│ sale_items │──N─1──┘
└──────────┘       └────────────┘
```

Chi tiết associations (khai báo trong `backend/src/models/index.ts`):

| Quan hệ | Loại | Ghi chú |
|--|--|--|
| `users` ↔ `roles` | Many-to-Many qua `user_roles` | `onDelete: CASCADE` cả hai phía |
| `warehouses` → `products` | One-to-Many (`warehouse_id`) | `onDelete: CASCADE` |
| `products` → `product_unit_entries` | One-to-Many (`product_id`) | `onDelete: CASCADE` |
| `sales` → `sale_items` | One-to-Many (`sale_id`) | `onDelete: CASCADE` |
| `sale_items` → `products` | Many-to-One (`product_id`) | `onDelete: SET NULL` để giữ lịch sử hóa đơn khi sản phẩm bị xóa |

---

## 2. Bảng `users` — Tài khoản người dùng

| Cột | Kiểu | Null | Ý nghĩa | Đánh giá |
|--|--|--|--|--|
| `id` | INT, PK, AUTO_INCREMENT | ✗ | Khóa chính | **Cần** — dùng ở tất cả controller/route |
| `full_name` | VARCHAR(255) | ✓ | Họ tên đầy đủ | **Cần** — hiển thị trong accounts, my-account, set `importedBy` khi nhập SP |
| `username` | VARCHAR(100), UNIQUE | ✗ | Tên đăng nhập | **Cần** — login, JWT, `created_by` cho sales |
| `email` | VARCHAR(255), UNIQUE | ✓ | Email | **Cần** — hiển thị & chỉnh sửa ở accounts/my-account |
| `phone` | VARCHAR(20) | ✓ | SĐT | **Cần** — hiển thị & chỉnh sửa ở accounts/my-account |
| `password_hash` | VARCHAR(255) | ✗ | Hash bcrypt của mật khẩu | **Cần** — authController dùng khi login / đổi mật khẩu |
| `status` | ENUM('active','inactive') | ✗ | Trạng thái kích hoạt | **Cần** — filter + column ở `frontend/src/pages/accounts/index.tsx` |
| `created_at` | DATETIME | ✗ | Thời điểm tạo | **Timestamp chuẩn** — Sequelize tự điền, không hiển thị UI |
| `updated_at` | DATETIME | ✗ | Thời điểm cập nhật | **Timestamp chuẩn** — Sequelize tự điền, không hiển thị UI |

---

## 3. Bảng `roles` — Danh mục vai trò

| Cột | Kiểu | Null | Ý nghĩa | Đánh giá |
|--|--|--|--|--|
| `id` | INT, PK, AUTO_INCREMENT | ✗ | Khóa chính | **Cần** — FK tới `user_roles` |
| `role` | VARCHAR(50), UNIQUE | ✗ | Tên vai trò (`super_admin`, `admin`, …) | **Cần** — gate quyền trong accounts page, map label ở `roleLabels` |

Không có timestamps (`timestamps: false` trong model).

---

## 4. Bảng `user_roles` — Bảng trung gian N-N

| Cột | Kiểu | Null | Ý nghĩa | Đánh giá |
|--|--|--|--|--|
| `user_id` | INT, FK→`users.id`, PK | ✗ | Tham chiếu user | **Cần** |
| `role_id` | INT, FK→`roles.id`, PK | ✗ | Tham chiếu role | **Cần** |

Khóa chính tổ hợp `(user_id, role_id)`. Không có timestamps.

---

## 5. Bảng `warehouses` — Kho hàng

| Cột | Kiểu | Null | Ý nghĩa | Đánh giá |
|--|--|--|--|--|
| `id` | INT, PK, AUTO_INCREMENT | ✗ | Khóa chính | **Cần** |
| `name` | VARCHAR(255) | ✗ | Tên kho | **Cần** — hiển thị cột, làm option filter, dropdown |
| `address` | VARCHAR(500) | ✓ | Địa chỉ kho | **Cần** — column + form ở `warehouses/index.tsx` |
| `manager` | VARCHAR(255) | ✓ | Người quản lý kho | **Cần** — column + form ở `warehouses/index.tsx` |
| `status` | ENUM('active','inactive') | ✗ | Trạng thái hoạt động | **Cần** — filter + gating trong `warehouses/list` (chỉ trả về kho active) |
| `created_at` | DATETIME | ✗ | Thời điểm tạo | **Timestamp chuẩn** — dùng `order: [['created_at','DESC']]` |
| `updated_at` | DATETIME | ✗ | Thời điểm cập nhật | **Timestamp chuẩn** — Sequelize tự điền |

---

## 6. Bảng `products` — Sản phẩm

| Cột | Kiểu | Null | Ý nghĩa | Đánh giá |
|--|--|--|--|--|
| `id` | INT, PK, AUTO_INCREMENT | ✗ | Khóa chính | **Cần** |
| `name` | VARCHAR(255) | ✗ | Tên sản phẩm | **Cần** — hiển thị, tìm kiếm, unique rule cùng kho+lô để cộng dồn |
| `category` | VARCHAR(100) | ✓ | Loại sản phẩm | **Cần** — filter, autocomplete options, column |
| `warehouse_id` | INT, FK→`warehouses.id` | ✓ | FK tới kho | **Cần** — quan hệ chuẩn Sequelize |
| `warehouse_name` | VARCHAR(255) | ✓ | Tên kho (cached / denormalized) | **⚠ Trùng lặp** — xem mục cuối |
| `supplier` | VARCHAR(255) | ✓ | Nhà cung cấp | **Cần** — form, autocomplete, export Excel |
| `batch` | VARCHAR(100) | ✓ | Mã lô | **Cần** — column, form, khóa nghiệp vụ để cộng dồn stock |
| `quantity` | INT | ✗ | Tổng số lượng (quy đổi sang đơn vị lẻ) | **Cần** — column "Tổng", filter low-stock |
| `min_stock` | INT | ✗ | Tồn tối thiểu cảnh báo | **⚠ Có dùng 1 chỗ** — xem mục cuối |
| `unit_price` | DECIMAL(15,2) | ✗ | Giá nhập / đơn giá | **Cần** — dùng trong sales khi chọn SP, tính tiền (và trước đây tính `inventoryValue`) |
| `unit` | VARCHAR(50) | ✓ | Đơn vị hiển thị thô (text) | **⚠ Dư thừa** — xem mục cuối |
| `expiry_date` | DATE | ✓ | Hạn sử dụng | **Cần** — column, cảnh báo hết hạn, form |
| `imported_by` | VARCHAR(255) | ✓ | Người nhập hàng | **Cần** — column "Người nhập" trên products |
| `created_at` | DATETIME | ✗ | Ngày nhập/tạo bản ghi | **Cần** — column "Ngày tạo" + filter "Ngày nhập hàng" |
| `updated_at` | DATETIME | ✗ | Thời điểm cập nhật | **Timestamp chuẩn** — không hiển thị UI |

Indexes: `idx_products_warehouse_id`, `idx_products_name`.

---

## 7. Bảng `product_unit_entries` — Dòng đơn vị đóng gói

Một sản phẩm có thể có nhiều dòng: ví dụ "Kiện" + "Hộp" với hệ số quy đổi.

| Cột | Kiểu | Null | Ý nghĩa | Đánh giá |
|--|--|--|--|--|
| `id` | INT, PK, AUTO_INCREMENT | ✗ | Khóa chính | **Cần** |
| `product_id` | INT, FK→`products.id` | ✗ | Tham chiếu sản phẩm | **Cần** |
| `unit` | VARCHAR(50) | ✗ | Mã đơn vị (`kien`, `hop`, …) | **Cần** — render, map label |
| `quantity` | INT | ✗ | Số lượng theo đơn vị đó | **Cần** — hiển thị "5 Kiện + 10 Hộp" |
| `conversion_rate` | INT | ✗ | Hệ số quy đổi sang đơn vị lẻ | **Cần** — hiển thị "×N" + tính tổng quantity |

Không có timestamps (`timestamps: false`).

### Kết luận: Bảng **có cần**, nhưng logic hiện tại **đang SAI ở flow "nhập thêm hàng"**

Ý đồ thiết kế: mỗi sản phẩm có tối đa 2 dòng (1 dòng "kiện" + 1 dòng đơn vị lẻ `hop`/`goi`/…) để biểu diễn tồn kho ở dạng đóng gói, đồng bộ với UI 2 input
("Số kiện" + "Số lượng lẻ") ở `frontend/src/pages/products/index.tsx`.

Thực tế đang chạy sai ở **createProduct khi trùng SP + kho + lô**
(`backend/src/controllers/productController.ts:70-89`):

```ts
if (existing) {
  await existing.update({ quantity: existing.quantity + newQuantity, ... });
  if (unitEntries?.length) {
    await ProductUnitEntry.bulkCreate(unitEntries.map(...)); // APPEND
  }
}
```

Khi nhập thêm lô cũ, backend **append** các dòng mới vào `product_unit_entries` thay vì cộng dồn vào dòng đang có. Sau N lần re-import, 1 product có thể có 2N dòng, ví dụ:

```
kien | qty=5  | rate=10
hop  | qty=3  | rate=1
kien | qty=2  | rate=10   ← lần nhập thứ 2
hop  | qty=1  | rate=1
```

Các hệ quả cụ thể:

1. **Cột "Số lượng nhập" trên products table** (`pages/products/index.tsx:70-78` → `formatUnitEntries`) sẽ render lặp: `"5 Kiện (×10) + 3 Hộp + 2 Kiện (×10) + 1 Hộp"` — không đúng trạng thái tồn kho thực.

2. **Modal Edit SP** (`pages/products/index.tsx:173-180`) dùng `.find()` để lấy *entry đầu tiên* là kiện và *entry đầu tiên* không-kiện:
   ```ts
   const cartonEntry = record.unitEntries.find(e => e.unit === Unit.KIEN);
   const pieceEntry  = record.unitEntries.find(e => e.unit !== Unit.KIEN);
   ```
   → các dòng còn lại bị **bỏ qua im lặng** khi load vào form. Bấm "Cập nhật" sẽ xóa toàn bộ entries cũ và ghi lại theo giá trị form → **mất dữ liệu lũy kế** của các lần nhập trước.

3. **`products.quantity`** (cột cache tổng) vẫn đúng vì được cộng tay (`existing.quantity + newQuantity`). Nhưng `SUM(quantity * conversion_rate)` trên `product_unit_entries` có thể lệch với `products.quantity` nếu dữ liệu cũ không nhất quán.

4. **Giao diện nhập chỉ hỗ trợ 2 đơn vị** (kien + 1 small unit), nhưng schema không có ràng buộc → dữ liệu có thể có nhiều đơn vị khác, nhưng UI không render chính xác được.

### Đề xuất sửa

Chọn 1 trong 2 hướng:

**A. Siết schema + consolidate (khuyến nghị)**
- Thêm `UNIQUE KEY uq_pue_product_unit (product_id, unit)` trên `product_unit_entries`.
- Trong `createProduct` nhánh `existing`: thay `bulkCreate` bằng upsert — nếu `(product_id, unit)` đã có thì `quantity += new.quantity`, cập nhật `conversion_rate` nếu khác; nếu chưa có thì `create`.
- Cân nhắc migration "dọn dẹp" gộp các dòng trùng đơn vị cho dữ liệu cũ.

**B. Giữ append nhưng đồng bộ UI**
- Cho phép modal edit hiển thị & chỉnh N entries (không dùng `.find()` lấy first).
- Hoặc bỏ modal edit (chỉ cho delete/ thêm mới) và dùng `product_unit_entries` như một sổ lịch sử lần nhập.

Hướng A đơn giản hơn và khớp với UI hiện tại. Hướng B đòi hỏi rework UI.

---

## 8. Bảng `sales` — Hóa đơn bán hàng

| Cột | Kiểu | Null | Ý nghĩa | Đánh giá |
|--|--|--|--|--|
| `id` | INT, PK, AUTO_INCREMENT | ✗ | Khóa chính | **Cần** |
| `invoice_code` | VARCHAR(100), UNIQUE | ✗ | Mã hóa đơn tự sinh `HD-YYYYMMDD-NNN` | **Cần** — hiển thị, search, unique key |
| `customer_name` | VARCHAR(255) | ✓ | Tên khách | **Cần** — form, column, filter |
| `customer_phone` | VARCHAR(20) | ✓ | SĐT khách | **Cần** — form, column |
| `customer_address` | VARCHAR(500) | ✓ | Địa chỉ khách | **Cần** — form modal sales |
| `sale_type` | ENUM('wholesale','retail','broker') | ✗ | Loại giao dịch | **Cần** — 3 nút tạo đơn + tag color |
| `total_amount` | DECIMAL(15,2) | ✗ | Tổng tiền | **Cần** — column, StatCard tổng doanh thu |
| `paid` | TINYINT(1) | ✗ | Đã thanh toán? | **Cần** — filter, column, StatCard "Dư nợ" |
| `sale_date` | DATE | ✗ | Ngày bán | **Cần** — filter, column |
| `created_by` | VARCHAR(255) | ✓ | Username người tạo đơn | **⚠ Chưa hiển thị** — xem mục cuối |
| `created_at` | DATETIME | ✗ | Timestamp tạo | **Timestamp chuẩn** — Sequelize tự điền |
| `updated_at` | DATETIME | ✗ | Timestamp cập nhật | **Timestamp chuẩn** |

Index: `idx_sales_sale_date`, UNIQUE `uq_sales_invoice_code`.

---

## 9. Bảng `sale_items` — Dòng chi tiết hóa đơn

| Cột | Kiểu | Null | Ý nghĩa | Đánh giá |
|--|--|--|--|--|
| `id` | INT, PK, AUTO_INCREMENT | ✗ | Khóa chính | **Cần** |
| `sale_id` | INT, FK→`sales.id` | ✗ | FK tới hóa đơn (CASCADE) | **Cần** |
| `product_id` | INT, FK→`products.id`, nullable | ✓ | FK tới sản phẩm (SET NULL) | **Cần** — giữ lịch sử khi SP bị xóa |
| `product_name` | VARCHAR(255) | ✗ | Snapshot tên SP tại thời điểm bán | **Cần** — chống mất data khi SP đổi tên / bị xóa |
| `quantity` | INT | ✗ | Số lượng bán | **Cần** |
| `unit` | VARCHAR(50) | ✓ | Đơn vị bán (snapshot) | **Cần** — hiển thị "X hộp" trên dòng đơn |
| `unit_price` | DECIMAL(15,2) | ✗ | Đơn giá tại thời điểm bán | **Cần** |
| `total` | DECIMAL(15,2) | ✗ | Thành tiền (quantity × unit_price) | **Cần** — lưu snapshot, tránh tính lại |

Không có timestamps (`timestamps: false`).

---

## Cột không dùng / cần review

Đã audit lại đối chiếu từng cột với code backend + frontend. Kết quả chia làm
3 nhóm: **bug logic**, **cột nên bỏ**, và **cột cần xác nhận nghiệp vụ**.

### 🐞 Bug logic (không phải "cột thừa" mà là **flow đang sai**)

| Bảng | Vấn đề | Vị trí | Fix đề xuất |
|--|--|--|--|
| `product_unit_entries` | Flow "nhập thêm hàng trùng SP + kho + lô" append thêm dòng mới thay vì cộng vào dòng cũ → sau N lần re-import có 2N dòng, UI edit chỉ đọc first entry, mất dữ liệu khi update. | `backend/src/controllers/productController.ts:70-89` | Thêm `UNIQUE(product_id, unit)` + upsert logic. Xem [mục 7](#7-bảng-product_unit_entries--dòng-đơn-vị-đóng-gói) ở trên. |

### ❌ Nên cân nhắc bỏ

| Bảng | Cột | Lý do |
|--|--|--|
| `products` | `unit` (VARCHAR(50)) | Đơn vị "thô" dạng text (`Viên`, `Gói`…) được ghi từ seed & `req.body.unit` nhưng **chỉ render 1 chỗ duy nhất** là subtitle xám dưới tên SP ở inventory page (`inventory/index.tsx:119`) + cột Excel export. Mọi nghiệp vụ (render bảng products, dropdown sales, quy đổi, tính tồn) đều dùng `product_unit_entries`. Riêng sales page có `p.unit` nhưng giá trị đó đến từ `getProductsList` derive ra small unit từ `unitEntries` (`productController.ts:215`), **KHÔNG phải** `products.unit`. → an toàn để xóa. |
| `products` | `warehouse_name` | Denormalize tên kho, trùng với `warehouses.name` qua FK `warehouse_id`. Không có trigger sync → đổi tên kho sẽ lệch. Tất cả filter `where.warehouse_name` trong `productController` & `inventoryController` có thể thay bằng join `include: [{ model: Warehouse }]`. |
| `products` | `min_stock` | Dùng cho 2 chỗ: class cảnh báo màu đỏ (`inventory/index.tsx:166`) + `lowStockCount` stat (`inventoryController.ts:112`). **Không có input trên form create/edit products** → user tạo SP mới luôn có `min_stock=0`, `lowStockCount` luôn bằng 0 cho data người dùng; chỉ seed data có giá trị > 0. Nên hoặc (a) thêm form nhập để dùng thật, hoặc (b) bỏ cột + stat. |
| `sales` | `created_by` | Backend ghi `req.user?.username` vào cột, frontend map `createdBy` nhưng **không render** ở column, modal, hay report nào. Chỉ tồn tại trong DB. → bỏ được nếu không cần audit. |

### ⚠ Có dùng nhưng cần xác nhận nghiệp vụ

| Bảng | Cột | Ghi chú |
|--|--|--|
| `products` | `expiry_date` NULL | Schema cho NULL nhưng form require + inventory cảnh báo hết hạn. Nên siết `NOT NULL` nếu chắc chắn SP nào cũng phải có HSD. |
| `products` | `imported_by` (VARCHAR) | Luôn set từ `user.fullName / username` khi tạo. Không refresh khi user đổi tên → có data drift. Cân nhắc đổi thành FK `imported_by_user_id → users.id` để JOIN ra tên hiện tại. |
| `sale_items` | `product_id` (SET NULL) | Đúng chủ ý giữ lịch sử. Đảm bảo report tương lai fallback `product_name` snapshot khi `product_id IS NULL`. |
| `products` | `warehouse_id` NULL | Cho phép NULL nhưng form bắt buộc chọn kho. Nên `NOT NULL` để tránh orphan product. |

### 🧹 Dọn kèm nếu bỏ cột

- **`products.unit`**:
  - Model `backend/src/models/Product.ts` (attribute + init)
  - `backend/src/controllers/productController.ts:101,146` (ghi `unit: req.body.unit`)
  - `backend/src/controllers/inventoryController.ts:42` (`unit: p.unit`)
  - `backend/src/routes/productRoutes.ts:162` (swagger)
  - `backend/src/index.ts:91`
  - `backend/src/database/seed.ts` (các `unit: 'Viên'|'Gói'`)
  - `backend/src/database/migration.sql:78`
  - `frontend/src/services/products.service.ts:21`, `inventory.service.ts:14`
  - `frontend/src/pages/inventory/index.tsx:95,119` (Excel + subtitle)

- **`products.warehouse_name`**:
  - Model + migration
  - `productController`, `inventoryController` — mọi `where.warehouse_name`, `fn('DISTINCT', col('warehouse_name'))` thay bằng join `Warehouse` và đọc `warehouse.name`.
  - `frontend/src/services/products.service.ts:15`, `frontend/src/pages/products/index.tsx:51` (đổi sang đọc qua association).

- **`products.min_stock`**:
  - Model + migration
  - `inventoryController.getStats` — bỏ nhánh `lowStockCount`
  - `inventory/index.tsx:166` (class cảnh báo), `inventory/index.tsx:186` (StatCard), `inventory.service.ts:12,22`
  - Validator `minStock` trong `backend/src/validators/index.ts:47`
  - Swagger & seed

- **`sales.created_by`**:
  - Model + migration
  - `saleController` (tạo đơn — dòng 44, 69)
  - `services/sales.service.ts:26`, `pages/sales/index.tsx:45,76`
  - Swagger `backend/src/index.ts`, routes `saleRoutes.ts:84`

---

## Ghi chú khác

- Tất cả bảng dùng `ENGINE=InnoDB`, `CHARSET=utf8mb4`, `COLLATE=utf8mb4_0900_ai_ci`.
- `timestamps: false` được áp dụng cho: `roles`, `user_roles`, `product_unit_entries`, `sale_items` → KHÔNG cần quan tâm `created_at`/`updated_at` ở các bảng này.
- Sequelize config bật `underscored: true` → camelCase JS ↔ snake_case DB.
- Không có migration versioning (Umzug/Sequelize-CLI) — chỉ có 1 file `migration.sql` destructive. Mọi thay đổi cột ở trên cần thêm migration mới thủ công khi triển khai.
