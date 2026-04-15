import { Select, SelectProps } from 'antd';
import clsx from 'clsx';
import { forwardRef } from 'react';
import styles from './styles/AppSelect.module.scss';
import './styles/AppSelect.scss';

export interface AppSelectProps extends SelectProps {}

export const AppSelect = forwardRef<HTMLSelectElement, AppSelectProps>(
  (
    { placeholder = 'Select', size = 'middle', status = '', className, ...props }: AppSelectProps,
    ref
  ) => {
    const classNames = clsx(className, styles.appSelect, styles[size]);

    return (
      <Select
        ref={() => ref}
        placeholder={placeholder}
        size={size}
        status={status}
        className={classNames}
        {...props}
      />
    );
  }
);

AppSelect.displayName = 'AppSelect';
