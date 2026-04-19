import { AppAutoComplete } from '@/components/atoms/AppAutoComplete';
import { AppInput } from '@/components/atoms/AppInput';
import { AppSelect } from '@/components/atoms/AppSelect';
import { ActionColumn } from '@/components/molecules/action-column';
import { CrudModal } from '@/components/organisms/crud-modal';
import { FilterSection } from '@/components/organisms/filter-section';
import { TableSection } from '@/components/organisms/table-section';
import { statusOptions, statusLabels } from '@/constants/options';
import { useGetProducts, useUpdateProduct, useGetProductCategories } from '@/hooks/api/products';
import { useGetSmallUnitOptions } from '@/hooks/api/small-units';
import { sttColumn } from '@/utils/tableColumns';
import { Col, Form, Row, Tag, message } from 'antd';
import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

interface ProductRow {
  id: number;
  name: string;
  category: string | null;
  supplier: string | null;
  default_small_unit_id: number;
  default_small_unit: { id: number; code: string; label: string } | null;
  status: 'active' | 'inactive';
}

const ProductsPage = () => {
  const [filterForm] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [filters, setFilters] = useState<any>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);

  const { data: res, isLoading } = useGetProducts(filters);
  const { data: catRes } = useGetProductCategories();
  const { data: smallUnitsRes } = useGetSmallUnitOptions();
  const update = useUpdateProduct();

  const data: ProductRow[] = (res?.data || []) as any;
  const categoryOpts = catRes?.data || [];
  const smallUnitOpts = smallUnitsRes?.data || [];
  const loading = isLoading || update.isPending;

  const onSearch = (v: any) => setFilters({ keyword: v.keyword, category: v.category, status: v.status });
  const onClear = () => { filterForm.resetFields(); setFilters({}); };

  const openEdit = (r: ProductRow) => {
    setEditing(r);
    modalForm.setFieldsValue({
      category: r.category,
      supplier: r.supplier,
      default_small_unit_id: r.default_small_unit_id,
      status: r.status,
    });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditing(null); modalForm.resetFields(); };

  const onSubmit = () => {
    if (!editing) return;
    modalForm.validateFields().then(values => {
      update.mutate({
        id: editing.id,
        data: {
          category: values.category,
          supplier: values.supplier || null,
          default_small_unit_id: Number(values.default_small_unit_id),
          status: values.status,
        },
      }, {
        onSuccess: () => { message.success('Cập nhật SP thành công'); closeModal(); },
        onError: (e: any) => message.error(e?.response?.data?.message || 'Lỗi cập nhật'),
      });
    });
  };

  const columns = [
    sttColumn,
    { title: 'Tên SP', dataIndex: 'name', key: 'name',
      render: (t: string) => <span className="font-bold">{t}</span> },
    { title: 'Loại', dataIndex: 'category', key: 'category',
      render: (t: string) => t ? <Tag color="blue">{t}</Tag> : '-' },
    { title: 'NCC', dataIndex: 'supplier', key: 'supplier',
      render: (t: string) => t || '-' },
    { title: 'Đơn vị lẻ', dataIndex: 'default_small_unit', key: 'default_small_unit',
      render: (u: any) => u?.label || '-' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', align: 'center' as const,
      render: (s: string) => {
        const info = statusLabels[s] || { label: s, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'Hành động', key: 'actions', align: 'center' as const, width: 120,
      render: (_: any, r: ProductRow) => (
        <ActionColumn onEdit={() => openEdit(r)} />
      ),
    },
  ];

  return (
    <div className="products-page">
      <div className="p-4 mb-4 border-l-4 border-blue-400 rounded bg-blue-50">
        <p className="text-sm text-blue-800">
          <strong>Danh sách sản phẩm</strong> — sản phẩm tự động được tạo khi nhập hàng (xem trang "Nhập hàng").
          Tại đây bạn chỉ chỉnh được loại, đơn vị mặc định, giá đề xuất và trạng thái.
        </p>
      </div>

      <FilterSection form={filterForm} onSearch={onSearch} onClear={onClear} loading={loading}>
        <Form.Item name="keyword" label="Tìm kiếm" className="flex-1 mb-0">
          <AppInput placeholder="Tên SP..." prefix={<FiSearch />} />
        </Form.Item>
        <Form.Item name="category" label="Loại" className="w-[200px] mb-0">
          <AppSelect allowClear showSearch placeholder="Chọn loại" options={categoryOpts}
            filterOption={(i, o) => (o?.label ?? '').toString().toLowerCase().includes(i.toLowerCase())} />
        </Form.Item>
        <Form.Item name="status" label="Trạng thái" className="w-[200px] mb-0">
          <AppSelect allowClear placeholder="Chọn trạng thái" options={statusOptions} />
        </Form.Item>
      </FilterSection>

      <TableSection
        totalLabel="Tổng số SP"
        totalCount={data.length}
        columns={columns}
        dataSource={data.map(d => ({ ...d, key: String(d.id) }))}
        loading={loading}
      />

      <CrudModal
        open={modalOpen}
        title={`Chỉnh sửa: ${editing?.name || ''}`}
        onCancel={closeModal}
        onSubmit={onSubmit}
        submitLabel="Cập nhật"
        loading={update.isPending}
      >
        <Form form={modalForm} layout="vertical" className="pt-4" autoComplete="off">
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item name="category" label="Loại sản phẩm">
                <AppAutoComplete placeholder="Nhập hoặc chọn loại" options={categoryOpts} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="supplier" label="Nhà cung cấp">
                <AppInput placeholder="Tên NCC" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item name="default_small_unit_id" label="Đơn vị lẻ mặc định"
                rules={[{ required: true }]}>
                <AppSelect placeholder="Chọn đơn vị" options={smallUnitOpts} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
                <AppSelect options={statusOptions} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </CrudModal>
    </div>
  );
};

export default ProductsPage;
