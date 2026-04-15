import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

interface UserAttributes {
  id: number;
  full_name: string | null;
  username: string;
  email: string | null;
  phone: string | null;
  password_hash: string;
  status: 'active' | 'inactive';
}

type UserCreation = Optional<UserAttributes, 'id' | 'full_name' | 'email' | 'phone' | 'status'>;

export class User extends Model<UserAttributes, UserCreation> {
  declare id: number;
  declare full_name: string | null;
  declare username: string;
  declare email: string | null;
  declare phone: string | null;
  declare password_hash: string;
  declare status: 'active' | 'inactive';
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  // association mixins
  declare roles?: any[];
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    full_name: { type: DataTypes.STRING(255), allowNull: true },
    username: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(255), allowNull: true, unique: true },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
  },
  { sequelize, tableName: 'users' },
);
