import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

interface ProductAttributes {
  id: number;
  name: string;
  category: string | null;
  supplier: string | null;
  default_small_unit_id: number;
  status: 'active' | 'inactive';
}

type ProductCreation = Optional<ProductAttributes, 'id' | 'category' | 'supplier' | 'status'>;

export class Product extends Model<ProductAttributes, ProductCreation> {
  declare id: number;
  declare name: string;
  declare category: string | null;
  declare supplier: string | null;
  declare default_small_unit_id: number;
  declare status: 'active' | 'inactive';
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Product.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    category: { type: DataTypes.STRING(100) },
    supplier: { type: DataTypes.STRING(255) },
    default_small_unit_id: {
      type: DataTypes.INTEGER, allowNull: false,
      references: { model: 'small_units', key: 'id' },
    },
    status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
  },
  { sequelize, tableName: 'products' },
);
