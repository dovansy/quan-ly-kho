# API Reference

Base URL: `http://localhost:3000/api/v1`

Swagger UI: `http://localhost:3000/api-docs`

## Authentication

Tat ca API (tru login/register) yeu cau header:
```
Authorization: Bearer <accessToken>
```

---

## Auth

### POST /auth/login

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "code": 2000,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": {
      "id": 1,
      "fullName": "Super Admin",
      "email": "admin@quanlykho.com",
      "username": "admin",
      "phone": "0901234567",
      "status": "active",
      "roles": [{ "id": 1, "role": "super_admin" }]
    }
  }
}
```

### POST /auth/register

**Request:**
```json
{
  "fullName": "Nguyen Van A",
  "username": "nguyenvana",
  "email": "a@email.com",
  "phone": "0901234567",
  "password": "pass123"
}
```

### GET /auth/me

Tra ve thong tin user hien tai.

### PUT /auth/profile

**Request:**
```json
{
  "fullName": "Ten Moi",
  "email": "email@moi.com",
  "phone": "0999888777"
}
```

### PUT /auth/change-password

**Request:**
```json
{
  "currentPassword": "mat_khau_cu",
  "newPassword": "mat_khau_moi_6ky_tu"
}
```

---

## Products

### GET /products

**Query params:** `page`, `limit`, `keyword`, `category`, `warehouse`

**Response:** Danh sach san pham kem `unitEntries` va pagination metadata.

### POST /products

Tu dong kiem tra: neu trung `name + warehouse + batch` -> cong don quantity. Neu khong -> tao moi.

**Request:**
```json
{
  "name": "Paracetamol 500mg",
  "category": "Thuoc giam dau",
  "warehouse": "Kho Chan",
  "batch": "BATCH001",
  "supplier": "Duoc Hau Giang",
  "unitPrice": 1500,
  "importedBy": "Nguyen Van A",
  "expiryDate": "2027-03-15",
  "unitEntries": [
    { "unit": "kien", "quantity": 100, "conversionRate": 5 }
  ]
}
```

### GET /products/options

Tra ve distinct values cho filter:
```json
{
  "categories": [{ "label": "...", "value": "..." }],
  "warehouses": [...],
  "suppliers": [...],
  "batches": [...]
}
```

### GET /products/batches?name=...&warehouse=...

Tra ve danh sach lo theo ten SP va kho.

### GET /products/list

Tra ve danh sach don gian cho dropdown:
```json
[{ "id": 1, "label": "Paracetamol 500mg", "value": "Paracetamol 500mg", "price": 1500 }]
```

---

## Warehouses

### GET /warehouses

**Query params:** `keyword`, `status`

Tra ve kem computed fields: `productCount`, `inventoryValue`.

### POST /warehouses

```json
{
  "name": "Kho Ha Noi",
  "address": "123 Cau Giay",
  "manager": "Nguyen Van A",
  "status": "active"
}
```

### GET /warehouses/list

Tra ve kho active cho dropdown.

---

## Sales

### GET /sales

**Query params:** `page`, `limit`, `keyword`, `paid` (true/false), `saleDate` (YYYY-MM-DD)

Tra ve hoa don kem `items` array.

### POST /sales

Ma hoa don tu dong sinh: `HD-YYYYMMDD-XXX`

`items[].quantity` la **tong so don vi le** (sau quy doi kien -> le). Frontend cho user nhap "so kien" + "so le" rieng, tu tinh `quantity = carton * units_per_carton + piece` truoc khi gui — backend chi nhan `quantity`. `units_per_carton` cua lo lay tu response `GET /inventory` (subquery tu `stock_imports` moi nhat).

```json
{
  "customerName": "Nguyen Van A",
  "customerPhone": "0901234567",
  "saleType": "retail",
  "paid": true,
  "saleDate": "2024-03-15",
  "items": [
    {
      "product_id": 12,
      "product_name": "Paracetamol 500mg",
      "warehouse_id": 1,
      "supplier": "NCC A",
      "batch": "B-202403",
      "small_unit_id": 3,
      "quantity": 245,
      "unit_price": 1500,
      "total": 367500
    }
  ]
}
```

---

## Accounts

### GET /accounts

**Query params:** `keyword`, `status`

### POST /accounts

Tu dong gan role `admin`. Password duoc hash bang bcryptjs.

```json
{
  "fullName": "Tran Thi B",
  "username": "tranthib",
  "email": "b@email.com",
  "phone": "0912345678",
  "password": "pass123"
}
```

---

## Inventory

### GET /inventory

**Query params:** `warehouse`, `category`, `supplier`, `batch`, `keyword`

### GET /inventory/stats

**Query params:** (cung filter nhu /inventory)

```json
{
  "totalItems": 4,
  "totalValue": 12760000,
  "lowStockCount": 1
}
```

### GET /inventory/filters

**Query params:** `warehouse`, `category`, `supplier`, `batch`, `keyword`

Cascading filter - moi dropdown chi tra ve values phu hop voi cac filter khac da chon. Kho tra ve tat ca kho active neu chua co filter nao.
