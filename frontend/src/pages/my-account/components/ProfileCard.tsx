import { Card, Col, Divider, Form, Row, Tag } from 'antd';
import { AppButton } from '@/components/atoms/AppButton';
import { AppInput } from '@/components/atoms/AppInput';
import { useAppNotification } from '@/components/templates/notification';
import { roleLabels } from '@/constants/options';
import { useUpdateProfile } from '@/hooks/api/auth';
import { useAppDispatch } from '@/shared/redux/hooks';
import { updateUser } from '@/store/auth';
import { getErrorMessage } from '@/utils/format';

interface Props {
  user: any;
}

export const ProfileCard = ({ user }: Props) => {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const updateProfile = useUpdateProfile();
  const { success, error } = useAppNotification();

  const roleInfo = user?.roles?.[0]?.role
    ? roleLabels[user.roles[0].role] || { label: user.roles[0].role, color: 'default' }
    : { label: 'N/A', color: 'default' };

  const onSubmit = () => {
    form.validateFields().then(values => {
      updateProfile.mutate(
        { fullName: values.fullName, email: values.email, phone: values.phone },
        {
          onSuccess: res => {
            success({ message: 'Cập nhật thông tin thành công' });
            if (res.data.data) dispatch(updateUser(res.data.data));
          },
          onError: (e: any) =>
            error({ message: 'Cập nhật thất bại', description: getErrorMessage(e) }),
        }
      );
    });
  };

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Thông tin cá nhân</h3>
          <p className="text-sm text-gray-500">Cập nhật thông tin tài khoản của bạn</p>
        </div>
        <Tag color={roleInfo.color}>{roleInfo.label}</Tag>
      </div>

      <Divider className="my-3" />

      <Form
        form={form}
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
            <Form.Item name="phone" label="Số điện thoại">
              <AppInput placeholder="Nhập số điện thoại" />
            </Form.Item>
          </Col>
        </Row>
        <div className="flex justify-end">
          <AppButton type="primary" onClick={onSubmit} loading={updateProfile.isPending}>
            Lưu thay đổi
          </AppButton>
        </div>
      </Form>
    </Card>
  );
};
