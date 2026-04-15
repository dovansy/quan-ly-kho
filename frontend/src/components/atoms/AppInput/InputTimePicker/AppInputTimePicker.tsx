import { forwardRef } from 'react';

import { InputRef, TimePicker, TimePickerProps } from 'antd';
import clsx from 'clsx';

import styles from '../AppInput.module.scss';
import './styles.scss';

export const AppInputTimePicker = forwardRef<InputRef, TimePickerProps>(
  ({ className, disabled, ...props }: TimePickerProps, _ref) => {
    const classNames = clsx(className, styles.appInput, {
      [styles.errorInput]: props.status === 'error',
    });

    return <TimePicker disabled={disabled} className={classNames} {...props} />;
  }
);

AppInputTimePicker.displayName = 'AppInputTimePicker';
