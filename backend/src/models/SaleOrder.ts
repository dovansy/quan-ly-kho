import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

interface SaleOrderAttributes {
  id: number;
  invoice_code: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  broker_name: string | null;
  sale_type: 'wholesale' | 'retail' | 'broker';
  total_amount: number;
  paid: boolean;
  payment_status: 'paid' | 'unpaid' | 'pending';
  sale_date: Date;
  returned: boolean;
  returned_at: Date | null;
  items_snapshot: any | null;
  created_by_user_id: number | null;
}

type SaleOrderCreation = Optional<
  SaleOrderAttributes,
  | 'id'
  | 'customer_name'
  | 'customer_phone'
  | 'customer_address'
  | 'broker_name'
  | 'total_amount'
  | 'paid'
  | 'payment_status'
  | 'returned'
  | 'returned_at'
  | 'items_snapshot'
  | 'created_by_user_id'
>;

export class SaleOrder extends Model<SaleOrderAttributes, SaleOrderCreation> {
  declare id: number;
  declare invoice_code: string;
  declare customer_name: string | null;
  declare customer_phone: string | null;
  declare customer_address: string | null;
  declare broker_name: string | null;
  declare sale_type: 'wholesale' | 'retail' | 'broker';
  declare total_amount: number;
  declare paid: boolean;
  declare payment_status: 'paid' | 'unpaid' | 'pending';
  declare sale_date: Date;
  declare returned: boolean;
  declare returned_at: Date | null;
  declare items_snapshot: any | null;
  declare created_by_user_id: number | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  declare items?: any[];
}

SaleOrder.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    invoice_code: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    customer_name: { type: DataTypes.STRING(255) },
    customer_phone: { type: DataTypes.STRING(20) },
    customer_address: { type: DataTypes.STRING(500) },
    broker_name: { type: DataTypes.STRING(255), allowNull: true },
    sale_type: { type: DataTypes.ENUM('wholesale', 'retail', 'broker'), allowNull: false },
    total_amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    paid: { type: DataTypes.BOOLEAN, defaultValue: false },
    payment_status: {
      type: DataTypes.ENUM('paid', 'unpaid', 'pending'),
      allowNull: false,
      defaultValue: 'unpaid',
    },
    sale_date: { type: DataTypes.DATEONLY, allowNull: false },
    returned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    returned_at: { type: DataTypes.DATE, allowNull: true },
    items_snapshot: { type: DataTypes.JSON, allowNull: true },
    created_by_user_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
  },
  { sequelize, tableName: 'sale_orders' },
);
