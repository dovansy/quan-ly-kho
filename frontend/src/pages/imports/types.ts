export interface ImportRecord {
  id: number;
  product_id: number;
  product_name: string;
  category: string | null;
  warehouse_id: number;
  warehouse_name: string;
  supplier: string;
  batch: string;
  small_unit_id: number;
  small_unit: { id: number; code: string; label: string } | null;
  carton_quantity: number;
  units_per_carton: number;
  piece_quantity: number;
  total_pieces: number;
  expiry_date: string;
  imported_by: string | null;
  import_date: string;
  input_total_pieces?: number | null;
  units_per_box?: number | null;
  boxes_per_carton?: number | null;
}
