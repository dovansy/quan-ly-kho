import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import 'express-async-errors'; // auto-catch async errors → errorHandler

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { AuthRoutes } from './routes/authRoutes';
import { ProductRoutes } from './routes/productRoutes';
import { WarehouseRoutes } from './routes/warehouseRoutes';
import { SaleRoutes } from './routes/saleRoutes';
import { AccountRoutes } from './routes/accountRoutes';
import { InventoryRoutes } from './routes/inventoryRoutes';
import { SmallUnitRoutes } from './routes/smallUnitRoutes';
import { StockImportRoutes } from './routes/stockImportRoutes';
import sequelize from './models';
import logger from './utils/logger';

const app = express();
const port = process.env.PORT || 3000;
const apiPrefix = process.env.API_PREFIX || '/api/v1';

// ── Middleware ─────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://quanlykhosy.vercel.app'
  ],
  credentials: true,
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Swagger ───────────────────────────────────────────────
const specs = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Quan Ly Kho API',
      version: '1.0.0',
      description: 'API quản lý tồn kho - Warehouse Inventory Management',
    },
    servers: [
      {
        url: process.env.BASE_URL || `http://localhost:${port}`,
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập access token (không cần prefix "Bearer")',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string' },
            username: { type: 'string' },
            phone: { type: 'string' },
            status: { type: 'string', enum: ['active', 'inactive'] },
            walletAddress: { type: 'string' },
            roles: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, role: { type: 'string' } } } },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            key: { type: 'string' },
            name: { type: 'string' },
            category: { type: 'string' },
            default_small_unit_id: { type: 'integer' },
            status: { type: 'string', enum: ['active', 'inactive'] },
          },
        },
        Warehouse: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            key: { type: 'string' },
            name: { type: 'string' },
            address: { type: 'string' },
            manager: { type: 'string' },
            productCount: { type: 'integer' },
            status: { type: 'string', enum: ['active', 'inactive'] },
          },
        },
        Sale: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            key: { type: 'string' },
            invoice_code: { type: 'string' },
            customer_name: { type: 'string' },
            customer_phone: { type: 'string' },
            sale_type: { type: 'string', enum: ['wholesale', 'retail'] },
            total_amount: { type: 'number' },
            paid: { type: 'boolean' },
            sale_date: { type: 'string', format: 'date' },
            items: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, productName: { type: 'string' }, quantity: { type: 'integer' }, unit: { type: 'string' }, unitPrice: { type: 'number' }, total: { type: 'number' } } } },
          },
        },
        Account: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            key: { type: 'string' },
            fullName: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string' },
            status: { type: 'string', enum: ['active', 'inactive'] },
          },
        },
        InventoryItem: {
          type: 'object',
          properties: {
            key: { type: 'string' },
            product_id: { type: 'integer' },
            product_name: { type: 'string' },
            category: { type: 'string' },
            warehouse_id: { type: 'integer' },
            warehouse_name: { type: 'string' },
            supplier: { type: 'string' },
            batch: { type: 'string' },
            stock_pieces: { type: 'integer' },
            nearest_expiry: { type: 'string', format: 'date' },
            small_unit: { type: 'object', properties: { id: { type: 'integer' }, code: { type: 'string' }, label: { type: 'string' } } },
          },
        },
        SelectOption: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            value: { type: 'string' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalCurrentPage: { type: 'integer' },
            hasNextPage: { type: 'boolean' },
            hasPreviousPage: { type: 'boolean' },
          },
        },
      },
    },
  },
  apis: [path.resolve(__dirname, './routes/*.js')],
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// ── Health check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────
app.use(apiPrefix, apiLimiter);
app.use(apiPrefix, AuthRoutes());
app.use(`${apiPrefix}/products`, ProductRoutes());
app.use(`${apiPrefix}/warehouses`, WarehouseRoutes());
app.use(`${apiPrefix}/sales`, SaleRoutes());
app.use(`${apiPrefix}/accounts`, AccountRoutes());
app.use(`${apiPrefix}/inventory`, InventoryRoutes());
app.use(`${apiPrefix}/small-units`, SmallUnitRoutes());
app.use(`${apiPrefix}/imports`, StockImportRoutes());

// ── Error handler (must be last) ──────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────
const server = app.listen(port, async () => {
  try {
    await sequelize.authenticate();
    // Schema được quản lý bởi migration.sql + triggers (xem `npm run seed`).
    // Không dùng sequelize.sync() để tránh xung đột với triggers/CHECK constraints.
    logger.info('Database connected successfully (Sequelize)');
  } catch (error) {
    logger.error('Failed to connect to database', error);
    process.exit(1);
  }
  logger.info(`API server is running at ${process.env.BASE_URL || `http://localhost:${port}`}`);
  logger.info(`Swagger docs at http://localhost:${port}/api-docs`);
});

// ── Graceful shutdown ─────────────────────────────────────
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  await sequelize.close();
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
