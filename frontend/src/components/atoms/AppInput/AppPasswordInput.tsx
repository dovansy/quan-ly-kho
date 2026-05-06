import { forwardRef, useState } from 'react';
import { InputProps, InputRef } from 'antd';

import { AppInput } from './AppInput';
import SuffixPass from './SuffixPass';

/**
 * Password input có sẵn nút mắt (toggle hiện/ẩn mật khẩu).
 * Dùng đồng bộ trên màn login, thêm tài khoản, đổi mật khẩu, ...
 */
export const AppPasswordInput = forwardRef<InputRef, InputProps>((props, ref) => {
  const [passwordVisible, setPasswordVisible] = useState(true);

  return (
    <AppInput
      ref={ref}
      {...props}
      type={passwordVisible ? 'password' : 'text'}
      suffix={
        <div
          onClick={() => setPasswordVisible(!passwordVisible)}
          className="cursor-pointer"
        >
          <SuffixPass isVisible={passwordVisible} />
        </div>
      }
    />
  );
});

AppPasswordInput.displayName = 'AppPasswordInput';
