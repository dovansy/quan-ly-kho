import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

interface ProductAttributes {
  id: number;
  name: string;
  category: string | null;
  warehouse_id: number | null;
  warehouse_name: string | null;
  supplier: string | null;
  batch: string | null;
  quantity: number;
  min_stock: number;
  unit_price: number;
  unit: string | null;
  expiry_date: Date | null;
  imported_by: string | null;
}

type ProductCreation = Optional<ProductAttributes, 'id' | 'category' | 'warehouse_id' | 'warehouse_name' | 'supplier' | 'batch' | 'quantity' | 'min_stock' | 'unit_price' | 'unit' | 'expiry_date' | 'imported_by'>;

export class Product extends Model<ProductAttributes, ProductCreation> {
  declare id: number;
  declare name: string;
  declare category: string | null;
  declare warehouse_id: number | null;
  declare warehouse_name: string | null;
  declare supplier: string | null;
  declare batch: string | null;
  declare quantity: number;
  declare min_stock: number;
  declare unit_price: number;
  declare unit: string | null;
  declare expiry_date: Date | null;
  declare imported_by: string | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // association mixins
  declare unitEntries?: any[];
}

Product.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    category: { type: DataTypes.STRING(100) },
    warehouse_id: { type: DataTypes.INTEGER, references: { model: 'warehouses', key: 'id' } },
    warehouse_name: { type: DataTypes.STRING(255) },
    supplier: { type: DataTypes.STRING(255) },
    batch: { type: DataTypes.STRING(100) },
    quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
    min_stock: { type: DataTypes.INTEGER, defaultValue: 0 },
    unit_price: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    unit: { type: DataTypes.STRING(50) },
    expiry_date: { type: DataTypes.DATEONLY },
    imported_by: { type: DataTypes.STRING(255) },
  },
  { sequelize, tableName: 'products' },
);
