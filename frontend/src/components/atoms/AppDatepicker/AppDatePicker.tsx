import { DatePicker, DatePickerProps } from 'antd';
import clsx from 'clsx';

import styles from './AppDatePicker.module.scss';

export const AppDatePicker = ({ className, ...props }: DatePickerProps) => {
  const classNames = clsx(className, styles.appPicker, {
    [styles.errorInput]: props.status === 'error',
    [styles.notDisabled]: !props.disabled,
  });

  return <DatePicker className={classNames} {...props} />;
};
