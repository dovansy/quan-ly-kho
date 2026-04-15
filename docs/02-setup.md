# Huong Dan Cai Dat va Chay Du An

## Yeu Cau He Thong

- **Node.js**: >= 20.19 (frontend yeu cau Vite 7)
- **npm** hoac **yarn**
- **Docker** + Docker Compose (cho MySQL)
- **MySQL 8.0** (hoac dung Docker)

## 1. Clone va Cai Dat

```bash
# Clone repo
cd /path/to/project

# Cai dat backend dependencies
cd backend
npm install

# Cai dat frontend dependencies
cd ../frontend
npm install
```

## 2. Khoi Dong Database (Docker)

```bash
cd backend
docker compose up -d
```

MySQL se chay tai `localhost:3306` voi:
- User: `root`
- Password: `root`
- Database: `quan_ly_kho`

## 3. Seed Database

```bash
cd backend
npm run seed
```

Lenh nay se:
- Tao tat ca bang (users, roles, products, warehouses, sales, ...)
- Them tai khoan admin mac dinh (admin / admin123)
- Them du lieu mau (kho, san pham)

## 4. Cau Hinh Environment

### Backend (`backend/.env`)

```env
PORT=3000
API_PREFIX=/api/v1
LOG_LEVEL=info

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=quan_ly_kho

# JWT
JWT_SECRET=quan-ly-kho-secret-key-2024
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## 5. Chay Du An

### Backend (Port 3000)

```bash
cd backend
npm run dev
```

Output:
```
API server is running at http://localhost:3000
Swagger docs at http://localhost:3000/api-docs
```

### Frontend (Port 5173)

```bash
cd frontend

# Neu dang dung Node 18, chuyen sang Node 20+
nvm use 20

npm run dev
```

Output:
```
VITE ready in 400 ms
Local: http://localhost:5173/
```

## 6. Truy Cap

| URL | Mo Ta |
|-----|-------|
| http://localhost:5173 | Frontend (React App) |
| http://localhost:3000/api-docs | Swagger API Documentation |
| http://localhost:3000/health | Health Check |

## 7. Build Production

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
# Output tai frontend/dist/
```

## Xu Ly Loi Thuong Gap

### Port da duoc su dung
```bash
# Tim va tat process tren port 3000
fuser -k 3000/tcp
```

### Node version khong dung (frontend)
```bash
nvm use 20
# hoac
nvm install 20
```

### Database chua ket noi
```bash
# Kiem tra Docker container
docker compose ps
# Restart neu can
docker compose restart
```
