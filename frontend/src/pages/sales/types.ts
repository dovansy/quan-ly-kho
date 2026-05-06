export interface SaleLine {
  id?: number;
  inventory_id?: number;
  product_id: number;
  product_name: string;
  warehouse_id: number;
  warehouse_name: string;
  supplier: string;
  batch: string;
  small_unit_id: number;
  small_unit_label: string;
  available: number;
  units_per_carton: number;
  carton_quantity: number;
  piece_quantity: number;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface SaleOrderRow {
  id: number;
  key: string;
  invoice_code: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  broker_name: string | null;
  sale_type: string;
  items: SaleLine[];
  total_amount: number;
  paid: boolean;
  sale_date: string;
  returned: boolean;
  returned_at: string | null;
}

export const mapSale = (s: any): SaleOrderRow => ({
  id: s.id,
  key: String(s.id),
  invoice_code: s.invoice_code,
  customer_name: s.customer_name || '',
  customer_phone: s.customer_phone || '',
  customer_address: s.customer_address || '',
  broker_name: s.broker_name || null,
  sale_type: s.sale_type,
  items: (s.items || []).map((i: any) => ({
    id: i.id,
    product_id: i.product_id,
    product_name: i.product_name,
    warehouse_id: i.warehouse_id,
    warehouse_name: i.warehouse_name || '',
    supplier: i.supplier,
    batch: i.batch,
    small_unit_id: i.small_unit_id,
    small_unit_label: i.small_unit?.label || '',
    available: 0,
    units_per_carton: 0,
    carton_quantity: 0,
    piece_quantity: 0,
    quantity: Number(i.quantity) || 0,
    unit_price: Number(i.unit_price) || 0,
    total: Number(i.total) || 0,
  })),
  total_amount: Number(s.total_amount),
  paid: Boolean(s.paid),
  sale_date: s.sale_date,
  returned: Boolean(s.returned),
  returned_at: s.returned_at || null,
});

export const createEmptyLine = (): SaleLine => ({
  product_id: 0,
  product_name: '',
  warehouse_id: 0,
  warehouse_name: '',
  supplier: '',
  batch: '',
  small_unit_id: 0,
  small_unit_label: '',
  available: 0,
  units_per_carton: 0,
  carton_quantity: 0,
  piece_quantity: 0,
  quantity: 0,
  unit_price: 0,
  total: 0,
});

export const findInventoryFor = (inventoryList: any[], it: Pick<SaleLine, 'product_id' | 'warehouse_id' | 'supplier' | 'batch'>) =>
  inventoryList.find(
    (x: any) =>
      x.product_id === it.product_id &&
      x.warehouse_id === it.warehouse_id &&
      x.supplier === it.supplier &&
      x.batch === it.batch
  );
