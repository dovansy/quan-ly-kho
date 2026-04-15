# Backend - Cau Truc va Chi Tiet

## Cau Truc Thu Muc

```
backend/src/
├── index.ts              # Entry point
├── controllers/          # Xu ly request (auth, product, warehouse, sale, account, inventory)
├── models/               # Sequelize Models (User, Role, Product, Warehouse, Sale, ...)
├── routes/               # API routes + Swagger docs
├── middleware/            # Auth JWT, error handler, validation
├── utils/                # Response helpers, error codes, logger
└── database/             # Migration SQL + seed script
```

## Database Schema

### ERD (Entity Relationship)

```
users ──┬── user_roles ──┬── roles
        │                │
        │   products ────┬── product_unit_entries
        │       │
        │   warehouses
        │
        │   sales ───── sale_items
```

### Bang Chi Tiet

| Bang | Mo Ta | Cot Chinh |
|------|-------|-----------|
| **users** | Tai khoan nguoi dung | id, full_name, username, email, phone, password_hash, status |
| **roles** | Vai tro | id, role (super_admin, admin) |
| **user_roles** | Lien ket user-role | user_id, role_id |
| **warehouses** | Kho hang | id, name, address, manager, status |
| **products** | San pham | id, name, category, warehouse_id, warehouse_name, supplier, batch, quantity, min_stock, unit_price, unit, expiry_date, imported_by |
| **product_unit_entries** | Don vi quy doi | id, product_id, unit, quantity, conversion_rate |
| **sales** | Hoa don ban hang | id, invoice_code, customer_name, customer_phone, sale_type, total_amount, paid, sale_date, created_by |
| **sale_items** | Chi tiet hoa don | id, sale_id, product_name, quantity, unit, unit_price, total |

## API Endpoints

### Auth (`/api/v1/auth`)

| Method | Endpoint | Auth | Mo Ta |
|--------|----------|:----:|-------|
| POST | `/auth/login` | No | Dang nhap, tra ve accessToken + refreshToken + user |
| POST | `/auth/register` | No | Dang ky tai khoan moi |
| GET | `/auth/me` | Yes | Lay thong tin user hien tai |
| PUT | `/auth/profile` | Yes | Cap nhat ho ten, email, SDT |
| PUT | `/auth/change-password` | Yes | Doi mat khau |

### Products (`/api/v1/products`)

| Method | Endpoint | Mo Ta |
|--------|----------|-------|
| GET | `/products` | Danh sach san pham (phan trang, filter: keyword, category, warehouse) |
| POST | `/products` | Tao san pham hoac cong don neu trung ten+kho+lo |
| PUT | `/products/:id` | Cap nhat san pham |
| DELETE | `/products/:id` | Xoa san pham |
| GET | `/products/options` | Distinct values cho filter dropdowns |
| GET | `/products/batches` | Danh sach lo theo ten SP + kho |
| GET | `/products/list` | Danh sach don gian cho dropdown |

### Warehouses (`/api/v1/warehouses`)

| Method | Endpoint | Mo Ta |
|--------|----------|-------|
| GET | `/warehouses` | Danh sach kho + productCount + inventoryValue |
| POST | `/warehouses` | Tao kho moi |
| PUT | `/warehouses/:id` | Cap nhat kho |
| DELETE | `/warehouses/:id` | Xoa kho |
| GET | `/warehouses/list` | Danh sach kho active cho dropdown |

### Sales (`/api/v1/sales`)

| Method | Endpoint | Mo Ta |
|--------|----------|-------|
| GET | `/sales` | Danh sach hoa don (phan trang, filter: keyword, paid, saleDate) |
| POST | `/sales` | Tao hoa don (tu sinh ma HD-YYYYMMDD-XXX) |
| PUT | `/sales/:id` | Cap nhat hoa don |
| DELETE | `/sales/:id` | Xoa hoa don |

### Accounts (`/api/v1/accounts`)

| Method | Endpoint | Mo Ta |
|--------|----------|-------|
| GET | `/accounts` | Danh sach tai khoan (filter: keyword, status) |
| POST | `/accounts` | Tao tai khoan (tu gan role admin) |
| PUT | `/accounts/:id` | Cap nhat tai khoan |
| DELETE | `/accounts/:id` | Xoa tai khoan |

### Inventory (`/api/v1/inventory`)

| Method | Endpoint | Mo Ta |
|--------|----------|-------|
| GET | `/inventory` | Danh sach ton kho (filter: warehouse, category, supplier, batch, keyword) |
| GET | `/inventory/stats` | Thong ke: totalItems, totalValue, lowStockCount (ho tro filter) |
| GET | `/inventory/filters` | Cascading filter options tu database |

## Response Format

### Thanh cong
```json
{
  "code": 2000,
  "message": "Success",
  "data": { ... }
}
```

### Phan trang
```json
{
  "code": 2000,
  "message": "Success",
  "data": [ ... ],
  "metadata": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Loi
```json
{
  "code": 4001,
  "message": "Wrong password",
  "data": null
}
```

## Ma Loi (Error Codes)

| Code | HTTP | Mo Ta |
|------|------|-------|
| 2000 | 200 | Thanh cong |
| 1001 | 400 | Truong bat buoc |
| 4001 | 401 | Sai mat khau |
| 4010 | 401 | Chua xac thuc |
| 4040 | 404 | Khong tim thay |
| 4041 | 404 | User khong ton tai |
| 40011 | 409 | Email da ton tai |
| 40013 | 409 | Username da ton tai |
| 5000 | 500 | Loi server |
