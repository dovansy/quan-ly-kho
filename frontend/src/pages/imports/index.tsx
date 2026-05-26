import { Form, Popconfirm, type TableProps } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import { AppButton } from '@/components/atoms/AppButton';
import { TableSection } from '@/components/organisms/table-section';
import { useAppNotification } from '@/components/templates/notification';
import { useDeleteImport, useGetImports } from '@/hooks/api/imports';
import { useGetProducts } from '@/hooks/api/products';
import { useGetWarehouseList } from '@/hooks/api/warehouses';
import { stockImportsService } from '@/services/stockImports.service';
import { getErrorMessage } from '@/utils/format';
import { ImportFilterForm } from './components/ImportFilterForm';
import { ImportFormModal } from './components/ImportFormModal';
import { useImportListColumns } from './components/useImportListColumns';
import { ImportRecord } from './types';
import { exportImportsExcel } from './utils';

const SORTABLE_IMPORTS = ['product_name', 'warehouse_name', 'expiry_date', 'import_date'] as const;
type SortableImportField = (typeof SORTABLE_IMPORTS)[number];

const ImportsPage = () => {
  const [filterForm] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const isFiltering = Object.keys(filters).some(k => filters[k] !== undefined && filters[k] !== '');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ImportRecord | null>(null);
  const [sort, setSort] = useState<{ sort_by?: SortableImportField; sort_order?: 'asc' | 'desc' }>(
    {}
  );

  const { data: importsRes, isLoading } = useGetImports({ ...filters, ...sort });
  const { data: warehouseListRes } = useGetWarehouseList();
  const { data: productsRes } = useGetProducts({ limit: 1000 });
  const { data: allImportsRes } = useGetImports({ limit: 1000 } as any);
  const remove = useDeleteImport();
  const { success, error } = useAppNotification();

  const data: ImportRecord[] = (importsRes?.data || []) as any;
  const allWarehouseOptions = (warehouseListRes?.data || []).map((w: any) => ({
    label: w.label,
    value: w.id,
  }));
  const productList: any[] = productsRes?.data || [];
  const productNameOpts = productList.map((p: any) => ({ label: p.name, value: p.name }));
  const allImports: ImportRecord[] = (allImportsRes?.data || []) as any;

  const warehouseSelected = Form.useWatch('warehouse_id', filterForm);
  const batchSelected = Form.useWatch('batch', filterForm);

  const cascadedWarehouseOptions = (() => {
    if (!batchSelected) return allWarehouseOptions;
    const ids = new Set(allImports.filter(i => i.batch === batchSelected).map(i => i.warehouse_id));
    return allWarehouseOptions.filter(o => ids.has(o.value));
  })();

  const cascadedBatchOptions = (() => {
    let pool = allImports;
    if (warehouseSelected) {
      pool = pool.filter(i => i.warehouse_id === Number(warehouseSelected));
    }
    const batches = Array.from(new Set(pool.map(i => i.batch).filter(Boolean)));
    return batches.sort().map(b => ({ label: b, value: b }));
  })();

  const loading = isLoading || remove.isPending;

  useEffect(() => {
    filterForm.setFieldsValue({
      keyword: filters.keyword || undefined,
      warehouse_id: filters.warehouse_id ? Number(filters.warehouse_id) : undefined,
      supplier: filters.supplier || undefined,
      batch: filters.batch || undefined,
      importDate: filters.importDate ? dayjs(filters.importDate) : undefined,
    });
  }, [filters, filterForm]);

  const onSearch = (values: any) => {
    setFilters({
      keyword: values.keyword,
      warehouse_id: values.warehouse_id,
      supplier: values.supplier,
      batch: values.batch,
      importDate: values.importDate ? dayjs(values.importDate).format('YYYY-MM-DD') : undefined,
    });
  };

  const onClear = () => {
    filterForm.resetFields();
    setFilters({});
    setSort({});
  };

  const { sort_by: sortBy, sort_order: sortOrder } = sort;

  const handleTableChange: TableProps<any>['onChange'] = (_pag, _filt, sorter) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    if (s && s.order && SORTABLE_IMPORTS.includes(s.field as SortableImportField)) {
      setSort({
        sort_by: s.field as SortableImportField,
        sort_order: s.order === 'ascend' ? 'asc' : 'desc',
      });
    } else {
      setSort({});
    }
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (r: ImportRecord) => {
    setEditing(r);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const onExport = async () => {
    try {
      const res = await stockImportsService.list({
        keyword: filters.keyword,
        warehouse_id: filters.warehouse_id ? Number(filters.warehouse_id) : undefined,
        supplier: filters.supplier,
        batch: filters.batch,
        importDate: filters.importDate,
        limit: 100000,
      });
      exportImportsExcel((res.data?.data || []) as any);
    } catch (e: any) {
      error({
        message: 'Lỗi xuất Excel',
        description: getErrorMessage(e, 'Không thể xuất'),
      });
    }
  };

  const onDelete = (r: ImportRecord) => {
    remove.mutate(r.id, {
      onSuccess: () => success({ message: 'Xóa bản ghi nhập thành công' }),
      onError: (e: any) =>
        error({
          message: 'Lỗi xóa',
          description: getErrorMessage(e, 'Không thể xóa'),
        }),
    });
  };

  const columns = useImportListColumns({ onEdit: openEdit, onDelete, sortBy, sortOrder });
  const filterSummary = (() => {
    const parts: { label: string; value: string }[] = [];
    if (filters.keyword) parts.push({ label: 'Tên sản phẩm', value: `"${filters.keyword}"` });
    if (filters.warehouse_id) {
      const w = allWarehouseOptions.find((o: any) => o.value === Number(filters.warehouse_id));
      if (w) parts.push({ label: 'Kho', value: w.label });
    }
    if (filters.supplier) parts.push({ label: 'NCC', value: filters.supplier });
    if (filters.batch) parts.push({ label: 'Lô', value: filters.batch });
    if (filters.importDate) parts.push({ label: 'Ngày nhập', value: filters.importDate });
    return parts;
  })();

  return (
    <div className="imports-page">
      <ImportFilterForm
        form={filterForm}
        loading={loading}
        warehouseOptions={cascadedWarehouseOptions}
        batchOptions={cascadedBatchOptions}
        productNameOpts={productNameOpts}
        onSearch={onSearch}
        onClear={onClear}
      />

      <TableSection
        totalLabel="Tổng số lần nhập"
        totalCount={data.length}
        isFiltering={isFiltering}
        addLabel="Nhập hàng mới"
        onAdd={openCreate}
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
        dataSource={data.map(d => ({ ...d, key: String(d.id) }))}
        loading={loading}
        scroll={{ x: 1400 }}
        onChange={handleTableChange}
      />

      <ImportFormModal
        open={modalOpen}
        editing={editing}
        warehouseOptions={allWarehouseOptions}
        productList={productList}
        productNameOpts={productNameOpts}
        allImports={allImports}
        onClose={closeModal}
      />
    </div>
  );
};

export default ImportsPage;
