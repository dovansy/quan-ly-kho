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
import { Warehouse } from './Warehouse';
import { SmallUnit } from './SmallUnit';
import { Product } from './Product';
import { StockImport } from './StockImport';
import { SaleOrder } from './SaleOrder';
import { StockExport } from './StockExport';
import { InventoryBalance } from './InventoryBalance';

// ── Define associations ─────────────────────────────────
User.belongsToMany(Role, { through: 'user_roles', foreignKey: 'user_id', otherKey: 'role_id', as: 'roles', timestamps: false });
Role.belongsToMany(User, { through: 'user_roles', foreignKey: 'role_id', otherKey: 'user_id', as: 'users', timestamps: false });

// Catalog
Product.belongsTo(SmallUnit, { foreignKey: 'default_small_unit_id', as: 'defaultSmallUnit' });
SmallUnit.hasMany(Product, { foreignKey: 'default_small_unit_id', as: 'products' });

// Stock imports
StockImport.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
StockImport.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
StockImport.belongsTo(SmallUnit, { foreignKey: 'small_unit_id', as: 'smallUnit' });
StockImport.belongsTo(User, { foreignKey: 'imported_by_user_id', as: 'importer' });
Product.hasMany(StockImport, { foreignKey: 'product_id', as: 'imports' });
Warehouse.hasMany(StockImport, { foreignKey: 'warehouse_id', as: 'imports' });

// Sale orders + stock exports
SaleOrder.hasMany(StockExport, { foreignKey: 'sale_order_id', as: 'items', onDelete: 'CASCADE' });
StockExport.belongsTo(SaleOrder, { foreignKey: 'sale_order_id', as: 'order' });
StockExport.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
StockExport.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
StockExport.belongsTo(SmallUnit, { foreignKey: 'small_unit_id', as: 'smallUnit' });
SaleOrder.belongsTo(User, { foreignKey: 'created_by_user_id', as: 'createdBy' });

// Inventory balance
InventoryBalance.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
InventoryBalance.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });

export { User, Role, Warehouse, SmallUnit, Product, StockImport, SaleOrder, StockExport, InventoryBalance };
