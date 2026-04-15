import { DATE_FORMAT, LOCALE } from '@/constants/format';
import dayjs, { Dayjs } from 'dayjs';

export const formatCurrency = (value: number): string => {
  return value.toLocaleString(LOCALE) + ' đ';
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
