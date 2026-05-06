import { Card, Col, Divider, Form, Row } from 'antd';
import { FiLock } from 'react-icons/fi';
import { AppButton } from '@/components/atoms/AppButton';
import { AppInput } from '@/components/atoms/AppInput';
import { useAppNotification } from '@/components/templates/notification';
import { useChangePassword } from '@/hooks/api/auth';
import { noSpaceRule } from '@/utils/validationRules';

export const ChangePasswordCard = () => {
  const [form] = Form.useForm();
  const changePassword = useChangePassword();
  const { success, error } = useAppNotification();

  const onSubmit = () => {
    form.validateFields().then(values => {
      changePassword.mutate(
        { currentPassword: values.currentPassword, newPassword: values.newPassword },
        {
          onSuccess: () => {
            success({ message: 'Đổi mật khẩu thành công' });
            form.resetFields();
          },
          onError: (err: any) => {
            const code = err?.data?.code;
            if (code === 4001) {
              form.setFields([
                { name: 'currentPassword', errors: ['Mật khẩu hiện tại không đúng'] },
              ]);
            } else {
              error({ message: 'Đổi mật khẩu thất bại' });
            }
          },
        }
      );
    });
  };

  return (
    <Card className="mb-6">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <FiLock /> Đổi mật khẩu
        </h3>
        <p className="text-sm text-gray-500">Thay đổi mật khẩu đăng nhập</p>
      </div>

      <Divider className="my-3" />

      <Form form={form} layout="vertical" autoComplete="off">
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="currentPassword"
              label="Mật khẩu hiện tại"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu hiện tại' },
                noSpaceRule,
              ]}
            >
              <AppInput
                type="password"
                placeholder="Nhập mật khẩu hiện tại"
                autoComplete="new-password"
              />
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
              <AppInput
                type="password"
                placeholder="Nhập mật khẩu mới"
                autoComplete="new-password"
              />
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
              <AppInput
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
              />
            </Form.Item>
          </Col>
        </Row>
        <div className="flex justify-end">
          <AppButton type="primary" onClick={onSubmit} loading={changePassword.isPending}>
            Đổi mật khẩu
          </AppButton>
        </div>
      </Form>
    </Card>
  );
};
