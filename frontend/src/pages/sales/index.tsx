import { Form } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import { AppButton } from '@/components/atoms/AppButton';
import { TableSection } from '@/components/organisms/table-section';
import { useAppNotification } from '@/components/templates/notification';
import { useGetInventory } from '@/hooks/api/inventory';
import { useDeleteSale, useGetSales, useReturnSale } from '@/hooks/api/sales';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { toApiDate } from '@/utils/format';
import { SaleDetailModal } from './components/SaleDetailModal';
import { SaleFilterForm } from './components/SaleFilterForm';
import { SaleFormModal } from './components/SaleFormModal';
import { SaleStatsCards } from './components/SaleStatsCards';
import { SaleTypeButtons } from './components/SaleTypeButtons';
import { useSaleListColumns } from './components/useSaleListColumns';
import { mapSale, SaleOrderRow } from './types';
import { exportSalesExcel } from './utils';

const SalesPage = () => {
  const [filterForm] = Form.useForm();
  const { filters, setFilters, clearFilters, isFiltering } = useUrlFilters();
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editing, setEditing] = useState<SaleOrderRow | null>(null);
  const [defaultSaleType, setDefaultSaleType] = useState<string | undefined>(undefined);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewing, setViewing] = useState<SaleOrderRow | null>(null);

  const { data: salesRes, isLoading } = useGetSales(filters);
  const { data: inventoryRes } = useGetInventory();
  const remove = useDeleteSale();
  const returnSale = useReturnSale();
  const { success, error } = useAppNotification();

  const inventoryList = inventoryRes?.data || [];
  const data = (salesRes?.data || []).map(mapSale);
  const loading = isLoading || remove.isPending || returnSale.isPending;

  const activeOrders = useMemo(() => data.filter(x => !x.returned), [data]);
  const totalRevenue = useMemo(
    () => activeOrders.reduce((s, x) => s + x.total_amount, 0),
    [activeOrders]
  );
  const totalDebt = useMemo(
    () => activeOrders.filter(x => !x.paid).reduce((s, x) => s + x.total_amount, 0),
    [activeOrders]
  );

  // Hydrate form từ URL khi load lần đầu hoặc filters đổi (back/forward).
  useEffect(() => {
    filterForm.setFieldsValue({
      keyword: filters.keyword || undefined,
      paid:
        filters.paid === 'true' ? true : filters.paid === 'false' ? false : undefined,
      saleDate: filters.saleDate ? dayjs(filters.saleDate) : undefined,
    });
  }, [filters, filterForm]);

  const onSearch = (v: any) =>
    setFilters({
      keyword: v.keyword,
      paid: v.paid !== undefined && v.paid !== null ? String(v.paid) : undefined,
      saleDate: v.saleDate ? toApiDate(v.saleDate) : undefined,
    });

  const onClear = () => {
    filterForm.resetFields();
    clearFilters();
  };

  const openCreate = (saleType: string) => {
    setEditing(null);
    setDefaultSaleType(saleType);
    setFormModalOpen(true);
  };

  const openEdit = (r: SaleOrderRow) => {
    setEditing(r);
    setDefaultSaleType(undefined);
    setFormModalOpen(true);
  };

  const closeFormModal = () => {
    setFormModalOpen(false);
    setEditing(null);
    setDefaultSaleType(undefined);
  };

  const openView = (r: SaleOrderRow) => {
    setViewing(r);
    setViewModalOpen(true);
  };

  const closeView = () => {
    setViewModalOpen(false);
    setViewing(null);
  };

  const onDelete = (r: SaleOrderRow) => {
    remove.mutate(r.id, {
      onSuccess: () => success({ message: 'Xóa hóa đơn thành công' }),
      onError: () => error({ message: 'Không thể xóa hóa đơn' }),
    });
  };

  const onReturn = (r: SaleOrderRow) => {
    returnSale.mutate(r.id, {
      onSuccess: () => success({ message: 'Hoàn hàng thành công' }),
      onError: (e: any) =>
        error({
          message: 'Hoàn hàng thất bại',
          description: e?.data?.message,
        }),
    });
  };

  const columns = useSaleListColumns({
    onView: openView,
    onEdit: openEdit,
    onDelete,
    onReturn,
  });

  return (
    <div className="sales-page">
      <SaleStatsCards totalRevenue={totalRevenue} totalDebt={totalDebt} />

      <SaleFilterForm form={filterForm} loading={loading} onSearch={onSearch} onClear={onClear} />

      <SaleTypeButtons onSelect={openCreate} />

      <TableSection
        totalLabel="Tổng số hóa đơn"
        totalCount={data.length}
        isFiltering={isFiltering}
        extraActions={
          <AppButton
            icon={<FiDownload />}
            type="default"
            onClick={() => exportSalesExcel(data, inventoryList)}
          >
            Xuất Excel
          </AppButton>
        }
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: 1200 }}
      />

      <SaleFormModal
        open={formModalOpen}
        editing={editing}
        defaultSaleType={defaultSaleType}
        inventoryList={inventoryList}
        onClose={closeFormModal}
      />

      <SaleDetailModal
        open={viewModalOpen}
        viewing={viewing}
        inventoryList={inventoryList}
        onClose={closeView}
      />
    </div>
  );
};

export default SalesPage;
