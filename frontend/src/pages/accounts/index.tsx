import { AppInput, AppPasswordInput } from '@/components/atoms/AppInput';
import { AppSelect } from '@/components/atoms/AppSelect';
import { ActionColumn } from '@/components/molecules/action-column';
import { CrudModal } from '@/components/organisms/crud-modal';
import { FilterSection } from '@/components/organisms/filter-section';
import { TableSection } from '@/components/organisms/table-section';
import { useAppNotification } from '@/components/templates/notification';
import { statusOptions, statusLabels, roleLabels, roleOptions } from '@/constants/options';
import { Status } from '@/constants/enums';
import { useGetAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from '@/hooks/api/accounts';
import { useAppSelector } from '@/shared/redux/hooks';
import { sttColumn } from '@/utils/tableColumns';
import { Col, Form, Row, Tag, Tooltip } from 'antd';
import { useMemo, useState } from 'react';
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
  const [editingItem, setEditingItem] = useState<Account | null>(null);

  const currentUser = useAppSelector(state => state.auth.user);
  const isSuperAdmin = currentUser?.roles?.some(r => r.role === 'super_admin') ?? false;

  const { data: accountsRes, isLoading } = useGetAccounts(filters);
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deleteMutation = useDeleteAccount();
  const { success, error } = useAppNotification();

  const dataSource: Account[] = useMemo(
    () => (accountsRes?.data || []).map((item: any) => ({
      ...item,
      key: item.key || String(item.id),
    })),
    [accountsRes?.data],
  );

  const loading = isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const canDeleteRow = (row: Account): boolean => {
    if (row.id === currentUser?.id) return false;
    if ((row.role === 'admin' || row.role === 'super_admin') && !isSuperAdmin) return false;
    return true;
  };

  const onSearch = (values: any) => {
    setFilters({ keyword: values.keyword, status: values.status });
  };

  const handleClearFilter = () => {
    filterForm.resetFields();
    setFilters({});
  };

  const openCreateModal = () => {
    setEditingItem(null);
    modalForm.resetFields();
    modalForm.setFieldsValue({ status: Status.ACTIVE });
    setModalOpen(true);
  };

  const openEditModal = (record: Account) => {
    setEditingItem(record);
    modalForm.resetFields();
    modalForm.setFieldsValue(record);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    modalForm.resetFields();
  };

  const onSubmit = () => {
    modalForm.validateFields().then(values => {
      if (editingItem) {
        const { fullName, email, phone, status, role } = values;
        const payload: Record<string, unknown> = { fullName, email, phone, status };
        if (isSuperAdmin && role !== editingItem.role) payload.role = role;
        updateMutation.mutate(
          { id: editingItem.id, data: payload },
          {
            onSuccess: () => {
              success({ message: 'Cập nhật tài khoản thành công' });
              closeModal();
            },
            onError: (err: any) =>
              error({
                message: 'Cập nhật tài khoản thất bại',
                description: err?.data?.message,
              }),
          }
        );
      } else {
        const { fullName, username, email, phone, password } = values;
        createMutation.mutate(
          { fullName, username, email, phone, password, role: 'admin' },
          {
            onSuccess: () => {
              success({ message: 'Thêm tài khoản thành công' });
              closeModal();
            },
            onError: (err: any) =>
              error({
                message: 'Thêm tài khoản thất bại',
                description: err?.data?.message,
              }),
          }
        );
      }
    });
  };

  const handleDelete = (record: Account) => {
    deleteMutation.mutate(record.id, {
      onSuccess: () => success({ message: 'Xóa tài khoản thành công' }),
      onError: (err: any) =>
        error({ message: 'Xóa tài khoản thất bại', description: err?.data?.message }),
    });
  };

  const availableRoleOptions = isSuperAdmin
    ? roleOptions
    : roleOptions.filter(r => r.value !== 'super_admin');

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
      render: (_: any, record: Account) => {
        const canDelete = canDeleteRow(record);
        const deleteTooltip = record.id === currentUser?.id
          ? 'Không thể xóa chính mình'
          : !isSuperAdmin && record.role === 'admin'
            ? 'Chỉ super admin mới xóa được admin'
            : undefined;

        if (!canDelete && deleteTooltip) {
          return (
            <Tooltip title={deleteTooltip}>
              <span>
                <ActionColumn
                  onEdit={() => openEditModal(record)}
                  showDelete={false}
                />
              </span>
            </Tooltip>
          );
        }

        return (
          <ActionColumn
            onEdit={() => openEditModal(record)}
            onDelete={() => handleDelete(record)}
            deleteTitle="Xóa tài khoản"
            deleteDescription={`Bạn có chắc muốn xóa tài khoản "${record.fullName}"?`}
            showDelete={canDelete}
          />
        );
      },
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
        totalCount={dataSource.length}
        addLabel="Thêm tài khoản"
        onAdd={openCreateModal}
        columns={columns}
        dataSource={dataSource}
        loading={loading}
      />

      <CrudModal
        open={modalOpen}
        title={editingItem ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
        onCancel={closeModal}
        onSubmit={onSubmit}
        submitLabel={editingItem ? 'Cập nhật' : 'Thêm mới'}
        loading={createMutation.isPending || updateMutation.isPending}
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
                  disabled={!!editingItem}
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
          {editingItem && (
            <Row gutter={[16, 0]}>
              {isSuperAdmin && (
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="role"
                    label="Vai trò"
                    rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
                  >
                    <AppSelect placeholder="Chọn vai trò" options={availableRoleOptions} />
                  </Form.Item>
                </Col>
              )}
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
          {!editingItem && (
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
                  <AppPasswordInput
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
                  <AppPasswordInput
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
