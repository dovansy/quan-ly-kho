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

export const formatDateTime = (date: string | Dayjs): string => {
  return dayjs(date).format(DATE_FORMAT.DISPLAY_WITH_TIME);
};

export const formatDateWithTime = (
  date: string | Dayjs,
  timeSource?: string | Dayjs | null
): string => {
  const base = dayjs(date);
  if (!timeSource) return base.format(DATE_FORMAT.DISPLAY_WITH_TIME);

  const time = dayjs(timeSource);
  return base
    .hour(time.hour())
    .minute(time.minute())
    .format(DATE_FORMAT.DISPLAY_WITH_TIME);
};

export const toApiDate = (date: string | Dayjs): string => {
  return dayjs(date).format(DATE_FORMAT.API);
};

export const getErrorMessage = (error: any, fallback = 'Đã có lỗi xảy ra'): string => {
  return (
    error?.data?.message ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
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
