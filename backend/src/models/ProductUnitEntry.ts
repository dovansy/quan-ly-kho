import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

interface ProductUnitEntryAttributes {
  id: number;
  product_id: number;
  unit: string;
  quantity: number;
  conversion_rate: number;
}

type ProductUnitEntryCreation = Optional<ProductUnitEntryAttributes, 'id' | 'conversion_rate'>;

export class ProductUnitEntry extends Model<ProductUnitEntryAttributes, ProductUnitEntryCreation> {
  declare id: number;
  declare product_id: number;
  declare unit: string;
  declare quantity: number;
  declare conversion_rate: number;
}

ProductUnitEntry.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    product_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'products', key: 'id' } },
    unit: { type: DataTypes.STRING(50), allowNull: false },
    quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
    conversion_rate: { type: DataTypes.INTEGER, defaultValue: 1 },
  },
  { sequelize, tableName: 'product_unit_entries', timestamps: false },
);
