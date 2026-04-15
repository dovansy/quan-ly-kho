import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

interface WarehouseAttributes {
  id: number;
  name: string;
  address: string | null;
  manager: string | null;
  status: 'active' | 'inactive';
}

type WarehouseCreation = Optional<WarehouseAttributes, 'id' | 'address' | 'manager' | 'status'>;

export class Warehouse extends Model<WarehouseAttributes, WarehouseCreation> {
  declare id: number;
  declare name: string;
  declare address: string | null;
  declare manager: string | null;
  declare status: 'active' | 'inactive';
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Warehouse.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    address: { type: DataTypes.STRING(500), allowNull: true },
    manager: { type: DataTypes.STRING(255), allowNull: true },
    status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
  },
  { sequelize, tableName: 'warehouses' },
);
