import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

interface InventoryTransferAttributes {
  id: number;
  product_id: number;
  warehouse_id_from: number;
  warehouse_id_to: number;
  supplier: string;
  batch: string;
  quantity: number;
  transferred_by_user_id: number | null;
  transfer_date: Date;
  note: string | null;
  created_at: Date;
}

type InventoryTransferCreation = Optional<
  InventoryTransferAttributes,
  'id' | 'transferred_by_user_id' | 'note' | 'created_at' | 'transfer_date'
>;

export class InventoryTransfer
  extends Model<InventoryTransferAttributes, InventoryTransferCreation>
  implements InventoryTransferAttributes {
  declare id: number;
  declare product_id: number;
  declare warehouse_id_from: number;
  declare warehouse_id_to: number;
  declare supplier: string;
  declare batch: string;
  declare quantity: number;
  declare transferred_by_user_id: number | null;
  declare transfer_date: Date;
  declare note: string | null;
  declare readonly created_at: Date;
}

InventoryTransfer.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    product_id: {
      type: DataTypes.INTEGER, allowNull: false,
      references: { model: 'products', key: 'id' },
    },
    warehouse_id_from: {
      type: DataTypes.INTEGER, allowNull: false,
      references: { model: 'warehouses', key: 'id' },
    },
    warehouse_id_to: {
      type: DataTypes.INTEGER, allowNull: false,
      references: { model: 'warehouses', key: 'id' },
    },
    supplier: { type: DataTypes.STRING(255), allowNull: false },
    batch: { type: DataTypes.STRING(100), allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    transferred_by_user_id: {
      type: DataTypes.INTEGER, allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    transfer_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    note: { type: DataTypes.STRING(500), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { sequelize, tableName: 'inventory_transfers', timestamps: false },
);
