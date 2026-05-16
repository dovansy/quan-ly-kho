import { Form, type TableProps } from 'antd';
import { useState } from 'react';
import { TableSection } from '@/components/organisms/table-section';
import { useGetProductCategories, useGetProducts } from '@/hooks/api/products';
import { ProductFilterForm } from './components/ProductFilterForm';
import { ProductFormModal } from './components/ProductFormModal';
import { useProductListColumns } from './components/useProductListColumns';
import { ProductRow } from './types';

const ProductsPage = () => {
  const [filterForm] = Form.useForm();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const isFiltering = Object.keys(filters).some(k => filters[k] !== undefined && filters[k] !== '');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [sort, setSort] = useState<{ sort_by?: 'name'; sort_order?: 'asc' | 'desc' }>({});

  const { data: res, isLoading } = useGetProducts({ ...filters, ...sort });
  const { data: catRes } = useGetProductCategories();

  const data: ProductRow[] = (res?.data || []) as any;
  const categoryOpts = catRes?.data || [];
  const productNameOpts = data.map((p: any) => ({ label: p.name, value: p.name }));

  const onSearch = (v: any) =>
    setFilters({ keyword: v.keyword, category: v.category, status: v.status });

  const onClear = () => {
    filterForm.resetFields();
    setFilters({});
    setSort({});
  };

  const { sort_by: sortBy, sort_order: sortOrder } = sort;

  const handleTableChange: TableProps<any>['onChange'] = (_pag, _filt, sorter) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    if (s && s.order && s.field === 'name') {
      setSort({
        sort_by: 'name',
        sort_order: s.order === 'ascend' ? 'asc' : 'desc',
      });
    } else {
      setSort({});
    }
  };

  const openEdit = (r: ProductRow) => {
    setEditing(r);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const columns = useProductListColumns({ onEdit: openEdit, sortBy, sortOrder });

  return (
    <div className="products-page">
      <div className="p-4 mb-4 border-l-4 border-blue-400 rounded bg-blue-50">
        <p className="text-sm text-blue-800">
          <strong>Danh sách sản phẩm</strong> — sản phẩm tự động được tạo khi nhập hàng (xem trang
          "Nhập hàng"). Tại đây bạn chỉ chỉnh được loại, đơn vị mặc định, giá đề xuất và trạng thái.
        </p>
      </div>

      <ProductFilterForm
        form={filterForm}
        loading={isLoading}
        categoryOpts={categoryOpts}
        productNameOpts={productNameOpts}
        onSearch={onSearch}
        onClear={onClear}
      />

      <TableSection
        totalLabel="Tổng số SP"
        totalCount={data.length}
        isFiltering={isFiltering}
        columns={columns}
        dataSource={data.map(d => ({ ...d, key: String(d.id) }))}
        loading={isLoading}
        onChange={handleTableChange}
      />

      <ProductFormModal
        open={modalOpen}
        editing={editing}
        categoryOpts={categoryOpts}
        onClose={closeModal}
      />
    </div>
  );
};

export default ProductsPage;
