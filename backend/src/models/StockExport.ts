import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

interface StockExportAttributes {
  id: number;
  sale_order_id: number;
  product_id: number;
  warehouse_id: number;
  supplier: string;
  batch: string;
  small_unit_id: number;
  quantity: number;
  unit_price: number;
  total: number;
}

type StockExportCreation = Optional<StockExportAttributes, 'id' | 'quantity' | 'unit_price' | 'total'>;

export class StockExport extends Model<StockExportAttributes, StockExportCreation> {
  declare id: number;
  declare sale_order_id: number;
  declare product_id: number;
  declare warehouse_id: number;
  declare supplier: string;
  declare batch: string;
  declare small_unit_id: number;
  declare quantity: number;
  declare unit_price: number;
  declare total: number;
}

StockExport.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    sale_order_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'sale_orders', key: 'id' } },
    product_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'products', key: 'id' } },
    warehouse_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'warehouses', key: 'id' } },
    supplier: { type: DataTypes.STRING(255), allowNull: false },
    batch: { type: DataTypes.STRING(100), allowNull: false },
    small_unit_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'small_units', key: 'id' } },
    quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
    unit_price: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  },
  { sequelize, tableName: 'stock_exports', timestamps: false },
);
