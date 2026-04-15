# Environment

## Yeu Cau He Thong

| Tool | Version | Ghi Chu |
|------|---------|---------|
| **Node.js** | >= 18 (backend), >= 20.19 (frontend) | Frontend dung Vite 7 yeu cau Node 20+ |
| **npm** | >= 8 | Hoac yarn >= 1.22 |
| **Docker** | >= 20 | Chay MySQL container |
| **Docker Compose** | >= 2 | |
| **MySQL** | 8.0 | Chay qua Docker hoac cai tay |
| **TypeScript** | >= 5.0 | Ca backend va frontend |

> Neu dung `nvm`, chuyen Node version: `nvm use 20`

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Server
PORT=3000
API_PREFIX=/api/v1
LOG_LEVEL=info              # debug | info | warn | error

# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=quan_ly_kho

# JWT
JWT_SECRET=quan-ly-kho-secret-key-2024
```

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| PORT | No | 3000 | Port backend server |
| API_PREFIX | No | /api/v1 | Prefix cho tat ca API routes |
| LOG_LEVEL | No | info | Winston log level |
| DB_HOST | Yes | localhost | MySQL host |
| DB_PORT | No | 3306 | MySQL port |
| DB_USER | Yes | root | MySQL username |
| DB_PASSWORD | Yes | root | MySQL password |
| DB_NAME | Yes | quan_ly_kho | MySQL database name |
| JWT_SECRET | Yes | - | Secret key cho JWT token (thay doi khi deploy production) |

## Frontend (`frontend/.env`)

```env
# API
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| VITE_API_BASE_URL | Yes | - | URL cua backend API |

## Commands

### Setup lan dau

```bash
# 1. Start MySQL
cd backend
docker compose up -d

# 2. Cai dat dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Seed database
cd backend
npm run seed
```

### Chay du an

```bash
# Backend (port 3000)
cd backend
npm run dev

# Frontend (port 5173) - can Node >= 20
cd frontend
nvm use 20
npm run dev
```

### Cac lenh khac

| Lenh | Thu muc | Mo ta |
|------|---------|-------|
| `npm run dev` | backend | Chay dev server (hot reload) |
| `npm run build` | backend | Build TypeScript -> dist/ |
| `npm start` | backend | Chay production |
| `npm run seed` | backend | Tao bang + du lieu mau |
| `npm run lint` | backend | Kiem tra ESLint |
| `npm test` | backend | Chay unit test (vitest) |
| `npm run dev` | frontend | Chay Vite dev server |
| `npm run build` | frontend | Build production -> dist/ |
| `npm run typecheck` | frontend | Kiem tra TypeScript |
| `npm run lint` | frontend | Kiem tra ESLint |
| `docker compose up -d` | backend | Start MySQL container |
| `docker compose down` | backend | Stop MySQL container |
| `fuser -k 3000/tcp` | - | Tat process dang chiem port 3000 |

### URLs

| URL | Mo ta |
|-----|-------|
| http://localhost:5173 | Frontend |
| http://localhost:3000/api-docs | Swagger API docs |
| http://localhost:3000/health | Health check |

---

## Luu Y

- Backend: dung `dotenv`, truy cap qua `process.env.VARIABLE`
- Frontend: dung Vite env, prefix `VITE_`, truy cap qua `import.meta.env.VITE_VARIABLE`
- **Khong commit file `.env` len git** - chi commit `.env.example`
- Khi deploy production: thay `JWT_SECRET` bang gia tri manh, thay `VITE_API_BASE_URL` bang domain thuc
