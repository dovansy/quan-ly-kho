import { Button, ButtonProps } from 'antd';
import clsx from 'clsx';
import { forwardRef } from 'react';
import styles from './AppButton.module.scss';
import { AppButtonColor } from './types';

export interface AppButtonProps extends Omit<ButtonProps, 'color'> {
  color?: AppButtonColor;
}

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(
  (
    { color = 'blue', type = 'primary', size = 'middle', className, ...props }: AppButtonProps,
    ref
  ) => {
    const classNames = clsx(className, styles.appButton, styles[color], styles[size], styles[type]);

    return <Button ref={ref} className={classNames} type={type} size={size} {...props} />;
  }
);

AppButton.displayName = 'AppButton';
