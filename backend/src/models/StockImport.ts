import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './index';

interface StockImportAttributes {
  id: number;
  product_id: number;
  warehouse_id: number;
  supplier: string;
  batch: string;
  small_unit_id: number;
  carton_quantity: number;
  units_per_carton: number;
  piece_quantity: number;
  expiry_date: Date;
  imported_by_user_id: number | null;
  import_date: Date;
  note: string | null;
}

type StockImportCreation = Optional<
  StockImportAttributes,
  'id' | 'carton_quantity' | 'units_per_carton' | 'piece_quantity' | 'imported_by_user_id' | 'note'
>;

export class StockImport extends Model<StockImportAttributes, StockImportCreation> {
  declare id: number;
  declare product_id: number;
  declare warehouse_id: number;
  declare supplier: string;
  declare batch: string;
  declare small_unit_id: number;
  declare carton_quantity: number;
  declare units_per_carton: number;
  declare piece_quantity: number;
  declare expiry_date: Date;
  declare imported_by_user_id: number | null;
  declare import_date: Date;
  declare note: string | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

StockImport.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    product_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'products', key: 'id' } },
    warehouse_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'warehouses', key: 'id' } },
    supplier: { type: DataTypes.STRING(255), allowNull: false },
    batch: { type: DataTypes.STRING(100), allowNull: false },
    small_unit_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'small_units', key: 'id' } },
    carton_quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
    units_per_carton: { type: DataTypes.INTEGER, defaultValue: 1 },
    piece_quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
    expiry_date: { type: DataTypes.DATEONLY, allowNull: false },
    imported_by_user_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
    import_date: { type: DataTypes.DATEONLY, allowNull: false },
    note: { type: DataTypes.STRING(500) },
  },
  { sequelize, tableName: 'stock_imports' },
);
