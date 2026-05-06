import { ProductCategory, SaleType, SmallUnit, Status, Unit } from './enums';

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
  { label: 'Bán qua Nhà môi giới', value: SaleType.BROKER },
];

export const saleTypeLabels: Record<string, { label: string; color: string }> = {
  [SaleType.WHOLESALE]: { label: 'Bán buôn', color: 'purple' },
  [SaleType.RETAIL]: { label: 'Bán lẻ', color: 'cyan' },
  [SaleType.BROKER]: { label: 'Nhà môi giới', color: 'orange' },
};

// --- Payment ---
export const paidOptions: { label: string; value: any }[] = [
  { label: 'Đã thanh toán', value: true },
  { label: 'Chưa thanh toán', value: false },
];

// --- Unit (large unit: kiện / thùng / hộp) ---
export const unitOptions = [
  { label: 'Kiện', value: Unit.KIEN },
  { label: 'Thùng', value: Unit.THUNG },
  { label: 'Hộp', value: Unit.HOP },
];

export const unitLabels: Record<string, string> = {
  [Unit.KIEN]: 'Kiện',
  [Unit.THUNG]: 'Thùng',
  [Unit.HOP]: 'Hộp',
};

// --- Small unit (unit per piece: hộp / lọ / gói / túi) ---
export const smallUnitOptions = [
  { label: 'Hộp', value: SmallUnit.HOP },
  { label: 'Lọ', value: SmallUnit.LO },
  { label: 'Gói', value: SmallUnit.GOI },
  { label: 'Túi', value: SmallUnit.TUI },
];

export const smallUnitLabels: Record<string, string> = {
  [SmallUnit.HOP]: 'Hộp',
  [SmallUnit.LO]: 'Lọ',
  [SmallUnit.GOI]: 'Gói',
  [SmallUnit.TUI]: 'Túi',
  // Alias for large unit value used in product unit entries.
  [Unit.KIEN]: 'Kiện',
};

// --- Product Category ---
export const categoryOptions = [
  { label: 'Thuốc giảm đau', value: ProductCategory.GIAM_DAU },
  { label: 'Kháng sinh', value: ProductCategory.KHANG_SINH },
  { label: 'Vitamin', value: ProductCategory.VITAMIN },
  { label: 'Thuốc tiêu hóa', value: ProductCategory.TIEU_HOA },
];

export const categoryLabels: Record<string, string> = {
  [ProductCategory.GIAM_DAU]: 'Thuốc giảm đau',
  [ProductCategory.KHANG_SINH]: 'Kháng sinh',
  [ProductCategory.VITAMIN]: 'Vitamin',
  [ProductCategory.TIEU_HOA]: 'Thuốc tiêu hóa',
};

// --- Role ---
export const roleLabels: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin', color: 'red' },
  admin: { label: 'Admin', color: 'blue' },
};

export const roleOptions = [
  { label: 'Super Admin', value: 'super_admin' },
  { label: 'Admin', value: 'admin' },
];
