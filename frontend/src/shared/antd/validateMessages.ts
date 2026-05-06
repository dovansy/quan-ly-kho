import type { ValidateMessages } from 'rc-field-form/lib/interface';

/**
 * Validate messages mặc định tiếng Việt cho mọi `Form` trong app.
 * Apply qua `<ConfigProvider form={{ validateMessages }}>`.
 */
export const validateMessages: ValidateMessages = {
  default: 'Trường ${label} không hợp lệ',
  required: 'Vui lòng nhập ${label}',
  enum: '${label} phải là một trong [${enum}]',
  whitespace: '${label} không được để trống',
  date: {
    format: '${label} sai định dạng ngày',
    parse: '${label} không thể phân tích thành ngày',
    invalid: '${label} không phải là một ngày hợp lệ',
  },
  types: {
    string: '${label} không phải là chuỗi',
    method: '${label} không phải là hàm',
    array: '${label} không phải là mảng',
    object: '${label} không phải là object',
    number: '${label} không phải là số',
    date: '${label} không phải là ngày',
    boolean: '${label} không phải là boolean',
    integer: '${label} không phải là số nguyên',
    float: '${label} không phải là số thực',
    regexp: '${label} không phải là regex hợp lệ',
    email: '${label} không phải là email hợp lệ',
    url: '${label} không phải là URL hợp lệ',
    hex: '${label} không phải là hex hợp lệ',
  },
  string: {
    len: '${label} phải dài đúng ${len} ký tự',
    min: '${label} phải có ít nhất ${min} ký tự',
    max: '${label} không được dài hơn ${max} ký tự',
    range: '${label} phải có độ dài từ ${min} đến ${max} ký tự',
  },
  number: {
    len: '${label} phải bằng ${len}',
    min: '${label} không được nhỏ hơn ${min}',
    max: '${label} không được lớn hơn ${max}',
    range: '${label} phải nằm trong khoảng ${min} - ${max}',
  },
  array: {
    len: 'Phải có ${len} ${label}',
    min: 'Tối thiểu ${min} ${label}',
    max: 'Tối đa ${max} ${label}',
    range: 'Số lượng ${label} phải trong khoảng ${min} - ${max}',
  },
  pattern: {
    mismatch: '${label} không khớp với pattern ${pattern}',
  },
};
