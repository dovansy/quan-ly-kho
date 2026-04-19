import {
  Schema, required, minLength, maxLength, isEmail, isIn, isArray, minArrayLength, isNumber,
} from '../middleware/validationMiddleware';

export const loginSchema: Schema = {
  username: [required()],
  password: [required()],
};

export const changePasswordSchema: Schema = {
  currentPassword: [required()],
  newPassword: [required(), minLength(6)],
};

export const updateProfileSchema: Schema = {
  fullName: [maxLength(255)],
  email: [isEmail()],
};

export const createAccountSchema: Schema = {
  username: [required(), minLength(3), maxLength(100)],
  password: [required(), minLength(6)],
  fullName: [required()],
  email: [isEmail()],
  role: [isIn(['super_admin', 'admin'] as const)],
};

export const updateAccountSchema: Schema = {
  email: [isEmail()],
  status: [isIn(['active', 'inactive'] as const)],
  role: [isIn(['super_admin', 'admin'] as const)],
};

export const createWarehouseSchema: Schema = {
  name: [required(), maxLength(255)],
  status: [isIn(['active', 'inactive'] as const)],
};

export const updateWarehouseSchema: Schema = {
  name: [maxLength(255)],
  status: [isIn(['active', 'inactive'] as const)],
};

export const updateProductSchema: Schema = {
  status: [isIn(['active', 'inactive'] as const)],
};

export const createSmallUnitSchema: Schema = {
  code: [required(), maxLength(50)],
  label: [required(), maxLength(100)],
  status: [isIn(['active', 'inactive'] as const)],
};

export const updateSmallUnitSchema: Schema = {
  label: [maxLength(100)],
  status: [isIn(['active', 'inactive'] as const)],
};

export const createStockImportSchema: Schema = {
  product_name: [required(), maxLength(255)],
  warehouse_id: [required(), isNumber()],
  supplier: [required(), maxLength(255)],
  batch: [required(), maxLength(100)],
  small_unit_id: [required(), isNumber()],
  expiry_date: [required()],
};


export const createSaleSchema: Schema = {
  customerName: [required(), maxLength(255)],
  saleType: [required(), isIn(['wholesale', 'retail', 'broker'] as const)],
  saleDate: [required()],
  items: [required(), isArray(), minArrayLength(1, 'Hóa đơn phải có ít nhất 1 dòng')],
};

export const updateSaleSchema: Schema = {
  saleType: [isIn(['wholesale', 'retail', 'broker'] as const)],
  items: [isArray()],
};
