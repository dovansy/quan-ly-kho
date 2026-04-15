# Quan Ly Kho - Tong Quan Du An

## Gioi Thieu

He thong quan ly ton kho (Warehouse Inventory Management System) - ung dung web full-stack cho phep quan ly san pham, kho hang, hoa don ban hang, tai khoan nguoi dung va theo doi ton kho.

## Tinh Nang Chinh

| Module | Mo Ta |
|--------|-------|
| **Dang nhap / Dang ky** | Xac thuc bang JWT, phan quyen super_admin / admin |
| **Quan ly san pham** | CRUD san pham, ho tro nhieu don vi quy doi (kien, thung, hop), tu dong cong don khi nhap them hang cung ten + kho + lo |
| **Quan ly kho** | CRUD kho hang, tu dong tinh so luong san pham va gia tri ton kho |
| **Quan ly ban hang** | CRUD hoa don, tu sinh ma hoa don (HD-YYYYMMDD-XXX), theo doi thanh toan |
| **Quan ly tai khoan** | CRUD user, phan quyen, chi super_admin moi xoa duoc tai khoan |
| **Ton kho** | Xem ton kho voi cascading filter (kho, loai SP, NCC, lo, keyword), thong ke tong gia tri, canh bao ton thap |
| **Trang ca nhan** | Xem/sua thong tin, doi mat khau, dang xuat |

## Kien Truc Tong Quan

```
Browser (React SPA)
    |
    | HTTP / REST API
    v
Express.js Server (Node.js + TypeScript)
    |
    | Sequelize ORM
    v
MySQL 8.0 (Docker)
```

## Cong Nghe Su Dung

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: MySQL 8.0
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Docs**: Swagger (swagger-jsdoc + swagger-ui-express)
- **Logging**: Winston
- **Security**: Helmet, CORS, express-async-errors

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 7
- **UI Library**: Ant Design 5
- **Styling**: TailwindCSS + SASS
- **State Management**: Redux Toolkit + Redux Persist
- **Server State**: TanStack React Query v5
- **HTTP Client**: Axios
- **Routing**: React Router v6