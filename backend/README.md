# Quan Ly Kho - Backend

Warehouse Inventory Management System - Backend API built with Express + TypeScript + Sequelize ORM.

## Tech Stack

- **Express.js** + **TypeScript**
- **Sequelize** ORM + **MySQL** 8.0
- **JWT** authentication (jsonwebtoken + bcryptjs)
- **Swagger** API documentation
- **Winston** logging
- **Helmet** + **CORS** (security)
- **express-async-errors** (error handling)

## Requirements

- Node.js >= 18
- Docker + Docker Compose (for MySQL)

## Setup

```bash
# Start MySQL
docker compose up -d

# Install dependencies
npm install

# Seed database (create tables + sample data)
npm run seed
```

## Environment Variables (`backend/.env`)

```env
PORT=3000
API_PREFIX=/api/v1
LOG_LEVEL=info
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=quan_ly_kho
JWT_SECRET=quan-ly-kho-secret-key-2024
```

## Development

```bash
npm run dev
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/api-docs
- Health: http://localhost:3000/health

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server (hot reload) |
| `npm run build` | Build TypeScript to dist/ |
| `npm start` | Run production build |
| `npm run seed` | Create tables + seed data |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests (vitest) |

## Project Structure

```
src/
├── index.ts          # Entry point
├── controllers/      # Request handlers (auth, product, warehouse, sale, account, inventory)
├── models/           # Sequelize models + associations
├── routes/           # API routes + Swagger docs
├── middleware/        # Auth JWT, error handler, validation
├── utils/            # Response helpers, error codes, logger
└── database/         # Migration SQL + seed script
```

## API Endpoints

| Module | Endpoints |
|--------|-----------|
| **Auth** | POST login, POST register, GET me, PUT profile, PUT change-password |
| **Products** | GET list, GET options, GET batches, GET (paginated), POST, PUT, DELETE |
| **Warehouses** | GET list, GET (with stats), POST, PUT, DELETE |
| **Sales** | GET (paginated), POST, PUT, DELETE |
| **Accounts** | GET, POST, PUT, DELETE |
| **Inventory** | GET (filtered), GET stats, GET filters |

Full API docs at http://localhost:3000/api-docs

// "start": "cross-env NODE_ENV=production node dist/index.js",