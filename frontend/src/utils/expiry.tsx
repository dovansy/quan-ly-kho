import { Tag } from 'antd';
import dayjs from 'dayjs';
import { ReactNode } from 'react';
import { formatDate } from './format';

/**
 * Render Tag hạn sử dụng theo thời hạn còn lại:
 * - đỏ (error): còn dưới 1 năm (hoặc đã hết hạn)
 * - vàng (warning): còn dưới 2 năm
 * - xanh (processing): còn từ 2 năm trở lên
 * Dùng đồng bộ trên các bảng inventory, imports, ...
 */
export const renderExpiryTag = (date: string | null | undefined): ReactNode => {
  if (!date) return '-';
  const diff = dayjs(date).diff(dayjs(), 'day');
  let color = 'processing';
  if (diff < 365) color = 'error';
  else if (diff < 730) color = 'warning';
  return <Tag color={color}>{formatDate(date)}</Tag>;
};
