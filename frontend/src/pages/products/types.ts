export interface ProductRow {
  id: number;
  name: string;
  category: string | null;
  supplier: string | null;
  default_small_unit_id: number;
  default_small_unit: { id: number; code: string; label: string } | null;
  status: 'active' | 'inactive';
}
