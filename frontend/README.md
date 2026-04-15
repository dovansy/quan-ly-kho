# Quan Ly Ton Kho - Frontend

Warehouse Inventory Management System - Frontend built with React + TypeScript + Ant Design.

## Tech Stack

- **React** 18 + **TypeScript**
- **Vite** 7 (build tool)
- **Ant Design** 5 (UI components)
- **TailwindCSS** + **SASS** (styling)
- **Redux Toolkit** + **Redux Persist** (auth state)
- **TanStack React Query** v5 (server state)
- **Axios** (HTTP client)
- **React Router** v6 (routing)

## Requirements

- Node.js >= 20.19
- Backend API running at `http://localhost:3000`

## Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## Development

```bash
npm run dev
```

Open http://localhost:5173

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run clean` | Remove dist, node_modules |

## Project Structure

```
src/
├── components/       # UI components (atoms, molecules, organisms, templates)
├── pages/            # Page components
├── hooks/api/        # React Query hooks by module
├── services/         # Axios API services
├── router/           # Route config + guards
├── store/            # Redux auth slice
├── shared/           # Ant Design theme, React Query, Redux config
├── constants/        # Enums, options, format, error codes
├── types/            # TypeScript interfaces
├── utils/            # Helpers (format, validation, export excel)
└── scss/             # Global styles
```

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Authentication |
| `/inventory` | Inventory | Stock overview with cascading filters |
| `/products` | Products | Product CRUD + stock import |
| `/warehouses` | Warehouses | Warehouse management |
| `/sales` | Sales | Invoice management |
| `/accounts` | Accounts | User account management |
| `/my-profile` | My Account | Profile + change password |

## Default Account

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | super_admin |
