import { Sequelize } from 'sequelize';
import logger from '../utils/logger';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'quan_ly_kho',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'root',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: (msg) => logger.debug(msg),
    pool: { min: 0, max: 10, acquire: 30000, idle: 10000 },
    define: {
      timestamps: true,
      underscored: true, // camelCase → snake_case in DB
    },
  },
);

export default sequelize;

// ── Import & register models ────────────────────────────
import { User } from './User';
import { Role } from './Role';
import { Product } from './Product';
import { ProductUnitEntry } from './ProductUnitEntry';
import { Warehouse } from './Warehouse';
import { Sale } from './Sale';
import { SaleItem } from './SaleItem';

// ── Define associations ─────────────────────────────────
User.belongsToMany(Role, { through: 'user_roles', foreignKey: 'user_id', otherKey: 'role_id', as: 'roles', timestamps: false });
Role.belongsToMany(User, { through: 'user_roles', foreignKey: 'role_id', otherKey: 'user_id', as: 'users', timestamps: false });

Warehouse.hasMany(Product, { foreignKey: 'warehouse_id', as: 'products' });
Product.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });

Product.hasMany(ProductUnitEntry, { foreignKey: 'product_id', as: 'unitEntries', onDelete: 'CASCADE' });
ProductUnitEntry.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Sale.hasMany(SaleItem, { foreignKey: 'sale_id', as: 'items', onDelete: 'CASCADE' });
SaleItem.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });

export { User, Role, Product, ProductUnitEntry, Warehouse, Sale, SaleItem };
