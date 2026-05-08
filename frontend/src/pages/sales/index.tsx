import { Form, Popconfirm, type TableProps } from 'antd';
import { useMemo, useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import { AppButton } from '@/components/atoms/AppButton';
import { TableSection } from '@/components/organisms/table-section';
import { useAppNotification } from '@/components/templates/notification';
import { useGetInventory } from '@/hooks/api/inventory';
import { useDeleteSale, useGetSales, useReturnSale } from '@/hooks/api/sales';
import { salesService } from '@/services/sales.service';
import { toApiDate } from '@/utils/format';
import { SaleDetailModal } from './components/SaleDetailModal';
import { SaleFilterForm } from './components/SaleFilterForm';
import { SaleFormModal } from './components/SaleFormModal';
import { SaleStatsCards } from './components/SaleStatsCards';
import { SaleTypeButtons } from './components/SaleTypeButtons';
import { useSaleListColumns } from './components/useSaleListColumns';
import { mapSale, SaleOrderRow } from './types';
import { exportSalesExcel } from './utils';

const SORTABLE_SALES = ['customer_name', 'status', 'sale_date', 'total_amount'] as const;
type SortableSaleField = (typeof SORTABLE_SALES)[number];

const SalesPage = () => {
  const [filterForm] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const isFiltering = Object.keys(filters).some(k => filters[k] !== undefined && filters[k] !== '');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editing, setEditing] = useState<SaleOrderRow | null>(null);
  const [defaultSaleType, setDefaultSaleType] = useState<string | undefined>(undefined);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewing, setViewing] = useState<SaleOrderRow | null>(null);
  const [sort, setSort] = useState<{ sort_by?: SortableSaleField; sort_order?: 'asc' | 'desc' }>({});

  const { data: salesRes, isLoading } = useGetSales({ ...filters, ...sort });
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

  const onSearch = (v: any) =>
    setFilters({
      keyword: v.keyword,
      paid: v.paid !== undefined && v.paid !== null ? String(v.paid) : undefined,
      saleDate: v.saleDate ? toApiDate(v.saleDate) : undefined,
    });

  const onClear = () => {
    filterForm.resetFields();
    setFilters({});
    setSort({});
  };

  const { sort_by: sortBy, sort_order: sortOrder } = sort;

  const handleTableChange: TableProps<any>['onChange'] = (_pag, _filt, sorter) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    if (s && s.order && SORTABLE_SALES.includes(s.field as SortableSaleField)) {
      setSort({
        sort_by: s.field as SortableSaleField,
        sort_order: s.order === 'ascend' ? 'asc' : 'desc',
      });
    } else {
      setSort({});
    }
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
    sortBy,
    sortOrder,
  });

  const onExport = async () => {
    try {
      const res = await salesService.getAll({
        keyword: filters.keyword,
        paid: filters.paid,
        saleDate: filters.saleDate,
        limit: 100000,
      });
      const orders = (res.data?.data || []).map(mapSale);
      exportSalesExcel(orders, inventoryList);
    } catch (e: any) {
      error({
        message: 'Lỗi xuất Excel',
        description: e?.response?.data?.message || 'Không thể xuất',
      });
    }
  };

  const filterSummary = (() => {
    const parts: { label: string; value: string }[] = [];
    if (filters.keyword) parts.push({ label: 'Khách hàng', value: `"${filters.keyword}"` });
    if (filters.paid !== undefined && filters.paid !== '') {
      parts.push({ label: 'Thanh toán', value: filters.paid === 'true' ? 'Đã trả' : 'Còn nợ' });
    }
    if (filters.saleDate) parts.push({ label: 'Ngày bán', value: filters.saleDate });
    return parts;
  })();

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
          isFiltering ? (
            <Popconfirm
              title="Xuất Excel với bộ lọc hiện tại?"
              description={
                <div style={{ maxWidth: 320 }}>
                  <div className="mb-1">Sẽ xuất data theo filter:</div>
                  <ul className="pl-4 m-0 list-disc">
                    {filterSummary.map(f => (
                      <li key={f.label} className="break-words">
                        <span className="font-medium">{f.label}:</span> {f.value}
                      </li>
                    ))}
                  </ul>
                </div>
              }
              onConfirm={onExport}
              okText="Xuất"
              cancelText="Hủy"
            >
              <AppButton icon={<FiDownload />} type="default">
                Xuất Excel
              </AppButton>
            </Popconfirm>
          ) : (
            <AppButton icon={<FiDownload />} type="default" onClick={onExport}>
              Xuất Excel
            </AppButton>
          )
        }
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: 1200 }}
        onChange={handleTableChange}
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
