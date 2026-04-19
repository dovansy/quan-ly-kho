import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

interface SmallUnitAttributes {
  id: number;
  code: string;
  label: string;
  status: 'active' | 'inactive';
}

type SmallUnitCreation = Optional<SmallUnitAttributes, 'id' | 'status'>;

export class SmallUnit extends Model<SmallUnitAttributes, SmallUnitCreation> {
  declare id: number;
  declare code: string;
  declare label: string;
  declare status: 'active' | 'inactive';
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

SmallUnit.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    label: { type: DataTypes.STRING(100), allowNull: false },
    status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
  },
  { sequelize, tableName: 'small_units' },
);
