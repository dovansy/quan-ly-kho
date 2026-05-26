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
  useGetWarehouses,
  useCreateWarehouse,
  useUpdateWarehouse,
  useDeleteWarehouse,
} from '@/hooks/api/warehouses';
import { sttColumn } from '@/utils/tableColumns';
import { formatNumber, getErrorMessage } from '@/utils/format';
import { Col, Form, Row, Tag } from 'antd';
import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

interface Warehouse {
  key: string;
  id: number;
  name: string;
  address: string;
  manager: string;
  productCount: number;
  status: string;
}

const WarehousesPage = () => {
  const [filterForm] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [filters, setFilters] = useState<{ keyword?: string; status?: string }>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Warehouse | null>(null);

  const { data: warehousesRes, isLoading } = useGetWarehouses(filters);
  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();
  const deleteMutation = useDeleteWarehouse();
  const { success, error } = useAppNotification();

  const filteredData: Warehouse[] = (warehousesRes?.data || []).map((w: any) => ({
    ...w,
    key: String(w.id),
    productCount: Number(w.productCount) || 0,
  }));

  const loading =
    isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const onSearch = (values: any) => {
    setFilters({ keyword: values.keyword, status: values.status });
  };

  const handleClearFilter = () => {
    filterForm.resetFields();
    setFilters({});
  };

  const openCreateModal = (defaults?: Partial<Warehouse>) => {
    setEditingRecord(null);
    modalForm.resetFields();
    if (defaults) modalForm.setFieldsValue(defaults);
    setModalOpen(true);
  };

  const openEditModal = (record: Warehouse) => {
    setEditingRecord(record);
    modalForm.resetFields();
    modalForm.setFieldsValue(record);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRecord(null);
    modalForm.resetFields();
  };

  const onSubmit = () => {
    modalForm.validateFields().then(values => {
      if (editingRecord) {
        updateMutation.mutate(
          { id: editingRecord.id, data: values },
          {
            onSuccess: () => {
              success({ message: 'Cập nhật kho thành công' });
              closeModal();
            },
            onError: (e: any) =>
              error({ message: 'Cập nhật kho thất bại', description: getErrorMessage(e) }),
          }
        );
      } else {
        createMutation.mutate(values, {
          onSuccess: () => {
            success({ message: 'Thêm kho thành công' });
            closeModal();
          },
          onError: (e: any) =>
            error({ message: 'Thêm kho thất bại', description: getErrorMessage(e) }),
        });
      }
    });
  };

  const handleDelete = (record: Warehouse) => {
    deleteMutation.mutate(record.id, {
      onSuccess: () => success({ message: 'Xóa kho thành công' }),
      onError: (e: any) =>
        error({ message: 'Xóa kho thất bại', description: getErrorMessage(e) }),
    });
  };

  const columns = [
    sttColumn,
    {
      title: 'Tên kho',
      dataIndex: 'name',
      key: 'name',
      width: '400px',
      render: (text: string) => <span className="font-bold">{text}</span>,
    },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address' },
    { title: 'Người quản lý', dataIndex: 'manager', key: 'manager' },
    {
      title: 'Số lượng sản phẩm',
      dataIndex: 'productCount',
      key: 'productCount',
      align: 'center' as const,
      render: (value: number) => formatNumber(value),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      align: 'center' as const,
      render: (status: string) => {
        const info = statusLabels[status] || { label: status, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      align: 'center' as const,
      width: 150,
      render: (_: any, record: Warehouse) => (
        <ActionColumn
          onEdit={() => openEditModal(record)}
          onDelete={() => handleDelete(record)}
          deleteTitle="Xóa kho"
          deleteDescription={`Bạn có chắc muốn xóa kho "${record.name}"?`}
        />
      ),
    },
  ];

  return (
    <div className="warehouses-page">
      <FilterSection
        form={filterForm}
        onSearch={onSearch}
        onClear={handleClearFilter}
        loading={loading}
      >
        <Form.Item name="keyword" label="Tìm kiếm theo tên kho" className="flex-1 mb-0">
          <AppInput placeholder="Nhập tên kho hoặc địa chỉ..." prefix={<FiSearch />} />
        </Form.Item>
        <Form.Item name="status" label="Trạng thái" className="w-[200px] mb-0">
          <AppSelect allowClear placeholder="Chọn trạng thái" options={statusOptions} />
        </Form.Item>
      </FilterSection>

      <TableSection
        totalLabel="Tổng số kho"
        totalCount={filteredData.length}
        addLabel="Thêm kho"
        onAdd={() => openCreateModal({ status: Status.ACTIVE })}
        columns={columns}
        dataSource={filteredData}
        loading={loading}
      />

      <CrudModal
        open={modalOpen}
        title={editingRecord ? 'Chỉnh sửa kho' : 'Thêm kho mới'}
        onCancel={closeModal}
        onSubmit={onSubmit}
        submitLabel={editingRecord ? 'Cập nhật' : 'Thêm mới'}
        loading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={modalForm} layout="vertical" className="pt-4" autoComplete="off">
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label="Tên kho"
                rules={[{ required: true, message: 'Vui lòng nhập tên kho' }]}
              >
                <AppInput placeholder="Nhập tên kho" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="manager"
                label="Người quản lý"
                rules={[{ required: true, message: 'Vui lòng nhập người quản lý' }]}
              >
                <AppInput placeholder="Nhập tên người quản lý" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 0]}>
            <Col xs={24}>
              <Form.Item
                name="address"
                label="Địa chỉ"
                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
              >
                <AppInput placeholder="Nhập địa chỉ kho" />
              </Form.Item>
            </Col>
          </Row>
          {editingRecord && (
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="status"
                  label="Trạng thái"
                  rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                >
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

export default WarehousesPage;
