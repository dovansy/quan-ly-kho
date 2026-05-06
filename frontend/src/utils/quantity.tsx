import { ReactNode } from 'react';
import { formatNumber } from './format';

/**
 * Render JSX dạng "X Kiện × Y + Z unit = Total unit", phần "= Total unit" mờ (text-gray-400).
 * Dùng đồng bộ trên các bảng (inventory, imports, sales view modal, ...).
 * Nếu không có quy cách kiện (units_per_carton ≤ 1), chỉ render "Total unit".
 */
export const renderCartonPieces = (
  total: number | string | null | undefined,
  unitsPerCarton: number | string | null | undefined,
  unitLabel: string | null | undefined
): ReactNode => {
  const t = Number(total) || 0;
  const upc = Number(unitsPerCarton) || 0;
  const u = unitLabel || '';
  if (upc > 1 && t > 0) {
    const cartons = Math.floor(t / upc);
    const pieces = t - cartons * upc;
    if (cartons === 0) return `${formatNumber(pieces)} ${u}`.trim();
    const parts: string[] = [`${formatNumber(cartons)} Kiện × ${upc}`];
    if (pieces > 0) parts.push(`${formatNumber(pieces)} ${u}`.trim());
    return (
      <span>
        {parts.join(' + ')}{' '}
        <span>
          = {formatNumber(t)} {u}
        </span>
      </span>
    );
  }
  return `${formatNumber(t)} ${u}`.trim();
};
