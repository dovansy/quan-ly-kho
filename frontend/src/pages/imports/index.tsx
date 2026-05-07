import { Form, type TableProps } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import { AppButton } from '@/components/atoms/AppButton';
import { TableSection } from '@/components/organisms/table-section';
import { useAppNotification } from '@/components/templates/notification';
import {
  useDeleteImport,
  useGetImports,
} from '@/hooks/api/imports';
import { useGetProductCategories, useGetProducts } from '@/hooks/api/products';
import { useGetSmallUnitOptions } from '@/hooks/api/small-units';
import { useGetWarehouseList } from '@/hooks/api/warehouses';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { ImportFilterForm } from './components/ImportFilterForm';
import { ImportFormModal } from './components/ImportFormModal';
import { useImportListColumns } from './components/useImportListColumns';
import { ImportRecord } from './types';
import { exportImportsExcel } from './utils';

const SORTABLE_IMPORTS = ['product_name', 'warehouse_name', 'expiry_date', 'import_date'] as const;
type SortableImportField = (typeof SORTABLE_IMPORTS)[number];

const ImportsPage = () => {
  const [filterForm] = Form.useForm();
  const { filters, setFilters, clearFilters, isFiltering } = useUrlFilters();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ImportRecord | null>(null);
  const [sort, setSort] = useState<{ sort_by?: SortableImportField; sort_order?: 'asc' | 'desc' }>({});

  const { data: importsRes, isLoading } = useGetImports({ ...filters, ...sort });
  const { data: warehouseListRes } = useGetWarehouseList();
  const { data: smallUnitsRes } = useGetSmallUnitOptions();
  const { data: catRes } = useGetProductCategories();
  const { data: productsRes } = useGetProducts({ limit: 1000 });
  const { data: allImportsRes } = useGetImports({ limit: 1000 } as any);
  const remove = useDeleteImport();
  const { success, error } = useAppNotification();

  const data: ImportRecord[] = (importsRes?.data || []) as any;
  const warehouseOptions = (warehouseListRes?.data || []).map((w: any) => ({
    label: w.label,
    value: w.id,
  }));
  const smallUnitOpts = smallUnitsRes?.data || [];
  const categoryOpts = catRes?.data || [];
  const productList: any[] = productsRes?.data || [];
  const productNameOpts = productList.map((p: any) => ({ label: p.name, value: p.name }));
  const allImports: ImportRecord[] = (allImportsRes?.data || []) as any;

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
    clearFilters();
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

  const onDelete = (r: ImportRecord) => {
    remove.mutate(r.id, {
      onSuccess: () => success({ message: 'Xóa bản ghi nhập thành công' }),
      onError: (e: any) =>
        error({
          message: 'Lỗi xóa',
          description: e?.response?.data?.message || 'Không thể xóa',
        }),
    });
  };

  const columns = useImportListColumns({ onEdit: openEdit, onDelete, sortBy, sortOrder });

  return (
    <div className="imports-page">
      <ImportFilterForm
        form={filterForm}
        loading={loading}
        warehouseOptions={warehouseOptions}
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
          <AppButton
            icon={<FiDownload />}
            type="default"
            onClick={() => exportImportsExcel(data)}
          >
            Xuất Excel
          </AppButton>
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
        warehouseOptions={warehouseOptions}
        smallUnitOpts={smallUnitOpts}
        categoryOpts={categoryOpts}
        productList={productList}
        productNameOpts={productNameOpts}
        allImports={allImports}
        onClose={closeModal}
      />
    </div>
  );
};

export default ImportsPage;
