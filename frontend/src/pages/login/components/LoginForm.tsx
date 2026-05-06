import { useState } from 'react';
import { Form } from 'antd';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLock } from 'react-icons/fi';

import { AppButton } from '@/components/atoms/AppButton';
import { AppInput, AppPasswordInput } from '@/components/atoms/AppInput';
import { AppFormItem } from '@/components/molecules/form-item';
import { useAppNotification } from '@/components/templates/notification';
import { ROUTE_PATH } from '@/constants/app';
import { HttpErrorCode, HttpErrorMessage } from '@/constants/http';
import { APIErrorResponse } from '@/types/api.type';
import { authService } from '@/services/auth.service';
import { useAppDispatch } from '@/shared/redux/hooks';
import { loginSuccess } from '@/store/auth';
import { noSpaceRule } from '@/utils/validationRules';

interface Props {
  disabled?: boolean;
}

const LoginForm = ({ disabled = false }: Props) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { error: notifyError } = useAppNotification();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await authService.login({
        username: values.username,
        password: values.password,
      });
      const { accessToken, refreshToken, user } = response.data.data;
      dispatch(loginSuccess({ accessToken, refreshToken, user }));
      localStorage.setItem('access_token', accessToken);
      navigate(ROUTE_PATH.INVENTORY);
    } catch (error) {
      const errorCode: HttpErrorCode = (error as APIErrorResponse).data?.code;
      const isInvalidCredentials =
        errorCode === HttpErrorCode.USER_NOT_FOUND || errorCode === HttpErrorCode.WRONG_PASSWORD;
      const description = isInvalidCredentials
        ? 'Tên đăng nhập hoặc mật khẩu không chính xác'
        : HttpErrorMessage[errorCode] || HttpErrorMessage[HttpErrorCode.UNKNOWN_ERROR];
      notifyError({
        message: 'Lỗi',
        description,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="login-form">
      <h5 className="form-heading">Đăng nhập</h5>
      <Form disabled={disabled} className="form-main" onFinish={onFinish} form={form}>
        <AppFormItem
          name="username"
          rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }, noSpaceRule]}
        >
          <AppInput
            prefix={<FiUser className="text-gray-400" />}
            className="username-input"
            id="username"
            name="username"
            autoComplete="username"
            placeholder="Tên đăng nhập"
          />
        </AppFormItem>

        <AppFormItem
          name="password"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu' },
            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
            noSpaceRule,
          ]}
        >
          <AppPasswordInput
            prefix={<FiLock className="text-gray-400" />}
            className="password-input"
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Mật khẩu"
          />
        </AppFormItem>

        <div className="flex items-center justify-end my-[18px]">
          <div className="text-blue-500 cursor-pointer hover:underline">Quên mật khẩu?</div>
        </div>

        <AppButton loading={loading} className="submit-btn w-full" htmlType="submit" type="primary">
          Đăng nhập
        </AppButton>
      </Form>
    </section>
  );
};

export default LoginForm;
