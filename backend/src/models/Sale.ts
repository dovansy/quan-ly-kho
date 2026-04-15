import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

interface SaleAttributes {
  id: number;
  invoice_code: string;
  customer_name: string | null;
  customer_phone: string | null;
  sale_type: 'wholesale' | 'retail';
  total_amount: number;
  paid: boolean;
  sale_date: Date;
  created_by: string | null;
}

type SaleCreation = Optional<SaleAttributes, 'id' | 'customer_name' | 'customer_phone' | 'total_amount' | 'paid' | 'created_by'>;

export class Sale extends Model<SaleAttributes, SaleCreation> {
  declare id: number;
  declare invoice_code: string;
  declare customer_name: string | null;
  declare customer_phone: string | null;
  declare sale_type: 'wholesale' | 'retail';
  declare total_amount: number;
  declare paid: boolean;
  declare sale_date: Date;
  declare created_by: string | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  declare items?: any[];
}

Sale.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    invoice_code: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    customer_name: { type: DataTypes.STRING(255) },
    customer_phone: { type: DataTypes.STRING(20) },
    sale_type: { type: DataTypes.ENUM('wholesale', 'retail'), allowNull: false },
    total_amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    paid: { type: DataTypes.BOOLEAN, defaultValue: false },
    sale_date: { type: DataTypes.DATEONLY, allowNull: false },
    created_by: { type: DataTypes.STRING(255) },
  },
  { sequelize, tableName: 'sales' },
);
