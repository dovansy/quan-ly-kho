import { ProductCategory, SaleType, Status, Unit } from './enums';

// --- Status ---
export const statusOptions = [
  { label: 'Hoạt động', value: Status.ACTIVE },
  { label: 'Ngừng hoạt động', value: Status.INACTIVE },
];

export const statusLabels: Record<string, { label: string; color: string }> = {
  [Status.ACTIVE]: { label: 'Hoạt động', color: 'success' },
  [Status.INACTIVE]: { label: 'Ngừng hoạt động', color: 'error' },
};

// --- Sale Type ---
export const saleTypeOptions = [
  { label: 'Bán buôn', value: SaleType.WHOLESALE },
  { label: 'Bán lẻ', value: SaleType.RETAIL },
];

export const saleTypeLabels: Record<string, { label: string; color: string }> = {
  [SaleType.WHOLESALE]: { label: 'Bán buôn', color: 'purple' },
  [SaleType.RETAIL]: { label: 'Bán lẻ', color: 'cyan' },
};

// --- Payment ---
export const paidOptions: { label: string; value: any }[] = [
  { label: 'Đã thanh toán', value: true },
  { label: 'Chưa thanh toán', value: false },
];

// --- Unit ---
export const unitOptions = [
  { label: 'Kiện', value: Unit.KIEN },
  { label: 'Thùng', value: Unit.THUNG },
  { label: 'Hộp', value: Unit.HOP },
];

// --- Product Category ---
export const categoryOptions = [
  { label: ProductCategory.GIAM_DAU, value: ProductCategory.GIAM_DAU },
  { label: ProductCategory.KHANG_SINH, value: ProductCategory.KHANG_SINH },
  { label: ProductCategory.VITAMIN, value: ProductCategory.VITAMIN },
  { label: ProductCategory.TIEU_HOA, value: ProductCategory.TIEU_HOA },
];

// --- Warehouse ---
export const warehouseOptions = [
  { label: 'Kho Chẵn', value: 'Kho Chẵn' },
  { label: 'Kho Lẻ', value: 'Kho Lẻ' },
  { label: 'Kho Thuốc BHYT', value: 'Kho Thuốc BHYT' },
];

// --- Role ---
export const roleLabels: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin', color: 'red' },
  admin: { label: 'Admin', color: 'blue' },
};
