import { AppInput } from '@/components/atoms/AppInput';
import { AppSelect } from '@/components/atoms/AppSelect';
import { ActionColumn } from '@/components/molecules/action-column';
import { CrudModal } from '@/components/organisms/crud-modal';
import { FilterSection } from '@/components/organisms/filter-section';
import { TableSection } from '@/components/organisms/table-section';
import { statusOptions, statusLabels, roleLabels } from '@/constants/options';
import { Status } from '@/constants/enums';
import { useGetAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from '@/hooks/api/accounts';
import { useAppSelector } from '@/shared/redux/hooks';
import { sttColumn } from '@/utils/tableColumns';
import { Col, Form, Row, Tag, message } from 'antd';
import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { noSpaceRule } from '@/utils/validationRules';

interface Account {
  key: string;
  id: number;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  status: string;
}

const AccountsPage = () => {
  const [filterForm] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [filters, setFilters] = useState<{ keyword?: string; status?: string }>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Account | null>(null);

  const currentUser = useAppSelector(state => state.auth.user);
  const isSuperAdmin = currentUser?.roles?.some(r => r.role === 'super_admin');

  const { data: accountsRes, isLoading } = useGetAccounts(filters);
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deleteMutation = useDeleteAccount();

  const filteredData: Account[] = (accountsRes?.data || []).map((item: any) => ({
    ...item,
    key: item.key || String(item.id),
  }));

  const loading = isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const onSearch = (values: any) => {
    setFilters({ keyword: values.keyword, status: values.status });
  };

  const handleClearFilter = () => {
    filterForm.resetFields();
    setFilters({});
  };

  const openCreateModal = (defaultValues?: Record<string, any>) => {
    setEditingRecord(null);
    modalForm.resetFields();
    if (defaultValues) modalForm.setFieldsValue(defaultValues);
    setModalOpen(true);
  };

  const openEditModal = (record: Account) => {
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
        const { fullName, email, phone, status } = values;
        updateMutation.mutate({ id: editingRecord.id, data: { fullName, email, phone, status } }, {
          onSuccess: () => { message.success('Cập nhật tài khoản thành công'); closeModal(); },
          onError: () => message.error('Cập nhật tài khoản thất bại'),
        });
      } else {
        const { fullName, username, email, phone, password } = values;
        createMutation.mutate({ fullName, username, email, phone, password }, {
          onSuccess: () => { message.success('Thêm tài khoản thành công'); closeModal(); },
          onError: () => message.error('Thêm tài khoản thất bại'),
        });
      }
    });
  };

  const handleDelete = (record: Account) => {
    deleteMutation.mutate(record.id, {
      onSuccess: () => message.success('Xóa tài khoản thành công'),
      onError: () => message.error('Xóa tài khoản thất bại'),
    });
  };

  const columns = [
    sttColumn,
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (text: string, record: Account) => (
        <div>
          <div className="font-bold">{text}</div>
          <div className="text-xs text-gray-500">@{record.username}</div>
        </div>
      ),
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Số điện thoại', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      align: 'center' as const,
      render: (role: string) => {
        const info = roleLabels[role] || { label: role, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
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
      render: (_: any, record: Account) => (
        <ActionColumn
          onEdit={() => openEditModal(record)}
          onDelete={() => handleDelete(record)}
          deleteTitle="Xóa tài khoản"
          deleteDescription={`Bạn có chắc muốn xóa tài khoản "${record.fullName}"?`}
          showDelete={!!isSuperAdmin}
        />
      ),
    },
  ];

  return (
    <div className="accounts-page">
      <FilterSection
        form={filterForm}
        onSearch={onSearch}
        onClear={handleClearFilter}
        loading={loading}
      >
        <Form.Item name="keyword" label="Tìm kiếm theo tên" className="flex-1 mb-0">
          <AppInput placeholder="Nhập tên hoặc username..." prefix={<FiSearch />} />
        </Form.Item>
        <Form.Item name="status" label="Trạng thái" className="w-[200px] mb-0">
          <AppSelect allowClear placeholder="Chọn trạng thái" options={statusOptions} />
        </Form.Item>
      </FilterSection>

      <TableSection
        totalLabel="Tổng số tài khoản"
        totalCount={filteredData.length}
        addLabel="Thêm tài khoản"
        onAdd={() => openCreateModal({ status: Status.ACTIVE })}
        columns={columns}
        dataSource={filteredData}
        loading={loading}
      />

      <CrudModal
        open={modalOpen}
        title={editingRecord ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
        onCancel={closeModal}
        onSubmit={onSubmit}
        submitLabel={editingRecord ? 'Cập nhật' : 'Thêm mới'}
      >
        <Form form={modalForm} layout="vertical" className="pt-4" autoComplete="off">
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="fullName"
                label="Họ và tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
              >
                <AppInput placeholder="Nhập họ và tên" autoComplete="new-password" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="username"
                label="Tên đăng nhập"
                rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }, noSpaceRule]}
              >
                <AppInput
                  placeholder="Nhập tên đăng nhập"
                  disabled={!!editingRecord}
                  autoComplete="new-password"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' },
                ]}
              >
                <AppInput placeholder="Nhập email" autoComplete="new-password" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
              >
                <AppInput placeholder="Nhập số điện thoại" autoComplete="new-password" />
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
          {!editingRecord && (
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu' },
                    { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
                    noSpaceRule,
                  ]}
                >
                  <AppInput
                    type="password"
                    placeholder="Nhập mật khẩu"
                    autoComplete="new-password"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="confirmPassword"
                  label="Xác nhận mật khẩu"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                    noSpaceRule,
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) return Promise.resolve();
                        return Promise.reject(new Error('Mật khẩu không khớp'));
                      },
                    }),
                  ]}
                >
                  <AppInput
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    autoComplete="new-password"
                  />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </CrudModal>
    </div>
  );
};

export default AccountsPage;
