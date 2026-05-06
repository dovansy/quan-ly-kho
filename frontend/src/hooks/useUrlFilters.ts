import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Đồng bộ filter form với URL query params.
 * - Reload trang vẫn giữ filter
 * - Share URL kèm filter
 *
 * Trả về:
 * - `filters`: object string-keyed (đọc từ URL)
 * - `setFilters`: cập nhật URL (đồng thời trigger re-render)
 * - `clearFilters`: xóa hết
 * - `isFiltering`: có filter nào đang active không
 *
 * Page tự lo convert (vd dayjs <-> string) vì giá trị URL luôn là string.
 */
export const useUrlFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<Record<string, string>>(() => {
    const obj: Record<string, string> = {};
    searchParams.forEach((v, k) => {
      obj[k] = v;
    });
    return obj;
  }, [searchParams]);

  const setFilters = useCallback(
    (next: Record<string, any>) => {
      const params = new URLSearchParams();
      Object.entries(next).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
      });
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const isFiltering = useMemo(
    () => Array.from(searchParams.keys()).length > 0,
    [searchParams]
  );

  return { filters, setFilters, clearFilters, isFiltering };
};
