import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

interface InventoryBalanceAttributes {
  id: number;
  product_id: number;
  warehouse_id: number;
  supplier: string;
  batch: string;
  stock_pieces: number;
  nearest_expiry: Date | null;
}

type InventoryBalanceCreation = Optional<InventoryBalanceAttributes, 'id' | 'stock_pieces' | 'nearest_expiry'>;

export class InventoryBalance extends Model<InventoryBalanceAttributes, InventoryBalanceCreation> {
  declare id: number;
  declare product_id: number;
  declare warehouse_id: number;
  declare supplier: string;
  declare batch: string;
  declare stock_pieces: number;
  declare nearest_expiry: Date | null;
  declare readonly updated_at: Date;
}

InventoryBalance.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    product_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'products', key: 'id' } },
    warehouse_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'warehouses', key: 'id' } },
    supplier: { type: DataTypes.STRING(255), allowNull: false },
    batch: { type: DataTypes.STRING(100), allowNull: false },
    stock_pieces: { type: DataTypes.INTEGER, defaultValue: 0 },
    nearest_expiry: { type: DataTypes.DATEONLY, allowNull: true },
  },
  { sequelize, tableName: 'inventory_balance', timestamps: true, createdAt: false, updatedAt: 'updated_at' },
);
