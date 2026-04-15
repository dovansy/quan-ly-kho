import { DataTypes, Model } from 'sequelize';
import sequelize from './index';

export class Role extends Model {
  declare id: number;
  declare role: string;
}

Role.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    role: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  },
  { sequelize, tableName: 'roles', timestamps: false },
);
