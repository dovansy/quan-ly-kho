import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

interface SaleItemAttributes {
  id: number;
  sale_id: number;
  product_name: string;
  quantity: number;
  unit: string | null;
  unit_price: number;
  total: number;
}

type SaleItemCreation = Optional<SaleItemAttributes, 'id' | 'unit' | 'unit_price' | 'total'>;

export class SaleItem extends Model<SaleItemAttributes, SaleItemCreation> {
  declare id: number;
  declare sale_id: number;
  declare product_name: string;
  declare quantity: number;
  declare unit: string | null;
  declare unit_price: number;
  declare total: number;
}

SaleItem.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    sale_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'sales', key: 'id' } },
    product_name: { type: DataTypes.STRING(255), allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    unit: { type: DataTypes.STRING(50) },
    unit_price: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  },
  { sequelize, tableName: 'sale_items', timestamps: false },
);
