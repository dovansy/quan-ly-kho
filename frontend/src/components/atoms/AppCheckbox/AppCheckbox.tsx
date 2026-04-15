import { forwardRef } from 'react';

import { Checkbox, CheckboxProps, CheckboxRef } from 'antd';
import clsx from 'clsx';

import styles from './AppCheckbox.module.scss';

export const AppCheckbox = forwardRef<CheckboxRef, CheckboxProps>(
  ({ className, ...props }: CheckboxProps, ref) => {
    const classNames = clsx(className, styles.appCheckbox);

    return <Checkbox ref={ref} className={classNames} {...props} />;
  }
);

AppCheckbox.displayName = 'AppCheckbox';
