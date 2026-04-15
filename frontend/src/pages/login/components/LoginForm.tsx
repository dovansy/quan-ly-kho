import { useCallback, useState } from 'react';
import { Form } from 'antd';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLock } from 'react-icons/fi';

import { AppButton } from '@/components/atoms/AppButton';
import { AppInput } from '@/components/atoms/AppInput';
import { AppFormItem } from '@/components/molecules/form-item';
import { useAppNotification } from '@/components/templates/notification';
import { ROUTE_PATH } from '@/constants/app';
import { HttpErrorCode, HttpErrorMessage } from '@/constants/http';
import { APIErrorResponse } from '@/types/api.type';
import { authService } from '@/services/auth.service';
import { useAppDispatch } from '@/shared/redux/hooks';
import { loginSuccess } from '@/store/auth';
import { noSpaceRule } from '@/utils/validationRules';
import SuffixPass from './SuffixPass';

interface Props {
  disabled?: boolean;
}

const LoginForm = ({ disabled = false }: Props) => {
  const [form] = Form.useForm();
  const [passwordVisible, setPasswordVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const { error: notifyError } = useAppNotification();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const setError = useCallback(
    (name: any, errors: string[] | string) => {
      const errorMessages = Array.isArray(errors) ? errors : [errors];
      form.setFields([
        {
          name,
          errors: errorMessages,
        },
      ]);
    },
    [form]
  );

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
      const errorMessage = HttpErrorMessage[errorCode];
      switch (errorCode) {
        case HttpErrorCode.USER_NOT_FOUND:
          setError('username', errorMessage);
          return;
        case HttpErrorCode.WRONG_PASSWORD:
          setError('password', errorMessage);
          return;
        default:
          notifyError({
            message: 'Lỗi',
            description: errorMessage || HttpErrorMessage[HttpErrorCode.UNKNOWN_ERROR],
          });
          return;
      }
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
          <AppInput
            prefix={<FiLock className="text-gray-400" />}
            className="password-input"
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Mật khẩu"
            type={passwordVisible ? 'password' : 'text'}
            suffix={
              <div onClick={() => setPasswordVisible(!passwordVisible)} className="cursor-pointer">
                <SuffixPass isVisible={passwordVisible} />
              </div>
            }
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
