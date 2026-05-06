import { DATE_FORMAT, LOCALE } from '@/constants/format';
import dayjs, { Dayjs } from 'dayjs';

export const formatCurrency = (value: number): string => {
  return value.toLocaleString(LOCALE);
};

export const formatNumber = (value: number): string => {
  return value.toLocaleString(LOCALE);
};

export const formatDate = (date: string | Dayjs): string => {
  return dayjs(date).format(DATE_FORMAT.DISPLAY);
};

export const toApiDate = (date: string | Dayjs): string => {
  return dayjs(date).format(DATE_FORMAT.API);
};

/**
 * Format số lượng dạng "X Kiện × Y + Z unit = Total unit".
 * Dùng đồng bộ trên toàn app (table render dạng plain text + Excel export).
 * Nếu không có quy cách kiện (units_per_carton ≤ 1), trả về "Total unit".
 */
export const formatCartonPiecesPlain = (
  total: number | string | null | undefined,
  unitsPerCarton: number | string | null | undefined,
  unitLabel: string | null | undefined
): string => {
  const t = Number(total) || 0;
  const upc = Number(unitsPerCarton) || 0;
  const u = unitLabel || '';
  if (upc > 1 && t > 0) {
    const cartons = Math.floor(t / upc);
    const pieces = t - cartons * upc;
    if (cartons === 0) return `${formatNumber(pieces)} ${u}`.trim();
    const parts: string[] = [`${formatNumber(cartons)} Kiện × ${upc}`];
    if (pieces > 0) parts.push(`${formatNumber(pieces)} ${u}`.trim());
    return `${parts.join(' + ')} = ${formatNumber(t)} ${u}`.trim();
  }
  return `${formatNumber(t)} ${u}`.trim();
};
