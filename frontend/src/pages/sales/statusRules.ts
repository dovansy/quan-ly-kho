import { PaymentStatus } from '@/constants/enums';
import { SaleOrderRow } from './types';

export function isCancelledOrder(order: SaleOrderRow | null | undefined) {
  return !!order && order.payment_status === PaymentStatus.CANCELLED;
}

export function isPendingOrder(order: SaleOrderRow | null | undefined) {
  return !!order && order.payment_status === PaymentStatus.PENDING && !order.returned;
}

export function canEditProducts(order: SaleOrderRow | null | undefined) {
  if (!order) return true;
  return order.returned || order.payment_status === PaymentStatus.PENDING;
}

export function canEditOrder(order: SaleOrderRow | null | undefined) {
  return !isCancelledOrder(order);
}

export function canDeleteOrder(order: SaleOrderRow) {
  return (
    order.payment_status === PaymentStatus.PENDING ||
    order.payment_status === PaymentStatus.CANCELLED
  );
}

export function canReturnOrder(order: SaleOrderRow) {
  return !order.returned && order.payment_status === PaymentStatus.UNPAID;
}

export function canConfirmShipment(order: SaleOrderRow) {
  return order.payment_status === PaymentStatus.PENDING && !order.returned;
}
