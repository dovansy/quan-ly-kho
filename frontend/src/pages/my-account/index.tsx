import { AppButton } from '@/components/atoms/AppButton';
import { AppInput } from '@/components/atoms/AppInput';
import { useGetMe, useUpdateProfile, useChangePassword } from '@/hooks/api/auth';
import { useAppDispatch } from '@/shared/redux/hooks';
import { updateUser, logout } from '@/store/auth';
import { roleLabels } from '@/constants/options';
import { Card, Col, Divider, Form, Row, Tag, message, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATH } from '@/constants/app';
import { FiUser, FiLock, FiLogOut } from 'react-icons/fi';
import { noSpaceRule } from '@/utils/validationRules';

const MyAccountPage = () => {
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { data: meRes, isLoading } = useGetMe();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  const user = meRes?.data;

  const handleUpdateProfile = () => {
    profileForm.validateFields().then(values => {
      updateProfileMutation.mutate(
        { fullName: values.fullName, email: values.email, phone: values.phone },
        {
          onSuccess: (res) => {
            message.success('Cập nhật thông tin thành công');
            if (res.data.data) {
              dispatch(updateUser(res.data.data));
            }
          },
          onError: () => message.error('Cập nhật thất bại'),
        },
      );
    });
  };

  const handleChangePassword = () => {
    passwordForm.validateFields().then(values => {
      changePasswordMutation.mutate(
        { currentPassword: values.currentPassword, newPassword: values.newPassword },
        {
          onSuccess: () => {
            message.success('Đổi mật khẩu thành công');
            passwordForm.resetFields();
          },
          onError: (error: any) => {
            const code = error?.data?.code;
            if (code === 4001) {
              passwordForm.setFields([{ name: 'currentPassword', errors: ['Mật khẩu hiện tại không đúng'] }]);
            } else {
              message.error('Đổi mật khẩu thất bại');
            }
          },
        },
      );
    });
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('access_token');
    navigate(ROUTE_PATH.LOGIN);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  const roleInfo = user?.roles?.[0]?.role
    ? roleLabels[user.roles[0].role] || { label: user.roles[0].role, color: 'default' }
    : { label: 'N/A', color: 'default' };

  return (
    <div className="my-account-page max-w-[800px] mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FiUser /> Tài khoản của tôi
      </h2>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Thông tin cá nhân</h3>
            <p className="text-gray-500 text-sm">Cập nhật thông tin tài khoản của bạn</p>
          </div>
          <Tag color={roleInfo.color}>{roleInfo.label}</Tag>
        </div>

        <Divider className="my-3" />

        <Form
          form={profileForm}
          layout="vertical"
          initialValues={{
            fullName: user?.fullName || '',
            email: user?.email || '',
            phone: user?.phone || '',
          }}
          autoComplete="off"
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="fullName"
                label="Họ và tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
              >
                <AppInput placeholder="Nhập họ và tên" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Tên đăng nhập">
                <AppInput value={user?.username || ''} disabled />
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
                <AppInput placeholder="Nhập email" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
              >
                <AppInput placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>
          </Row>
          <div className="flex justify-end">
            <AppButton
              type="primary"
              onClick={handleUpdateProfile}
              loading={updateProfileMutation.isPending}
            >
              Lưu thay đổi
            </AppButton>
          </div>
        </Form>
      </Card>

      <Card className="mb-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FiLock /> Đổi mật khẩu
          </h3>
          <p className="text-gray-500 text-sm">Thay đổi mật khẩu đăng nhập</p>
        </div>

        <Divider className="my-3" />

        <Form form={passwordForm} layout="vertical" autoComplete="off">
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="currentPassword"
                label="Mật khẩu hiện tại"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }, noSpaceRule]}
              >
                <AppInput type="password" placeholder="Nhập mật khẩu hiện tại" autoComplete="new-password" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="newPassword"
                label="Mật khẩu mới"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                  { min: 6, message: 'Tối thiểu 6 ký tự' },
                  noSpaceRule,
                ]}
              >
                <AppInput type="password" placeholder="Nhập mật khẩu mới" autoComplete="new-password" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="confirmNewPassword"
                label="Xác nhận mật khẩu mới"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                  noSpaceRule,
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                      return Promise.reject(new Error('Mật khẩu không khớp'));
                    },
                  }),
                ]}
              >
                <AppInput type="password" placeholder="Nhập lại mật khẩu mới" autoComplete="new-password" />
              </Form.Item>
            </Col>
          </Row>
          <div className="flex justify-end">
            <AppButton
              type="primary"
              onClick={handleChangePassword}
              loading={changePasswordMutation.isPending}
            >
              Đổi mật khẩu
            </AppButton>
          </div>
        </Form>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
              <FiLogOut /> Đăng xuất
            </h3>
            <p className="text-gray-500 text-sm">Đăng xuất khỏi tài khoản hiện tại</p>
          </div>
          <AppButton danger onClick={handleLogout}>
            Đăng xuất
          </AppButton>
        </div>
      </Card>
    </div>
  );
};

export default MyAccountPage;
