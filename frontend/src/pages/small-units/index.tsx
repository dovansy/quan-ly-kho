import { AppInput } from '@/components/atoms/AppInput';
import { AppSelect } from '@/components/atoms/AppSelect';
import { ActionColumn } from '@/components/molecules/action-column';
import { CrudModal } from '@/components/organisms/crud-modal';
import { FilterSection } from '@/components/organisms/filter-section';
import { TableSection } from '@/components/organisms/table-section';
import { useAppNotification } from '@/components/templates/notification';
import { statusOptions, statusLabels } from '@/constants/options';
import { Status } from '@/constants/enums';
import {
  useGetSmallUnits, useCreateSmallUnit, useUpdateSmallUnit, useDeleteSmallUnit,
} from '@/hooks/api/small-units';
import { sttColumn } from '@/utils/tableColumns';
import { Col, Form, Row, Tag } from 'antd';
import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

interface SmallUnitRow {
  id: number;
  code: string;
  label: string;
  status: 'active' | 'inactive';
}

const SmallUnitsPage = () => {
  const [filterForm] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [filters, setFilters] = useState<{ keyword?: string; status?: string }>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SmallUnitRow | null>(null);

  const { data: res, isLoading } = useGetSmallUnits(filters);
  const create = useCreateSmallUnit();
  const update = useUpdateSmallUnit();
  const remove = useDeleteSmallUnit();
  const { success, error } = useAppNotification();

  const data: SmallUnitRow[] = (res?.data || []) as any;
  const loading = isLoading || create.isPending || update.isPending || remove.isPending;

  const onSearch = (v: any) => setFilters({ keyword: v.keyword, status: v.status });
  const onClear = () => { filterForm.resetFields(); setFilters({}); };

  const openCreate = () => {
    setEditing(null);
    modalForm.resetFields();
    modalForm.setFieldsValue({ status: Status.ACTIVE });
    setModalOpen(true);
  };

  const openEdit = (r: SmallUnitRow) => {
    setEditing(r);
    modalForm.setFieldsValue(r);
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditing(null); modalForm.resetFields(); };

  const onSubmit = () => {
    modalForm.validateFields().then(values => {
      if (editing) {
        update.mutate(
          { id: editing.id, data: { label: values.label, status: values.status } },
          {
            onSuccess: () => {
              success({ message: 'Cập nhật đơn vị thành công' });
              closeModal();
            },
            onError: (e: any) =>
              error({
                message: 'Lỗi cập nhật',
                description: e?.response?.data?.message,
              }),
          }
        );
      } else {
        create.mutate(values, {
          onSuccess: () => {
            success({ message: 'Tạo đơn vị thành công' });
            closeModal();
          },
          onError: (e: any) =>
            error({ message: 'Lỗi tạo đơn vị', description: e?.response?.data?.message }),
        });
      }
    });
  };

  const onDelete = (r: SmallUnitRow) => {
    remove.mutate(r.id, {
      onSuccess: () => success({ message: 'Xóa đơn vị thành công' }),
      onError: (e: any) =>
        error({ message: 'Lỗi xóa', description: e?.response?.data?.message }),
    });
  };

  const columns = [
    sttColumn,
    { title: 'Code', dataIndex: 'code', key: 'code',
      render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: 'Nhãn hiển thị', dataIndex: 'label', key: 'label',
      render: (t: string) => <span className="font-bold">{t}</span> },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', align: 'center' as const,
      render: (s: string) => {
        const info = statusLabels[s] || { label: s, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'Hành động', key: 'actions', align: 'center' as const, width: 150,
      render: (_: any, r: SmallUnitRow) => (
        <ActionColumn onEdit={() => openEdit(r)} onDelete={() => onDelete(r)}
          deleteTitle="Xóa đơn vị" deleteDescription={`Xóa đơn vị "${r.label}"?`} />
      ),
    },
  ];

  return (
    <div className="small-units-page">
      <FilterSection form={filterForm} onSearch={onSearch} onClear={onClear} loading={loading}>
        <Form.Item name="keyword" label="Tìm kiếm" className="flex-1 mb-0">
          <AppInput placeholder="Code hoặc nhãn..." prefix={<FiSearch />} />
        </Form.Item>
        <Form.Item name="status" label="Trạng thái" className="w-[200px] mb-0">
          <AppSelect allowClear placeholder="Chọn trạng thái" options={statusOptions} />
        </Form.Item>
      </FilterSection>

      <TableSection
        totalLabel="Tổng số đơn vị"
        totalCount={data.length}
        addLabel="Thêm đơn vị"
        onAdd={openCreate}
        columns={columns}
        dataSource={data.map(d => ({ ...d, key: String(d.id) }))}
        loading={loading}
      />

      <CrudModal
        open={modalOpen}
        title={editing ? 'Chỉnh sửa đơn vị lẻ' : 'Thêm đơn vị lẻ mới'}
        onCancel={closeModal}
        onSubmit={onSubmit}
        submitLabel={editing ? 'Cập nhật' : 'Thêm mới'}
        loading={create.isPending || update.isPending}
      >
        <Form form={modalForm} layout="vertical" className="pt-4" autoComplete="off">
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item name="code" label="Code"
                rules={[{ required: true, message: 'Nhập code' }]}>
                <AppInput placeholder="vd: hop, goi, tui" disabled={!!editing} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="label" label="Nhãn hiển thị"
                rules={[{ required: true, message: 'Nhập nhãn' }]}>
                <AppInput placeholder="vd: Hộp, Gói, Túi" />
              </Form.Item>
            </Col>
          </Row>
          {editing && (
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item name="status" label="Trạng thái"
                  rules={[{ required: true }]}>
                  <AppSelect placeholder="Chọn trạng thái" options={statusOptions} />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </CrudModal>
    </div>
  );
};

export default SmallUnitsPage;
