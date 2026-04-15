import { forwardRef } from 'react';

import { Input, InputProps, InputRef } from 'antd';
import clsx from 'clsx';

import styles from './AppInput.module.scss';

export const AppInput = forwardRef<InputRef, InputProps>(
  ({ className, disabled, ...props }: InputProps, ref) => {
    const classNames = clsx(className, styles.appInput, {
      [styles.errorInput]: props.status === 'error',
    });

    return <Input ref={ref} disabled={disabled} className={classNames} {...props} />;
  }
);

AppInput.displayName = 'AppInput';
